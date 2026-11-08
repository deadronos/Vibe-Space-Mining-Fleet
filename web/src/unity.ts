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

export async function loadUnity(
  canvas: HTMLCanvasElement,
  onProgress: (progress: number) => void,
  onBanner: (message: string, type: 'error' | 'warning' | 'info') => void,
): Promise<UnityInstance> {
  await loadScript(`${BUILD}.loader.js`);
  return createUnityInstance(
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

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error(`Could not load ${src}`)));
    document.body.append(script);
  });
}
