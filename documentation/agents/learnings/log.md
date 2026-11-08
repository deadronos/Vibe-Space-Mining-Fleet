# Learnings log

Newest first. Format and rules are in [README.md](README.md).

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
