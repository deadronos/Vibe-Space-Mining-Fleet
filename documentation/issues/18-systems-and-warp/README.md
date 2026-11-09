# #18 Systems and warp

[GitHub issue #18](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/18)
implements [ADR 0010](../../agents/decisions/0010-open-ended-systems-and-warp.md).

Git branch: `feature/18-systems-and-warp`. UVCS branch:
`/main/feature-18-systems-and-warp`, changesets `cs:26` and `cs:27` (based on
`cs:25`), merged into `/main` as `cs:28`.

## Changes

- Two seeded, revisitable systems share a persistent fleet. System 2 generates
  50% more ore per rock, including respawns; its distance factor is at least
  50%, increasing wave pressure, and its first wave arrives 30% sooner.
- Starting warp recalls the fleet and charges for 90 seconds. The HUD names
  ships still out, displays the countdown and allows cancellation. Drones,
  barges, haulers and squadrons stay aboard once recalled. Logistics ships at
  their berths are hidden and cannot be targeted while the fleet is recalled.
  Ships still outside at departure are lost; their cargo goes with them.
- The active field is snapshotted on departure, including rocks, veins, RNG,
  pirates and wave state. Its timers pause while away. Fleet cargo, carrier
  resources and the build queue travel with the fleet. The camera cuts to the
  carrier on a system change. Carrier destruction still retreats home.
- Save version 5 adds the system snapshots and charge state. Supported saves
  from versions 2–4 load into system 1. The web shell continues to treat the
  save as opaque JSON.
- A recalled fleet remains aboard after cancellation or arrival until the
  player resumes automation, launches a drone, or issues a new order.

## Verification

- Unity compiled without current errors. All **58 EditMode tests passed**.
  New tests cover a two-system round trip with independent ore and surveyed
  veins, JSON save/load between jumps and during charging, version 4 migration,
  cancellation, a deliberately distant lost drone, and automatic recall of
  all four ship classes from 90 units. They also check carrier and logistics
  cargo carryover, paused depleted-rock respawn, and protection of berthed
  logistics ships. Existing version 2 and 3 migration tests also pass.
- The Unity web build succeeded at **10.2 MB** in 76 seconds with no build
  errors. `pnpm run check` passed after removing Playwright's generated files.
- In Chrome on WebGPU, manual recall showed the remaining ships then
  “Everyone aboard”; cancellation stopped the countdown. A subsequent jump
  reached system 2 with ten drones, a barge, a hauler, a squadron and 645 t of
  refined ore, and the HUD showed increased pirate pressure. The browser check
  used the build before the final camera, berth visibility and HUD layout
  refinements. The final build was reloaded from a version 5 save and its
  repositioned warp control and countdown were checked in Chrome.

## Open points

The 90-second charge has been tested at 90-unit deployed distances, not tuned
across a broad set of player layouts or under combat. [#48](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/48)
tracks a broader balance pass and possible headless scenarios. Later
destinations and map revelation remain future work.

## PR review follow-up

- Reject invalid inactive rocks and pirates before loading. Tests cover both
  null C# entries and raw JSON nulls, which `JsonUtility` turns into default
  objects; rejected loads leave the live simulation unchanged.
- Clear event history and its location links on a system change, including
  notices emitted in the departure frame.
- Unity compiled and **62/62 EditMode tests passed**. The rebuilt web player
  succeeded at 10.2 MB. Chrome/WebGPU completed system 1 → 2, saved and
  reloaded, then returned to system 1 with ten drones, one barge, one hauler,
  one squadron and 193 t refined ore. For the return, a disposable copy of
  the save brought a raid warning forward: its event-log row appeared before
  departure and the log was empty after arrival. The warning timing was the
  only intentional fixture change.
