# #51 Migrate the HUD from UIDocument to PanelRenderer

GitHub issue: [#51](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/51)

Unity 6000.6 replaces the **UI Document** component with **Panel Renderer** ([Unity's migration guide](https://docs.unity.com/en-us/engine/6000.6/manual/uitoolkits/uielements/uie-support-for-runtime-ui/uie-render-runtime-ui/uie-create-ui-document-component#migration-to-panel-renderer)). The HUD from ADR 0005 was the only user of `UIDocument`.

## Where the code lives

| | |
| --- | --- |
| UVCS branch | `/main/feature-51-panel-renderer` |
| Changeset | `cs:30` |
| Merged to `/main` | `cs:31` (same 13 entries as cs:30) |
| Repository | `Vibe-Space-Mining-Fleet/Vibe-Space-Mining-Fleet@iridanblub@unity` |

## What changed in the Unity project

- `Assets/_Game/UI/HudController.cs`
  - `[RequireComponent(typeof(PanelRenderer))]`.
  - `OnEnable` registers `OnUIReload(PanelRenderer, VisualElement, int version)` with `RegisterUIReloadCallback`; `OnDisable` unregisters it.
  - All element lookups and button wiring moved from `OnEnable` into `OnUIReload`. It also clears the pooled elements (rings, hull bars, selection rows, queue rows) and resets the group-bar cache, because after a reload they belong to the old tree.
  - The ring texture is made once, not on every enable.
- `Assets/_Game/Scripts/Editor/MiningFleetSceneBuilder.cs` (`CreateHud`): adds a `PanelRenderer` with `HudPanelSettings` and `Hud.uxml` instead of a `UIDocument`.
- `Assets/_Game/Scenes/MiningFleet.unity`: rebuilt with **Build Demo Scene**. The rebuild also regenerates the prefabs (`Barge`, `Hauler`, `MiningDrone`, `Raider`, `Squadron`), `PirateGlow.mat` and `Settings/MiningFleetVolume.asset`. Their diffs are new fileIDs and reordered objects, not content changes; they're in the changeset because the scene references them.

`HudTheme.tss` needed no change: the Panel Renderer's root still carries the `unity-ui-document__root` class, so the stretch rule from ADR 0005 still applies.

## Verified

- Recompile: 0 errors, 0 warnings. (The two-argument `UIReloadCallback` overload is already obsolete in 6000.6.8, CS0618; the HUD uses the versioned one.)
- No `UIDocument` left in the scene after the rebuild; the HUD object has a `PanelRenderer`.
- EditMode tests: 62/62 pass.
- Editor play mode: the HUD root is 1920×1080 (reference resolution), all panels show, the group bar has 10 slots, no console errors or warnings. Deactivating and reactivating the HUD object keeps the tree attached and wired.
- Web build (`Build Web`): succeeded, 10.2 MB, same file sizes as before (data 3060 KB, wasm 7276 KB). In the browser (WebGPU, `pnpm dev`): no console errors; HUD renders as before; Events, Sensors and the group buttons respond; with the carrier selected, a click inside the Defence panel and in the Sensors panel doesn't deselect it, so `BlocksPointer` still stops clicks on panels.

## Notes

- ADR 0005 still says "UIDocument" in its Decision section; the decision itself (UI Toolkit HUD, own Panel Settings and theme) is unchanged, only the component that hosts it.
- `Screen.width`/`Screen.height` inside `script eval` report the Editor window, not the Game view, so `BlocksPointer` can't be tested from the CLI. Test it in the web build.
