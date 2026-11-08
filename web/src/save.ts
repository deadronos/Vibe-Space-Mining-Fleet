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
    return typeof save.version === 'number' && typeof save.time === 'number'
      ? (save as SaveFile)
      : null;
  } catch {
    return null;
  }
}

export function readSave(): SaveFile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === null ? null : parseSave(raw);
  } catch {
    return null; // storage blocked (private mode, disabled site data)
  }
}

export function writeSave(save: SaveFile): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing stored, nothing to clear
  }
}

export function downloadSave(save: SaveFile): void {
  const stamp = (save.savedAt || new Date().toISOString()).slice(0, 19).replaceAll(':', '-');
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vibe-space-mining-${stamp}.json`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readSaveFile(file: File): Promise<SaveFile | null> {
  return parseSave(await file.text());
}
