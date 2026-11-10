// Message shapes shared with Unity. The C# side is
// Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Web/WebBridge.cs (payload classes at the bottom)
// and Sim/Core/SimSave.cs; keep the two in step.

/** Commands the page can send (C# WebBridge.BridgeCommand, run by WebBridge.Command). */
export type BridgeCommand =
  | { type: 'launch' }
  | { type: 'recall' }
  | { type: 'toggleAutoLaunch' }
  | { type: 'setAutoLaunch'; value: boolean }
  | { type: 'resumeAuto' }
  | { type: 'build'; unit: UnitKind };

/** What the carrier can build (C# SpaceMining.Sim.UnitKind). */
export type UnitKind = 'drone' | 'barge' | 'hauler' | 'refinery' | 'squadron';

/** The link that limits income (C# SpaceMining.Sim.Bottleneck). */
export type Bottleneck =
  | 'None'
  | 'Mining'
  | 'DroneTravel'
  | 'HangarLaunch'
  | 'Haulers'
  | 'Refinery';

/** Sent once when the scene has started (C# BridgeReady). */
export interface BridgeReady {
  saveVersion: number;
  /** Oldest save version this build still loads; older saves are migrated by Unity. */
  minSaveVersion: number;
  renderer: string;
  drones: number;
  rocks: number;
  unityVersion: string;
  /** Drone count of the render benchmark (`?bench=N`, #30), or 0 in a normal game. */
  bench: number;
}

/** Live snapshot, a few times a second (C# BridgeState). */
export interface BridgeState {
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
  barges: number;
  haulers: number;
  /** Build queue length. */
  queue: number;
  /** Refined ore available to spend, t. */
  refined: number;
  /** Raw ore waiting for the refinery, t. */
  rawOre: number;
  /** Measured refined ore per second. */
  income: number;
  /** Estimated income from the throughput model, t/s. */
  estimatedIncome: number;
  bottleneck: Bottleneck;
  /** Fighter squadrons alive (phase 4). */
  squadrons: number;
  /** Pirate raiders alive. */
  pirates: number;
  /** Waves spawned so far. */
  wave: number;
  /** Times the carrier was destroyed and jumped home. */
  retreats: number;
  carrierHull: number;
  carrierHullMax: number;
  /** Cargo heat, 0..1: field cargo plus half the carrier raw ore. */
  heat: number;
  /** Seconds until the next wave (paused while one is being fought). */
  nextWaveIn: number;
  /** Timings over the last second (#30): frames per second. */
  fps: number;
  /** Frame time mean, 95th percentile and worst, ms. */
  frameMs: number;
  frameMsP95: number;
  frameMsMax: number;
  /** Sim step time per frame (all ticks) and per tick, ms. */
  simMs: number;
  tickMs: number;
  /** View sync time per frame, ms. */
  syncMs: number;
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

/** Outcome of a LoadSave call (C# BridgeLoaded). */
export interface BridgeLoaded {
  ok: boolean;
  error: string;
  time: number;
}

/** A player-facing fleet event. */
export interface FleetNotice {
  /** A C# SimEventKind name, such as `WaveWarning` or `OfflineCredit`. */
  kind: string;
  severity: 'info' | 'warning' | 'alert';
  message: string;
  position: { x: number; y: number; z: number };
  time: number;
}

/** Unity -> page events, dispatched on window as `spacemining:<name>`. */
export interface BridgeEvents {
  event: FleetNotice;
  ready: BridgeReady;
  state: BridgeState;
  save: SaveFile;
  loaded: BridgeLoaded;
}
