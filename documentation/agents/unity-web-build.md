# Unity web build

The Unity player is built locally and written to `web/public/unity/` in the git repo. Vite copies it into `dist/` unchanged.

## Build

Run the menu item **Space Mining Fleet → Build Web (into web/public/unity)**:

```zsh
U=~/.unity/bin/unity   # standalone CLI, see using-unity-mcp.md
P="$HOME/Github/Vibe-Space-Mining-Fleet/Vibe-Space-Mining-Fleet"
F=(--caller plugin --skill unity-cli --project-path "$P" --no-banner)
"$U" command editor invoke_menu --path "Space Mining Fleet/Build Web (into web/public/unity)" "${F[@]}" --timeout 900
cat "$P/Library/WebBuildResult.txt"   # "Succeeded size=… errors=0 out=…" (or "running")
```

A build takes several minutes. If the call times out, keep reading `WebBuildResult.txt` until it no longer says `running`. Don't start a second build in the meantime.

`WebBuild.BuildForPages` (in `Assets/_Game/Scripts/Editor/WebBuild.cs`):

- applies the Player settings first (`ApplySettings`);
- clears the old output;
- builds;
- deletes Unity's `index.html` and `TemplateData/`, because `web/index.html` replaces them.

The output is `web/public/unity/Build/unity.{loader.js,framework.js.unityweb,wasm.unityweb,data.unityweb}`.

## Settings, and why

Change these in `WebBuild.ApplySettings`, not in the Player Settings window, so they are versioned and re-applied on every build.

| Setting | Value | Why |
| --- | --- | --- |
| Graphics APIs | WebGPU, then OpenGLES3 | WebGPU first; the loader falls back to WebGL2 |
| Compression | Gzip + Decompression Fallback | Pages can't set `Content-Encoding`. See [decisions/0004](decisions/0004-gzip-with-decompression-fallback.md) |
| Template | `APPLICATION:Default` | The PWA template fails on 6000.6 (`DATA_FILENAME`) |
| Progressive asset loading | off | The split data files break startup when Decompression Fallback is on |
| Stripping | High managed stripping, strip engine code, `DiskSizeLTO` | Download size |
| Exceptions | None | Size. Errors in the player won't have managed stack traces |

## Check it in a browser

1. Run `pnpm dev` from the repo root, in the background.
2. Open http://localhost:5173/ in a browser. A hidden built-in browser pane renders no frames, so the game stalls at "Starting…". Ask the user to show the pane, or use the Chrome DevTools browser.
3. Wait for the `spacemining:ready` event; the loading screen hides when it fires. Then check that the console shows no errors.
4. In the built-in browser, real clicks and keys (`computer` tool) reach the game and are enough for click-select, hover, M/S/H/Esc. `left_click_drag` presses and releases in one frame, so it can't box-select; use a plain click, or dispatch DOM pointer events with delays between press, move and release. If the Chrome DevTools browser says `The browser is already running for …chrome-profile`, use the built-in pane (show it with `show_pane preview`).
5. Drive the game with synthetic DOM events on the canvas. Dispatch `MouseEvent`s (`mousemove`, `mousedown`, `mouseup`, with `button`/`buttons` set): `PointerEvent`s alone didn't reach the Input System. Wait ~80 ms between steps; for a box-select, send several `mousemove`s while the button is down. HUD buttons and selection-list rows take the same clicks. The idle camera keeps orbiting, so a unit moves between a screenshot and the click: box-select a large area, then click its row in the selection list. This is the only way to test RTS controls, because the Editor's play mode ignores injected input.
6. Read the game state: listen for `spacemining:state` on `window`, or read the HUD in a screenshot.
7. To test the WebGL2 fallback, open the page in a browser without WebGPU, or block `navigator.gpu` before the loader runs.

For Safari, use the installed browser UI if WebDriver reports that Allow
Remote Automation is disabled. For a forced WebGL2 test without changing
Safari settings, serve a disposable copy of the build with this script in
the page head before the loader runs:

```html
<script>
  Object.defineProperty(Navigator.prototype, 'gpu', { get: () => undefined });
</script>
```

Before you commit a new build, compare its size with the previous one. A package added to the project shows up here.
