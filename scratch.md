# Scratch: what to do next

Written 8 Nov 2026 from the open issues. Phases 1 and 2 (#1, #2) and the web shell (#3, #4) are done. Everything below is open.

## Suggested order

| #   | Issue                                                | Why now                                                                                                                                                                                                   | Size |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | #31 EditMode tests for FleetSim                      | Safety net before the sim grows in phases 3 and 4. Add `com.unity.test-framework` (not in the manifest yet). The perf test gives the ms-per-tick number that decides whether Burst or ECS is ever needed. | S    |
| 2   | #8 Decision: direct control vs automation            | Cheap to settle, and it shapes #20, #15 and #16. Write the rules into `documentation/`.                                                                                                                   | S    |
| 3   | #13 Decision: HUD technology                         | Phase 3 adds the build queue and throughput panel, the first big UI. Pick uGUI, UI Toolkit or HTML before building it.                                                                                    | S    |
| 4   | #11 Control-group keys, then #32 RTS controls polish | Ctrl+1-9 is unusable in Chrome on Windows and Linux. Fix it together with the hotbar and stop order.                                                                                                      | S-M  |
| 5   | #15 Phase 3: logistics chain                         | The main gameplay step. Barges, haulers, throughput bottleneck, build queue, save version bump.                                                                                                           | L    |
| 6   | #34 Post-deploy smoke check                          | Small and independent. Do it before the next tag release.                                                                                                                                                 | S    |

## After that

- **#9 enemy design**, then **#16 Phase 4 combat**, with #20 stance scopes and #21 cargo heat alongside.
- **#30 instancing and LOD**: take a baseline of 500+ drones on WebGPU and WebGL2 before phase 3 adds units, then do the work when the numbers say so.
- **#17 Phase 5 Sensors Manager**, **#18 Phase 6 warp**, and the asteroid-fleet ports #19, #22 to #27.
- **#33 cross-browser and device testing**, ahead of any public announcement.
- **#12 where the Unity build lives**: not urgent, but each release adds about 10 MB of history.

## Needs a decision, not code

#5 run structure, #6 meta-progression, #7 offline progress, #10 hangar slot board, #14 art direction. Revisit these when the phase that depends on them is next.

## Packages (see the comments on #31, #30, #29, #28, #16, #17, #32, #37)

- Now: `com.unity.test-framework` (#31).
- With the grid: `com.unity.collections` and `com.unity.mathematics`.
- Later: `com.unity.cloud.gltfast` (#29), `com.unity.cinemachine` (#17), `com.unity.burst` only after profiling.
- Skip Entities and Entities Graphics for now. Revisit only if the sim tick passes about 8-10 ms at the target ship count and Burst on the grid is not enough.

## Decision checkpoints

- Add one package at a time and compare web build size.
- Profile WebGPU against the WebGL2 fallback before and after any rendering change.
