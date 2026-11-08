# Cargo heat and fleet events

[Cargo heat #21](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/21) ·
[Event log #27](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/27)

Git branch `feature/21-27-cargo-heat-event-log` and UVCS branch
`/main/feature-21-27-cargo-heat-event-log` carry the two changes together.
Unity changeset `cs:22` was merged to `/main` as `cs:23`.

- Raw ore in the carrier counts at half weight until refined. Field cargo
  keeps its full weight. The heat meter, wave size and wave interval use the
  weighted total. This updates the heat rule in
  [ADR 0008](../../agents/decisions/0008-pirate-waves-and-carrier-loss.md).
- `CombatSettings.waveWarningHeatReduction` sets how many seconds to subtract
  at full heat. Its default is zero, so the warning stays at 30 seconds. When
  configured, the reduction scales with heat and stops at zero seconds.
- The HUD starts with the Events panel collapsed. Opening it clears the unread
  count. It holds the latest 24 entries, newest first, and clicking an entry
  focuses the camera on its recorded position. The history resets on save load.
- The log records incoming, arrived and cleared waves, friendly ship losses,
  carrier retreats, full barges and depleted asteroids. Combat banners still
  announce urgent events. Each entry is also published to the page as
  `spacemining:event` with its kind, severity, message, world position and sim time.
  Warp events can be added when warp exists.

Unity compiled successfully and all 52 EditMode tests passed. The two new tests
cover half-weight carrier ore and the default and configured warning durations.
`pnpm run check` passed.

The web build succeeded at 10.2 MB with zero build errors. In Chrome on
WebGPU, a test save produced a full-barge warning and a 30-second raid
alert. Both appeared in the event log and on the web bridge. Opening and
closing the panel cleared the unread count, and clicking the raid entry
centered its marker. Importing another save reset the log, and a barge
destroyed by a raider added one unread alert and displayed its banner.
