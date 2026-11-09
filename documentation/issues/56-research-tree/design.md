# #56 Research tree: design

- **Issue:** [#56 Research tree without resets: first nodes](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/56)
- **Governing decision:** [ADR 0011](../../agents/decisions/0011-research-without-resets.md) (research with permanent unlocks, no run reset; prestige revisited in #57)
- **UI decision:** [ADR 0005](../../agents/decisions/0005-ui-toolkit-hud.md) (all game UI in UI Toolkit)
- **Status:** design agreed with the user, 9 Nov 2026. Built on `/main/feature-56-research-tree` (see [README.md](README.md)), checked in as cs:40.

## Intent

The game needs more to do with a running fleet. Research gives the player a
second thing to spend on: permanent upgrades to the fleet and chain they already
have, bought with a currency earned by playing actively (mining, delivering,
surveying, fighting). Nothing resets.

Ship modules (#23) and carrier modules (#59) aren't built yet, so the first nodes
improve existing systems. Module unlocks become later nodes once those features exist.

## Goals

- A separate research currency, **Data**, earned from play.
- Nine repeatable nodes that boost existing stats.
- One tap buys one level. Levels have no upper limit, with diminishing returns past a soft cap.
- A Research tab in the existing Build panel. The game keeps running while it's open.
- Buttons big enough to tap, so the panel works on touch screens later (#41).
- Research state lives in `FleetSim`, is saved, and old saves migrate.
- Every number is tunable in one config.

## Non-goals

- Module unlocks, ship classes and carrier modules (#23, #59). These come as later nodes.
- Prerequisites or a branching tree. The first nodes are a flat list.
- Prestige or any reset (#57).
- Final balance. Base values must be playable, and #48's scenario runner can tune them later.
- New art, icons or sounds.

## Anti-goals (a failure even if it works)

- Research that earns Data while the game is closed (offline), which pulls the game toward an idle game (ADR 0011).
- Data for building ships, which would just turn ore into Data.
- A panel that pauses the game or covers the field.
- Hidden diminishing returns: the player must see the real current effect.
- Effects that make the run trivial or break determinism and save/load.

## Currency: Data

Data is separate from refined ore. It's a float in the sim, shown rounded down.

| Source | Hook in the sim today | Weight (user intent) |
|---|---|---|
| Ore mined | ore cut while a drone is mining | tiny trickle per tonne, never zero |
| Ore delivered | ore reaching the carrier (`DroneDocked` amount, and hauler unloads at the carrier) | more per tonne than mining |
| Survey | `SurveyComplete` (veins discovered) | burst per vein |
| Pirate damage | damage dealt to pirates by squadrons and turrets | small per point of damage |
| Pirate kill | `UnitDestroyed` with a pirate target | per kill |
| Wave cleared | `WaveCleared` | bonus |
| Rock depleted | `RockDepleted` | small bonus |
| First arrival in a system | first completed warp into a system never visited before | one-off bonus |

- **System multiplier:** all Data earned in a system is scaled by that system's multiplier. It's higher in the second system, which has richer ore and stronger pirates. *(Builder: use or extend the per-system data the sim already has, such as `WarpBalance.oreMultiplier`.)*
- **Data Gain:** the Data Gain node multiplies every source.
- **Target mix:** in a typical stretch of active play, roughly half comes steadily from mining and delivery, and half in bursts from surveys and combat. An active player should out-earn a passive one. This is a starting target for tuning, not a hard rule.
- **Never earns Data:** time the game isn't running (closed tab, offline), and building units.
- **Automation still earns (user decision):** "idle" means only offline. A running game earns Data from whatever happens in it, including auto-launch mining, hauler deliveries and carrier turret kills, with or without player input. There is no activity tracking or input timeout. Active play out-earns passive play because survey bursts need scouts sent out, and squadrons clear waves faster.
- Offline credit (#58, ADR 0012) stays ore-only and gives no Data.

## Nodes

All nine are repeatable. Effects stack as below.

| Id | Button text | Effect per level (full strength) | Applies to |
|---|---|---|---|
| `droneSpeed` | Drone Speed +10% | +10% | drone cruise speed (`maxSpeed`) |
| `droneCargo` | Drone Cargo +10% | +10% | `cargoCapacity` |
| `miningRate` | Mining Rate +10% | +10% | `mineRate` |
| `logisticsCargo` | Logistics Cargo +10% | +10% | `bargeCapacity` and `haulerCapacity` |
| `refineThroughput` | Refine Throughput +10% | +10% | `RefineryRate` (base and modules) |
| `fighterDamage` | Fighter Damage +10% | +10% | `fighterDps` |
| `surveyRange` | Survey Range +15% | +15% | `SurveyRadius` (scout/survey reach) |
| `warpCharge` | Warp Charge −10% | ×0.9 (compounding) | warp charge time (`WarpChargeSeconds` / `WarpBalance.chargeSeconds`) |
| `dataGain` | Data Gain +10% | +10% | all Data earned |

- **Stacking:** additive nodes add up (Drone Speed level 5 = +50%). Warp Charge compounds, so it never reaches zero, and is floored at 25% of the base charge time (settled in the plan).
- **Soft cap:** up to `softCapLevel` (default 5), each level gives its full per-level effect. Past it, each further level gives a smaller share, falling off by a tunable factor, so effects keep growing more and more slowly with no hard limit. *(Settled in the plan: level n past the cap gives `perLevel / (1 + falloff × (n − softCapLevel))`, falloff 0.25. This shrinks like 1/n, so the total keeps growing with no ceiling. A geometric falloff was rejected because it converges to a hidden hard cap.)*
- **Cost:** `baseCost × costGrowth^level`, default growth about 1.6. Each node has its own base cost. Costs keep climbing past the soft cap.
- **When effects apply:** immediately on purchase, to existing and future units. *(Builder: if a capacity increase meets a full hold mid-trip, just raise the cap; don't refill.)*
- Effects are read through the sim's settings at use time, so any formula change also reaches loaded saves.

## Config

A `ResearchSettings` struct with a `Default`, held by the existing `FleetConfig` asset next to `logistics` and `combat` (settled in the plan: this is the pattern those two already use, and it needs no new asset or scene wiring). It holds:

- every Data rate and bonus from the currency table, and the per-system multipliers (unless those live in the existing per-system data);
- per node: base cost, per-level effect, and button label;
- the shared `softCapLevel`, falloff and `costGrowth`. *(Builder's call: per-node overrides, if useful.)*

The existing `FleetConfig.asset` picks up the defaults from the field initializer; re-save it through the Editor (never by hand-editing `.asset`, AGENTS.md).

## Sim and commands

- `FleetSim` gains `Data` (float) and a level per node.
- Buying goes through the command queue like Build: a new `FleetCommandKind` (for example `Research`) carrying the node id. It's processed on the sim tick, so it stays deterministic.
- A purchase with too little Data does nothing. The UI shouldn't send it, but the sim must still check.
- A sim event on purchase (for example `ResearchBought`) so the event log can show "Drone Speed → level 3".
- Data and levels carry across warps (fleet-level state, like refined ore).

## Save

- `SimSave.CurrentVersion` 5 → 6. Add `data` and the node levels (a list keyed by node id, or a fixed array in node order; builder's choice, but adding nodes later must not break saves).
- Version 2–5 saves load with 0 Data and every node at level 0.
- `web/src/protocol.ts` treats saves as opaque apart from `version` and `savedAt`, so it should need no change. Check this anyway (cross-boundary guide).

## UI

The Build panel gets two tabs at the top: **Build | Research**.

- **Build** is today's panel: build buttons and the queue.
- **Research** is a vertically scrollable list, one full-width button per node. Each button shows:
  - the effect text, for example "Drone Speed +10%";
  - the real current total effect, for example "now +62%";
  - "Lv 2 → 3";
  - the next level's cost in Data.
- **Affordable** nodes are highlighted. **Unaffordable** ones are dimmed and ignore taps.
- One tap (click) buys one level. No confirm dialog.
- The panel header shows the current Data.
- The Status panel also shows Data, so it's visible without opening the tab.
- **Touch:** buttons get a comfortable tap height (at least about 44 px at the 1920×1080 reference) and a scroll area that works by drag and by mouse wheel.
- The game keeps running. The build queue keeps progressing while Research is showing.
- Panel clicks still go through `HudController.BlocksPointer`, so they never select or order in the world.
- **The fold toggle** ("Build +/−") and the sensor-plot folding keep working, with either tab active. *(Builder's call: remember the last active tab for the session, not in the save.)*
- Hotkey: none required. *(Builder's call: add one if a free key fits the existing scheme.)*

## Verification (done when)

- **EditMode tests:**
  - each Data source credits the configured amount, with the system multiplier and Data Gain applied;
  - a purchase deducts the cost and raises the level;
  - an unaffordable purchase does nothing;
  - the cost curve is right;
  - the soft-cap curve is monotonic and gives full value up to the cap;
  - each effect reaches the stat it targets;
  - save → load round-trips Data and levels;
  - a v5 save loads with zeros;
  - determinism holds: same seed and same commands give the same state.
- **Unity:** compiles with no new console errors, and the existing EditMode tests pass.
- **Browser check** on the web build:
  - Data accrues while mining, surveying and fighting;
  - the tab switches;
  - buying works and the effect is visible (for example, faster drones);
  - save, reload and import keep research;
  - the panel is usable at the HUD's reference size.
- **Issue notes** in `documentation/issues/56-research-tree/README.md`, as `issues-and-decisions.md` describes, with the final costs and rates.

## Left to the builder

- The base costs and every Data rate, within the intent above (the plan sets starting values).
- How node levels are stored in the save.
- Command and event names.
- USS styling for the tabs and node buttons, within the existing HUD theme.
