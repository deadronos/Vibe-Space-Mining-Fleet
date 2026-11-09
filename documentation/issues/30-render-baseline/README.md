# #30 Render baseline: 500 drones on WebGPU and WebGL2

GitHub issue: [#30](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/30)

This is the first step of #30: measure before changing anything. Instancing and
LOD are not implemented yet.

## Where the code lives

| | |
| --- | --- |
| UVCS branch | `/main/feature-30-render-baseline` |
| Changeset | `cs:36` |
| Git branch | `feature/30-render-baseline` (web shell, these notes, the web build) |

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

## Next steps (still #30)

1. Find out what grows with drone count on WebGPU. Turn trails off, then lasers,
   then use one shared material (with `?bench=500`). Read the frame in Chrome's
   WebGPU profiling, or in the Unity profiler with a development build.
2. Then draw drones with `Graphics.RenderMeshInstanced` and keep GameObjects only for
   near or selected units, as the issue describes. Re-run this table to compare.
3. Add a 1,000-drone row once instancing is in.
