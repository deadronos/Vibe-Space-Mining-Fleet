# 0015: Touch controls with a context tap

- **Status:** Accepted
- **Date:** 2026-11-10
- **Issue:** #41
- **Decided by:** the project owner, from two options laid out in chat (context tap or an order-mode toggle)

## Context

Every control assumed a mouse and keyboard: right-click orders, right-drag orbits, the wheel zooms, Shift queues, keys switch modes. On a phone the game ran but the 3D view ignored touches.

Measured in the web player (Unity 6000.6.8, Input System 1.20.1, Chrome, synthetic touch events on the canvas):

- a touch arrives as a `Touchscreen` device; the player's `Mouse` does not move;
- UI Toolkit reads the touchscreen itself, so HUD buttons already worked with taps;
- a tap must not be read twice if a browser also sends compatibility mouse events.

The open question was what a tap on the 3D view means while ships are selected: select something, or order the selection.

## Options

1. **Context tap.** With ships selected, a tap on a target or on empty space orders them, exactly as a desktop right-click there would. A tap on one of your own ships that isn't a target selects it. A Deselect button clears the selection. One tap per order; a stray tap on empty space can move ships.
2. **Order-mode toggle.** Taps always select; an Order button arms the next tap as an order. A stray tap can never send ships anywhere, but every order takes two taps.

## Decision

Option 1, the context tap. The gestures:

| Gesture | Effect | Desktop equivalent |
| --- | --- | --- |
| Tap, nothing selected | Select the ship (or the carrier) under the finger | Left-click |
| Tap, ships selected, on a target or space | Order: mine, dock, unload, attack, escort, move | Right-click |
| Tap, ships selected, on one of your ships that isn't a target | Select that ship instead | Left-click |
| Double tap a ship | Every ship of that kind on screen | Double-click |
| Long press (0.45 s) before lifting | Queue the order, or add to the selection | Shift |
| One-finger drag on empty space | Box select | Left-drag |
| Two-finger drag | Orbit | Right-drag |
| Pinch | Zoom (far enough opens sensors, as the wheel does) | Wheel |
| Long press a group slot | Save the selection to the group | Shift+click |
| Move mode: drag, lift | Aim the move widget, confirm on lift | Mouse, click |

Which targets count is decided by `OrderController.ResolveContext`, the same as for a right-click: for drones, a barge is a target (unload); for barges and haulers alone, it is not, so the tap selects it.

While ships can't take orders (the warp drive charging), a tap that would order does nothing; the HUD says why.

On touch, a fingertip counts as about 24 CSS px: picks of ships, raiders and rocks use at least that radius, and a tap near a rock counts as on it.

The command bar adds touch-only buttons: **Deselect** (Esc), **Up** and **Down** in move mode (Alt+mouse), and **Carrier** (F). The HUD switches to touch wording and bigger targets once a touch is seen, or on a phone or tablet browser.

Touch gestures live in `Scripts/Rts/TouchInput.cs`. Mouse handling stands aside while touch is in use (a finger is down, was within 0.8 s, or the mouse hasn't moved since).

## Consequences

- One tap per order, the same rules as the desktop right-click, and no extra mode to explain.
- A stray tap on empty space moves the selection. Deselect, or a tap on one of your ships, is the way out.
- Altitude in move mode is a step per tap on Up or Down, not a drag. A drag gesture for it is a possible follow-up.
- Hover hints don't exist on touch; the order a tap gave shows briefly at the tap point instead.
- Revisit if play on real phones shows many accidental orders: option 2 can be added as a setting without changing the gestures above.
