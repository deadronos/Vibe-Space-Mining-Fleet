# 0006: Control groups: Shift+1–0 assigns, 1–0 recalls

- **Status:** Accepted
- **Date:** 2026-11-08
- **Issue:** #11
- **Decided by:** the user

## Context

Ctrl+1–0 assigned a control group. Chrome on Windows and Linux keeps Ctrl+1–9 for switching tabs, and a page can't intercept it, so control groups didn't work there.

## Options

1. **Shift+1–0 assigns**, 1–0 recalls. This is common in browser RTS games.
2. **SC2 style:** Ctrl assigns, Shift adds. Assigning would still be broken in Chrome on Windows and Linux.
3. **Platform-dependent:** Cmd on macOS, Shift elsewhere.
4. **Alt assigns.** This clashes with menus on Windows and with tab switching in Firefox on Linux.

## Decision

- **Shift+1–0** assigns the selection to a group on every platform. **Ctrl/Cmd+1–0** also assigns, wherever the browser lets the key through.
- **1–0** recalls a group. Pressing it twice centres the camera on the group.
- The HUD has a 10-slot **group bar**. Clicking a slot recalls the group; Shift-clicking (or Ctrl/Cmd-clicking) assigns. A slot shows what is in the group, such as `C 1B 5D` (carrier, barges, haulers, drones).
- A group can hold drones, barges, haulers and the carrier. Loading a save clears all groups, because unit indices may change.

## Consequences

- Shift+digit can't later mean "add to group" (SC2 style). If that's ever wanted, use the group bar instead.
- Shift is also the queue and add-to-selection modifier for clicks. Digit keys don't otherwise use it, so there's no clash.
