# 0005: In-game HUD in UI Toolkit; the page keeps only a game menu

- **Status:** Accepted
- **Date:** 2026-11-08
- **Issue:** #13
- **Decided by:** the user (chose UI Toolkit; then asked to trim the HTML toolbar to a gear menu)

## Context

The HUD was uGUI with the legacy `Text` component and the built-in font, which has no en dashes or icons. The page had its own HTML toolbar with game buttons and stats. Phase 3 (#15) adds a throughput panel, a build queue and a control-group bar, which is the first UI with real lists and buttons.

## Options

1. **uGUI + TextMeshPro.** Familiar, but list-heavy panels are tedious to build, and the font assets add to the build size.
2. **UI Toolkit.** Works in the Editor and in the build. Layout and style live in UXML/USS. No bridge traffic is needed for game UI.
3. **HTML overlay through the bridge.** Fast to style, but it doesn't exist in the Editor, and every panel needs bridge data.
4. **Split.** Panels in HTML, world-space markers in Unity.

## Decision

- All game UI is UI Toolkit:
  - `Assets/_Game/UI/Hud.uxml` and `Hud.uss`, driven by `HudController.cs`;
  - status, the ore-chain panel, fleet buttons, the build queue, the selection list, the group bar, and selection rings and the drag box.
- It uses its own `HudPanelSettings`, scaled to 1920×1080 (match 0.5), with a minimal `HudTheme.tss`: Unity's default runtime theme is not used.
- The font is Roboto Regular (Apache 2.0), in `UI/Fonts`.
- World input asks `HudController.BlocksPointer(screenPos)` first, so clicks on panels never select, order or orbit.
- The HTML page keeps only what needs the browser: a gear button that opens a dialog for save, export, import and new game. The toolbar's game buttons and stats moved into the HUD.

## Consequences

- The uGUI `FleetHUD` and `SelectionOverlay` are gone. Nothing uses uGUI any more, so `com.unity.ugui` could be removed (check the build size first).
- Positions that change every frame (rings, the drag box, queue progress) are set from C# styles. Everything else is styled through USS classes.
- The theme must stretch `.unity-ui-document__root` itself. Without that the root has no height, and bottom-anchored panels end up off screen.
- The page can still read game state from `spacemining:state` (now with refined ore, income, the bottleneck, and barge and hauler counts), but it doesn't draw it.
