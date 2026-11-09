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
| [0007](0007-stop-hold-and-escape.md) | S stops (back to automation), H holds position, Escape cancels modes and drags before clearing the selection | Accepted |
| [0008](0008-pirate-waves-and-carrier-loss.md) | Pirate waves scaled by heat and distance; a destroyed carrier jumps home and loses the field fleet; save version 3 still reads version 2 | Accepted |
| [0009](0009-squadrons-stances-formations.md) | Fighter squadrons as one unit; attack, escort and dock orders; four stances, three formations | Accepted |
| [0010](0010-open-ended-systems-and-warp.md) | Open-ended route of seeded, revisitable systems with fleet recall and warp | Accepted |
| [0011](0011-research-without-resets.md) | Research tree with permanent unlocks and no run reset; prestige deferred (#57) | Accepted |
| [0012](0012-light-offline-credit.md) | Light offline credit: a share of recent ore income on load, nothing else changes | Accepted |
| [0013](0013-hangar-types-as-carrier-modules.md) | Hangar types become carrier modules; implementation deferred to a HUD pass (#59) | Accepted |
| [0014](0014-keep-committing-unity-build.md) | Keep committing the Unity web build; revisit past ~1 GB of history | Accepted |

## Open decisions (GitHub `decision needed`)

| Issue | Question |
| --- | --- |
| #57 | Revisit prestige and long-term balance (after the research tree) |
| #8 | How far direct control goes vs automation (stop / hold settled in [0007](0007-stop-hold-and-escape.md); the rest is open) |
