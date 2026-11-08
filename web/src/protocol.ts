// Message shapes shared with Unity. The C# side is
// Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Web/WebBridge.cs (payload classes at the bottom)
// and Sim/SimSave.cs; keep the two in step.

/** Commands the page can send (WebBridge.Command). */
export type Command =
  | { type: 'launch' }
  | { type: 'recall' }
  | { type: 'toggleAutoLaunch' }
  | { type: 'setAutoLaunch'; value: boolean }
  | { type: 'resumeAuto' };

/** Sent once when the scene has started. */
export interface ReadyEvent {
  saveVersion: number;
  renderer: string;
  drones: number;
  rocks: number;
  unityVersion: string;
}

/** Live snapshot, a few times a second. */
export interface FleetState {
  time: number;
  ore: number;
  sorties: number;
  autoLaunch: boolean;
  drones: number;
  hangar: number;
  mining: number;
  transit: number;
  moving: number;
  returning: number;
  selected: number;
  renderer: string;
}

/**
 * A whole-game save (C# SimSave). The page only reads the header fields; the rest is passed
 * back to Unity untouched.
 */
export interface SaveFile {
  version: number;
  savedAt: string;
  time: number;
  oreDelivered: number;
  sortiesCompleted: number;
  [key: string]: unknown;
}

/** Outcome of a LoadSave call. */
export interface LoadedEvent {
  ok: boolean;
  error: string;
  time: number;
}

/** Unity -> page events, dispatched on window as `spacemining:<name>`. */
export interface BridgeEvents {
  ready: ReadyEvent;
  state: FleetState;
  save: SaveFile;
  loaded: LoadedEvent;
}
