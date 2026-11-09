# #30 Render baseline: 500 drones on WebGPU and WebGL2

GitHub issue: [#30](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/30)

Two steps so far. First a baseline, measured before changing anything (below).
Then [batched drone rendering](#batched-drone-rendering): it brings 500 drones on
WebGPU from 41 to 60 fps.

## Where the code lives

| | |
| --- | --- |
| UVCS branch | `/main/feature-30-render-baseline` |
| Changeset | `cs:36` |
| Merged to `/main` | `cs:37` |
| Git branch | `feature/30-render-baseline` (web shell, these notes, the web build) |
| Batched rendering, UVCS | `/main/feature-30-instanced-drones`, `cs:38` |
| Batched rendering, git | `feature/30-instanced-drones` (web build, readout position, these notes) |

## What changed

Unity (`cs:36`):

- `Sim/RenderBench.cs` (new): `RenderBench.FromUrl` reads `bench=N` from the page
  URL (capped at 2,000). `RenderBench.Apply` starts N drones, launches every 0.05 s,
  turns pirate waves off and raises `maxClaimsPerRock` to `ceil(N / rocks) + 4`.
  Without that last change, drones that found no free rock went home. That held 500
  drones at about 270 in flight; with it, about 460 are in flight.
- `PerfStats.cs` (new): a rolling one-second window of frame time (mean, p95 and
  worst), fps, sim step time per frame and per tick, and view sync time per frame.
- `FleetSimRunner.cs`: applies the benchmark in `Awake`, and times the tick loop and
  the view sync with a `Stopwatch`. It also adds the `SpaceMining.SimStep` and
  `SpaceMining.SyncViews` profiler markers. `FleetSimRunner.BenchDrones` sets
  the count in the Editor.
- `Web/WebBridge.cs`: `ready` carries `bench`, and `state` carries `fps`, `frameMs`,
  `frameMsP95`, `frameMsMax`, `simMs`, `tickMs` and `syncMs`.
- `FleetSimTests.cs`: URL parsing cases, and a 500-drone benchmark sim that keeps
  more than 350 drones out at 45 s with no pirates.

Web (git):

- `web/src/bench.ts` (new): when `ready.bench > 0`, shows a readout in the top
  left. It skips 45 s of warm-up, samples once per sim second for 60 s, then logs
  `[bench] summary` and exposes `window.spaceMining.bench.summary()`.
- `web/src/main.ts`: a benchmark run doesn't load the stored save and never
  autosaves, so the player's game is safe.
- `web/src/protocol.ts`: the new fields.

Run it with `?bench=500`, and add `&renderer=webgl2` for WebGL2.

## Results

Apple M4 (24 GB), macOS, Chrome 144, 1440 × 773 CSS px at DPR 1 (Chrome DevTools
MCP browser), local `pnpm dev`, 9 Nov 2026. Each row is a 60-sample mean after
45 s of warm-up. "Other" is frame time minus sim and sync: rendering, UI Toolkit,
the browser and the vsync wait.

| Renderer | Drones (in flight) | fps | Frame ms (p95 / worst) | Sim ms/frame (per tick) | Sync ms | Other ms |
| --- | --- | --- | --- | --- | --- | --- |
| WebGPU | 500 (458) | **40.9** | 24.5 (27.8 / 33) | 0.16 (0.33) | 0.96 | 23.4 |
| WebGL2 | 500 (457) | 59.5 | 16.8 (19.3 / 29) | 0.11 (0.33) | 0.91 | 15.8 |
| WebGPU | 10 (10) | 60.0 | 16.7 (– / 19) | 0.02 (0.06) | 0.10 | 16.6 |

The console showed no errors or warnings. In the EditMode perf test, 500 ships
took 0.06–0.07 ms per tick.

Web build after this change: wasm 7,452,776 B (+2,485), data 3,130,389 B (+679).
The framework and loader are the same size, and the total is still 10.2 MB.

## What it says

- **The sim isn't the problem.** Sim and view sync together take about 1.1 ms of a
  frame at 500 drones, on both renderers.
- **WebGPU is the bottleneck: 500 drones run at 41 fps, below the 50 fps target.**
  WebGL2 holds vsync at 60 fps with the same scene. WebGPU also holds 60 fps with 10
  drones, so the cost grows with the number of drones. It isn't a fixed WebGPU
  overhead. Each drone is a GameObject with mesh renderers, engine `TrailRenderer`s and
  a `LineRenderer`/`ParticleSystem` laser. Per-object draw submission, or trails,
  seem to cost much more on Unity's WebGPU backend.
- An M4 is not a "mid laptop". The issue's done-when line (50 fps in Chrome) still
  needs a slower machine, and WebGPU already misses it here.

## Batched drone rendering

The baseline pointed at per-object rendering: each drone had 8 mesh renderers (cubes,
cylinders and spheres from `MiningFleetSceneBuilder`), 2 `TrailRenderer`s, a
`LineRenderer` laser and a `ParticleSystem`. That is about 12 renderers per drone, or
roughly 5,000 per frame at 500 drones.

### What changed (`cs:38`)

- `DroneBatchRenderer.cs` (new) is added to the runner at start-up and draws every
  drone:
  - **Hulls.** It merges the drone prefab's parts into one mesh per material (4
    meshes) and draws them with `Graphics.RenderMeshInstanced`. That is 4 calls per
    1,023 drones, each with shadows. The prefab is still the source of the look; no
    asset or scene changes.
  - **Trails.** Each engine keeps a ring of up to 14 points, sampled every 35 ms.
    All trails go into one camera-facing ribbon mesh, with the prefab trail's time,
    start width and colour gradient. A drone that docks or a game that loads clears
    its trail.
  - **Lasers.** All beams go into a second ribbon mesh (same widths and flicker as
    the old `LineRenderer`).
  - **Sparks.** One shared particle system, cloned from the prefab's, emits 60
    sparks a second at each hit point.
- `RibbonMesh.cs` (new): builds one dynamic mesh of camera-facing strips per frame.
  It uses 32-bit indices only above 65,535 vertices.
- `MiningDrone.cs`: when batched, the drone switches its own renderers off and skips
  the laser code. `Beam()` returns the laser's start and hit point (the same rock
  raycast as before) for the batch renderer. The GameObject and its transform stay,
  so selection, camera follow, control groups and orders work as before.
