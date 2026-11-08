import './styles.css';
import { Bridge, on, once } from './bridge';
import type { BridgeCommand, BridgeState, SaveFile } from './protocol';
import { clearSave, downloadSave, readSave, readSaveFile, writeSave } from './save';
import { loadUnity } from './unity';

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
const toolbar = $('toolbar');
const autoButton = $('auto');
const statOre = $('stat-ore');
const statFleet = $('stat-fleet');
const toast = $('toast');
const fatal = $('fatal');
const importFile = $('import-file') as HTMLInputElement;

const oreFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
let toastTimer = 0;
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
// Toolbar buttons must not take keyboard focus, or Space/Enter would press them as well as
// reaching the game.
toolbar.addEventListener('mousedown', (e) => e.preventDefault());

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
      if (type === 'error') showFatal(message);
      else showToast(message);
    },
  );
  const info = await ready;
  const bridge = new Bridge(unity);
  loading.classList.add('done');
  toolbar.hidden = false;
  canvas.focus();

  on('state', render);
  wireToolbar(bridge);
  await continueFromSave(bridge, info.saveVersion);

  const autosave = () => void saveNow(bridge, true);
  window.setInterval(autosave, AUTOSAVE_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') autosave();
  });
  window.addEventListener('pagehide', autosave);

  // Console access for debugging, like asteroid-fleet's __fleet.
  Object.assign(window, { spaceMining: { bridge, unity, info } });
}

async function continueFromSave(bridge: Bridge, version: number): Promise<void> {
  const save = readSave();
  if (!save) return;
  if (save.version !== version) {
    showToast(
      `Stored save is version ${save.version}; this build reads ${version}. Started fresh.`,
    );
    return;
  }
  const result = await bridge.load(save);
  if (result.ok) showToast(`Continued from save (${formatTime(save.time)} in, ${savedAgo(save)})`);
  else showToast(`Could not load the save: ${result.error}`, 'error');
}

async function saveNow(bridge: Bridge, silent: boolean): Promise<SaveFile | null> {
  if (discarding) return null;
  try {
    const save = await bridge.requestSave();
    const ok = writeSave(save);
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

function wireToolbar(bridge: Bridge): void {
  for (const button of toolbar.querySelectorAll<HTMLButtonElement>('button[data-cmd]')) {
    const command = simpleCommand(button.dataset.cmd);
    if (command) button.addEventListener('click', () => bridge.send(command));
  }
  autoButton.addEventListener('click', () =>
    bridge.send({ type: 'setAutoLaunch', value: !(lastState?.autoLaunch ?? true) }),
  );

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
      writeSave(save);
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

/** The toolbar's one-click commands (data-cmd); anything else is ignored. */
function simpleCommand(type: string | undefined): BridgeCommand | null {
  switch (type) {
    case 'launch':
    case 'recall':
    case 'toggleAutoLaunch':
    case 'resumeAuto':
      return { type };
    default:
      return null;
  }
}

function render(state: BridgeState): void {
  lastState = state;
  statOre.textContent = `${oreFormat.format(state.ore)} t`;
  statFleet.textContent = `${state.drones - state.hangar}/${state.drones} out`;
  autoButton.textContent = state.autoLaunch ? 'Auto: on' : 'Auto: off';
  autoButton.classList.toggle('on', state.autoLaunch);
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
  loading.classList.add('done');
  showFatal(`The game could not start: ${e instanceof Error ? e.message : String(e)}`);
});
