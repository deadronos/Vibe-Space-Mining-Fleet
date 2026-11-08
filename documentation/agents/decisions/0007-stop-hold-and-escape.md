# 0007: Stop, Hold and layered Escape

- **Status:** Accepted
- **Date:** 2026-11-08
- **Issue:** #32 (answers part of #8, which stays open)
- **Decided by:** the user

## Context

Units fall back to automation when their order queue is empty. Players needed a way to cancel orders, and a way to park a unit and keep automation from sending it off again. Escape also did two jobs without a clear rule.

## Options

For Stop and Hold, the user chose from two readings of "stop": back to automation, or stay put. Both are useful, so both exist.

## Decision

| Key | Name | Effect on the selection |
| --- | --- | --- |
| **S** | Stop | Clears the order queue. The unit returns to automation right away. |
| **H** | Hold | Clears the queue and keeps the unit where it is. No automation until its next order, **S** or **A**. |
| **A** | Resume (existing) | Clears the queue and any hold; back to automation. |

- Both work on drones, barges and haulers. The carrier's waypoint queue is cleared too (it has no automation).
- They go through the sim as commands (`FleetCommandKind.Stop`, `Hold`), so they are deterministic and replayable.
- **Stop and A do the same thing today.** S is the RTS convention, so players find it; A stays for the HUD's "All auto" button and for existing habits. They may diverge later (for example if Stop learns to keep a stance).
- **Hold:**
  - Drones brake to a halt where they are, release their rock claim, and do nothing else. A hold does not touch a drone in the hangar, or one that is launching, docking or unloading; those finish first.
  - Haulers brake to a halt, drop their job and keep their cargo.
  - Barges have no automation (they already hold station when idle), so Hold equals Stop for them.
  - Any new order, queued or not, ends a hold. Recall (R) also ends it and brings the drone home.
- **Save format:** `held` is a new field on `DroneSave` and `HaulerSave`. `SimSave.CurrentVersion` stays at 2: a save without the field loads as "not held", so existing saves keep working. A test checks this.
- **Escape is layered.** One press cancels the innermost active thing: a move mode, a box drag, or a pending right-click. Only when none of those is active does it clear the selection. `SelectionController` decides, asking `OrderController.CancelActive()` and its own box drag, so the order is the same on every frame.
- **Keys:** S and H are ignored while Ctrl, Cmd or Alt are held, so browser shortcuts such as Cmd+S are unaffected. No other binding used S or H.

## Consequences

- #8's question "is there a hold position / stop order, and does it count as an order?" is answered: Stop is not an order (it ends them); Hold is a state that lasts until the next order. Whether miners take direct orders at all, how combat ships behave, and how stances (#20) and rule cards (#19) rank against a direct order are still open.
- Stances (#20) will have to say what a held unit does when a stance changes: today a held unit ignores everything until the player acts.
- A held drone full of ore stays full. That is the player's choice; Stop or A sends it home.
