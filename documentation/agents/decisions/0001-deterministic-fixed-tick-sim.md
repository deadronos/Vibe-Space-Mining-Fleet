# 0001: Deterministic sim at a fixed tick, separate from views

- **Status:** Accepted
- **Date:** 2026-11-08
- **Issue:** #1 (Phase 1: sim core)
- **Decided by:** the user, with the phase 1 plan

## Context

The game needs hundreds of drones, saves that restore the exact state, and later maybe replays, lockstep or offline progress. MonoBehaviour-driven movement with `Update` and physics can't give any of that, and costs a lot per object in WebAssembly.

## Decision

- All game state and rules live in `FleetSim` (asmdef `SpaceMining.Sim`): plain C#, no MonoBehaviours, no `UnityEngine.Random`, no physics. Collision uses a uniform spatial hash grid and analytic sphere casts.
- `FleetSimRunner` steps the sim at a fixed 20 Hz tick (`FleetConfig.tickRate`). Views (`Carrier`, `MiningDrone`, `Asteroid`) only read state and interpolate between ticks.
- All randomness comes from `SimRng` (mulberry32), seeded from config. Its state is part of the save.
- Input becomes `FleetCommand`s, queued and applied at the start of a tick. Events (`SimEvents`) flow out to the views.
- The same seed and the same commands give the same state. The EditMode tests check this, including after a save and load.

## Consequences

- Saves are a full snapshot (`SimSave`), and a round trip is exact.
- A new mechanic goes into `FleetSim` with a test, and then gets a view. Don't put rules in MonoBehaviours.
- The sim still uses `UnityEngine.Vector3`, `Quaternion` and `Mathf`. That is fine in Unity, but it isn't engine-free and isn't bit-identical across platforms. Revisit this only if lockstep multiplayer or a server sim ever becomes a goal.
- Perf: about 0.05 ms per tick at 500 ships in the Editor (#31), far below the budget where Burst or ECS would be worth adding (#30).
