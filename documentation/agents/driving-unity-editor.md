# Driving the Unity Editor (CLI and MCP)

The Editor for this project is usually open. Drive it live; don't edit scene or asset files by hand and don't start a second Editor.

- **First, in every session that touches the project:** run `"$U" cm status` from the Unity project directory ([unity-version-control.md](unity-version-control.md)). If it shows changes or a pending merge you didn't make, ask the user before you edit, branch or build: a build includes whatever is in the workspace.
- Unity 6000.6.8f1, URP, Input System, project `Vibe-Space-Mining-Fleet/`.
- Package `com.unity.pipeline` is installed, which is what the CLI and the MCP server talk to.

## CLI first, MCP second

If you have a shell, use the **Unity CLI**. It reaches every Pipeline command. The `unity-mcp` MCP server exposes the same Editor to clients without a shell. Use it only when the CLI is unavailable, and follow the same rules.

Use the standalone CLI in `~/.unity/bin` (installed with `curl -fsSL https://unity.com/install.sh | bash`). It updates itself; Unity Hub ships an older copy at `/Applications/Unity Hub.app/Contents/Resources/unity` that lags behind. Agent shells don't load `~/.zshrc`, so call it by path:

```zsh
U=~/.unity/bin/unity           # 1.0.0-beta.17 on 2026-11-08; check with "$U" self-update --check

P="$HOME/Github/Vibe-Space-Mining-Fleet/Vibe-Space-Mining-Fleet"
F=(--caller plugin --skill unity-cli --project-path "$P" --no-banner)
"$U" status --no-banner        # expect: ready, this project path, 6000.6.8f1
```

If `status` lists no Editor for the project, start one with `"$U" projects open "$P" --no-banner` and poll `"$U" status --no-banner` until it shows `ready` (about 20 s on this machine).

- Pass `--project-path` to Editor commands. The `cm` passthrough takes native UVCS arguments and uses the current directory.
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

Before writing a sim check that spans ship classes, read their state definitions. For example, drones aboard use `DroneState.Hangar`, and docked squadrons expose `Docked`.

Headless scenarios that exercise field hazards need `SimSetup.fieldHazards = true`, as set by the live runner. Other fixtures can leave hazards disabled to isolate the mechanic under test.

For route scenarios, queue `FleetCommand.WarpTo(destination)`. If the scenario models resumed mining, queue `SetAutoLaunch` with `true` after arrival. Warp recall turns auto-launch off.

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
| Recompile and EditMode tests, summarised | `scripts/unity-check.sh` (from the repo root) |
| EditMode tests, raw JSON | `"$U" command test run --mode EditMode --timeout 300 "${F[@]}" --result-only` |
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

1. Edit the `.cs` file. One `MonoBehaviour` or `ScriptableObject` per file, named after the class, or Unity silently drops the component from prefabs.
2. Run the check from the repo root:

   ```zsh
   scripts/unity-check.sh              # refresh, recompile, EditMode tests
   scripts/unity-check.sh --no-tests   # refresh and recompile only
   ```

   It prints `compiled` and `EditMode N of N passed`, or the compile errors, or each test that didn't pass with its message. Exit code 0 means compiled and all green. The whole suite takes a few seconds.
3. If the scene layout changed, run **Build Demo Scene**.
4. Check the behaviour (next section).

What the script does, for when you need a step by hand:

- `script eval` with `UnityEditor.AssetDatabase.Refresh()`, because an unfocused Editor doesn't notice edits made from the shell;
- `status --until-ready`, because the Refresh starts the compile and the domain reload;
- `recompile`, then `status --until-ready` again;
- `console get`, reading `groundTruth.compilationFailed`: `recompile` can say `up_to_date` after a failed compile, and tests then pass against the old assemblies;
- `test run --mode EditMode`, summarised (the raw result is several hundred lines of JSON).

## Checking behaviour

- **Input can't be injected into Editor play mode.** Synthetic mouse and keyboard events don't reach the Input System there. To test controls, build for the web and drive the browser page with DOM events. See [unity-web-build.md](unity-web-build.md).
- Play mode can freeze when the Editor is unfocused, while `status` still says "playing". Prove the game is advancing: read a changing value twice through `script eval` (for example `return UnityEngine.Object.FindAnyObjectByType<SpaceMining.FleetSimRunner>().Sim.Time;`; `FindFirstObjectByType` is obsolete in 6000.6), or look at two captures.
- `Screen.width`/`Screen.height` inside `script eval` are the Editor window's size, not the Game view's. Screen-to-panel checks (`HudController.BlocksPointer`) give wrong answers there; test them in the web build.
- Add a temporary `Debug.Log` that shows what you expect (a position, a count), read it with `console get`, then remove it.
- Stop play mode when you're done. Changes made in play mode are lost.

## Emissive materials

URP switches the `_EMISSION` keyword off whenever it validates a material whose `globalIlluminationFlags` has no emissive bit. `MiningFleetSceneBuilder.Lit` therefore sets `RealtimeEmissive`. A `.mat` file can list the keyword while the Editor (and so the build) has it off: check with `Material.IsKeywordEnabled("_EMISSION")`. **Build Web** refuses to build while any material in `Assets/_Game/Materials` has an emission colour and the keyword off, and names them in `Library/WebBuildResult.txt`.

## When it goes wrong

- **`No Pipeline instance found for project`:** a domain reload is still running (after `recompile`, or after `AssetDatabase.Refresh()` through `script eval`). Run `"$U" status --until-ready --project-path "$P" --no-banner`, then retry. `scripts/unity-check.sh` waits for you.
- **Connection refused or timeouts right after an edit:** the Editor may be in Safe Mode because of compile errors. `"$U" status` lists them. Fix them, and the Editor recovers.
- **A long import or build:** pass a larger `--timeout` (seconds), or `--detach` and poll with `job`.
- **Still failing:** tell the user what you ran and what failed. Don't loop on retries, don't switch to another Editor, and don't fall back to editing files by hand.

## Don'ts

- Don't edit `.unity`, `.prefab`, `.asset`, `.meta` or `ProjectSettings/*` by hand.
- Don't add packages to save a few lines of code. Each one costs web build size: check the build before and after.
- Don't commit `Library/`, `Temp/`, `Logs/`, `UserSettings/` or the generated `*.csproj`/`*.slnx` files.
