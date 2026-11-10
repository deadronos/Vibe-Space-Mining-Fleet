# Touch input and a phone layout

[GitHub issue #41](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/41). The gesture scheme is [ADR 0015](../../agents/decisions/0015-touch-context-tap.md) (context tap).

- **UVCS branch:** `/main/feature-41-touch-input`, from cs:53. Changeset: cs:54, merged to `/main` as cs:55.
- **Git branch:** `feature/41-touch-input`, merged to `main` by PR #69 (6e9d4ad). It holds these notes, ADR 0015, the page changes and the web build.

## What arrives today

Measured in the web player before any change (v0.12.1, Chrome, the built-in browser pane at 844 x 390 CSS px, synthetic `TouchEvent`s on the canvas):

- A tap on a HUD button worked: the Build panel opened. UI Toolkit reads the `Touchscreen` itself.
- A tap on a ship selected nothing: the game read only `Mouse.current`, and a touch didn't move it.
- No DOM mouse or pointer events followed the synthetic touches. Real browsers may send compatibility mouse events after a tap, so the game guards against reading a tap twice.
- The HUD scaled its 1920 x 1080 design to about 40 %: 17-unit text came out near 7 CSS px. See `before-phone.jpg`.

Not measured: a real Android or iOS device. Real touches, Safari, the fullscreen request and the orientation lock are untested.

## What changed

**C# (UVCS).**

- `Scripts/Rts/TouchInput.cs` (new): a static gesture reader. Updated once per frame on first use, so no scene or prefab changes. Reports tap, long press (0.45 s), one-finger box, two-finger orbit delta and pinch factor. A touch that starts on the HUD is the HUD's. After a two-finger gesture nothing is reported until every finger is up. `Recent` tells mouse code to stand aside (a finger down, within 0.8 s of one, or the mouse hasn't moved since). `PickRadiusPx` widens picks to at least 24 CSS px on touch.
- `SelectionController`: `HandleTouch` (box select, tap: order first, else select). `Escape()` holds Esc's layered behaviour so the Deselect button can use it. The mouse path is skipped while touch is in use. Pick radii go through `TouchInput.PickRadiusPx`.
- `OrderController`: works without a keyboard or a mouse (it returned early before). `TapOrder` is the context tap. `TouchMoveMode`: the widget follows the finger and confirms on lift. `NudgeAltitude` for Up and Down. A tap near a rock counts as on it while touch is in use. The widget drawing moved into `PlaceWidget`, shared by mouse and touch.
- `FleetCamera`: two-finger orbit (half the mouse rate per pixel) and pinch zoom. Zoom is shared with the wheel in `Zoom()`, including opening and closing the sensors view. `ReturnToCarrier()` for the Carrier button.
- `UI/HudController.Layout.cs` (new): root classes `hud--touch`, `hud--compact`, `hud--move`, `hud--manager`. On a screen under 1000 x 600 CSS px it swaps in a copy of the panel settings at 0.72 CSS px per unit (the asset on disk is not changed), and folds the ore chain and the event log at first. Wires the touch-only buttons.
- `UI/Hud.uxml`: touch-only buttons Up, Down, Deselect (unit commands) and Carrier (fleet commands).
- `UI/Hud.uss`: touch rules (60-unit targets, 48 to 54 on a phone), and the compact layout. Also: the strip and rail clear the page's gear button, the event log moves under the rail, and the selection panel hides while the ore chain is open.
- `HudController`: group slots assign on a long press by touch. The command bar, the selection panel, the survey button and the pointer label use touch wording. On touch, the order a tap gave shows at the tap point for 0.9 s, and "Queue" shows while a held finger has become a long press. The selection list shows three rows in the compact layout. Closing the sensors view keeps the ore chain folded in the compact layout.

**TypeScript and page (git).**

- `main.ts`: on a coarse pointer, the first touch on the game requests fullscreen (`navigationUI: 'hide'`), then a landscape lock where the browser offers one. Both may be refused; nothing depends on them.
- `index.html`, `styles.css`: a small "Turn your device sideways" hint, shown only for a coarse pointer in portrait.

Save format: unchanged.

## Verification

- `scripts/unity-check.sh`: compiled, EditMode 149 of 149 passed (no new tests: `TouchInput`, the controllers and the HUD are outside the test assembly).
- `pnpm run check` passed.
- Web build: Succeeded, 10.3 MB, errors=0 (v0.12.1 was also 10.3 MB).
- Browser, built-in pane, WebGPU, `pnpm dev --port 5199`, viewport 844 x 390, synthetic touch events:
  - The compact layout: readable text, the ore chain and event log folded, nothing over the gear button. The touch layout appears after the first touch: bigger buttons, the Carrier button, touch hints. See `touch-squadron.jpg`.
  - One-finger drag box-selected 2, 3, 6 and 9 ships in different runs.
  - Context tap on space with a squadron and a barge selected: both "moving", path lines, "Move" at the tap point, selection kept.
  - Context tap on the carrier (sensors view) with drones and a squadron selected: "Dock", the squadron "returning to repair".
  - Context tap on a rock (sensors view) with a drone selected: "Mine", the drone "to rock [1 order]". See `touch-sensors-mine.jpg`.
  - Pinch out zoomed in; a two-finger drag orbited the camera and kept the selection, with no stray tap or order.
  - Long press on group slot 1 saved the squadron ("1S"); Deselect cleared the selection; a tap on slot 1 recalled it.
  - Move mode by touch: Move, Up twice, drag and lift: the squadron "moving", move mode closed. See `touch-move-mode.jpg`.
  - HUD buttons by touch: Build, Sensors, Launch, Deselect.
- Desktop, 1280 x 800 CSS px, mouse: the layout is the old one, no touch buttons; box select (3 ships) and right-click move with the "Move" hover label still work. In a window under 1000 CSS px wide, the compact layout applies with mouse wording.

Not checked: unloading at a barge by tap (the barge kept moving away under attack between screenshot and tap; it takes the same pick-and-order path as dock and escort); the altitude change itself (only that Up and Down are there and move mode confirms); the WebGL2 path; real devices.

## Open points

- **Real devices.** Everything above used synthetic touches in desktop Chrome. Test on an Android phone in Chrome (and iOS Safari if available): compatibility mouse events, fullscreen, the orientation lock, frame rate and heat at 10 and 50+ drones (also #33).
- **Portrait.** Only a hint. A portrait layout would be its own issue.
- **Altitude by gesture.** Up and Down step 6 % of the camera distance per tap. A vertical drag might feel better.
- **Hit targets.** On a phone the command buttons are about 39 CSS px tall (54 units at 0.72), a little under the 44 px the issue asked for, to leave the view open. Raise `.hud--compact.hud--touch .command-button` if real play needs it.
- **Accidental orders.** If a stray tap often moves ships, ADR 0015 suggests adding the order-mode toggle as a setting.
