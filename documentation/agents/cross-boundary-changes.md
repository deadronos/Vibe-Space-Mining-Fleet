# Changes that touch both C# and TypeScript

Some changes need edits on both sides, which are under two version control systems. Each side then gets its own commit, and the two must stay in step.

What the bridge and the saves are is described in [../web-shell.md](../web-shell.md). This guide is about changing them.

## The contract

| Concern | C# (UVCS) | TypeScript (git) |
| --- | --- | --- |
| Page → Unity calls | `WebBridge.Command / RequestSave / LoadSave / SettleOffline` | `Bridge` in `web/src/bridge.ts` |
| Unity → page events | `WebBridge.Emit` → `SpaceMining_Emit` in `Assets/Plugins/WebGL/SpaceMiningBridge.jslib` | `on` / `once` in `bridge.ts`, typed by `BridgeEvents` |
| Payload shapes | `[Serializable]` classes in `WebBridge.cs` | same names in `web/src/protocol.ts` |
| Save format | `SimSave` + `SimSave.CurrentVersion` in `Sim/Core/SimSave.cs` | `SaveFile` in `protocol.ts`, storage in `save.ts` (`spacemining.save.v1`) |
| The built player | `WebBuild.cs` | `web/public/unity/`, loaded by `web/src/unity.ts` |

`JsonUtility` does the C# side of the JSON. It has limits:

- only public fields or `[SerializeField]` fields;
- no dictionaries;
- no top-level arrays;
- no `null` for nested classes (it writes defaults instead).
- JSON `null` elements in lists of serializable classes deserialize as default
  objects, so import validation must check required field invariants as well
  as null references. Test the JSON path, not just constructed C# objects.

Keep the payloads flat. On the TypeScript side, type every field as required, matching what `JsonUtility` actually writes.

## Order of work

1. **C# first.** Edit the payload class or the command, then recompile and test ([driving-unity-editor.md](driving-unity-editor.md)).
2. **TypeScript to match.** Edit `protocol.ts` and the code that uses it, then run `pnpm run check`.
3. **Build the player** into `web/public/unity` ([unity-web-build.md](unity-web-build.md)).
4. **Check it in the browser:** the event arrives with the new shape and the command takes effect.
5. **Version control, only when the user asks:**
   - check in to UVCS ([unity-version-control.md](unity-version-control.md));
   - commit to git: the TypeScript, `web/public/unity` and the notes, with the UVCS branch and changeset in the message or the issue notes.

## Save format changes

- If the change adds, removes or renames a `SimSave` field, or changes its meaning, bump `SimSave.CurrentVersion`.
- `FleetSim.Load` refuses other versions and leaves the sim unchanged. The page then starts a new game. If old saves should survive, write a migration and say so in the issue.
- Extend the save round-trip test in `FleetSimTests.cs`.
- Record the format change and its reason in the issue notes.

## Adding a bridge command

1. Add a `case` to `WebBridge.Command`. Unknown types only log a warning, so a typo fails quietly.
2. Add the type to the `BridgeCommand` union in `protocol.ts`.
3. Add a method on `Bridge` if the page calls it from more than one place.
