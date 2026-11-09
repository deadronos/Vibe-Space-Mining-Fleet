# Unity Version Control (UVCS)

The Unity project `Vibe-Space-Mining-Fleet/` is versioned in UVCS (Plastic SCM), not in git.

| | |
| --- | --- |
| Repository | `Vibe-Space-Mining-Fleet/Vibe-Space-Mining-Fleet@iridanblub@unity` |
| Workspace | the project folder itself (it has a `.plastic/` folder) |
| Main branch | `/main` |
| Ignore list | `Vibe-Space-Mining-Fleet/ignore.conf` (Library, Temp, Logs, UserSettings, csproj/sln…) |

Run `cm` through the Unity CLI, from inside the project folder:

```zsh
U=~/.unity/bin/unity   # standalone CLI, see driving-unity-editor.md
cd "$HOME/Github/Vibe-Space-Mining-Fleet/Vibe-Space-Mining-Fleet"
"$U" cm wi              # which branch and changeset the workspace is on
"$U" cm status          # pending changes
```

## Branches

One branch per GitHub issue, under `/main`, named after it: `/main/feature-31-fleetsim-tests`, `/main/phase2-rts-controls`.

```zsh
"$U" cm branch create /main/feature-<n>-<slug> -c="GitHub #<n>: <title>"
"$U" cm switch /main/feature-<n>-<slug>
```

- `cm branch create` takes `-c="…"` for the comment. `--commentary` does not exist.
- Before you switch, check `cm status`. Switching with pending changes can carry them to the other branch, or block the switch.

## Check-in: the trap

**`cm ci` with a directory and no `--applychanged` checks in only *added* files. Changes to existing files are silently left out.** This has happened here. Check-ins also drift from their notes: the notes for cs:13 list a `Packages/manifest.json` change that the changeset doesn't contain, and the changeset does contain a stray `Screenshots/phase1.png`. Always compare `cm diff` against what you say you checked in.

Do it like this:

```zsh
"$U" cm status                                   # 1. see everything pending
"$U" cm add <new files and folders, with their .meta>   # if status lists them as private
"$U" cm ci <explicit paths> --applychanged -c="GitHub #<n>: <what changed>"
"$U" cm diff cs:<new>                           # 2. verify what actually went in (A/C/D + path)
"$U" cm status                                   # 3. nothing you meant to check in is left
```

- Name the paths explicitly. Don't check in the whole workspace blindly: files such as `Screenshots/*.png` or an Editor-generated `ProjectAuditorSettings.asset` may be pending, and they don't belong in a feature changeset.
- Every new asset needs its `.meta` file in the same changeset.
- Write the comment like a commit message, and put the GitHub issue number in it.

## Merge to /main

```zsh
"$U" cm switch /main
"$U" cm merge br:/main/feature-<n>-<slug> --merge   # applies the merge to the workspace only
"$U" cm ci --all -c="Merge GitHub #<n>: <title>"     # creates the merge changeset
"$U" cm diff cs:<merge changeset>     # check the merge contains every file from the branch
```

Name the leftover paths explicitly in each command. In zsh, a variable such as `$L="a b"` is not split into words, so `cm shelveset create $L` shelves nothing and the switch then stops at its prompt.

If files are pending (leftovers you're not checking in), `cm switch` asks whether to shelve, bring or cancel: `echo b | "$U" cm switch /main` brings them along. `cm merge` refuses outright. Shelve them (`cm shelveset create <paths> -c="…"`, which prints `sh:<n>`), `cm undo <paths>`, merge and check in, then `cm shelveset apply sh:<n>` to put them back. Never undo pending changes without shelving them first.

Merge only when the user asks. After the merge, the GitHub side (issue notes, a new web build in `web/public/unity`) is a separate git commit. See [cross-boundary-changes.md](cross-boundary-changes.md).

## Don'ts

- Don't create new repositories or workspaces (`unity vcs setup` on an existing workspace once created an orphan repository that had to be deleted).
- Don't delete branches, repositories or changesets without the user's yes.
- Don't put the Unity project in git, and don't put `web/` or `documentation/` in UVCS.
