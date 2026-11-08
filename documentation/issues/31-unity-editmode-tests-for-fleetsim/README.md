# #31 Unity EditMode tests for FleetSim (determinism, save round-trip, orders)

GitHub issue: [#31](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/31)

## Where the code lives

The Unity project is not in git (it is under Unity Version Control), so this PR carries only these notes.

| | |
| --- | --- |
| UVCS branch | `/main/feature-31-fleetsim-tests` |
| Changeset | `cs:13` ("tests") |
| Repository | `Vibe-Space-Mining-Fleet/Vibe-Space-Mining-Fleet@iridanblub@unity` |

## What changed in the Unity project

- `Packages/manifest.json`, `packages-lock.json`: added `com.unity.test-framework` 1.8.0.
- `Assets/_Game/Tests/EditMode/SpaceMining.Sim.Tests.asmdef`: Editor-only test assembly referencing `SpaceMining.Sim`.
- `Assets/_Game/Tests/EditMode/FleetSimTests.cs`: 11 tests.

## Tests

| Area | Test |
| --- | --- |
| Determinism | Same seed twice gives identical state after 60 s; a different seed differs |
| Save / load | Save → load → 120 s matches the original run, directly and through `JsonUtility` JSON |
| Bad saves | `null`, wrong version, wrong drone or rock count, inconsistent hangar data and a missing drone are all refused, and the sim's state stays unchanged |
| Orders | Move, mine and dock orders complete and hand the drone back to automation (dock ends in the hangar) |
| Carrier | A move order ends within `arriveRadius` of the goal |
| Perf | Milliseconds per tick at 100 and 500 ships; asserts most of the fleet is out before timing, and fails only above 50 ms/tick |

## Results

All 11 pass in the Editor (Unity 6000.6.8f1, EditMode).

Perf, logged as `[perf] N ships: X ms/tick` (Editor, Mono, simple belt):

| Ships | ms per tick |
| --- | --- |
| 100 | about 0.03 |
| 500 | about 0.05 |

At 20 Hz that is far below the 8-10 ms budget in `scratch.md` that would justify Burst or ECS.

## How to run

Open the project in Unity, then Window > General > Test Runner > EditMode > Run All. Or from the shell, with the Editor closed:

```bash
"/Applications/Unity Hub.app/Contents/Resources/unity" test --help
```

CI needs a Unity license, which is tracked in #12.

## Notes

- `SpaceMining.Sim` still references `UnityEngine` (`Vector3`, `Mathf`). The tests run fine in EditMode, but the issue's wish to keep the assembly engine-free is not met today.
- The perf numbers are Editor timings. Take a WebGL baseline separately (#30).
