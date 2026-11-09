# Web shell, git and GitHub

Everything outside the Unity folder is in git, on GitHub at `deadronos/Vibe-Space-Mining-Fleet`. The page itself is described in [../web-shell.md](../web-shell.md).

## Toolchain

| Tool | Version | Notes |
| --- | --- | --- |
| pnpm | 12.15 (`packageManager` field) | Use pnpm, not npm or yarn |
| Node | 24 | CI uses 24 too |
| TypeScript | 7 (native `tsc`) | `strict`, `resolveJsonModule`, no emit; Vite does the bundling |
| Vite | 8 | `base: './'` so the site works under `/Vibe-Space-Mining-Fleet/` on Pages |
| oxlint | 1.92, `--type-aware` (oxlint-tsgolint) | `--deny-warnings`: a warning fails CI |
| oxfmt | 0.77 | the formatter; don't add Prettier or ESLint |

```sh
pnpm install
pnpm dev             # http://localhost:5173/, serves web/public/unity as-is
pnpm run check       # lint + format:check + typecheck; must pass before you say done
pnpm run format      # fix formatting
pnpm run build       # tsc + vite build → dist/
```

## Code rules

- `web/src/protocol.ts` mirrors the C# payload classes in `WebBridge.cs`. Type names match the C# class names (`BridgeState`, `BridgeCommand`…). Change both together: [cross-boundary-changes.md](cross-boundary-changes.md).
- Listen to Unity events with `on`/`once` from `bridge.ts`, and send to Unity through the `Bridge` class. Don't call `SendMessage` directly anywhere else.
- No runtime dependencies. Add a dev dependency only when the user asks for it.
- The app version comes from `package.json` through `import.meta.env.APP_VERSION`.

## git

- Branch from `main`: `feature/<issue>-<slug>`, for example `feature/31-fleetsim-editmode-tests`.
- Commit messages are imperative and say what changed. Mention the issue (`(#31)`), and use `Closes #n` in the PR body when the PR finishes the issue.
- `web/public/unity/` is committed build output. Commit a new build only together with the Unity change that produced it, and say so in the message.
- Don't commit `dist/`, `node_modules/` or anything from `Vibe-Space-Mining-Fleet/`.
- Use `gh` for issues and PRs.

## CI and deploy

- `.github/workflows/ci.yml` runs on pushes to main, on PRs, and when deploy calls it. It runs install (frozen lockfile), lint, format check, a check that the Unity build is present, and the build.
- `.github/workflows/deploy.yml` runs on a `v*` tag or by hand. It reruns CI, checks the tag equals `v` + the `package.json` version, builds, deploys `dist/` to Pages, and then polls the live page until it serves that version (`scripts/verify-deploy.sh`).
- Actions has no Unity license. The Unity player is always built locally and committed.

## Release (only when the user asks)

Versions: a minor bump for a feature (`0.11.0`), a patch bump for a fix (`0.11.1`).

1. **Unity side is settled.** `cm status` shows nothing pending that belongs in the release, and the work is merged to `/main` ([unity-version-control.md](unity-version-control.md)).
2. **Build the player** and compare its size with the last build ([unity-web-build.md](unity-web-build.md)). Check it in a browser.
3. **Get the work onto `main`.** A feature goes through a PR from `feature/<issue>-<slug>` with the TypeScript, `web/public/unity`, and the issue notes (`Closes #n`); merge it when CI is green. A small fix can be committed to `main` directly.
4. **Release commit.** Bump `version` in `package.json`, commit as `Release v<version>` with nothing else in it, and push `main`.
5. **Tag.** `git tag v<version> && git push origin v<version>`. The deploy workflow refuses a tag that doesn't match `package.json`.
6. **GitHub release.** `gh release create v<version> --title v<version> --notes-file <file>`. Write the notes for players, not developers:
   - one bullet per change, starting with a bold label (`**Offline progress.**`, `**Fix:**`);
   - say what the player sees or can do, with the numbers that matter to them;
   - say what happens to saves (`**Saves** are unchanged.`);
   - no file names, changesets or issue numbers. Only state what was checked.
7. **Wait for the deploy.** Find the run with `gh run list --workflow deploy.yml --limit 1`, then `gh run watch <id> --exit-status` in the background. Its last step is the smoke check below.
8. **Check the live site** at https://deadronos.github.io/Vibe-Space-Mining-Fleet/: the served `assets/index-*.js` contains the new version, `unity/Build/*` carries a new `last-modified` and the committed files' sizes (`curl -sI`), and the game starts.

### The smoke check, and when it fails

The deploy job ends with `scripts/verify-deploy.sh` (GitHub #34). The page carries `<meta name="version">` from `package.json`; the script polls the live URL every 15 s for up to 5 minutes until it serves that version and this build's `assets/index-*.js`, and fails the job if it doesn't. Run it by hand with `scripts/verify-deploy.sh https://deadronos.github.io/Vibe-Space-Mining-Fleet/ dist` after a local `pnpm run build` (`TIMEOUT` and `INTERVAL` are in seconds).

If it fails (the v0.3.0 deploy reported success while Pages kept serving the old page), rerun the workflow from `main`: `gh workflow run deploy.yml --ref main`. A deploy of the same version with the same script hash can't be told from the old one; bump the version if you need to be sure.
