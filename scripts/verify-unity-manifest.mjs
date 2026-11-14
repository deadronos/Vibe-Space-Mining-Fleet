import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_PLAYER_FILES = [
  'Build/unity.loader.js',
  'Build/unity.framework.js.unityweb',
  'Build/unity.wasm.unityweb',
  'Build/unity.data.unityweb',
];

export function verifyUnityManifest({
  unityDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'web',
    'public',
    'unity',
  ),
  requireClean = false,
} = {}) {
  const manifestPath = path.join(unityDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing Unity build manifest: ${manifestPath}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    throw new Error(
      `Invalid JSON in ${manifestPath}: ${err instanceof Error ? err.message : String(err)}`,
      {
        cause: err,
      },
    );
  }

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Unity manifest root must be a JSON object.');
  }
  if (typeof manifest.unityVersion !== 'string' || manifest.unityVersion.trim().length === 0) {
    throw new Error('Unity manifest is missing a non-empty unityVersion.');
  }
  if (typeof manifest.builtAtUtc !== 'string' || Number.isNaN(Date.parse(manifest.builtAtUtc))) {
    throw new Error('Unity manifest is missing a valid ISO-8601 builtAtUtc timestamp.');
  }

  const uvcs = manifest.uvcs;
  if (!uvcs || typeof uvcs !== 'object' || Array.isArray(uvcs)) {
    throw new Error('Unity manifest is missing uvcs metadata.');
  }
  if (typeof uvcs.branch !== 'string' || uvcs.branch.trim().length === 0) {
    throw new Error('Unity manifest uvcs.branch must be a non-empty string.');
  }
  if (typeof uvcs.changeset !== 'string' || !/^cs:\d+$/.test(uvcs.changeset)) {
    throw new Error(
      `Unity manifest uvcs.changeset must match cs:<number>, got ${JSON.stringify(uvcs.changeset)}.`,
    );
  }
  if (typeof uvcs.dirty !== 'boolean') {
    throw new Error('Unity manifest uvcs.dirty must be a boolean.');
  }
  if (
    !Array.isArray(uvcs.dirtyItems) ||
    uvcs.dirtyItems.some((item) => typeof item !== 'string' || !item.trim())
  ) {
    throw new Error('Unity manifest uvcs.dirtyItems must be an array of non-empty strings.');
  }
  if (uvcs.dirty && uvcs.dirtyItems.length === 0) {
    throw new Error('Unity manifest marks uvcs.dirty=true without listing dirtyItems.');
  }
  if (!uvcs.dirty && uvcs.dirtyItems.length > 0) {
    throw new Error('Unity manifest marks uvcs.dirty=false while dirtyItems is non-empty.');
  }
  if (requireClean && uvcs.dirty) {
    throw new Error(
      `Unity build was produced from a dirty UVCS workspace: ${uvcs.dirtyItems.join(', ')}`,
    );
  }

  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    throw new Error('Unity manifest files must be a non-empty array.');
  }

  const buildRoot = path.join(unityDir, 'Build');
  if (!existsSync(buildRoot) || !lstatSync(buildRoot).isDirectory()) {
    throw new Error(`Missing Unity Build directory: ${buildRoot}`);
  }

  const listed = new Map();
  let previousPath = '';
  for (const entry of manifest.files) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('Unity manifest file entry must be an object.');
    }
    if (
      typeof entry.path !== 'string' ||
      !entry.path.startsWith('Build/') ||
      entry.path.includes('..')
    ) {
      throw new Error(`Invalid manifest file path: ${JSON.stringify(entry.path)}`);
    }
    if (listed.has(entry.path)) {
      throw new Error(`Duplicate manifest file entry: ${entry.path}`);
    }
    if (previousPath && entry.path < previousPath) {
      throw new Error(
        `Unity manifest files must be sorted by path (${entry.path} came after ${previousPath}).`,
      );
    }
    previousPath = entry.path;

    if (!Number.isInteger(entry.size) || entry.size < 0) {
      throw new Error(`Invalid file size for ${entry.path}: ${JSON.stringify(entry.size)}`);
    }
    if (typeof entry.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(entry.sha256)) {
      throw new Error(`Invalid sha256 digest for ${entry.path}: ${JSON.stringify(entry.sha256)}`);
    }
    listed.set(entry.path, entry);
  }

  for (const required of REQUIRED_PLAYER_FILES) {
    if (!listed.has(required)) {
      throw new Error(`Unity manifest is missing required player file: ${required}`);
    }
  }

  const actualFiles = listBuildFiles(unityDir, buildRoot);
  const actualSet = new Set(actualFiles);

  for (const [relPath, entry] of listed) {
    if (!actualSet.has(relPath)) {
      throw new Error(`Manifest lists missing Unity build file: ${relPath}`);
    }
    const fullPath = path.join(unityDir, relPath);
    const bytes = readFileSync(fullPath);
    if (bytes.length !== entry.size) {
      throw new Error(
        `Size mismatch for ${relPath}: manifest has ${entry.size}, disk has ${bytes.length}.`,
      );
    }
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== entry.sha256) {
      throw new Error(
        `SHA-256 mismatch for ${relPath}: manifest has ${entry.sha256}, disk has ${digest}.`,
      );
    }
  }

  for (const relPath of actualFiles) {
    if (!listed.has(relPath)) {
      throw new Error(`Un-manifested file present in Build/: ${relPath}`);
    }
  }

  return manifest;
}

function listBuildFiles(unityDir, dirPath) {
  const results = [];
  for (const dirent of readdirSync(dirPath, { withFileTypes: true })) {
    const abs = path.join(dirPath, dirent.name);
    if (dirent.isDirectory()) {
      results.push(...listBuildFiles(unityDir, abs));
    } else if (dirent.isFile()) {
      results.push(path.relative(unityDir, abs).split(path.sep).join('/'));
    } else {
      throw new Error(`Unsupported entry type inside Build/: ${abs}`);
    }
  }
  results.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return results;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const args = process.argv.slice(2);
  const requireClean = args.includes('--require-clean');
  const dirArg = args.find((arg) => arg.startsWith('--dir='));
  const unityDir = dirArg ? path.resolve(dirArg.slice('--dir='.length)) : undefined;
  const manifest = verifyUnityManifest({ unityDir, requireClean });
  const state = manifest.uvcs.dirty ? `dirty (${manifest.uvcs.dirtyItems.length})` : 'clean';
  console.log(
    `Unity manifest verified: ${manifest.uvcs.branch}@${manifest.uvcs.changeset} (${state}), ${manifest.files.length} files`,
  );
}
