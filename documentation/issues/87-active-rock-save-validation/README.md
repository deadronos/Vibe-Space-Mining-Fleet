# Save recovery and active asteroid validation

[Browser save recovery #86](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/86) · [Active asteroid validation #87](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/87)

The browser distinguishes a missing save, unavailable storage, and a stored payload it cannot load. For rejected payloads, the game menu offers a download of the original text, import of another save, and explicit replacement with the current game. Autosave and Save now respect recovery. Export downloads the current game independently of browser storage. Before replacing a slot, the page compares its contents with the last value it read or wrote.

Unity applies the same positive, finite full-scale and ore-capacity checks to saved rocks in the active and inactive fields. It rejects malformed active rocks before changing the running fleet. The save format remains version 11 and supports versions 2 through 11.

Unity changes were checked in as `cs:79` on `/main/feature-87-save-validation` and merged to `/main` as `cs:80`. The rebuilt player is in `web/public/unity/`.

## Verification

- Unity compiled and passed 262 EditMode tests, including JSON null and zero-valued asteroid records, preservation of the running simulation after rejection, and depleted rocks in current and version-2 saves.
- All six web tests passed, along with the web build.
- Chrome WebGPU preserved the exact rejected payload through the 30-second autosave, simulated tab-hide and page-exit events, and a real reload. It downloaded the original, preserved it on cancel, and allowed explicit replacement. The rebuilt player rejected a null active rock and exported a valid live rock. A version-2 import continued after reload, and the current game could still be exported with browser writes blocked.
