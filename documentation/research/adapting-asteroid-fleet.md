# Adapting asteroid-fleet into a Homeworld-style RTS

Advice, written 8 Nov 2026. Sources: `~/Github/asteroid-fleet` (its README, `docs/agents/`, the concept docs and `src/sim/`) and [homeworld-and-space-rts.md](homeworld-and-space-rts.md).

## The one decision to make first

asteroid-fleet has a firm design rule: **"No direct orders during play; the player sets doctrine like an admiral."** Homeworld is the opposite: you select ships and give orders all the time. Both can't be the core.

**Recommendation: a hybrid. Steer the military by hand and automate the economy.**

| Layer | Control | Inspiration |
| --- | --- | --- |
| Carrier, fighters, escorts, scouts | Direct RTS orders: select, move in 3D, attack, dock, queue | Homeworld |
| Drones, barges, haulers | Automatic by default, driven by stances and rule cards. You can still grab one and override it, and it goes back to automation when its order is done or when you press "resume auto". | asteroid-fleet, and HW collectors that harvest on their own |
| Fleet-wide behaviour | Stances on every ship: Aggressive / Neutral / Evasive (+ Passive) | HW2/HW3 tactics, asteroid-fleet engagement axis |

Homeworld itself works this way. Collectors harvest without being told, and the player's attention goes to combat. The current Unity demo already has the automated half.

## What the two projects have today

| Topic | Vibe-Space-Mining-Fleet (Unity) | asteroid-fleet (TS / React Three Fiber) |
| --- | --- | --- |
| Drone loop | `MiningDrone` state machine: Hangar → Launch → Transit → Mine → Return → Dock | `drone()` in `mining.ts`, plus unloading at barges and salvage jobs |
| Target choice | `AsteroidField.FindTarget`: distance × claims, up to 2 claims per rock | `pickAsteroid` with greedy/safe modes, vein bonus, charted hazards avoided |
| Logistics | Drone → carrier only | Drone → barge (mobile depot) → hauler → refinery, with the throughput bottleneck shown in the UI |
| Combat | None | Fighters (escort, intercept), carrier turrets, pirate waves scaled by distance and **cargo heat** |
| Player control | Launch / recall / auto-launch keys, orbit camera | Hangar board, stances (fleet → class → hangar), up to 12 condition/action rule cards |
| Sim architecture | MonoBehaviour `Update`s, SphereCast avoidance | Deterministic 10 Hz tick in a worker, seeded RNG, render interpolation, spatial `PointGrid`, 8 ms per tick at 1,000 ships |
| Art | Primitives plus procedural rocks | Procedural Blender "Foundry" glTF ships, Kenney meteor (CC0), tactical icon view |

## Port these (design and patterns, not code)

The code is TypeScript, so nothing ports directly. What carries over is the design and the architecture, roughly in order of value:

1. **The logistics chain and its bottleneck.** Throughput = min(mining, drone transport, barge capacity, hauler transport, refinery). This is the strongest idea in asteroid-fleet, and it doubles as an RTS economy you have to defend. Barges are the HW2 Mobile Refinery and Deserts of Kharak support cruiser. Starting stats in `config.ts` `SHIP_STATS`:
   - Drone: cost 40, hull 20, speed 11, cargo 10.
   - Barge: cost 600, hull 220, speed 3.2, cargo 400.
   - Hauler: cost 280, hull 90, speed 6.5, cargo 180.
2. **Stance resolution from most specific to least.** Order: active rule card → hangar or group → ship class → fleet default. In an RTS, **a direct order sits on top of all of these**. Map asteroid-fleet's engagement axis onto Homeworld's names: Aggressive = Aggressive, Defensive ≈ Neutral, Passive/Evasive = Evasive.
3. **Rule cards as automation.** A card has a scope, 1–3 AND-ed conditions and one action. It's the right tool for the economy layer: "barge >80 % full → call hauler" and "pirate wave announced → fighters escort barges". Start with the preset cards only. A card editor can come later.
4. **Cargo heat.** Pirate pressure rises with distance and with the ore held out in the field. It creates the risk-and-reward you want from a vulnerable economy (see the research doc: collectors are meant to be vulnerable). Pirates go for full barges first.
5. **Scouts and veins.** A scout surveys a cluster, marks rocks worth at least 50 % of the system's best as veins (drones score these ×1.5) and charts hazards. This fits a sensors and fog-of-war layer well.
6. **The carrier energy pool.** One pool feeds the refinery, shields and warp. Solar trickles in, so the carrier is never stranded. Power modes give the carrier Kharak-style "abilities".
7. **Warp with recall.** Ships still outside the carrier when it jumps are lost, which matches Homeworld's persistent fleet: whatever is docked at the jump carries over. That gives a run structure: a chain of systems with one persistent fleet.
8. **Architecture patterns:**
   - Keep a **plain C# simulation** separate from the views. Step it on a fixed tick, either `FixedUpdate` or your own accumulator (10–20 Hz is plenty), and have MonoBehaviours interpolate between ticks.
   - Route **all player input as commands**. That gives you order queues, replays and (later) determinism almost for free.
   - Move the data tables into **ScriptableObjects**: ship stats, modules and presets. This is the equivalent of asteroid-fleet's `config.ts`.
   - Use a **uniform spatial grid** for neighbour, target and avoidance queries. It replaces the per-drone `SphereCast`, which won't scale.
   - Make **no allocations on the hot path**. asteroid-fleet's `ctx.ts` reuses containers between ticks.
   - Use an **event bus** for player-facing messages. The sim writes events and never reads them back.
