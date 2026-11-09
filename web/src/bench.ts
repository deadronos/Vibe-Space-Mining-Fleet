import { on } from './bridge';
import type { BridgeReady, BridgeState } from './protocol';

// Render benchmark (#30): `?bench=N` starts Unity with N drones and no pirate waves. The page
// then neither loads nor writes the player's save, and shows the timings Unity reports.
// Unity reads `bench` from the URL itself and reports the count it used in `ready`.

/** Seconds of sim time to skip while drones launch, then seconds to measure. */
const WARMUP_S = 45;
const MEASURE_S = 60;

export interface BenchSummary {
  renderer: string;
  drones: number;
  /** Drones out of the hangar, mean over the measured window. */
  inFlight: number;
  samples: number;
  fps: number;
  frameMs: number;
  frameMsP95: number;
  frameMsMax: number;
  simMs: number;
  tickMs: number;
  syncMs: number;
  /** Frame time not spent in the sim or view sync: rendering, UI, browser, vsync wait. */
  otherMs: number;
  userAgent: string;
}

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const round = (x: number): number => Math.round(x * 100) / 100;
const fmt = (x: number): string => x.toFixed(2).padStart(6);

/** Shows live timings and, after the measured window, a summary (also on `window.spaceMining`). */
export function startBench(info: BridgeReady): { summary: () => BenchSummary | null } {
  const panel = document.createElement('pre');
  panel.id = 'bench';
  document.body.append(panel);

  const samples: BridgeState[] = [];
  let lastTime = -1;
  let summary: BenchSummary | null = null;

  on('state', (s) => {
    // Perf numbers change once a second; keep one sample per sim second.
    if (s.time >= WARMUP_S && Math.floor(s.time) !== lastTime && !summary) {
      lastTime = Math.floor(s.time);
      samples.push(s);
      if (s.time >= WARMUP_S + MEASURE_S) summary = summarise(info, samples);
    }
    panel.textContent = render(info, s, samples.length, summary);
  });
  return { summary: () => summary };
}

function summarise(info: BridgeReady, xs: BridgeState[]): BenchSummary {
  const pick = (f: (s: BridgeState) => number) => round(mean(xs.map(f)));
  const frameMs = pick((s) => s.frameMs);
  const simMs = pick((s) => s.simMs);
  const syncMs = pick((s) => s.syncMs);
  const result: BenchSummary = {
    renderer: info.renderer,
    drones: info.bench,
    inFlight: Math.round(mean(xs.map((s) => s.drones - s.hangar))),
    samples: xs.length,
    fps: pick((s) => s.fps),
    frameMs,
    frameMsP95: pick((s) => s.frameMsP95),
    frameMsMax: round(Math.max(...xs.map((s) => s.frameMsMax))),
    simMs,
    tickMs: pick((s) => s.tickMs),
    syncMs,
    otherMs: round(frameMs - simMs - syncMs),
    userAgent: navigator.userAgent,
  };
  console.info('[bench] summary', JSON.stringify(result));
  return result;
}

function render(
  info: BridgeReady,
  s: BridgeState,
  measured: number,
  summary: BenchSummary | null,
): string {
  const status = summary
    ? `done: ${summary.fps.toFixed(1)} fps, ${summary.frameMs} ms/frame (window.spaceMining.bench.summary())`
    : s.time < WARMUP_S
      ? `warming up ${Math.ceil(WARMUP_S - s.time)} s`
      : `measuring ${measured}/${MEASURE_S} s`;
  return [
    `bench ${info.bench} drones · ${info.renderer}`,
    `in flight ${s.drones - s.hangar}`,
    `fps      ${fmt(s.fps)}`,
    `frame ms ${fmt(s.frameMs)}  p95 ${fmt(s.frameMsP95)}  max ${fmt(s.frameMsMax)}`,
    `sim ms   ${fmt(s.simMs)}  per tick ${fmt(s.tickMs)}`,
    `sync ms  ${fmt(s.syncMs)}`,
    status,
  ].join('\n');
}
