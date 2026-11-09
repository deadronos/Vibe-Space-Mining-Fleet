# Web shell, bridge and saves

Covers GitHub issues #3 (full-window canvas) and #4 (TypeScript ↔ Unity bridge).

## Layout

| Path | What it is |
| --- | --- |
| `Vibe-Space-Mining-Fleet/` | Unity project (not in git; Unity Version Control) |
| `web/index.html`, `web/src/` | The page: full-window canvas, loading screen, gear menu, saves (Vite + TypeScript 7). Game controls and stats are in the Unity HUD (ADR 0005) |
| `web/public/unity/Build/` | Unity web build, written by Unity and committed to git. Vite copies it to `dist/unity/` untouched |
| `.github/workflows/` | `ci.yml` (lint, format, typecheck, build) and `deploy.yml` (Pages on `v*` tags) |

The page replaces Unity's own web template: Unity's `index.html` and `TemplateData/` are deleted after each build, and `web/src/unity.ts` calls `createUnityInstance` itself. The canvas is `position: fixed; inset: 0; 100vw × 100dvh`, `matchWebGLToCanvasSize` keeps Unity's back buffer at the canvas size, and the device pixel ratio is capped at 1.5.

## Bridge

```
page ──SendMessage("WebBridge", method, json)──► WebBridge.cs
         Command(json)    launch | recall | toggleAutoLaunch | setAutoLaunch | resumeAuto | build {unit}
         RequestSave("")  → emits "save" with the whole sim (SimSave) as JSON
         LoadSave(json)   → emits "loaded" { ok, error, time }
         SettleOffline(s) seconds away since the save; credits ore next frame (#58, ADR 0012)

WebBridge.cs ──SpaceMining_Emit(type, json)──► SpaceMiningBridge.jslib ──► window "spacemining:<type>"
         ready   once, when the scene starts
         state   4×/s: ore, refined ore, income, bottleneck, sorties, auto-launch, unit counts,
                 build queue length, selection, renderer; combat: carrier hull, heat, raiders,
                 squadrons, wave number, seconds to the next wave, carrier losses
         event   fleet notification with kind, severity, message, world position and sim time
```

