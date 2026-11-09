# Issues, issue notes and decisions

## GitHub labels

| Label | Meaning |
| --- | --- |
| `umbrella` | A tracking issue that links its child issues. Don't implement it directly; work its children. List them with `gh issue list --label umbrella` |
| `decision needed` | A question to settle before code. The outcome is an ADR in [decisions/](decisions/README.md). List the open ones with `gh issue list --label "decision needed"` |
| `exploration` | A spike: find out and write it down. The result is notes, maybe a prototype, not a shipped feature |
| `gameplay`, `tech`, `web`, `art`, `asteroid-fleet` | Area |

[`scratch.md`](../../scratch.md) at the repo root has the current suggested order of work. Update it when an issue it lists is closed or a release changes the order.

## Working an issue

1. Read the issue, its umbrella, and any ADR it touches.
2. Run `cm status` in the Unity project before you start ([unity-version-control.md](unity-version-control.md)). Branch on both sides if both change: `feature/<n>-<slug>` in git, `/main/feature-<n>-<slug>` in UVCS.
3. Do the work and verify it ([AGENTS.md](../../AGENTS.md), "A change is done when it is verified").
4. Write notes in `documentation/issues/<n>-<slug>/README.md` when the work is Unity-side (git can't show it) or when there are results worth keeping, such as numbers, trade-offs or follow-ups. Use [the #31 notes](../issues/31-unity-editmode-tests-for-fleetsim/README.md) as the model. Include:
   - the GitHub issue link;
   - the UVCS branch and changeset, if any;
   - what changed;
   - how it was verified, with the actual results;
   - open points.
5. Every claim in the notes must match what was checked in: compare with `cm diff cs:<n>` and `git show --stat`.
6. Link the PR to the issue (`Closes #n`). Close the issue only when the user asks, or when the PR merges.

## Settling a decision issue

A `decision needed` issue becomes an ADR once the user has decided.

1. Lay out the options in the issue (or in chat): what each means for this game and the web build, with costs. Give a recommendation.
2. **The user decides.** An agent doesn't accept its own proposal.
3. Write `documentation/agents/decisions/NNNN-<slug>.md` from [the template](decisions/template.md) with status `Accepted`, and link it from [decisions/README.md](decisions/README.md).
4. Comment on the issue with a link to the ADR, then close the issue (with the user's OK).
5. If a later decision changes it, don't edit the old ADR's decision. Write a new ADR, and set the old one to `Superseded by NNNN`.

Exploration issues can end in an ADR too, when the spike settles a question.
