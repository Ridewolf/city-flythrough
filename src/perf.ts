/**
 * One-shot device micro-benchmark. Times a sim-shaped workload (integer
 * hashing + trig — the same math the traffic simulation burns every frame)
 * and turns the elapsed milliseconds into a 0.25…1.2 "power factor". The
 * scene scales its entity counts and canvas DPR cap by this factor, so a
 * weak device gets a lighter city instead of a laggy one.
 *
 * The run costs single-digit milliseconds on modern hardware and is memoized
 * for the session.
 */

const ITERATIONS = 60_000;
/** A device that crunches ITERATIONS in this many ms gets factor 1. */
const REF_MS = 8;
const MIN_FACTOR = 0.25;
const MAX_FACTOR = 1.2;

let sink = 0; // workload results land here so the JIT can't dead-code the loop
let cached: number | null = null;

function workload(iterations: number): number {
  let acc = 0;
  let h = 2166136261;
  for (let i = 0; i < iterations; i += 1) {
    h = ((h ^ i) * 16777619) | 0;
    const a = (h % 6283) / 1000;
    acc +=
      Math.cos(a) * 3 + Math.sin(a * 0.7) + Math.atan2(a, 1 + (i & 15)) + Math.sqrt(1 + (h & 255));
  }
  return acc;
}

/** Map a best-of benchmark timing onto the clamped power factor. Pure. */
export function factorFromMs(bestMs: number): number {
  if (!Number.isFinite(bestMs) || bestMs <= 0) return MAX_FACTOR; // too fast to measure
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, REF_MS / bestMs));
}

/** Benchmark once (memoized) and map the timing onto the power factor. */
export function measurePerfFactor(): number {
  if (cached !== null) return cached;
  if (typeof performance === 'undefined' || !performance.now) {
    cached = 1;
    return cached;
  }
  sink += workload(ITERATIONS / 4); // warm-up: let the JIT tier the loop up
  // Best of two runs — a stray GC pause in one shouldn't downgrade the device.
  let best = Number.POSITIVE_INFINITY;
  for (let run = 0; run < 2; run += 1) {
    const t0 = performance.now();
    sink += workload(ITERATIONS);
    best = Math.min(best, performance.now() - t0);
  }
  // Reading `sink` keeps the workload observable to the JIT; a non-finite
  // value would mean the benchmark itself misbehaved — fall back to neutral.
  if (!Number.isFinite(sink)) {
    cached = 1;
    return cached;
  }
  cached = factorFromMs(best);
  return cached;
}

/** Cap on devicePixelRatio — fill rate is the other half of the frame cost. */
export function dprCapFor(factor: number): number {
  if (factor >= 0.9) return 2;
  if (factor >= 0.5) return 1.5;
  return 1;
}
