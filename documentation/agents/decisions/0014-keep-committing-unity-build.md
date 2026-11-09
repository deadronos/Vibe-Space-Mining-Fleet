# 0014: Keep committing the Unity web build

- **Status:** Accepted
- **Date:** 2026-11-09
- **Issue:** #12
- **Decided by:** the user

## Context

GitHub Actions can't run Unity without a license, so the Unity output is built
locally and committed to `web/public/unity` (ADR 0002). Each release adds about
10 MB to git history; the repository was about 167 MB on 9 Nov 2026 at v0.8.2.

## Options

1. **Keep committing:** no change; simple.
2. **Git LFS** for `web/public/unity/Build/*.unityweb`: needs `lfs: true` on
   checkout in the deploy workflow and uses LFS bandwidth quota.
3. **GitHub Releases:** attach the build to each release and download it by
   tag in the deploy workflow.
4. **Unity build in CI:** GameCI with a license secret; most moving parts.

## Decision

Keep committing the Unity build to `web/public/unity`, as today. Revisit when
the repository's history passes about 1 GB, or when clone or CI checkout time
becomes a problem; GitHub Releases is then the first option to try.

## Consequences

- The release steps in `documentation/web-shell.md` stay the same.
- History keeps growing by about 10 MB per release.
- Moving later needs only a deploy-workflow change; old history stays.
