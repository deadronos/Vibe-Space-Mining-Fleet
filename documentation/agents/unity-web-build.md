# Unity web build

The Unity player is built locally and written to `web/public/unity/` in the git repo. Vite copies it into `dist/` unchanged.

## Build

Run the menu item **Space Mining Fleet → Build Web (into web/public/unity)**:

```zsh
U="/Applications/Unity Hub.app/Contents/Resources/unity"
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
2. Open http://localhost:5173/ in the built-in browser.
3. Wait for the `spacemining:ready` event; the loading screen hides when it fires. Then check that the console shows no errors.
4. Drive the game with synthetic DOM events on the canvas (pointer and keyboard events). This is the only way to test RTS controls, because the Editor's play mode ignores injected input.
5. Read the game state: listen for `spacemining:state` on `window`, or read the toolbar.
6. To test the WebGL2 fallback, open the page in a browser without WebGPU, or block `navigator.gpu` before the loader runs.

Before you commit a new build, compare its size with the previous one. A package added to the project shows up here.