`?bench=N` starts a render benchmark (#30): N drones, no pirate waves, no save loaded or written, and a timing readout. `ready.bench` echoes N, and `state` carries `fps`, `frameMs`, `frameMsP95`, `frameMsMax`, `simMs`, `tickMs` and `syncMs`. Results are in [issues/30-render-baseline](issues/30-render-baseline/README.md).

- Shapes: `web/src/protocol.ts` mirrors the C# payload classes in `WebBridge.cs`, `FleetNotice.cs` and `Sim/SimSave.cs`. To change a payload, a command or the save format, follow [agents/cross-boundary-changes.md](agents/cross-boundary-changes.md).
- `SendMessage` runs C# synchronously and the reply event fires before it returns, so `Bridge.requestSave()` and `Bridge.load()` subscribe first, then send.
- In the browser console, `spaceMining.bridge` is the live bridge.

## Saves

- The whole sim is saved, including the RNG state, so a loaded game carries on exactly as the saved one would have (checked: save, load into a sim in a different state, run both 120 s, identical).
- Saves are about 16–25 KB of JSON in `localStorage` (`spacemining.save.v1`), not in Unity: PlayerPrefs is capped at ~1 MB on the web, and Unity's IndexedDB folder is keyed to the page URL.
- Autosave every 30 s, when the tab is hidden, and on page unload. On start the page continues from the stored save.
- Gear menu (top right): Save now, Export (download `.json`), Import (load a `.json`), New game (delete the save and reload).
- Continuing from the stored save credits refined ore for the time away: half the income rate in the save, nothing under 60 s, capped at 8 h (#58, [ADR 0012](agents/decisions/0012-light-offline-credit.md)). Importing a file does not.
- `SimSave.version` gates loading: a save outside the readable range is refused with a message, not half-loaded, and the page starts a new game. The current build writes version 6 and reads 2 to 6; Unity migrates the older ones. The history of the versions is in the comment on `SimSave.CurrentVersion` (`Sim/SimSave.cs`).
- The bridge's `ready` event says `saveVersion` and `minSaveVersion`, and the page loads anything between the two.

## Develop and release

```sh
pnpm install
pnpm dev            # http://localhost:5173/, uses whatever is in web/public/unity
```

After changing the game: Unity menu **Space Mining Fleet → Build Web (into web/public/unity)**, then reload the page.

The toolchain, the checks, CI and the release steps are in [agents/web-and-github.md](agents/web-and-github.md). A release is a `v*` tag that matches `package.json`; the deploy workflow publishes `dist/` to GitHub Pages and then checks that the live page serves that version.

Actions can't run Unity without a license, so the Unity output stays committed ([ADR 0014](agents/decisions/0014-keep-committing-unity-build.md), #12). Each release adds about 10 MB of history. Revisit when history passes about 1 GB or checkout gets slow; attaching builds to GitHub Releases is the first option to try, Git LFS the second.

## Renderer choice and WebGL2 fallback

Unity picks WebGPU when `navigator.gpu` exists, else WebGL2. The page controls that in `web/src/unity.ts`:

- `?renderer=webgl2` hides `navigator.gpu` before Unity starts. Use it for QA instead of editing browser flags.
- If the player fails to start while WebGPU is available (Firefox 150, [#44](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/44)), the page sets `sessionStorage["spacemining.renderer"] = "webgl2"` and reloads once. "Fails" means `createUnityInstance` rejects, or Unity reports a fatal banner error before the game is ready. A failed `loader.js` download or the 180 s `ready` timeout does not trigger it. The result is a WebGL2 start with a toast (the start was seen on Firefox 150; the toast was not).
- The flag lasts for the tab session. Clear it (or open a new tab) to try WebGPU again. A network failure while Unity downloads its data also counts as a failed start and sets the flag.
- A start that hangs inside `createUnityInstance` without an error or banner is not retried; use `?renderer=webgl2`.

## Known limits

- Control groups use Shift+1–0 to assign (ADR 0006), because Chrome on Windows and Linux keeps Ctrl+1–9 for tabs. Ctrl/Cmd still works where the browser passes it through.

## Browser QA

v0.5.0, macOS, 9 Nov 2026. Renderer values came from the game menu.
[QA issue #33](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/33).

| Browser | Default renderer | Forced WebGL2 | Save flow |
| --- | --- | --- | --- |
| Chrome 144.0.7559.133 | WebGPU started | Started | Both paths passed Save, Export, Import (v3 and v2), and New Game (cancel and confirm). |
| Safari 27.2 | WebGPU started | Started | Verified a v3 JSON download on WebGPU and New Game reload on WebGL2. The native picker opened for Import. Import completion remains unverified. |
| Firefox 150.0 | WebGPU failed during startup ([#44](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/44)) | Started | WebGL2 passed Save, Export, Import (v3 and v2), and New Game (cancel and confirm). |
| Firefox 158.0 | WebGPU started locally and on Pages | Started | Both paths passed Save, Export, Import (v3 and v2), and New Game (cancel and confirm). |

Firefox 150.0 re-test (9 Nov 2026, macOS arm64, official build run from a temporary
copy with a throwaway profile and `dom.webgpu.enabled` true): `main` reproduced #44
exactly (fatal banner, `wgpu[adapterOrDevice] is undefined`). The #44 branch started
the game on WebGL2 (HUD said "WebGL 2") with a fresh tab and no flags. Only the start
was checked, not Save, Export or Import on that path.

The v2 fixture was exported from the v0.4.1 player. WebGL2 was forced by
hiding `navigator.gpu` before Unity initialized in Chrome and Safari, and
by setting `dom.webgpu.enabled` to false in an isolated Firefox profile.
Chrome WebGL2 logged a URP warning about the Edge Adaptive Spatial
Upsampling shader and skipped post-processing passes.

The owner previously reported hardware-accelerated startup in Chrome on
Android with v0.4.0. Current phone and tablet layout, touch input, and
performance still need device testing. Touch controls and the mobile HUD
are tracked in [#41](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/41).
Non-QWERTY hotkeys and the remaining combat interactions (squadron groups,
offscreen wave marker and carrier loss) still need a browser pass.
