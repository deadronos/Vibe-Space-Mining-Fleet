# Open-ended system route, warp sequence and per-system looks

[GitHub issue #78](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/78). Follow-up: [#79 star map overlay](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/79).

UVCS branch `/main/feature-78-system-route`: changeset `cs:69` (from `cs:68`). Not merged into `/main` yet.

This stays within [ADR 0010](../../agents/decisions/0010-open-ended-systems-and-warp.md): a linear, seeded, open-ended route with revisitable fields, and no strategic map.

## What changed

### Sim

- **Route.** `CurrentSystem` can now be any value from 0 (home) upward. `FleetCommand.WarpTo(n)` charges toward a neighbouring system only. A bare `StartWarp` means one system outward. Every visited field keeps its state in `inactiveSystems`. `Visited(n)` and `FurthestSystem` expose the route so far.
- **Seeds.** `SystemSeed(n)` seeds a system's field on the first visit. System 1 keeps its old seed, so saves from before this change generate the same field.
- **Scaling with distance** (`WarpBalance`):
  - `OreAt(n) = 1 + 0.75·n`: system 1 is ×1.75, as before, and system 4 is ×4.
  - `PirateFloorAt(n) = min(1, 0.35·n)`: the distance factor peaks from system 3 onward.
  - `ExtraRaidersAt(n) = 1·(n−1)`: more raiders per wave beyond system 1. The cap is still `maxWaveSize`.
  - Data's system multiplier uses its last entry (×1.5) past the end of the table, where it used to fall back to 1.
- **Retreat.** If the carrier is destroyed, it jumps straight home from any system.
- **Events.** `WarpStarted` (destination, charge time), `WarpCancelled`, and `WarpArrived` (new system, the system it came from).
- **Save version 9.** Adds `warpTarget`. Validation allows any number of systems up to `MaxSystems` (1000), rejects duplicate ids, and requires a charging warp to target a neighbour. Version 5–8 saves still load with two systems at most, and a v8 save that is mid-charge heads for the other system.

### Views

- `SystemLook` (`Scripts/Views`) gives each system its look, seeded from the route seed and the system index: sun and rim light, ambient, sky colour, star density and warmth, planet direction, size and colour, a colour grade, and a generated name such as "Tysuia Shoal". Home's authored values live here, and `MiningFleetSceneBuilder` uses them.
- `WarpSequence` (`Scripts/Views`, created by **Build Demo Scene**) plays the warp. The sim still jumps in one tick, so the effect is staged around that tick:
  - **Charge:** a drive light and sparks at the stern brighten and pulse faster as the charge fills.
  - **Last 1.6 s:** star streaks rush past, the hull stretches along its axis, the camera shakes and the exposure climbs to a white-out.
  - **Arrival:** the new look is applied under the flash, then the flash, streaks and stretch fade over 1.4 s.
- `FleetCamera` starts at 3.5× the zoom after an arrival and eases in over about 2.5 s.
- `Starfield.Fill(seed, density, warmth)` refills the sky for each system.

### HUD

- The **Warp out** and **Warp back** buttons replace **Start warp**. **Warp back** is hidden at home. Their tooltips show the destination's name, ore multiplier, extra raiders, whether it is uncharted, and the recall warning.
- The status strip shows "System 3 · Name", or the countdown to the destination's name.
- The event log and banner show warp started, cancelled and "Arrived at …". On the frame the system changes, the arrival notice and the carrier-retreated notice still show; other events from the departure tick are dropped as before. Before this change, a retreat from system 1 lost its banner.

## Verification

- `scripts/unity-check.sh`: compiled, **EditMode 177 of 177 passed**. That includes the new `RouteTests`:
  - outward to system 3, with ore and pressure scaling;
  - system 1's seed is unchanged;
  - warping back keeps fields, including through a save;
  - only neighbours can be targeted;
  - events;
  - a charging warp survives a save, and a v8 save migrates;
  - bad route saves are rejected;
  - a retreat from system 2 jumps home.

  The existing round-trip tests now warp with explicit `WarpTo`.
- Play mode in the Editor, after **Build Demo Scene**, with no console warnings or errors:
  - home to system 2 ("Tysuia Shoal", teal palette), then back home;
  - captured the charge glow, the departure streaks at 0.65 s left, and the arrival flash, in slow motion with `Time.timeScale = 0.08`;
  - the HUD showed the destination countdown, the arrival banner, and **Warp back** in system 2.
- Web build (**Build Web**: `Succeeded size=10.3MB`, about the same as before), served on a clean port (5199). Checked in the built-in browser at real speed:
  - **WebGPU:** no console errors. A real click on **Warp out** started a charge; the save showed `version 9`, `warpTarget 1`. At the jump the streaks rushed past and faded, system 2 ("Tysuia Shoal") loaded with its teal look, and the HUD showed the arrival banner and **Warp back**.
  - **WebGL2** (`?renderer=webgl2`, and the bridge reported `WebGL 2`): reloading the save restored system 2's look. Warping on reached system 3 ("Orniia Deep", green palette): ore ×2.5, distance 70%, next wave 6 raiders.
  - **Phone (812 × 375, touch layout):** the command bar fits on two rows, including **Warp out** and **Warp back**. In portrait the page asks to rotate, as before.
- **Minor, existing:** the banner overlaps the top-right command buttons for a few seconds. The longer arrival message makes it wrap at narrow widths.

## Open points

- Balance past system 2 is unmeasured. `WarpBalanceScenarios` still covers systems 0 and 1 only.
- Every visited system adds a full rock list to the save, about the size of one field each.
- There is no audio. The project has no audio yet.
- Rock tints don't change per system; only the lighting does, which shifts them.
- Branching destinations and the star map: [#79](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/79).
