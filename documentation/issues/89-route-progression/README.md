# Warp arrival and route progression

[Resume mining #88](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/88) · [Route progression #89](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/89) · [Star map #79](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/79)

Warp still recalls the fleet and pauses automatic drone launches. If auto-launch was active, the command bar now offers **Resume mining** and **Keep docked** on arrival. Save version 12 retains that choice across a reload during or after a jump. Versions 2–11 still load and start without a pending prompt. Unity changes were checked in as `cs:81` on `/main/feature-88-89-warp-progression` and merged to `/main` as `cs:82`.

## Scenario

Run `SpaceMining.Editor.WarpBalanceScenarios.RunRouteProgression()` through the Unity CLI's `script eval` command. It writes `Library/RouteProgression.csv`. The [240-run snapshot](results.csv) uses the live scene setup, including hazards, at 20 Hz. Eight seeds (1, 7, 19, 42, 73, 101, 207, 313) run at HUD systems 1, 2, 3, 5 and 9 with each strategy and each pressure curve.

- The opening runs for eight minutes at Home. Builds use earned ore and the regular queue, with a spending cap of 4,800 t. Median actual opening investment is 0 t for starter (strategy 0), 3,900 t for defence-first (strategy 1, two squadrons and a repair ship), and 3,050 t for scout-first (strategy 2, one scout, three drones and a repair ship).
- The fleet then warps to its destination, enables auto-launch and mines for up to 15 minutes or until retreat. Upgraded strategies queue drone replacements when affordable. The starter strategy leaves the build queue alone. There are no manual combat orders or research purchases.
- Net refined ore measures the change after arrival, after rebuilds and repairs. Repair spend is refined production minus the change in the bank and charged build costs. It includes repair ships and docked fighter repair. Replacement shortfall compares the bank against the price of the missing drones at cutoff, accounting for the build queue.

## Results

System 9 results below are medians over eight seeds except for retreat counts. The starter runs that retreated ended early and include any emergency drones granted on retreat.

| Strategy | Extra raiders per step beyond System 2 | First wave | Net refined | Drones remaining | Retreats |
| --- | ---: | ---: | ---: | ---: | ---: |
| Starter | 1.0 | 13 | 5,408 t | 5 | 8/8 |
| Starter | 0.5 | 10 | 6,990 t | 0 | 0/8 |
| Defence-first | 1.0 | 13 | 2,574 t | 6 | 0/8 |
| Defence-first | 0.5 | 10 | 11,622 t | 10 | 0/8 |
| Scout-first | 1.0 | 13 | 1,378 t | 2 | 1/8 |
| Scout-first | 0.5 | 10 | 3,338 t | 10 | 0/8 |

The default is now **0.5 extra raiders per route step beyond System 2**, rounded as part of the total wave size. System 1 and 2 matched in every paired run. System 9 still wipes the unattended starter drone fleet, while upgraded fleets can rebuild. Scout-first brought in more ore but sustained more losses and kept less refined ore than defence-first in deeper systems.

One repair ship can spend 37.5 t/s at full output, above the roughly 20 t/s observed in the original starter opening. Across the gentler curve's upgraded runs, the highest measured interval-average combined repair spend was 6.34 t/s and zero of 80 runs had an ending drone replacement shortfall. The original curve had two shortfalls. This sweep does not establish a need for a repair reserve, so repair pricing and budgeting are unchanged.

## Star map inputs

The existing warp tooltip now uses the destination's ore multiplier and a first-wave raider estimate at the entry point with zero cargo heat. Both are available through `WarpTuning.OreAt(system)` and `FleetSim.FirstWaveBaseline(system)`. A visited field resumes saved pirate activity, so the tooltip identifies that case separately. The map can use the same estimates for unvisited fields and distinguish them from known activity on return visits. The full overlay remains tracked in #79.

## Verification

- All 266 Unity EditMode tests and six web tests passed. The Unity player and Vite builds succeeded.
- Chrome WebGPU verified outbound warp with the mouse and return warp with synthetic touch at 844 × 390. The scenario shortened the countdown by reloading a save after the miners were docked. All 10 drones arrived docked. Clicking **Resume mining** restarted launches. Tapping **Keep docked** dismissed the prompt and left the drones docked. A subsequent warp with auto-launch already off left the prompt hidden.
