// Typed loader for the Unity web build in public/unity (written by Unity's
// "Space Mining Fleet/Build Web" menu). Replaces Unity's own index.html template.

export interface UnityInstance {
  SendMessage(objectName: string, methodName: string, value?: string | number): void;
  SetFullscreen(fullscreen: 0 | 1): void;
  Quit(): Promise<void>;
}

interface UnityConfig {
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  streamingAssetsUrl: string;
  companyName: string;
  productName: string;
  productVersion: string;
  devicePixelRatio?: number;
  matchWebGLToCanvasSize?: boolean;
  showBanner?: (message: string, type: 'error' | 'warning' | 'info') => void;
}

declare global {
  function createUnityInstance(
    canvas: HTMLCanvasElement,
    config: UnityConfig,
    onProgress?: (progress: number) => void,
  ): Promise<UnityInstance>;
}

/** Unity names the build files after the output folder (web/public/unity). */
const BUILD = `${import.meta.env.BASE_URL}unity/Build/unity`;

/**
 * Render resolution cap. Full device pixel ratio on a retina or 4K screen costs a lot of fill
 * rate for little gain in this scene.
 */
const MAX_PIXEL_RATIO = 1.5;

const RENDERER_KEY = 'spacemining.renderer';

/** Why this page load runs without WebGPU, or null when WebGPU is allowed. */
export type Webgl2Reason = 'url' | 'fallback' | null;

/**
 * Decides before Unity starts whether WebGPU is off. `?renderer=webgl2` forces it for testing;
 * a failed WebGPU start sets the session flag and reloads (see `fallBackToWebgl2`). When it is
 * off, `navigator.gpu` is hidden so Unity picks WebGL2.
 */
export function applyRendererChoice(): Webgl2Reason {
  let reason: Webgl2Reason = null;
  if (new URLSearchParams(window.location.search).get('renderer') === 'webgl2') reason = 'url';
  else if (readFlag() === 'webgl2') reason = 'fallback';
  if (reason) Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
  return reason;
}

/** `createUnityInstance` rejected: the player started but failed, which may be WebGPU's fault. */
export class PlayerStartError extends Error {}

/**
 * Called when the player itself failed to start (or reported a fatal error before it was ready)
 * while WebGPU was available, as on Firefox 150 (#44). Remembers the choice for this tab and
 * reloads. Returns false when WebGPU was not in play, the retry already happened, or `error` is
 * something else (a failed download, the `ready` timeout), which WebGL2 would not fix.
 */
export function fallBackToWebgl2(reason: Webgl2Reason, error: unknown = null): boolean {
  if (error !== null && !(error instanceof PlayerStartError)) return false;
  if (reason || !('gpu' in navigator) || !navigator.gpu) return false;
  try {
    sessionStorage.setItem(RENDERER_KEY, 'webgl2');
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

function readFlag(): string | null {
  try {
    return sessionStorage.getItem(RENDERER_KEY);
  } catch {
    return null;
  }
}

export async function loadUnity(
  canvas: HTMLCanvasElement,
  onProgress: (progress: number) => void,
  onBanner: (message: string, type: 'error' | 'warning' | 'info') => void,
): Promise<UnityInstance> {
  await loadScript(`${BUILD}.loader.js`);
  return createInstance(
    canvas,
    {
      dataUrl: `${BUILD}.data.unityweb`,
      frameworkUrl: `${BUILD}.framework.js.unityweb`,
      codeUrl: `${BUILD}.wasm.unityweb`,
      streamingAssetsUrl: `${import.meta.env.BASE_URL}unity/StreamingAssets`,
      companyName: 'DefaultCompany',
      productName: 'Vibe-Space-Mining-Fleet',
      productVersion: import.meta.env.APP_VERSION,
      // Unity sizes its back buffer from the canvas's CSS size (styles.css makes it fill the
      // window) and follows it on resize.
      matchWebGLToCanvasSize: true,
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
      showBanner: onBanner,
    },
    onProgress,
  );
}

async function createInstance(
  ...args: Parameters<typeof createUnityInstance>
): Promise<UnityInstance> {
  try {
    return await createUnityInstance(...args);
  } catch (e) {
    throw new PlayerStartError(e instanceof Error ? e.message : String(e), { cause: e });
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error(`Could not load ${src}`)));
    document.body.append(script);
  });
}
