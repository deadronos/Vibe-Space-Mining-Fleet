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
- `.github/workflows/deploy.yml` runs on a `v*` tag or by hand. It reruns CI, checks the tag equals `v` + the `package.json` version, builds, and deploys `dist/` to Pages.
- Actions has no Unity license. The Unity player is always built locally and committed.

## Release (only when the user asks)

1. Build the Unity player and commit `web/public/unity` ([unity-web-build.md](unity-web-build.md)).
2. Bump `version` in `package.json`, then commit and push to `main`.
3. Tag the release: `git tag v<version> && git push origin v<version>`.
4. Check the live site at https://deadronos.github.io/Vibe-Space-Mining-Fleet/: the `assets/index-*.js` name in the served `index.html` should match your local `dist/`, and `unity/Build/*` should carry a new `last-modified` (`curl -sI`). A tag deploy once reported success while Pages kept serving the old build, and rerunning the workflow from `main` fixed it (issue #34 adds a check for this).