9. **The tactical view.** Shape-coded icons when zoomed far out (`ICON_SHAPE` / `SHAPES`) and a colour-blind-safe palette. This becomes the Sensors Manager.
10. **Models.** The Foundry ships (`public/models/foundry_*.glb`) are MIT-licensed in your own repo, and they're generated from a Blender script, so the whole set can be regenerated. Import them with the `com.unity.cloud.gltfast` package or re-export them as FBX. The material slots (`hull`, `hull2`, `dark`, `glow`, `metalRed`) map cleanly onto URP Lit with emission on `glow`.

## Leave these behind (for now)

- Idle and offline settlement, prestige/RP, Admiralty, and challenges. They're incremental-game layers that pull against the RTS. The persistent fleet already gives you long-term stakes.
- The hangar slot board with adjacency synergies. It's lovely autobattler depth, but an RTS needs a simple build queue first. You could bring it back later as "carrier modules".
- Multiple carriers with Tier A/B background simulation, and save migrations. Come back to these once there is something to save.
- The Web Worker host. Unity web builds are single-threaded for C#. If you need more CPU, go to Burst and Jobs where the web target supports them, but profile before reaching for them.

## New work that neither project has (from the Homeworld research)

| Feature | Notes |
| --- | --- |
| Selection | Left-click selects and right-click orders. Shift adds, Ctrl toggles, double-click selects all visible units of that type. For box select, project ship positions to screen space and test them against the rectangle. Leave out the carrier and drones when combat ships are in the box. |
| Control groups | Ctrl+1–0 to assign, the number to recall, double-tap to centre the camera on the group. Show them on a hotbar. |
| 3D move widget | Raycast the cursor onto a horizontal plane at the selection's mean height. Hold Shift (or the right button) and move the mouse vertically to set altitude. Draw a vertical line from the plane to the target with a disc. This is the part of an RTS players notice most, so polish it. |
| Context orders | Right-click a rock to mine (miners), an enemy to attack, the carrier or a barge to dock or unload, empty space to move. Shift queues orders and shows the queue as waypoint lines. |
| Formations | Start with slot offsets relative to the leader: Delta, Wall, Sphere. Tie the spread to the stance, as HW2 did: Aggressive spreads out, Evasive pulls in. BAR-style line-drag moves are a cheap bonus. |
| Squadrons | Fighters in squadrons of 3–5 that act as one selectable unit. Docking replaces losses for a cost (HW2). |
| Build queue on the carrier | Spend refined ore (your RU) on drones, barges, haulers, fighters and scouts. HW2 put this on the main screen, not a separate one. |
| Sensors Manager | Toggle a zoomed-out icon map, using the same camera with an overlay. Optional extras: fog of war per sensor radius, and Nebulous-style asteroid radar shadows to hide a mining op. |
| Enemy | Pirate waves first, using asteroid-fleet's distance and cargo-heat formula. A rival mining faction is the stretch goal. |

## Suggested phases

1. **Sim refactor.** Move the drone, carrier and asteroid logic into plain C# with a fixed tick, a spatial grid and interpolated views. Keep the existing behaviour and check it delivers ore at the same rate as now (about 1,200 t per minute with 10 drones).
2. **RTS control.** Selection, control groups, the move widget, context orders and the order queue. Drones accept a direct order and then go back to automation.
3. **Logistics.** Add barges and haulers, the throughput readout and a carrier build queue.
4. **Combat.** Fighters in squadrons, stances, formations, carrier turrets, and pirate waves with cargo heat.
5. **Sensors and tactical view.** The icon overlay, scouts and veins, and possibly fog of war.
6. **Run structure.** Warp between systems, persistent fleet, loss of ships left outside.

Phases 1 and 2 are the minimum for it to feel like Homeworld. Phase 3 is where the asteroid-fleet design pays off.

## Web build notes

- At about 300 or more ships, draw them with `Graphics.RenderMeshInstanced` (up to 1,023 per call) instead of one GameObject each. Keep GameObjects for the carrier and the selected or near units. Profile on both WebGPU and WebGL2.
- Trails and LineRenderers are relatively expensive per unit. Drop them at distance (asteroid-fleet uses LOD distances and a low-quality mode).
- Keep the `Mobile` quality tier as the web default and give players a low-quality toggle.
