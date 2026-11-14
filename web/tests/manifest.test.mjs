import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { verifyUnityManifest } from '../../scripts/verify-unity-manifest.mjs';

const PLAYER_FILES = {
  'Build/unity.data.unityweb': 'data-payload',
  'Build/unity.framework.js.unityweb': 'framework-payload',
  'Build/unity.loader.js': 'loader-payload',
  'Build/unity.wasm.unityweb': 'wasm-payload',
};

function createFixture(t, { dirty = false, dirtyItems = [], files = PLAYER_FILES } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'unity-manifest-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  mkdirSync(path.join(root, 'Build'), { recursive: true });
  const manifestFiles = [];
  for (const relPath of Object.keys(files).toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const content = Buffer.from(files[relPath]);
    const fullPath = path.join(root, relPath);
    mkdirSync(path.dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
    manifestFiles.push({
      path: relPath,
      size: content.length,
      sha256: createHash('sha256').update(content).digest('hex'),
    });
  }

  const manifest = {
    unityVersion: '6000.6.0b1',
    builtAtUtc: '2026-11-14T08:30:00Z',
    uvcs: {
      branch: '/main/test',
      changeset: 'cs:86',
      dirty,
      dirtyItems,
    },
    files: manifestFiles,
  };
  writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { root, manifest };
}

test('accepts a valid clean manifest and passes --require-clean', (t) => {
  const { root } = createFixture(t, { dirty: false, dirtyItems: [] });
  const verified = verifyUnityManifest({ unityDir: root, requireClean: true });
  assert.equal(verified.uvcs.dirty, false);
  assert.equal(verified.files.length, 4);
});

test('represents dirty UVCS workspaces accurately and fails only when --require-clean is set', (t) => {
  const { root } = createFixture(t, {
    dirty: true,
    dirtyItems: ['CH Assets/_Game/Scripts/Editor/WebBuild.cs'],
  });
  const verified = verifyUnityManifest({ unityDir: root, requireClean: false });
  assert.equal(verified.uvcs.dirty, true);
  assert.deepEqual(verified.uvcs.dirtyItems, ['CH Assets/_Game/Scripts/Editor/WebBuild.cs']);
  assert.throws(
    () => verifyUnityManifest({ unityDir: root, requireClean: true }),
    /dirty UVCS workspace/i,
  );
});

test('rejects a missing player file', (t) => {
  const { root } = createFixture(t);
  unlinkSync(path.join(root, 'Build/unity.wasm.unityweb'));
  assert.throws(() => verifyUnityManifest({ unityDir: root }), /missing Unity build file/i);
});

test('rejects an extra un-manifested file in Build/', (t) => {
  const { root } = createFixture(t);
  writeFileSync(path.join(root, 'Build/unity.extra.bin'), 'rogue');
  assert.throws(() => verifyUnityManifest({ unityDir: root }), /Un-manifested file/i);
});

test('rejects a modified or replaced file whose hash changed even with matching byte size', (t) => {
  const { root } = createFixture(t);
  const replacement = 'X' + PLAYER_FILES['Build/unity.loader.js'].slice(1);
  writeFileSync(path.join(root, 'Build/unity.loader.js'), replacement);
  assert.throws(() => verifyUnityManifest({ unityDir: root }), /SHA-256 mismatch/i);
});
