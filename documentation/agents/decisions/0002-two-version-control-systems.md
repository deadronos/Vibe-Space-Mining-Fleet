# 0002: Unity project in UVCS, everything else in git

- **Status:** Accepted. The build-output part is open in #12.
- **Date:** 2026-11-08
- **Issue:** #1, #12
- **Decided by:** the user ("use Unity Version Control")

## Context

The user wanted Unity Version Control for the Unity project. GitHub hosts the site (Pages), CI, issues and the web shell. Actions has no Unity license, so it can't build the player.

## Decision

- `Vibe-Space-Mining-Fleet/` (the Unity project) is versioned in UVCS and ignored by git.
- Everything else (web shell, workflows, documentation) is in git.
- The Unity web player is built locally and committed to git in `web/public/unity/`. That folder is the hand-off point between the two systems.
- Work that spans both sides is linked by issue number: the same `<n>-<slug>` in both branch names, the UVCS changeset in the git notes.

## Consequences

- A GitHub PR doesn't show the C# diff. Issue notes in `documentation/issues/` name the UVCS branch and changeset instead.
- Every release adds about 10 MB of build output to git history. #12 decides whether to move it to Git LFS, Releases assets or elsewhere.
- Agents must check in on both sides, carefully. See [../unity-version-control.md](../unity-version-control.md).
