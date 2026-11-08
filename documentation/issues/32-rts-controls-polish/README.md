# #32 RTS controls polish (and #34 deploy smoke check)

- Issues: [#32](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/32), [#34](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/34)
- UVCS: branch `/main/feature-32-rts-controls-polish`, changeset **cs:18** (verified with `cm diff cs:18`: nine changed files, all under `Assets/_Game`); merged to `/main` as **cs:19**
- git: branch `feature/32-34-rts-controls-and-smoke-check`
- Decision: [ADR 0007](../../agents/decisions/0007-stop-hold-and-escape.md) (answers part of #8, which stays open)

## What changed (#32, Unity)

- **S = Stop, H = Hold** on drones, barges and haulers (and the carrier's waypoints). New `FleetCommandKind.Stop` / `Hold` go through the sim; `SimDrone.Held` and `SimHauler.Held` stop a unit in place with no automation until its next order, Stop or A.
- **Save format:** `held` added to `DroneSave` and `HaulerSave`. `SimSave.CurrentVersion` stays 2 because a save without the field loads as "not held" (tested). No bump needed.
- **Escape is layered:** `SelectionController` cancels a box drag, then `OrderController.CancelActive()` (move mode, pending right-click), and clears the selection only if neither was active. Before, Esc during a box drag cleared the selection and the box still applied on release.
- **Hover:** a white ring around the unit, rock or carrier under the pointer, and a small label beside the pointer (Mine / Unload / Dock / Move, "(queue)" with Shift). Both come from `OrderController.ResolveContext`, the same function the right-click uses, so the hint can't disagree with the click. Hidden over HUD panels (`BlocksPointer`), while boxing, orbiting or in move mode.
- **Selection list:** every unit (and the carrier) is a row; clicking it selects just that unit.
- Controls help text lists S and H.
- Clickable hotbar: already done in #11 (ADR 0006), not touched.

## #34 (web side, git)

`<meta name="version">` from `package.json` (a small Vite plugin in `vite.config.ts`), and `scripts/verify-deploy.sh`, run as the last step of the deploy job: polls the live URL every 15 s for up to 5 min until it serves that version **and** this build's `assets/index-*.js` hash, else fails the job. Manual rerun fallback is in [web-shell.md](../../web-shell.md).

## Verification

- EditMode: **28 / 28 passed** (17 before; 11 new tests: stop, hold, new order ends hold, stop/resume end a hold, hangar ignored, recall ends hold, hauler hold, barge/hauler queues, save/load with hold running identically, save without `held` loads).
- `pnpm run check` and `pnpm run build` pass. `verify-deploy.sh`: exits 0 against a local server of `dist/`; exits 1 with the rerun hint against the live site (which has no version meta yet).
- Web build rebuilt (10.2 MB, 0 errors) and driven in the built-in browser with real mouse/key input: selecting a hauler, hover ring and "Move" hint, H shows "holding" and S returns it to "idle", M then Esc keeps the selection and a second Esc clears it, the hint and ring disappear over the selection panel. No console errors.

## Not verified

- The deploy workflow itself has not run (needs a tag or a push to GitHub). The version check only proves the page is current for a changed version or script hash.
- Browser: box-drag cancel with Esc, the Mine / Dock / Unload hints, clicking a row in a multi-unit list, and S/H on drones and barges. Synthetic drags land press and release in one frame, so no box drag could be made; later clicks missed because units drifted. These paths are covered by sim tests (drones, barges, haulers) but not by eye.
- Safari and Firefox untested.
- A held drone full of ore stays full; Stop or A sends it home.
