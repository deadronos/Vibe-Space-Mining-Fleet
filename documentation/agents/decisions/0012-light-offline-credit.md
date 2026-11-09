# 0012: Light offline credit on load

- **Status:** Accepted
- **Date:** 2026-11-09
- **Issue:** #7
- **Decided by:** the user

## Context

asteroid-fleet settles time away from timestamps at 50 % of recent mining
income, rolls no pirate waves offline and keeps rebuilding reserves. The page
already autosaves the whole sim with `savedAt`, so settlement is technically
easy. This game is an RTS with direct orders and a deterministic fixed-tick sim
(ADR 0001), so running the world while the player is away would take control
out of their hands.

## Options

1. **No:** the game pauses when the page is closed.
2. **Light credit:** credit some ore for time away; nothing else changes.
3. **asteroid-fleet model:** a background model runs over the time away with
   reduced risk.

## Decision

Credit a share of recent mining income for time away, and change nothing else.
On load the page passes the elapsed time since `savedAt`; the sim credits ore
as a pure function of the save and that number, without advancing the sim
clock. Ships don't move, pirate waves don't roll, heat, build queues and field
depletion don't change. A log entry and a toast report the credit. The exact
rules (rate, minimum, cap, clock skew) are in #58; the starting proposal is
50 % of the recent income rate, ignored under 60 s and capped at 8 h.

## Consequences

- Closing the tab is never punished and never plays the game for you.
- Determinism holds: the same save and elapsed time give the same credit.
- The save needs the recent income rate it was taken at.
- Revisit if players want progress beyond ore, such as build queues finishing.
