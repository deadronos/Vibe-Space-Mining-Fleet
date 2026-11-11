import type { SaveFile } from './protocol';

// Saves live in the page's localStorage, not in Unity's PlayerPrefs/IndexedDB: PlayerPrefs is
// capped at ~1 MB on the web, Unity's IndexedDB folder is keyed to the page URL, and a plain
// JSON save is easy to export, import, or later sync to a server.

const KEY = 'spacemining.save.v1';

/** Returns a save if the text looks like one (the C# side validates the rest). */
export function parseSave(text: string): SaveFile | null {
  try {
    const data: unknown = JSON.parse(text);
    if (typeof data !== 'object' || data === null) return null;
    const save = data as Partial<SaveFile>;
    return typeof save.version === 'number' &&
      Number.isInteger(save.version) &&
      typeof save.time === 'number' &&
      Number.isFinite(save.time)
      ? (save as SaveFile)
      : null;
  } catch {
    return null;
  }
}

export function readStoredSave(): string | null | undefined {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return undefined;
  }
}

export function writeSave(save: SaveFile, previous: string | null | undefined): string | null {
  try {
    if (localStorage.getItem(KEY) !== previous) return null;
    const raw = JSON.stringify(save);
    localStorage.setItem(KEY, raw);
    return raw;
  } catch {
    return null;
  }
}

export function clearSave(previous: string | null | undefined): boolean {
  try {
    if (localStorage.getItem(KEY) !== previous) return false;
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

export function downloadSave(save: SaveFile): void {
  const stamp = (save.savedAt || new Date().toISOString()).slice(0, 19).replaceAll(':', '-');
  downloadSaveText(JSON.stringify(save, null, 2), `vibe-space-mining-${stamp}.json`);
}

export function downloadSaveText(raw: string, filename: string): void {
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readSaveFile(file: File): Promise<SaveFile | null> {
  return parseSave(await file.text());
}
