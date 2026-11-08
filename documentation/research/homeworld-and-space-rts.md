# Research: Homeworld and other space RTS games

Notes collected on 8 Nov 2026 for turning Vibe Space Mining Fleet into a Homeworld-style RTS. The sources are mostly fan wikis, player guides and press articles, not official design docs. Points that came from a single community source are marked *(community)*.

## 1. Homeworld's core pillars

| Pillar | What it means | Source |
| --- | --- | --- |
| A true 3D battlespace | The first fully 3D RTS. Its orbit/zoom camera, centred on ships, is what made space feel big. | Rob Cunningham, GOG interview |
| The mothership as a mobile base | Production, the refinery and docking all happen on one huge ship that travels with the fleet. *Deserts of Kharak* kept this idea with its land Carrier: if you lose it, you lose the game. | Strategy Front, Game Informer |
| A persistent fleet | Surviving ships and resources carry over to the next mission, so every loss counts and preserving ships becomes the strategy. *Homeworld 3*'s War Games mode applies the same idea across a run of encounters, with "artifact" modifiers. | Fan guides, HW3 guides |
| Salvage and capture | Captured ships join the fleet for good, and in HW3 salvage is a major income source. HW1 salvage was considered overpowered, and HW2 made salvage craft fragile. | Commentary piece *(community)* |
| Vulnerable collectors | Resource collectors are slow and are meant to be vulnerable, so the economy is something you have to defend. | HW3 guides |
| Discrete resource pockets | HW2 moved resources into fixed pockets "to prevent roving Resource Collectors issues" from HW1. | Developer quote via fan wiki |

## 2. Command and control in Homeworld

**Selection and orders**
- Selecting a ship and moving it takes two or three actions. Right-click is context-sensitive: move, attack or harvest depending on the target.
- **Move widget:** the move disc (M) sets a destination on the horizontal plane. Holding a mouse button or Shift while moving the mouse sets the altitude. HW3 adds a key that toggles the movement plane.
- **Camera:** HW1 locked the camera to ships. HW2 added free panning and a key for panning vertically. Players found vertical camera movement awkward in every version, so it needs care.
- **Queued orders:** every ship can take a queue of orders.

**Squadrons, formations and strike groups**
- Fighters come in squadrons of 5 and corvettes in squadrons of 3. A damaged squadron keeps fighting at reduced strength, and docking it at the mothership rebuilds it for a resource cost.
- HW3 has eight formations: Delta, Claw, X, Broad, Wall, Sphere, Trail and Mixed. A formation also changes how the AI aims.
- A strike group is a mixed group of squadrons and capital ships that behaves by role: fighters protect capital ships, and corvettes protect fighters. Formations nest, for example a Wall of Deltas. Designers called them "control groups on steroids".
- Ordinary control groups still work: Ctrl+1–0 assigns a group, and pressing the number or clicking the hotbar recalls it.

**Tactics (stances)**

| Game | Settings | Behaviour |
| --- | --- | --- |
| HW2 | Aggressive / Defensive / Passive | Aggressive chases enemies in range. Defensive helps nearby friendlies but stops chasing beyond a set radius. Passive never fires back. |
| HW3 | Aggressive / Neutral / Evasive | Aggressive tightens the formation and focuses on firing, with no evasion. Evasive spreads the formation out and dodges. Neutral balances the two. |

- In HW2, a tactic **changes the formation as well as the behaviour**: Aggressive spreads it out, and Evasive pulls it together.
- Players' rule of thumb: go Aggressive when ships are cheap and Evasive when they are expensive. *(community)*

**Sensors Manager**
- A zoomed-out tactical map, kept and expanded in HW2. The UI can scale from fully hidden up to a full tactical overlay.
- HW2 moved building from a separate screen onto the main game screen.

## 3. Other games worth borrowing from

