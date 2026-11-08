# Decisions (ADRs)

Short records of decisions that shape the code, one per file: what was decided, and why. Read the relevant one before you change something it covers. If you think it is wrong, raise it with the user rather than working around it.

How a decision gets here: [../issues-and-decisions.md](../issues-and-decisions.md#settling-a-decision-issue). Start from [template.md](template.md).

Name the files `NNNN-<slug>.md`, numbered in order. A record's status is `Proposed`, `Accepted`, `Superseded by NNNN` or `Rejected`.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-deterministic-fixed-tick-sim.md) | Deterministic plain-C# sim at a fixed 20 Hz tick, separate from views | Accepted |
| [0002](0002-two-version-control-systems.md) | Unity project in UVCS, everything else in git; the web build is committed | Accepted |
| [0003](0003-vite-typescript-shell-and-tag-deploys.md) | Vite + TypeScript page around the Unity build; deploy to Pages on `v*` tags | Accepted |
| [0004](0004-gzip-with-decompression-fallback.md) | Gzip + Decompression Fallback on Pages; no service worker for now | Accepted |
| [0005](0005-ui-toolkit-hud.md) | In-game HUD in UI Toolkit; the page keeps only a gear menu for saves | Accepted |
| [0006](0006-control-group-keys.md) | Control groups: Shift+1–0 assigns (Ctrl/Cmd too where allowed), 1–0 recalls, plus a group bar | Accepted |

## Open decisions (GitHub `decision needed`)

| Issue | Question |
| --- | --- |
| #5 | Run structure: endless field, system map or mission campaign |
| #6 | Meta-progression (research, prestige) or none |
| #7 | Offline / idle progress |
| #8 | How far direct control goes vs automation |
| #9 | Enemy design: pirate waves, rival faction or both |
| #10 | asteroid-fleet's hangar slot board in an RTS |
| #12 | Where the Unity web build lives (affects 0002) |
