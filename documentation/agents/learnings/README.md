# Learnings

A shared inbox of what agents learned the hard way. Every agent (Claude, Codex, Gemini…) reads and writes it the same way.

- [log.md](log.md): one line per entry, **newest first**.
- [archive/](archive/): entries already promoted into a guide, moved here by month.

**The guides are the truth; this log is the history.** If an entry changes how something should be done, edit the guide in the same change, and point the entry at it.

## When to write an entry

Write one when any of these happened:

- something failed and cost a retry or more (a wrong command, flag, API or assumption);
- the user corrected an agent;
- a fact surprised you, such as a tool, platform or Unity behaviour that isn't what you'd expect.

Before you write, ask: **would the next agent lose time without this?** If not, skip it.

**Only record what you verified.** Give the command that worked, or the output that proved it. Never record a guess as a fact.

## Format

Add the entry at the top of the list in `log.md`, on one line:

```
- YYYY-MM-DD · <area> · <kind> · <what happened> → <cause / what works>. → <guide it went into, or "not promoted">
```

| Field | Values |
| --- | --- |
| area | `unity-cli`, `unity-editor`, `uvcs`, `web-build`, `web`, `git`, `ci`, `pages`, `sim`, `bridge`, `docs`, `process` |
| kind | `error` (something broke: symptom → cause → fix), `finding` (a fact about the tools or platform), `approach` (a better way to work, and why) |

Keep it to about 200 characters. Put command names and exact error text in backticks, so people can grep for them.

## Promote, then archive

1. **Promote:** if the entry should change behaviour, edit the guide it belongs to, such as [driving-unity-editor.md](../driving-unity-editor.md), [unity-version-control.md](../unity-version-control.md) or an ADR. Then end the entry with `→ <file>`.
2. **Archive:** once `log.md` grows past about 40 entries, move the promoted ones (oldest first) to `archive/YYYY-MM.md`, keeping their text unchanged. Entries that weren't promoted stay in `log.md`.
3. Only the archive step edits existing lines. Otherwise, change nothing but the top of the file. If an entry turns out wrong, add a new entry that corrects it (`kind: error`, "entry from <date> was wrong: …").