| Game | Idea to borrow | Why it fits a mining fleet |
| --- | --- | --- |
| **Falling Frontier** | Resources physically exist in the world. Ore and fuel can only be used where they are, cargo ships carry them, and destroying a cargo ship destroys its cargo. Supply lines run on automatic trade routes, so raiding them is the main tactic. | Our drones already carry real cargo, and the barge and hauler chain makes the economy something you can see and attack. |
| **Nebulous: Fleet Command** | Sensors and signatures. Asteroids and gas clouds hide ships in their radar shadow. Ships packed closely give off a bigger signal. Ships can go "cold" by switching off radar and relying on fleetmates' tracks. | An asteroid belt gives natural cover, and you could hide a mining op behind rocks. Mining lasers could also raise your signature, an idea close to asteroid-fleet's cargo heat. |
| **Homeworld: Deserts of Kharak** | The Carrier is your base and also a combat platform with abilities. Losing it loses the game. Salvagers bring resources to the Carrier or to a support cruiser. | It maps directly onto our carrier. A support cruiser is our barge. |
| **EVE Online (Orca / Rorqual)** and **HW2 Mobile Refinery** | A mobile depot that sits by the rocks so collectors only make short trips. | asteroid-fleet already uses this as its barge. |
| **Dust Fleet** (Orbiting Disco, Early Access Aug 2023) | Two layers. A turn-based strategy map: explore, take strategic nodes, gather resources, manage the fleet and stations. Real-time 3D battles inside it, where you can call reinforcements and support powers from neighbouring sectors. A ship designer with researched hulls, modules and weapons. Side missions unlock fleet stations that give bonuses (extra build queues, battle support powers). Sector Assault mode generates random starmaps, and there's a campaign editor with mod.io support. Reviewers call it "not Homeworld, but a neat space RTS with 4X elements" and mention a weak engine and some bugs. | It's a model for the run structure: a node map between systems (like asteroid-fleet's 10 systems and warp) with real-time play inside each one. Module loadouts match asteroid-fleet's module slots. Neighbouring-sector reinforcements suggest how multiple carriers could help each other. |
| **Beyond All Reason / Spring** | Line-drag move: dragging a line with the move command spreads the selected units evenly along it. Holding while dragging sets the formation's final facing. Ctrl-click toggles units in or out of the selection, Shift adds, and double-click selects every visible unit of that type. | It's cheap to build and gives you a formation tool without a full formation system. |

## 4. RTS control conventions (general)

From RTS forums and wikis. These are conventions, not standards:

- Keep select and order on **different mouse buttons**. Left-click selects, right-click orders, so issuing an order never clears the selection.
- **Modifiers:** Shift adds or queues, Ctrl toggles, double-click selects all visible units of the same type, and Ctrl+number assigns a control group.
- **Box select:** highlight units while dragging and confirm the selection on release. **Leave out the obvious exceptions**: a box drawn over the carrier and some drones should select only the drones.
- Let players **pick one unit out of a mixed selection** in the selection panel. Age of Empires IV players asked for this specifically.
- 3D placement: cast the cursor against a horizontal plane at the selection's height, then adjust altitude with a modifier. This is the Unreal forum pattern and matches Homeworld's move disc.

## 5. Tech notes for Unity at RTS unit counts

- A dated benchmark (Unity 2020.1) of boids: about 350 as GameObjects, about 7,000 with ECS and Jobs, and about 250k with an optimised ECS and Jobs version. Compute-shader flocking passes 500k. The lesson: **thousands of separate GameObjects will not scale**.
- Neighbour queries need **spatial partitioning** (a grid or hash). Looping over every other agent is what kills performance. asteroid-fleet uses a `PointGrid` for this.
- `Graphics.RenderMeshInstanced` draws up to 1,023 instances per call in 6.3 (511 with the default matrices in 6.0 unless `assumeuniformscaling` is set). The material needs `enableInstancing`, and the call throws if the platform doesn't support it. Nothing turned up about WebGPU specifically, so **profile it in the web build**.

## Sources

- [Tech Briefing: Command & Control (HW2), Well of Souls](https://well-of-souls.com/homeworld/hw2/tech_control.htm)
- [Homeworld 3 fleet command explained: control groups, formations, stances, Charlie Intel](https://charlieintel.com/games/homeworld-3-fleet-command-explained-control-groups-formations-stances-323786)
- [Best formations and stances in Homeworld 3, GameSkinny](https://www.gameskinny.com/tips/best-formations-and-stances-in-homeworld-3/)
- [Homeworld 3 controls and keybinds, GamePressure](https://gamepressure.com/newsroom/homeworld-3-all-controls-and-keybinds/z66d6f)
- [Homeworld Remastered beginner's guide, Gameranx](https://gameranx.com/updates/id/26824/article/homeworld-remastered-collection-beginners-guide/)
- [Homeworld-style RTS control, Unreal Engine forums](https://forums.unrealengine.com/t/homeworld-style-rts-control/1353390)
- [Hiigaran Resource Collector, Well of Souls](https://well-of-souls.com/homeworld/hw2/resourcer.htm)
- [Homeworld commentary, Force for Good](https://forceforgood.co.uk/?p=11257)
- [War Stories: How Homeworld brought the third dimension to RTS](https://pipedot.org/51V1N)
- [Homeworld interview with Rob Cunningham, 80.lv](https://80.lv/articles/homeworld-interview-with-rob-cunningham)
- [Homeworld 3 complete fleet guide, After Strategy](https://after-strategy.com/en/homeworld-3-complete-guide-space-rts-fleet-2026/)
- [Deserts of Kharak preview, Game Informer](https://gameinformer.com/games/homeworld_deserts_of_kharak/b/pc/archive/2016/01/28/a-fleeting-glimpse-of-the-glorious-past)
- [Deserts of Kharak review, Strategy Front](https://strategyfrontgaming.com/?p=161)
- [Deserts of Kharak unit list, GamePressure](https://www.gamepressure.com/homeworlddesertsofkharak/list-of-units/z48f42)
- [Falling Frontier Q&A: Logistical RTS goodness, Space Game Junkie](https://www.spacegamejunkie.com/?p=241920)
- [Falling Frontier brings hardcore logistics, PC Gamer](https://www.pcgamer.com/uk/falling-frontier-brings-hardcore-logistics-and-granular-space-combat-to-the-dark-future/)
- [NEBULOUS: Fleet Command community guide (Google Doc)](https://docs.google.com/document/d/1pQ7bwAzAj3WlfnNv1drFt7eRpbo1EXX9exLFap_zuJI/export?format=pdf)
- [NEBULOUS wiki: Ships, Hooded Horse](https://wiki.hoodedhorse.com/NEBULOUS_Fleet_Command/index.php?oldid=25&title=Ships)
- [Dust Fleet wiki](https://dustfleet.wiki.gg/wiki/Dust_Fleet)
- [Dust Fleet on GOG](https://www.gog.com/en/game/dust_fleet)
- [Dust Fleet review, Force for Good](https://forceforgood.co.uk/?p=2639)
- [Dust Fleet at Gamescom 2023, GamesRadar](https://www.gamesradar.com/dust-fleet-fgs-gamescom-2023)
- [Move Line Drag, Beyond All Reason](https://beyondallreason.info/commands/move-line-drag)
- [Using Selections, Spring RTS wiki](https://springrts.com/wiki/Using_Selections)
- [Methods of selection, GameDev.net](https://www.gamedev.net/forums/topic/64319-methods-of-selection/)
- [Selection in strategy games (Faction Command), ModDB](https://www.moddb.com/news/selection-in-strategy-games)
- [RTS unit selection extension, GDevelop](https://wiki.gdevelop.io/gdevelop5/extensions/rtsunit-selection/)
- [Multiple unit selection suggestion, Age of Empires forums](https://forums.ageofempires.com/t/multiple-unit-selection-suggestion/223382)
- [How many Boids can Unity handle, GitHub](https://github.com/BadGraphixD/How-many-Boids-can-Unity-handle)
- [Unity Flocking CPU/GPU, GitHub](https://www.github.com/CristianQiu/Unity-Flocking-CPU-GPU)
- [Graphics.RenderMeshInstanced (6.3), Unity docs](https://docs.unity3d.com/ScriptReference/Graphics.RenderMeshInstanced.html)
- [Graphics.RenderMeshInstanced (6.0), Unity docs](https://docs.unity3d.com/kr/6000.0/ScriptReference/Graphics.RenderMeshInstanced.html)
