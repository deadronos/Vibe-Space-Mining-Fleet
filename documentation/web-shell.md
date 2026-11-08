# Web shell, bridge and releases

Covers GitHub issues #3 (full-window canvas) and #4 (TypeScript ↔ Unity bridge).

## Layout

| Path | What it is |
| --- | --- |
| `Vibe-Space-Mining-Fleet/` | Unity project (not in git; Unity Version Control) |
| `web/index.html`, `web/src/` | The page: full-window canvas, toolbar, loading screen, saves (Vite + TypeScript 7) |
| `web/public/unity/Build/` | Unity web build, written by Unity and committed to git. Vite copies it to `dist/unity/` untouched |
| `.github/workflows/` | `ci.yml` (lint, format, typecheck, build) and `deploy.yml` (Pages on `v*` tags) |

The page replaces Unity's own web template: Unity's `index.html` and `TemplateData/` are deleted after each build, and `web/src/unity.ts` calls `createUnityInstance` itself. The canvas is `position: fixed; inset: 0; 100vw × 100dvh`, `matchWebGLToCanvasSize` keeps Unity's back buffer at the canvas size, and the device pixel ratio is capped at 1.5.

## Bridge

```
page ──SendMessage("WebBridge", method, json)──► WebBridge.cs
         Command(json)    launch | recall | toggleAutoLaunch | setAutoLaunch | resumeAuto
         RequestSave("")  → emits "save" with the whole sim (SimSave) as JSON
         LoadSave(json)   → emits "loaded" { ok, error, time }

WebBridge.cs ──SpaceMining_Emit(type, json)──► SpaceMiningBridge.jslib ──► window "spacemining:<type>"
         ready   once, when the scene starts
         state   4×/s: ore, sorties, auto-launch, drone counts, selection, renderer
```

- Shapes: `web/src/protocol.ts` mirrors the C# payload classes in `WebBridge.cs` and `Sim/SimSave.cs`. Keep them in step.
- `SendMessage` runs C# synchronously and the reply event fires before it returns, so `Bridge.requestSave()` and `Bridge.load()` subscribe first, then send.
- In the browser console, `spaceMining.bridge` is the live bridge.

## Saves

- The whole sim is saved, including the RNG state, so a loaded game carries on exactly as the saved one would have (checked: save, load into a sim in a different state, run both 120 s, identical).
- Saves are about 16 KB of JSON in `localStorage` (`spacemining.save.v1`), not in Unity: PlayerPrefs is capped at ~1 MB on the web, and Unity's IndexedDB folder is keyed to the page URL.
- Autosave every 30 s, when the tab is hidden, and on page unload. On start the page continues from the stored save.
- Toolbar: Save, Export (download `.json`), Import (load a `.json`), New (delete the save and reload).
- `SimSave.version` gates loading. Bump it when the shape changes; mismatched saves are refused with a message, not half-loaded.

## Develop

```sh
pnpm install
pnpm dev            # http://localhost:5173/ — uses whatever is in web/public/unity
pnpm run check      # oxlint (type-aware) + oxfmt --check + tsc
pnpm run build      # → dist/
```

After changing the game: Unity menu **Space Mining Fleet → Build Web (into web/public/unity)**, then reload `pnpm dev`.

## Release

1. Build the Unity player (menu above) and commit `web/public/unity`.
2. Bump `version` in `package.json`, commit, push.
3. `git tag v<version> && git push origin v<version>`. The deploy workflow refuses a tag that doesn't match `package.json`.

Actions can't run Unity without a license, so the Unity output stays committed. If its history gets heavy (about 10 MB per release), Git LFS for `web/public/unity/Build/*.unityweb` or attaching builds to GitHub Releases are the next steps.

## Known limits

- Ctrl+1–9 (control groups) is a browser tab shortcut on Windows and Linux Chrome and can't be intercepted there. A different modifier for groups may be needed.
- Tested in Chrome (WebGPU). Safari and Firefox untested.
