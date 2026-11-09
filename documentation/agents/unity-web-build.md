# Unity web build

The Unity player is built locally and written to `web/public/unity/` in the git repo. Vite copies it into `dist/` unchanged.

## Build

Run the menu item **Space Mining Fleet → Build Web (into web/public/unity)**:

```zsh
U=~/.unity/bin/unity   # standalone CLI, see driving-unity-editor.md
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

1. **Use a clean origin.** `http://localhost:5173/` holds the user's own save, and the page autosaves into it; time away also earns offline ore. Start your own server on another port, which gives you empty storage: `pnpm dev --port 5199`, in the background.
2. **Show the browser pane, then load the page.** A hidden built-in pane renders no frames, so the game stalls at "Starting…", and a page that loaded while the pane was hidden does not recover when it is shown: show the pane (`show_pane preview`), then reload. The Chrome DevTools browser is the alternative.
3. Wait for the `spacemining:ready` event; the loading screen hides when it fires. Check that the console shows no errors.
4. Read the game state: listen for `spacemining:state` and `spacemining:event` on `window`, or read the HUD in a screenshot. `spaceMining.bridge` in the console is the live bridge.
5. Drive the game with input (next section), then look at the result.
6. To test the WebGL2 path, open the page with `?renderer=webgl2`.
7. Stop your server when you are done.

### Sending input

The Editor's play mode ignores injected input, so the web build is the only place to test RTS controls.

- **Real clicks and keys** (`computer` tool) reach the game and are enough for click-select, hover, HUD buttons and the hotkeys (M, S, H, Esc).
- **Box-select and drags:** `left_click_drag` presses and releases in one frame, so a drag never starts. Dispatch DOM `MouseEvent`s on the canvas instead (`mousemove`, `mousedown`, `mouseup`, with `button` and `buttons` set), about 80 ms apart, with several `mousemove`s while the button is down. `PointerEvent`s alone don't reach the Input System.
- **Units move.** The idle camera keeps orbiting, so a unit is elsewhere by the time you click. Box-select a large area, then click the unit's row in the selection list. Check the selected class in the HUD before a class-specific order.
- **HUD lists move buttons.** A list that grows or wraps shifts what is below it between the screenshot and the click. Take a new screenshot before clicking, and keep buttons above variable-length lists when you design HUD.
- **Sensors view:** markers overlap, and a squadron can fly over a drone marker. Load a save with one deployed drone away from the other ships.

### Seeding and editing saves

- The page autosaves on unload, so an edit to `spacemining.save.v1` in localStorage is overwritten by the reload that should load it. Write the save, stub `Storage.prototype.setItem` for that page, then call `location.reload()`.
- Offline credit (#58) needs a save at least 60 s old: set `savedAt` back in the stored JSON the same way.

### Tool quirks

- **Built-in pane, hidden:** real clicks may not reach Unity. Click the canvas once for real, then dispatch DOM events, scaling screenshot coordinates to CSS pixels (`innerWidth` / screenshot width).
- **Built-in pane, background tab:** a tab that is not in front keeps running but slowly, so sim time falls behind wall time. Front the tab you are measuring.
- **Chrome DevTools browser:** `The browser is already running for …chrome-profile` means it is taken; use the built-in pane.
- **Playwright CLI:** use the complete element reference from the latest snapshot, including a frame prefix such as `f1e7`. Delete its generated `.playwright-cli/` snapshots afterwards: the repo's format check includes them.
- **Safari:** WebDriver needs Allow Remote Automation; otherwise use the installed browser UI.

### Emissive materials

**Build Web** refuses to build while a material in `Assets/_Game/Materials` has an emission colour but the `_EMISSION` keyword off, and names them in `Library/WebBuildResult.txt`. Run **Build Demo Scene** to fix them ([driving-unity-editor.md](driving-unity-editor.md#emissive-materials)).

Before you commit a new build, compare its size with the previous one. A package added to the project shows up here.
