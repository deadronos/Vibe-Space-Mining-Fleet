# 0004: Gzip with Decompression Fallback on GitHub Pages

- **Status:** Accepted
- **Date:** 2026-11-08
- **Issue:** none (web build setup). Revisit together with #12 and #30.
- **Decided by:** the user, after the coi-serviceworker discussion

## Context

GitHub Pages can't set custom headers. It gzips `text/html` and `application/javascript` itself, but it serves `.unityweb` files as `application/vnd.unity` with no `Content-Encoding`. So the browser can't unpack precompressed Unity files natively.

## Options

1. **Gzip + Decompression Fallback** (current): Unity's loader unpacks the files in JavaScript. Fast enough.
2. **Brotli + Decompression Fallback**: usually 15–20% smaller wasm and data, but decoding in JavaScript is slower at startup. Worth measuring.
3. **Service worker that unpacks with `DecompressionStream`**: native-speed decode, but it needs a reload on first visit and care with Unity's loader. It only saves startup time; the download stays the same size.
4. **coi-serviceworker**: adds COOP/COEP headers for cross-origin isolation. It has nothing to do with compression. It is only needed if we enable Unity web threads.

## Decision

Option 1. Set it in `WebBuild.ApplySettings`. Don't add a service worker for now.

## Consequences

- The wasm is about 7.4 MB and the data about 3.0 MB as served (v0.3.0).
- Measure option 2 when download size becomes a priority.
- If Unity web multithreading is ever needed (Burst jobs at very high unit counts, #30), adopt coi-serviceworker in a new ADR. COEP `require-corp` then blocks cross-origin resources that don't send CORP headers.
