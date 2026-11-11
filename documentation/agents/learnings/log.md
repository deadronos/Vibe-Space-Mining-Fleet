# Learnings log

Newest first. Format and rules are in [README.md](README.md). Older promoted entries are in [archive/](archive/). Entries that point to `using-unity-mcp.md` mean [driving-unity-editor.md](../driving-unity-editor.md), its name since 10 Nov 2026.

- 2026-11-11 · web-build · finding · Playwright `run-code` returned a confirm-dialog snapshot while its listener handled the prompt and the script continued. Check the final page before dismissing. → unity-web-build.md

- 2026-11-11 · web-build · finding · Headed Playwright Chrome used SwiftShader for WebGL2 on the M4. Verify the unmasked renderer and launch with ANGLE Metal for hardware benchmarks. → unity-web-build.md

- 2026-11-11 · uvcs · error · `unity cm status --project-path` fails with `Unexpected option --project-path`. Run `unity cm status` from the Unity project directory. → driving-unity-editor.md

- 2026-11-11 · sim · finding · Warp recall leaves auto-launch off at arrival. Route economy checks use `FleetCommand.WarpTo(destination)` and explicitly restart launch before measuring mining. → driving-unity-editor.md

- 2026-11-11 · sim · error · Adding radiation to every SimSetup changed logistics and repair fixture outcomes. The live runner and hazard tests now explicitly enable field hazards. → driving-unity-editor.md

- 2026-11-11 · sim · finding · In a browser survey, an explicit scout order inherited an automatic scan already in progress. Reset the scan state when a new order takes over. → documentation/issues/24-hazards/README.md

- 2026-11-11 · sim · error · Debris damage initially checked for `DroneState.Docked`, which does not exist. Parked drones use `DroneState.Hangar`. → driving-unity-editor.md

- 2026-11-10 · web-build · finding · Framing one unit for a close-up in the web build failed: the idle camera drifted it off screen, `computer` scroll zoomed the wrong way and barely moved, and a pirate wave arrived. A cloned `Camera.main` rendered into a RenderTexture from `script eval` (scene lights and URP volume included) gave the close-up in one call; use the web build to confirm the unit renders, not to frame it → unity-web-build.md

- 2026-11-10 · uvcs · finding · Editor moves into new folders appeared as deletes and adds. Add the empty folders first, then use `cm mv` on each script and its `.meta` → unity-version-control.md

- 2026-11-10 · web-build · finding · A save sampled just after a right-click showed no barge order. Polling `spaceMining.bridge.requestSave()` across sim ticks showed the queued move and changing position → unity-web-build.md

- 2026-11-10 · uvcs · error · Bare `cm status` returned `command not found` in the agent shell. Run `~/.unity/bin/unity cm status` from the Unity project folder → unity-version-control.md

- 2026-11-10 · web-build · finding · In the built-in pane, the `computer` tool's Shift (key `shift+1`, and `modifiers: "shift"` on a click) never reached Unity: no group was assigned. DOM `KeyboardEvent`s with `code: "ShiftLeft"` then `code: "Digit1"` dispatched on the canvas worked. Screenshots also trailed clicks by a second or two; wait 2 s before judging a click → unity-web-build.md

- 2026-11-10 · web-build · finding · Testing touch with synthetic `TouchEvent`s: the `spacemining:state` event fires before the loading screen fades, and touches sent then still reach the game (they toggled sensors and launched nothing useful). Wait for `#loading.done`. The idle camera drift moves targets between a screenshot and the next tap; aim in the sensors view, where rocks are the brown dots → unity-web-build.md

- 2026-11-10 · uvcs · finding · `cm shelveset create` refused a file `cm status` listed as plain "Changed" (not checked out): "is not changed in current workspace". After `echo b | cm switch`, files whose content matches the branch show as "Checked-out (unchanged)"; `cm undo --unchanged <paths>` releases them losslessly so `cm merge` runs → unity-version-control.md

- 2026-11-10 · github · finding · PR #68 got no `ci.yml` run at all (only GitGuardian), though the workflow has `pull_request`. The push to main after merging ran CI and passed. Check `gh pr checks` lists `check` before treating a PR as green → web-and-github.md

- 2026-11-10 · unity-cli · finding · `scripts/unity-check.sh` stopped with "the Editor is not running" (`unity status` listed nothing). `"$U" projects open "$P"` started it; it was ready about 20 s later. Poll `unity status` for `ready` before the check → driving-unity-editor.md

