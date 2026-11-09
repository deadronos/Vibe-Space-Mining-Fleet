---
name: record-learning
description: Record what was learned in documentation/agents/learnings/log.md, and fix the agent guide it affects. Use after a command, tool or assumption failed and cost a retry, after the user corrected you, when you found a surprising fact about Unity, UVCS, GitHub Pages or the toolchain, and before you finish a task in which any of those happened.
---

# Record a learning

The procedure is shared with other agents and lives in one place: read and follow `documentation/agents/learnings/README.md` (repo root `~/Github/Vibe-Space-Mining-Fleet`). It covers when an entry is worth writing, the one-line format, promoting it into a guide, and archiving.

Two things that file does not say:

1. **Check for a duplicate first.** Grep `log.md`, `archive/` and the guides for the key term. If the learning is already covered, skip it, or correct the existing guidance.
2. **Report it.** Tell the user in one line what you recorded and which guide changed. Don't commit unless they ask.
