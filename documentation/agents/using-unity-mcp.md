# Driving the Unity Editor (CLI and MCP)

The Editor for this project is usually open. Drive it live; don't edit scene or asset files by hand and don't start a second Editor.

- Unity 6000.6.8f1, URP, Input System, project `Vibe-Space-Mining-Fleet/`.
- Package `com.unity.pipeline` is installed, which is what the CLI and the MCP server talk to.

## CLI first, MCP second

If you have a shell, use the **Unity CLI**. It reaches every Pipeline command. The `unity-mcp` MCP server exposes the same Editor to clients without a shell. Use it only when the CLI is unavailable, and follow the same rules.

The CLI is not on PATH:

```zsh
U="/Applications/Unity Hub.app/Contents/Resources/unity"
P="$HOME/Github/Vibe-Space-Mining-Fleet/Vibe-Space-Mining-Fleet"
F=(--caller plugin --skill unity-cli --project-path "$P" --no-banner)
"$U" status --no-banner        # expect: ready, this project path, 6000.6.8f1
```

- Always pass `--project-path`. The shell's cwd is often the repo root, not the project.
- In zsh, keep the flags in an array (`"${F[@]}"`). One quoted string won't split into flags.
- Shell state does not persist between tool calls, so set `U`, `P` and `F` in every call.
- Add `--result-only` for compact JSON and `--format json` to parse errors.

## Find the command before you guess it

```zsh
"$U" command "${F[@]}" --query playmode      # search names, descriptions, tags
"$U" command "${F[@]}" --tags                # list the tags
"$U" command <group> <name> --help "${F[@]}"  # a command's parameters
```

**The listing shows tags, and a tag is not always the command name.** The tag is `tests`, but the command is `test` (`test list`, `test run`). The tag is `editor/playmode`, and the command is `editor.playmode start`. When you get `Command Not Found`, search again with `--query`.

## Commands this project uses

| Task | Command |
| --- | --- |
| Recompile and see errors | `"$U" recompile --project-path "$P"` |
| Console (errors only) | `"$U" command console get --level error --tail 50 "${F[@]}"` |
| Clear console | `"$U" command console clear "${F[@]}"` |
| Run C# in the Editor | `"$U" command script eval --code '<statements>' "${F[@]}"` |
| Run a menu item | `"$U" command editor invoke_menu --path "Space Mining Fleet/Build Demo Scene" "${F[@]}"` |
| Play / stop | `"$U" command editor.playmode start "${F[@]}"` / `... stop` |
| Screenshot of the game | `"$U" command capture game_view --output-path "$P/Screenshots/x.png" "${F[@]}"` |
| EditMode tests | `"$U" command test run --mode EditMode --timeout 300 "${F[@]}" --result-only` |
| Packages | `"$U" command package …` (see `--query package`), never edit `manifest.json` by hand |

The project's menu items are under **Space Mining Fleet**:

- **Build Demo Scene** regenerates `Assets/_Game/Scenes/MiningFleet.unity` from `MiningFleetSceneBuilder`.
- **Apply Web Settings (WebGPU + WebGL2)** applies the web Player settings.
- **Build Web (into web/public/unity)** builds the web player. See [unity-web-build.md](unity-web-build.md).

## `script eval` rules

- The code is a statement block, not a file. Don't use `using` directives (error CS0210); write fully qualified types such as `UnityEditor.PlayerSettings.WebGL.compressionFormat`.
- `UnityEngine.Object`, not `Object` (CS0104).
- End with `return <value>;` to get a result back.
- Player settings stay in memory until saved. Call `UnityEditor.AssetDatabase.SaveAssets()`, then read them back. `WebBuild.ApplySettings` does both.
- For anything longer than a few lines, add a static method in `Assets/_Game/Scripts/Editor/` and call it. The code is then versioned and reviewable.

## The edit loop for C#

1. Edit the `.cs` file.
2. Run `"$U" recompile --project-path "$P"`. It must report 0 errors. A recompile with errors leaves the Editor running the old code.
3. If you changed the sim or saves, run the EditMode tests: 11 tests in `Assets/_Game/Tests/EditMode/FleetSimTests.cs`, about 3 s.
4. If the scene layout changed, run **Build Demo Scene**.
5. Check the behaviour (next section).

## Checking behaviour

- **Input can't be injected into Editor play mode.** Synthetic mouse and keyboard events don't reach the Input System there. To test controls, build for the web and drive the browser page with DOM events. See [unity-web-build.md](unity-web-build.md).
- Play mode can freeze when the Editor is unfocused, while `status` still says "playing". Prove the game is advancing: read a changing value twice through `script eval` (for example `return UnityEngine.Object.FindAnyObjectByType<SpaceMining.FleetSimRunner>().Sim.Time;`; `FindFirstObjectByType` is obsolete in 6000.6), or look at two captures.
- Add a temporary `Debug.Log` that shows what you expect (a position, a count), read it with `console get`, then remove it.
- Stop play mode when you're done. Changes made in play mode are lost.

## When it goes wrong

- **Connection refused or timeouts right after an edit:** the Editor may be in Safe Mode because of compile errors. `"$U" status` lists them. Fix them, and the Editor recovers.
- **A long import or build:** pass a larger `--timeout` (seconds), or `--detach` and poll with `job`.
- **Still failing:** tell the user what you ran and what failed. Don't loop on retries, don't switch to another Editor, and don't fall back to editing files by hand.

## Don'ts

- Don't edit `.unity`, `.prefab`, `.asset`, `.meta` or `ProjectSettings/*` by hand.
- Don't add packages to save a few lines of code. Each one costs web build size: check the build before and after.
- Don't commit `Library/`, `Temp/`, `Logs/`, `UserSettings/` or the generated `*.csproj`/`*.slnx` files.
