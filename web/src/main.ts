import './styles.css';
import { startBench } from './bench';
import { Bridge, on, once } from './bridge';
import type { BridgeReady, BridgeState, SaveFile } from './protocol';
import { clearSave, downloadSave, readSave, readSaveFile, writeSave } from './save';
import { applyRendererChoice, fallBackToWebgl2, loadUnity, type Webgl2Reason } from './unity';

const AUTOSAVE_MS = 30_000;

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing from index.html`);
  return el;
}

const canvas = $('game') as HTMLCanvasElement;
const loading = $('loading');
const loadingFill = $('loading-fill');
const loadingText = $('loading-text');
const menuButton = $('menu-button');
const menu = $('menu') as HTMLDialogElement;
const menuInfo = $('menu-info');
const toast = $('toast');
const fatal = $('fatal');
const importFile = $('import-file') as HTMLInputElement;

const oreFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
let toastTimer = 0;
let lastSavedAt = '';
let lastState: BridgeState | null = null;
// Set while starting a new game, so the unload autosave doesn't write the old game back.
let discarding = false;

function showToast(message: string, kind: 'info' | 'error' = 'info'): void {
  toast.textContent = message;
  toast.dataset.kind = kind;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3500);
}

function showFatal(message: string): void {
  fatal.textContent = message;
  fatal.hidden = false;
}

// The game uses right-click for orders and middle-drag to orbit: keep the browser's context
// menu and autoscroll out of the way.
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1) e.preventDefault();
});
// The gear button must not keep keyboard focus, or Space/Enter would press it as well as
// reaching the game.
menuButton.addEventListener('mousedown', (e) => e.preventDefault());

// Phones and tablets (#41): the first touch on the game asks for fullscreen, which hides the
// browser's address bar and its edge gestures, and then for landscape where the browser allows
// it. Both can be refused; the game works without them. Unity reads the touches itself.
if (matchMedia('(pointer: coarse)').matches) {
  canvas.addEventListener(
    'touchend',
    () => {
      if (document.fullscreenElement || !document.fullscreenEnabled) return;
      document.documentElement
        .requestFullscreen({ navigationUI: 'hide' })
        .then(() => {
          const orientation = screen.orientation as ScreenOrientation & {
            lock?: (o: string) => Promise<void>;
          };
          return orientation.lock?.('landscape');
        })
        .catch(() => {});
    },
    { once: true },
  );
}

const webgl2Reason: Webgl2Reason = applyRendererChoice();
// Banner errors before "ready" may be a failed WebGPU start; after it, a reload would lose play.
let started = false;

async function start(): Promise<void> {
  // "ready" is emitted from the scene's Start(), which can run before the instance promise
  // resolves, so listen first.
  const ready = once('ready', 180_000);
  const unity = await loadUnity(
    canvas,
    (p) => {
      loadingFill.style.width = `${Math.round(p * 100)}%`;
      loadingText.textContent = p < 0.9 ? `Loading ${Math.round(p * 100)}%` : 'Starting…';
    },
    (message, type) => {
      if (type === 'error') {
        // Unity often reports a failed start here and leaves its promise pending (#44).
        if (!started && fallBackToWebgl2(webgl2Reason)) return;
        showFatal(message);
      } else showToast(message);
    },
  );
  const info = await ready;
  started = true;
  if (webgl2Reason === 'fallback')
    showToast('The game could not start with WebGPU, so it restarted on WebGL2.');
  const bridge = new Bridge(unity);
  loading.classList.add('done');
  menuButton.hidden = false;
  canvas.focus();

  on('state', (state) => {
    lastState = state;
  });
  // The game's own HUD logs every notice; the page only announces the credit for time away.
  on('event', (notice) => {
    if (notice.kind === 'OfflineCredit') showToast(notice.message);
  });
  wireMenu(bridge, info);

  // The render benchmark is a throwaway game: keep the player's save out of it.
  if (info.bench > 0) {
    discarding = true;
    const bench = startBench(info);
    Object.assign(window, { spaceMining: { bridge, unity, info, bench } });
    return;
  }

  await continueFromSave(bridge, info.minSaveVersion ?? info.saveVersion, info.saveVersion);

  const autosave = () => void saveNow(bridge, true);
  window.setInterval(autosave, AUTOSAVE_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') autosave();
  });
  window.addEventListener('pagehide', autosave);

  // Console access for debugging, like asteroid-fleet's __fleet.
  Object.assign(window, { spaceMining: { bridge, unity, info } });
}

/** Loads the stored save if this build can read its version (older ones are migrated by Unity). */
async function continueFromSave(bridge: Bridge, oldest: number, newest: number): Promise<void> {
  const save = readSave();
  if (!save) return;
  if (save.version < oldest || save.version > newest) {
    const reads = oldest === newest ? `${newest}` : `${oldest} to ${newest}`;
    showToast(`Stored save is version ${save.version}; this build reads ${reads}. Started fresh.`);
    return;
  }
  const result = await bridge.load(save);
  if (!result.ok) {
    showToast(`Could not load the save: ${result.error}`, 'error');
    return;
  }
  showToast(`Continued from save (${formatTime(save.time)} in, ${savedAgo(save)})`);
  // Ore for the time away (#58). Unity applies the minimum, the cap and the rate; the page only
  // measures the time. An imported file is not settled, now or on the next load: import stores
  // it stamped with the import time.
  const away = secondsSince(save.savedAt);
  if (away > 0) bridge.settleOffline(away);
}

/** Whole seconds from an ISO time until now; 0 if it is unreadable or in the future. */
function secondsSince(iso: string): number {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return 0;
  return Math.max(0, Math.floor((Date.now() - at) / 1000));
}

async function saveNow(bridge: Bridge, silent: boolean): Promise<SaveFile | null> {
  if (discarding) return null;
  try {
    const save = await bridge.requestSave();
    const ok = writeSave(save);
    lastSavedAt = save.savedAt;
    if (!silent)
      showToast(
        ok ? 'Saved' : 'Saved in memory only: browser storage is blocked',
        ok ? 'info' : 'error',
      );
    return save;
  } catch (e) {
    if (!silent) showToast(`Save failed: ${(e as Error).message}`, 'error');
    return null;
  }
}

function wireMenu(bridge: Bridge, info: BridgeReady): void {
  menuButton.addEventListener('click', () => {
    menuInfo.textContent = menuSummary(info);
    menu.showModal();
  });
  // Hand the keyboard back to the game when the dialog closes.
  menu.addEventListener('close', () => canvas.focus());

  $('save').addEventListener('click', () => void saveNow(bridge, false));
  $('export').addEventListener('click', async () => {
    const save = await saveNow(bridge, true);
    if (save) downloadSave(save);
  });
  $('import').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    importFile.value = '';
    if (!file) return;
    const save = await readSaveFile(file);
    if (!save) {
      showToast(`${file.name} is not a save file`, 'error');
      return;
    }
    const result = await bridge.load(save);
    if (result.ok) {
      // Store it stamped now: the next page load settles time away from `savedAt`, and the
      // file's own stamp says how old the export is, not how long the player was away (#58).
      writeSave({ ...save, savedAt: new Date().toISOString() });
      menu.close();
      showToast(`Loaded ${file.name}`);
    } else showToast(`Could not load ${file.name}: ${result.error}`, 'error');
  });
  $('new').addEventListener('click', () => {
    if (!window.confirm('Delete the saved game and start over?')) return;
    discarding = true;
    clearSave();
    window.location.reload();
  });
}

function menuSummary(info: BridgeReady): string {
  const parts = [`v${import.meta.env.APP_VERSION}`, info.renderer, `Unity ${info.unityVersion}`];
  if (lastState)
    parts.push(
      `${formatTime(lastState.time)} played`,
      `${oreFormat.format(lastState.refined)} t refined`,
    );
  parts.push(lastSavedAt ? savedAgo({ savedAt: lastSavedAt } as SaveFile) : 'not saved yet');
  return parts.join(' · ');
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

function savedAgo(save: SaveFile): string {
  const at = Date.parse(save.savedAt);
  if (Number.isNaN(at)) return 'saved earlier';
  const minutes = Math.round((Date.now() - at) / 60_000);
  if (minutes < 1) return 'saved just now';
  if (minutes < 60) return `saved ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `saved ${hours} h ago` : `saved ${Math.round(hours / 24)} days ago`;
}

start().catch((e: unknown) => {
  if (fallBackToWebgl2(webgl2Reason, e)) return;
  loading.classList.add('done');
  showFatal(`The game could not start: ${e instanceof Error ? e.message : String(e)}`);
});
