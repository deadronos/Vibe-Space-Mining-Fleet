# Warp recall, ore and pirate balance

[GitHub issue #48](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/48)

Run the same fixed-tick simulation as the web player from the Unity Editor CLI. Start from the demo scene configuration. Use fixed seeds and keep the shipped 90-second charge and system-two modifiers as the baseline. Routine deployments should leave no ships or cargo behind at departure. Deliberate overextension should remain risky.

1. Add a regression test for per-run tuning and preserve the default setup and saved countdown.
2. Add an Editor command to run deployment and economy scenarios, reporting candidate settings, seeds, and outcomes.
3. Compare candidate runs against the baseline and record representative seeds and trade-offs.
4. Compile, run EditMode tests, and verify representative recalls in the web player.

## Run the sweep

Open the Unity project in the Editor, then run from the Git root.

```zsh
U=~/.unity/bin/unity
P="$PWD/Vibe-Space-Mining-Fleet"
"$U" command script eval \
  --code 'return SpaceMining.Editor.WarpBalanceScenarios.Run();' \
  --caller plugin --skill unity-cli --project-path "$P" --no-banner \
  --timeout 300 --result-only
```

The runner reads the demo scene in a preview scene and steps the player simulation
at 20 Hz. It writes `Library/WarpBalance.csv` and two seed-42 import saves
(`WarpRecall-150.json` and `WarpRecall-300.json`) in the Unity project. The saves
start before charging. Import each into the web player and press **Start warp**.

- Seeds are 1, 7, 19, 42, 73, 101, 207 and 313.
- Recall compares 45, 60, 75, 90 and 105 seconds at 60, 90, 150, 300, 600 and 1,200 units. All four classes deploy simultaneously toward the seeded belt. The stress fixture moves the carrier toward the belt, doubles the drone count, adds one of each other ship class, and spawns three raiders. These changes are combined in one fixture.
- The recall manifest is measured just before the departure tick. Combat losses are counted separately. The clear time is the first tick of the last continuous span with no surviving ships outside. A clear time of `-1` means the fleet was still outside at departure.
- Economy compares 5- and 15-minute windows, with automatic mining and no scripted ship purchases. System 1 starts at the initial state. System 2 starts just after the outbound jump. The sweep varies ore capacity, pirate distance floor, and first-wave delay. It also runs the selected defaults together and checks that the saved inactive rocks survive a return jump.
- Recovery is time from the latest combat loss to restoration of the original fleet count. A value of `-1` indicates no measured recovery, including runs without losses. Fleet recovery in this fixture does not model a player spending ore to rebuild.

## Tuning

| Setting | Shipped baseline | Selected |
| --- | ---: | ---: |
| Warp charge | 90 s | 60 s |
| System 2 ore per rock | +50% | +75% |
| System 2 pirate distance floor | 50% | 35% |
| System 2 first wave | 168 s | 204 s |

At 60 seconds, all 48 runs at 60–150 units brought back every ship and all
cargo without combat losses. The slowest of those fleets cleared in 31.95 s.
In the home-carrier fixture, all eight 300-unit runs left a barge behind at
60 seconds and all eight recovered it at 75 and 90 seconds. With seed 42,
that barge carried 1,200 t. All eight stress runs at 300 units brought back
the survivors at 60 seconds, with two combat losses per run. This is why the
report separates departure losses from combat losses.

The 45-second candidate also cleared the tested routine distances. We chose
60 seconds to leave roughly 28 seconds above the slowest observed routine
return and keep a 300-unit barge deployment risky. Ship classes use their
shipped speed and acceleration settings throughout these fixtures.

Unity changeset `cs:34` on `/main/feature-48-warp-balance` merged into
`/main` as `cs:35`.

### Economy results

Medians over eight seeds, measured from entry into each system.

| Setup | Window | Ore delivered | Rocks depleted | Waves / raiders | Combat losses |
| --- | ---: | ---: | ---: | ---: | ---: |
| System 1 baseline | 5 min | 5,944 t | 21 | 1 / 2 | 0 |
| System 2 baseline | 5 min | 5,788 t | 14 | 1 / 4 | 0 |
| System 2 selected | 5 min | 5,868 t | 12 | 1 / 4 | 0 |
| System 1 baseline | 15 min | 16,611 t | 61.5 | 3 / 8 | 1 |
| System 2 baseline | 15 min | 14,629 t | 33.5 | 5 / 26 | 4 |
| System 2 selected | 15 min | 15,350 t | 31 | 4 / 18 | 3 |

The selected system 2 settings improve median 15-minute delivery by about
5% over the shipped system 2 balance. The starter fleet still delivers more
in system 1 at that horizon. The system 2 reward is denser rocks and fewer
depletions per tonne. It still faces more raiders than system 1. There were
no carrier retreats or measured carrier hull loss in these economy runs. All
304 outbound economy runs preserved the inactive rock state across save,
reload, and return. The sweep covers 800 runs in total.

Seed 42 illustrates the trade-off. At 15 minutes in system 2 the selected
settings delivered 14,629 t versus 13,652 t at baseline, with 18 raiders
versus 26. Combat losses rose from four to five on that seed despite the
lower median across the sweep.

A second run produced byte-identical CSV and fixture saves.

## Verification

- Unity 6000.6.8f1 compiled with zero errors. EditMode passed 64 of 64 tests.
- The web build succeeded at 10.2 MB. `pnpm run check` passed.
- Chrome WebGPU loaded both seed-42 fixtures through the save importer.
  Starting warp from the HUD showed the new 60-second charge. At 150 units,
  all 10 drones, one barge with 1,200 t, one hauler, and one squadron arrived.
  At 300 units, the same fleet arrived without the barge and its cargo.
  Both arrival saves scheduled the first wave 204 seconds after departure.
