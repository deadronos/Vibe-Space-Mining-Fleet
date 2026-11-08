import type { BridgeEvents, Command, LoadedEvent, SaveFile } from './protocol';
import type { UnityInstance } from './unity';

/** GameObject the page talks to (WebBridge.ObjectName in C#). */
const OBJECT = 'WebBridge';
const PREFIX = 'spacemining:';

type Handler<K extends keyof BridgeEvents> = (detail: BridgeEvents[K]) => void;

/** Subscribes to a Unity -> page event. Returns an unsubscribe function. */
export function on<K extends keyof BridgeEvents>(type: K, handler: Handler<K>): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<BridgeEvents[K]>).detail);
  window.addEventListener(PREFIX + type, listener);
  return () => window.removeEventListener(PREFIX + type, listener);
}

/** Resolves with the next `type` event, or rejects after `timeoutMs`. */
export function once<K extends keyof BridgeEvents>(
  type: K,
  timeoutMs: number,
): Promise<BridgeEvents[K]> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      off();
      reject(new Error(`Timed out waiting for "${type}" from Unity`));
    }, timeoutMs);
    const off = on(type, (detail) => {
      window.clearTimeout(timer);
      off();
      resolve(detail);
    });
  });
}

/**
 * Page -> Unity calls. Unity answers synchronously (SendMessage runs C#, which calls the
 * .jslib, which dispatches the DOM event), so each request subscribes before it sends.
 */
export class Bridge {
  readonly #unity: UnityInstance;

  constructor(unity: UnityInstance) {
    this.#unity = unity;
  }

  send(command: Command): void {
    this.#unity.SendMessage(OBJECT, 'Command', JSON.stringify(command));
  }

  requestSave(): Promise<SaveFile> {
    const reply = once('save', 2000);
    this.#unity.SendMessage(OBJECT, 'RequestSave', '');
    return reply;
  }

  load(save: SaveFile): Promise<LoadedEvent> {
    const reply = once('loaded', 5000);
    this.#unity.SendMessage(OBJECT, 'LoadSave', JSON.stringify(save));
    return reply;
  }
}