- 2026-11-09 · unity-editor · finding · URP (6000.6) sets `_EMISSION` from `globalIlluminationFlags & AnyEmissive` whenever it validates a material, so `EnableKeyword("_EMISSION")` with flags `None` is undone and the web build has no glow, while the `.mat` on disk can still list the keyword. Set `RealtimeEmissive`; check `Material.IsKeywordEnabled` in the Editor, not the file → using-unity-mcp.md

- 2026-11-09 · uvcs · finding · `cm status` on `/main` showed a pending merge from a stray cs:42 on an already merged feature branch (six "Replaced" files). Run `cm status` before branching; if a merge is pending, ask the user, then check it in on its own with explicit paths before branching (`cm ci <merge paths>` left the other pending files alone) → documentation/issues/58-offline-credit

- 2026-11-09 · web-build · finding · A page that loaded while the browser pane was hidden stayed at "Starting…" after the pane was shown; reload it once the pane is visible → unity-web-build.md

- 2026-11-09 · web-build · finding · The built-in browser pane was hidden: real clicks didn't reach Unity, and DOM-dispatched mouse events only worked after one real click focused the canvas. Scale screenshot coordinates to CSS pixels (`innerWidth` / frame width) → unity-web-build.md

- 2026-11-09 · web-build · error · Editing `spacemining.save.v1` in localStorage and reloading lost the edit: the page autosaves on unload. Write the save, stub `Storage.prototype.setItem` for that page, then reload → unity-web-build.md

- 2026-11-09 · unity-editor · finding · Roboto in the web player has no "→" (U+2192); the Editor drew it from a system fallback font, so it only showed as a box in the browser. Keep HUD text to glyphs already used ("−", "·") or ASCII → documentation/issues/56-research-tree

- 2026-11-09 · unity-editor · finding · With the minimal `HudTheme.tss`, a ScrollView's viewport didn't clip, so content past `max-height` spilled out of the panel. Fixed with `.unity-scroll-view__content-viewport { overflow: hidden; }` in the theme → documentation/issues/56-research-tree

- 2026-11-09 · uvcs · error · `L="a b"; cm shelveset create $L` shelved nothing: zsh doesn't word-split `$L`, so `cm switch` then stopped at its s/b/c prompt → name the paths explicitly (or use an array). → unity-version-control.md

- 2026-11-09 · unity-cli · finding · `Screen.width/height` in `script eval` report the Editor window (792×563), not the Game view, so screen-to-panel checks such as `BlocksPointer` look wrong from the CLI; test pointer blocking in the web build. → using-unity-mcp.md

- 2026-11-09 · unity-editor · finding · `PanelRenderer.RegisterUIReloadCallback(UIReloadCallback)` is already obsolete in 6000.6.8 (CS0618); use the versioned `(PanelRenderer, VisualElement, int)` callback. Its root keeps the `unity-ui-document__root` class. → documentation/issues/51-panel-renderer

- 2026-11-09 · web-build · error · Playwright rejected `e7` for a snapshot's `f1e7`; use the complete current element reference, including its frame prefix. → unity-web-build.md

- 2026-11-09 · sim · finding · `JsonUtility.FromJson` turns null class-list elements into default objects; validate required fields and test raw JSON imports. → cross-boundary-changes.md

- 2026-11-09 · web-build · error · `pnpm run check` found unformatted Playwright CLI snapshots in `.playwright-cli/`; remove the generated snapshots after testing. → unity-web-build.md

- 2026-11-09 · web-build · finding · The warp button moved while the ships-out list wrapped, causing missed clicks; place controls above changing lists and refresh the capture. → unity-web-build.md

- 2026-11-09 · web-build · approach · Overlapping Sensors markers made the scout click select another ship. Isolate the drone in a disposable save and confirm its class before ordering. → unity-web-build.md

- 2026-11-09 · web-build · approach · Safari WebDriver needs Allow Remote Automation. Use the installed Safari UI and serve a disposable page without `navigator.gpu` to test WebGL2. → unity-web-build.md

- 2026-11-08 · unity-cli · error · `capture game_view --output …` wrote nothing (no error) → the flag is `--output-path`, as the guide's table already said; read the table first. → not promoted

- 2026-11-08 · process · error · `grep -rn … --include=*.cs` in zsh → `no matches found` (the glob is expanded); quote it: `--include='*.cs'`. → not promoted
- 2026-11-08 · uvcs · finding · test-framework 1.8.0 comes in as a builtin dependency (depth 1), so the EditMode tests run without a `manifest.json` entry. → not promoted
- 2026-11-08 · ci · error · deploy on a tag was refused → the `github-pages` environment allowed only branches; added a `v*` tag policy. → not promoted
