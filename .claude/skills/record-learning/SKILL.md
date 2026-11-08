---
name: record-learning
description: Record what was learned in documentation/agents/learnings/log.md, and fix the agent guide it affects. Use after a command, tool or assumption failed and cost a retry, after the user corrected you, when you found a surprising fact about Unity, UVCS, GitHub Pages or the toolchain, and before you finish a task in which any of those happened.
---

# Record a learning

The procedure is shared with other agents. Read and follow `documentation/agents/learnings/README.md`, in the repo root `~/Github/Vibe-Space-Mining-Fleet`. In short:

1. **Is it worth writing?** It qualifies if it cost a retry, if the user corrected you, or if it surprised you, and only if the next agent would lose time without it. If not, stop here.
2. **Is it verified?** Have the command or output that proves it. Don't record guesses.
3. **Check for a duplicate.** Grep `log.md` and the guides for the key term. If the learning is already covered, skip it, or correct the existing guidance.
4. **Promote it.** If it changes how something should be done, edit the guide that owns the topic, in `documentation/agents/` or `decisions/`, keeping that guide's style.
5. **Log it.** Add one line at the top of the list in `documentation/agents/learnings/log.md`:
   `- YYYY-MM-DD · <area> · <error|finding|approach> · <what happened> → <cause / what works>. → <guide, or "not promoted">`
   Keep it to about 200 characters, with exact error text and commands in backticks.
6. **Archive, if needed.** If `log.md` is past about 40 entries, move the promoted entries, oldest first, to `archive/YYYY-MM.md`.
7. Tell the user in one line what you recorded and which guide changed. Don't commit unless they ask.
