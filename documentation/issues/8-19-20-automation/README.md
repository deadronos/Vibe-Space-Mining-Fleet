# Direct control, stance scopes and rule cards

GitHub issues [#8](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/8) (decision), [#20](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/20) (stance scopes) and [#19](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/19) (rule cards). The rules are [ADR 0016](../../agents/decisions/0016-direct-control-stances-and-rule-cards.md).

- **UVCS branch:** `/main/feature-8-19-20-automation`, from cs:55. Changeset: cs:56, merged to `/main` as cs:57.
- **Git branch:** `feature/8-19-20-automation`, merged to `main` by PR #70 (2b3560a). It holds ADR 0016, these notes and the web build.

## What changed

**C# (UVCS).**

- `Sim/Doctrine.cs` (new): `StanceAxis`, `MiningStance` (Greedy, Safe), `FireStance` (Flee, Stand, Retreat), `ScopeKind`, `CardPreset`, `StanceSet` (one value per axis, -1 = Default) and `RuleCard`.
- `Sim/FleetSim.Doctrine.cs` (new): fleet, class and group stance sets; the card list (12 at most); `Resolve` (unit > lowest group > class > fleet); the safe zone (80 from the carrier, 45 from an active squadron); the four presets; the commands; save and load.
- `Sim/SimTypes.cs`: drones, haulers and squadrons gain `Own` (overrides) and `Groups` (a bit per control group); barges gain `Groups`. `SimSquadron.Stance` is now the stance in effect, resolved each tick. New commands `SetUnitStance`, `SetScopeStance`, `AssignGroup`, `AddCard`, `RemoveCard`, `ToggleCard`, `MoveCard`. `SetStance` now sets the engagement override.
- `Sim/FleetSim.cs`: auto-launch and Launch skip a drone that a dock card or Safe mining keeps in; `ResumeAuto` and the drone step apply "drones dock"; mining applies "far out"; `FindTarget` takes the safe zone; `PickHaulerJob` applies "call a hauler"; save and load carry the new fields.
- `Sim/FleetSim.Combat.cs`: squadrons resolve their stance each tick and escort barges under the wave card; drones and haulers hit on automation follow their under-fire stance (haulers gain Flee); a destroyed unit leaves its groups; squadron save fields.
- `Sim/SimSave.cs`: version 8 (`carrierGroups`, `fleetStances`, `classStances`, `groupStances`, `cards`; `own` and `groups` on units).
- `Rts/SelectionController.cs`: control groups are read from the sim. Assigning sends `AssignGroup`; loading no longer clears groups.
- `UI/HudController.Fleet.cs` (new): the unit-override buttons under the selection (Fight, Mine, Hit, each with Default), and the manager's Fleet tab: a scope picker (Fleet, Drones, Haulers, Squadrons, groups 1 to 0), the axes for that scope, the card list (on/off, up, down, remove) and the presets to add.
- `UI/HudController.cs`, `.Manager.cs`, `.Selection.cs`: wiring, the fourth tab (rail button and **Y**), the old squadron-only tactics code removed.
- `UI/Hud.uxml`, `UI/Hud.uss`: the Fleet rail button and tab, the named tactics groups, styles.
- `Tests/EditMode/DoctrineTests.cs` (new): 20 tests.

**Git.** ADR 0016 and its index entry, these notes, a line in `web-shell.md` (groups are saved), `scratch.md`, and the web build in `web/public/unity/`.

## Verification

- `scripts/unity-check.sh`: compiled, EditMode 169 of 169 passed (149 before, 20 new; none inconclusive).
  - Precedence: unit > group (lowest number) > class > fleet; Default falls through; the fleet scope refuses Default; axes only apply where they mean something.
  - #20 "done when": a group's Passive beats the fleet's Aggressive in a fight (no shots fired). Safe drones mine only in the safe zone: with 30 drones after 40 s, the farthest rock mined was 78 from the carrier, against 96 for Greedy.
  - Flee, Stand and Retreat for drones; haulers flee by default and stand when set to.
  - #19 "done when": "drones dock" sends every drone home and auto-launch keeps them in until the wave is over; "escort barges" sends the squadron to a far barge on a warning. "Call a hauler" picks the barge past 80% over one with more free ore. "Far out" sends a half-full drone 150 from the carrier to a barge, and not one 30 from it.
  - A direct order and a Hold beat a card; Stop hands the unit back and the card applies. A stance change doesn't release a hold.
  - Save and load through JSON keep stances, groups and cards and continue identically. A version 7 save loads with defaults and keeps a squadron's non-Neutral stance as its override. An unknown card is refused without changing state; bad stance values load as Default.
- `pnpm run check` passed.
- Web build: Succeeded, 10.3 MB, errors=0 (the same as before).
- Browser, built-in pane, WebGPU, `pnpm dev --port 5199`, 826 x 871 CSS px (the compact layout), mouse and keys. The origin held a version 7 save from an earlier session (wave 7, 28 min in):
  - It loaded without console errors, so the version 7 to 8 migration works in the player too.
  - **Y** and the Fleet rail button open the tab. Fleet scope shows Neutral, Greedy and Flee lit. The Drones scope shows only Mining and Under fire, on Default. Clicking Safe lit it.
  - With the Drones scope picked, only the two drone presets can be added. "Wave warned > drones dock" was added and showed "waits for a wave", then "active" once wave 8 was announced.
  - Live: when wave 8 was announced, a launched drone turned for home ("returning"). During the attack, with auto-launch on, all 9 drones stayed docked ("Drones 0/9 out").
  - Shift+1 with the carrier selected filled slot 1 ("1 C"). After a reload the slot still showed "1 C", and the stored save was version 8 with `carrierGroups` 1, drones on Safe and the card.
  - A squadron, a hauler and a drone selected: the tactics row showed Fight, Mine and Hit, each on Default, plus formations. Hit > Stand lit Stand; when the drone docked and left the selection, the Mine row went away.
  - Two layout bugs found and fixed here: the tab's rows shrank onto each other inside the scroll view (now `flex-shrink: 0`), and a card's buttons were pushed out of the narrow panel (the label now has its own line).

Not checked in the browser: the 1920 x 1080 desktop layout, the touch layout, WebGL2, the escort, hauler and far-out cards (covered by the EditMode tests).

## Open points

- Custom cards (conditions, actions, parameters) are not built. The card model already stores a scope and an order.
- Haulers now flee when hit. Watch for runs that never finish during long waves.
- The per-unit conditions ("call a hauler", "far out") show no "active" tag in the card list; only the wave cards do.
