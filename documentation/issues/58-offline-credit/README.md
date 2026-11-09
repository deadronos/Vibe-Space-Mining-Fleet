# Offline progress: light ore credit on load

[GitHub issue #58](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/58). Follows [ADR 0012](../../agents/decisions/0012-light-offline-credit.md).

- **UVCS branch:** `/main/feature-58-offline-credit`, from cs:43. Changeset: cs:44, merged to `/main` as cs:45.
- **Git branch:** `feature/58-offline-credit`. It holds these notes, the TypeScript and the web build.

## What changed

**Rules, as proposed in the issue.** When the page continues from its stored save, the player gets refined ore for the time away:

- credit = 50 % × the income rate in the save (`refinedRate`, the HUD's "+N t/s") × seconds away;
- under 60 s away earns nothing; time beyond 8 h earns nothing more;
- a clock that went backwards, an unreadable `savedAt` or a save with no income earns nothing;
- nothing else changes: the sim clock, ships, waves, heat, the build queue and the rocks stay as saved. `RefinedTotal` and the income rate don't count the credit.

Refined ore has no storage limit today, so there is nothing to cap the credit against.

**C# (UVCS).**

- `Sim/FleetSim.Offline.cs` (new): `FleetSim.SettleOffline(float elapsedSeconds)` and the constants `OfflineMinSeconds`, `OfflineMaxSeconds`, `OfflineShare`. A pure function of the loaded state and the number passed in. Returns the ore credited.
- `Sim/SimTypes.cs`: `SimEventKind.OfflineCredit` (Index = seconds credited, Amount = ore).
- `FleetSimRunner.SettleOffline`: holds the seconds until the start of the next frame, after the per-frame `Events.Clear()`, so the HUD and the bridge see the event. A later `Load` drops a settlement that hasn't run.
- `Web/WebBridge.SettleOffline(string seconds)`: the page's entry point.
- `FleetNotice`: the log line "While you were away: +N ore over H h M m" (info, no banner).
- `Tests/EditMode/OfflineCreditTests.cs` (new): 12 test cases.

**TypeScript (git).**

- `bridge.ts`: `Bridge.settleOffline(seconds)`.
- `main.ts`: after a successful load of the stored save, sends the seconds since `savedAt`. Shows a toast when an `OfflineCredit` event arrives.
- `protocol.ts`: a comment on `FleetNotice.kind`.

**Save format:** unchanged (version 6). `refinedRate` and `savedAt` were already in the save, so version 2 to 6 saves all settle.

**Importing a save file does not settle.** The age of an exported file says nothing about time away, and it would pay 8 h for any old export. Only the page's own stored save is settled.

## Verification

- EditMode tests: 119 of 119 passed (107 existing, 12 new). The new tests were run first against a stub that credited nothing: 6 failed on their assertions, then passed with the implementation. They cover the 50 % rate, the 60 s minimum (59.9 s and exactly 60 s), the 8 h cap, negative and NaN elapsed, no income, "only refined ore changes" (compared with an unsettled copy of the same save), the event's contents, and the same save and elapsed through JSON giving the same credit.
- `pnpm run check` passed.
- Web build: Succeeded, 10.2 MB, errors=0 (the previous build was also 10.2 MB).
- Browser, built-in pane, WebGPU, `pnpm dev`:
  - a version 6 save taken 2 h 47 m earlier (10,021 s, rate 10.99 t/s, 28,183 t refined) loaded with the event "While you were away: +55,049 ore over 2 h 47 m" (0.5 × 10.987 × 10,021 = 55,049). The HUD showed 83,410 t a few seconds later; sim time stayed at 32:02.
  - the page showed "Continued from save…" and then the credit toast; the HUD event log showed one row with the same text.
  - reloading straight away (save under 1 s old) gave no event and no credit toast.

Not checked in a browser: the forced WebGL2 path, and a save more than 8 h old (the cap is covered by the EditMode test only).

## Open points

- **cs:43 came first.** Before this work, `/main` had a pending merge from cs:42 (`/main/feature-56-research-tree`, comment "checkin", made after the #56 merge). The user chose to keep it, and it was checked in as cs:43. Against cs:41 it adds the package `com.unity.project-auditor-rules`, sets `runInBackground: 0` and drops the `_EMISSION` keyword from `Ore.mat`; it also replaces `PirateGlow.mat`, `packages-lock.json` and `Data/Plugins/lib_burst_generated.wasm`. The web build in this branch was made from cs:43 plus the cs:44 files, so it is the first build with those changes. Their effect in the player was not checked separately.
- **Balance.** The credit is paid in refined ore at once. A full 8 h at 11 t/s is about 158,000 t, against 250 t for a drone and 2,000 t for a barge. The rate and the cap are constants in `FleetSim.Offline.cs`.
- The credit toast replaces the "Continued from save" toast within a frame or two, so the first one is rarely read.
