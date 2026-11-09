# #53 Squadrons rotated relative to the carrier plane

GitHub issue: [#53](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/53)

## Where the code lives

| | |
| --- | --- |
| UVCS branch | `/main/feature-53-squadron-tilt` |
| Changeset | `cs:32` |
| Repository | `Vibe-Space-Mining-Fleet/Vibe-Space-Mining-Fleet@iridanblub@unity` |

## Cause

A squadron on automation guards a post 5 units above the carrier. The post was taken from `Carrier.Position`, which bobs (amplitude 0.35, 0.25 Hz). Once the squadron reached its post, all that was left was following the bob, so its velocity was purely vertical (about ±0.45 u/s). `SquadronView` turned to `LookRotation(velocity)` above a speed of about 0.22, which stood the fighters on their tails: pitch swung between about +89° and -89° every 4 s. Drones stayed within ±7°.

## What changed in the Unity project (cs:32)

- `Assets/_Game/Scripts/Sim/FleetSim.Combat.cs`: the guard post (on automation, and for an escort order on the carrier) hangs off `Carrier.BasePosition`, the un-bobbed position. Engagement range is still measured from `Carrier.Position`.
- `Assets/_Game/Scripts/SquadronView.cs`: new `Facing(look)`. The heading comes from the horizontal part of the velocity or target direction. Pitch follows the vertical part, capped at `maxPitch` (30°, serialized). With almost no sideways motion the squadron keeps its heading and levels out.
- `Assets/_Game/Tests/EditMode/CombatTests.cs`: `GuardingSquadron_DoesNotFollowTheCarrierBob` launches the squadron, lets it settle, and checks its vertical speed stays below 0.05 over two bob periods.

## Verified

- Recompile: 0 errors, 0 warnings.
- EditMode: 63/63 pass. With the sim change reverted, the new test fails (vertical speed 0.47), and with it, it passes.
- Editor play mode, squadron parked at its post, sampled every ~3 s for 15 s: velocity (0, 0, 0), pitch 0.0°, roll 0.0°, 5.02 above the carrier's base position while the carrier bobs between -0.35 and +0.32.
- Editor play mode, move order 60 up and 6 across (almost vertical): pitch -30.0° while climbing, +29.8°/+30.0° diving back to the post, 0.0° once there.
- Web build: succeeded, 10.2 MB (wasm +4 KB). The page loads in the browser (WebGPU) with no console errors. At normal zoom the fighters are too small to judge their angle by eye; orientation was checked in the Editor.

## Notes

- The sim change moves parked squadrons by up to 0.35 units vertically compared with before. Balance is unaffected: engagement range is still measured from the carrier's real position.
- `maxPitch` isn't in `Squadron.prefab` yet, so the field's default (30) applies. The next **Build Demo Scene** writes it into the prefab.
