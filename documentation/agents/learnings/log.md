# Learnings log

Newest first. Format and rules are in [README.md](README.md).

- 2026-11-09 · web-build · approach · Overlapping Sensors markers made the scout click select another ship. Isolate the drone in a disposable save and confirm its class before ordering. → unity-web-build.md

- 2026-11-09 · web-build · approach · Safari WebDriver needs Allow Remote Automation. Use the installed Safari UI and serve a disposable page without `navigator.gpu` to test WebGL2. → unity-web-build.md

- 2026-11-08 · unity-cli · finding · the Hub's bundled CLI was beta.13 while beta.17 was out; the standalone `~/.unity/bin/unity` self-updates (`self-update`) and agent shells don't have it on PATH → call it by path. → using-unity-mcp.md
- 2026-11-08 · unity-cli · error · `recompile` right after `script eval … AssetDatabase.Refresh()` → `No Pipeline instance` (the Refresh had started the reload) → `status --until-ready` between steps; then `recompile` says `up_to_date`, so confirm the compile from `console get` before trusting tests. → using-unity-mcp.md
- 2026-11-08 · unity-cli · error · `capture game_view --output …` wrote nothing (no error) → the flag is `--output-path`, as the guide's table already said; read the table first. → not promoted
- 2026-11-08 · web-build · finding · DOM `PointerEvent`s alone don't reach the Unity web player's Input System; dispatching `MouseEvent`s (`mousemove/down/up`) on the canvas does, including HUD buttons and selection-list rows. Synthetic key presses from DevTools didn't reach it (canvas not focused). → unity-web-build.md
- 2026-11-08 · sim · approach · balance by headless bots in `script eval`: build a `FleetSim` from the open scene's `Carrier.DescribeLayout()`, run 40 sim-minutes in a few seconds and log events; it found that squadrons never repaired and drones didn't flee. → documentation/issues/16-combat

- 2026-11-08 · unity-cli · error · `unity command … test run` right after `unity recompile` → `No Pipeline instance found for project` (domain reload still running); wait ~20 s (`unity status` says `ready`), then retry. → using-unity-mcp.md
- 2026-11-08 · web-build · finding · the built-in browser's `left_click_drag` presses and releases in one frame, so a box-select never starts (a plain click works); also keep the pane shown (`show_pane preview`) or the game stalls at "Starting…". → unity-web-build.md
- 2026-11-08 · web-build · error · Chrome DevTools MCP `new_page` → `The browser is already running for …chrome-profile`; use the built-in browser pane (`mcp__Claude_Browser__*`) after showing it. → unity-web-build.md
- 2026-11-08 · process · error · `grep -rn … --include=*.cs` in zsh → `no matches found` (the glob is expanded); quote it: `--include='*.cs'`. → not promoted
- 2026-11-08 · uvcs · error · `cm merge` refused while files were pending, and `cm switch` stopped at a prompt (s/b/c) → `echo b | cm switch` brings pending files along; for a merge, `cm shelveset create <paths>`, `cm undo <paths>`, merge and check in, then `cm shelveset apply sh:<n>`. → unity-version-control.md
- 2026-11-08 · web-build · finding · the built-in browser pane was hidden, so the Unity page stalled at "Starting…" (no frames) → test the web build in the Chrome DevTools browser, or ask the user to show the pane. → unity-web-build.md
- 2026-11-08 · unity-editor · error · UI Toolkit with a custom empty theme: the UIDocument root had height 0, so bottom-anchored panels were off screen → the theme must stretch `.unity-ui-document__root`. → decisions/0005
- 2026-11-08 · unity-editor · error · `HaulerView` and `BargeView` were in one .cs file → the prefab silently lost `HaulerView` (no error); one MonoBehaviour per file, named after the class. → using-unity-mcp.md
- 2026-11-08 · unity-cli · error · `unity recompile` said `up_to_date` after editing .cs files from the shell → the unfocused Editor hadn't noticed; run `script eval` with `AssetDatabase.Refresh()` first. → using-unity-mcp.md
- 2026-11-08 · unity-cli · error · `script eval` warned CS0618 for `FindFirstObjectByType` → obsolete in 6000.6, use `FindAnyObjectByType`. → using-unity-mcp.md
- 2026-11-08 · unity-cli · error · `unity command tests list` → `Command Not Found`; the listing shows tags, and the command is `test list` / `test run`. → using-unity-mcp.md
- 2026-11-08 · uvcs · error · the #31 notes claimed a `Packages/manifest.json` change that cs:13 doesn't contain, while cs:13 does contain a stray `Screenshots/phase1.png` → write notes from `cm diff cs:<n>`, not from memory. → unity-version-control.md
- 2026-11-08 · uvcs · finding · test-framework 1.8.0 comes in as a builtin dependency (depth 1), so the EditMode tests run without a `manifest.json` entry. → not promoted
- 2026-11-08 · pages · finding · Pages gzips html/js itself but serves `.unityweb` as `application/vnd.unity` with no `Content-Encoding`; coi-serviceworker only adds COOP/COEP (threads), not compression. → decisions/0004
- 2026-11-08 · pages · error · the v0.3.0 tag deploy succeeded but Pages kept serving the old build → rerunning deploy from `main` (workflow_dispatch) fixed it; check the served files after a release. → web-and-github.md
- 2026-11-08 · ci · error · deploy on a tag was refused → the `github-pages` environment allowed only branches; added a `v*` tag policy. → not promoted
- 2026-11-08 · unity-editor · finding · synthetic input doesn't reach the Input System in Editor play mode → test controls in the web build with DOM events. → using-unity-mcp.md
- 2026-11-08 · web-build · error · progressive asset loading + Decompression Fallback → player fails with "No GlobalGameManagers file was found"; ship one packed .data file. → unity-web-build.md
- 2026-11-08 · web-build · error · PWA template fails on 6000.6 (`DATA_FILENAME` is not defined) → pin `APPLICATION:Default`. → unity-web-build.md
- 2026-11-08 · uvcs · error · `cm ci <dir>` without `--applychanged` checked in only added files → pass explicit paths plus `--applychanged`, then verify with `cm diff`. → unity-version-control.md
- 2026-11-08 · uvcs · error · `cm branch create --commentary` doesn't exist → use `-c="…"`. → unity-version-control.md
- 2026-11-08 · uvcs · error · `unity vcs setup` on an existing workspace created an orphan repository → never re-run setup; check `cm wi` first. → unity-version-control.md
- 2026-11-08 · unity-cli · finding · zsh doesn't split a quoted flag string → keep CLI flags in an array, `F=(…)` then `"${F[@]}"`. → using-unity-mcp.md
- 2026-11-08 · process · approach · the user corrected `docs/` → notes go in `documentation/`, because `docs/` was Pages output. → AGENTS.md