- `FleetSimRunner.cs`: batching is on by default. `?batch=0` in the URL (or
  `FleetSimRunner.BatchOverride = false` in the Editor) keeps the old renderers for
  comparison. If a part mesh isn't readable, it logs a warning and falls back.
- `RenderBench.BatchFromUrl` and 5 more EditMode tests (78 in total, all passing).

Web (git): the new build, and the bench readout moved to the top centre so it
doesn't cover the HUD.

### Results

Same machine, browser and window as the baseline; the same build for every row.
Every row runs at a 60 Hz display, so 60 fps is the vsync ceiling.

| Renderer | Drones (in flight) | Batched | fps | Frame ms (p95 / worst) | Sim ms/frame | Sync ms |
| --- | --- | --- | --- | --- | --- | --- |
| WebGPU | 500 (458) | no (`?batch=0`) | 43.1 | 23.3 (26.3 / 32) | 0.15 | 0.92 |
| WebGPU | 500 (458) | yes | **60.0** | 16.7 (17.2 / 18) | 0.12 | 0.69 |
| WebGL2 | 500 (457) | yes | 60.0 | 16.7 (18.0 / 19) | 0.11 | 0.66 |
| WebGPU | 2,000 (871) | yes | 60.0 | 16.7 (18.1 / 20) | 0.23 | 1.41 |
| WebGL2 | 2,000 (870) | yes | 60.0 | 16.7 (18.1 / 21) | 0.23 | 1.43 |

A 2,000-drone bench keeps only about 870 in flight. One drone launches per tick
(20 a second), and sorties are short, so the rest wait in the hangar.

Also checked:
- **Normal game** (`/`, WebGPU): starts with no console errors and holds 60 fps.
  Box-select still picks up all 10 units.
- **Editor play mode**: the log says "batched drones". Hulls, trails, lasers and
  sparks draw; the laser mesh had 3 beams, each 2–4 units long, ending at the
  sparks.
- **Console**: one warning, on WebGL2 only. URP's FSR upscaling shader (`Edge
  Adaptive Spatial Upsampling`) is stripped from the build. It comes from the
  pipeline settings, not from this change.

Web build: wasm 7,467,073 B (+14,297 over the baseline build), data 3,134,915 B
(+4,526). The total is still 10.2 MB.

### Open points

- At 60 fps vsync on an M4 there is headroom left that these numbers can't show. A
  slower laptop (the issue's done-when) still needs a run.
- Other units still draw one GameObject at a time: squadron fighters, pirates,
  haulers and barges. Pirates and fighters are the next candidates if waves grow.
- No culling: instanced draws send every drone, in view or not. That isn't needed at
  these numbers.
- The HUD's "Still out" list can't fit hundreds of drones and runs off its panel
  (seen in the 500-drone bench). This is a separate HUD issue.

## Next steps (still #30)

1. Run `?bench=500` and `?bench=500&batch=0` on a mid-range laptop.
2. Batch fighters and pirates the same way if waves or squadron counts grow.
3. Draw distant units with a lower-detail mesh, and drop trails and lasers at
   distance, only if profiling on slower hardware asks for it.
