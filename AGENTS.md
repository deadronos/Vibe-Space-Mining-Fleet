# AGENTS.md

Vibe Space Mining Fleet: a Unity 6 RTS-style space mining game, shipped as a WebGPU/WebGL2 build inside a small Vite + TypeScript page on GitHub Pages.

The repo has two halves with **two version control systems**:

| Half                | Path                                    | Language   | Version control                                  |
| ------------------- | --------------------------------------- | ---------- | ------------------------------------------------ |
| Web shell, docs, CI | everything except the Unity folder      | TypeScript | git → GitHub `deadronos/Vibe-Space-Mining-Fleet` |
| Unity project       | `Vibe-Space-Mining-Fleet/` (gitignored) | C#         | Unity Version Control (UVCS)                     |

They meet in one folder: the Unity build writes `web/public/unity/`, which git tracks.

## Read before you work

Open only the guides your task needs.

| Read                                                                                             | When                                                                               |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [documentation/agents/repo-layout.md](documentation/agents/repo-layout.md)                       | First time here, or unsure where a file lives or which VCS owns it                 |
| [documentation/agents/using-unity-mcp.md](documentation/agents/using-unity-mcp.md)               | Any work in the Unity Editor: C# changes, scenes, play mode, tests, console        |
| [documentation/agents/unity-version-control.md](documentation/agents/unity-version-control.md)   | Before branching, checking in or merging anything under `Vibe-Space-Mining-Fleet/` |
| [documentation/agents/web-and-github.md](documentation/agents/web-and-github.md)                 | TypeScript, pnpm, lint/format, git, PRs, CI, releases                              |
| [documentation/agents/unity-web-build.md](documentation/agents/unity-web-build.md)               | Building the Unity player into `web/public/unity` and checking it in a browser     |
| [documentation/agents/cross-boundary-changes.md](documentation/agents/cross-boundary-changes.md) | A change that touches both C# and TypeScript (bridge, saves, build)                |
| [documentation/agents/issues-and-decisions.md](documentation/agents/issues-and-decisions.md)     | Picking up a GitHub issue, writing issue notes, settling a `decision needed` issue |
| [documentation/agents/decisions/](documentation/agents/decisions/README.md)                      | Before changing something an accepted decision covers                              |

Project and design notes (not agent-specific) are in [documentation/](documentation/README.md).

## Rules that apply everywhere

- Notes go in `documentation/`. `docs/` is not used; `dist/` is build output.
- Drive the running Unity Editor through the Unity CLI; never hand-edit `.unity`, `.prefab`, `.asset` or `ProjectSettings` files.
- A change is done when it is verified: `pnpm run check` for TypeScript, compile + EditMode tests for C#, and a browser check for anything the player sees.
- Commit, push, check in, merge, tag or release only when the user asks.
