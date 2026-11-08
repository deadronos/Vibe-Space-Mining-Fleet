# 0003: Vite + TypeScript page around the Unity build; deploy on tags

- **Status:** Accepted
- **Date:** 2026-11-08
- **Issue:** #3 (full-window canvas), #4 (TypeScript ↔ Unity bridge)
- **Decided by:** the user ("TypeScript 7, oxlint, oxfmt, Vite… deploy on tagging v*")

## Context

Unity's template page was fixed-size and couldn't reach the game. We wanted a responsive full-window canvas, saves and export/import handled by the page, and a typed channel to the game.

## Decision

- `web/` is a Vite 8 + TypeScript 7 page. It owns the canvas, the loading screen, the toolbar and saves. It loads the Unity player from `web/public/unity` with Unity's loader and `matchWebGLToCanvasSize`, with DPR capped at 1.5.
- The bridge is `SendMessage("WebBridge", …)` from the page to Unity, and `spacemining:<type>` window events from Unity to the page, through a jslib. Types in `protocol.ts` mirror the C# classes by name.
- Saves are kept in localStorage, with autosave and save on hide. The page passes the save JSON through without interpreting it, beyond a few header fields.
- Lint with oxlint (type-aware, warnings are errors); format with oxfmt; use pnpm. No runtime dependencies.
- CI runs on every push and PR. GitHub Pages deploys from Actions only on a `v*` tag that matches `package.json`.

## Consequences

- Unity's `index.html` and `TemplateData` are deleted after every build.
- Pushing to `main` doesn't change the live site. A release is a deliberate tag.
- The HUD question (in-canvas uGUI or HTML overlay) stays open in #13. This shell makes an HTML overlay possible.
