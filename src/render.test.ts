import { describe, expect, it } from 'bun:test';
import { dprCapFor, factorFromMs, measurePerfFactor } from './perf';
import { PALETTE_DARK, PALETTE_LIGHT, renderFrame, type Scene } from './render';
import { Sky } from './sky';
import { TrafficSim, type Viewport } from './traffic';

/** Deterministic LCG so runs are reproducible. */
function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const VIEW: Viewport = { left: -400, top: -300, width: 900, height: 600 };

interface Recorder {
  calls: string[];
  saves: number;
  restores: number;
}

/**
 * A canvas context that records instead of drawing. Everything `renderFrame`
 * touches is a method call or a style assignment, so a proxy is enough — and it
 * lets the test assert things a real canvas would swallow.
 */
function recordingContext(): { ctx: CanvasRenderingContext2D; log: Recorder } {
  const log: Recorder = { calls: [], saves: 0, restores: 0 };
  const gradient = { addColorStop: () => {} };
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_target, property: string) => {
      return (..._args: unknown[]) => {
        log.calls.push(property);
        if (property === 'save') log.saves += 1;
        if (property === 'restore') log.restores += 1;
        if (property.startsWith('create')) return gradient;
        if (property === 'measureText') return { width: 8 };
        return undefined;
      };
    },
    set: () => true, // fillStyle, lineWidth, font, globalAlpha…
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, log };
}

/** A populated frame: traffic stepped for a while, plus clouds and an aircraft. */
function buildScene(seed: number): Scene {
  const sim = new TrafficSim({ rng: seededRng(seed) });
  for (let i = 0; i < 24; i += 1) sim.agents.push(sim.makeAgent(VIEW));
  for (let step = 0; step < 120; step += 1) sim.step(1 / 30, VIEW);

  const sky = new Sky({ rng: seededRng(seed + 1) });
  sky.populate(VIEW, 6);
  for (let step = 0; step < 60; step += 1) sky.update(1 / 30, VIEW);

  return {
    agents: sim.agents,
    incidents: sim.incidents,
    clouds: sky.clouds,
    aircraft: sky.aircraft,
    elapsed: sim.elapsed,
  };
}

describe('renderFrame', () => {
  it('draws a full frame without touching a real canvas', () => {
    const { ctx, log } = recordingContext();
    renderFrame(ctx, PALETTE_DARK, VIEW, buildScene(7));

    expect(log.calls).toContain('fillRect'); // background
    expect(log.calls).toContain('arc'); // trees, wheels, lights
    expect(log.calls).toContain('stroke'); // road markings
    expect(log.calls.length).toBeGreaterThan(500); // a city, not a blank frame
  });

  it('leaves the context stack balanced', () => {
    // An unbalanced save/restore does not throw — it silently corrupts every
    // later frame with a stale transform or clip.
    const { ctx, log } = recordingContext();
    renderFrame(ctx, PALETTE_DARK, VIEW, buildScene(11));
    expect(log.saves).toBe(log.restores);
    expect(log.saves).toBeGreaterThan(0);
  });

  it('renders both palettes and an empty scene', () => {
    for (const palette of [PALETTE_DARK, PALETTE_LIGHT]) {
      const populated = recordingContext();
      renderFrame(populated.ctx, palette, VIEW, buildScene(3));
      expect(populated.log.saves).toBe(populated.log.restores);

      const empty = recordingContext();
      const scene: Scene = { agents: [], incidents: [], clouds: [], aircraft: null, elapsed: 0 };
      renderFrame(empty.ctx, palette, VIEW, scene);
      expect(empty.log.calls).toContain('fillRect'); // still paints the world
      expect(empty.log.saves).toBe(empty.log.restores);
    }
  });

  it('draws every aircraft kind, in both directions', () => {
    // The three kinds are separate drawing routines (fixed wing, rotor, quad),
    // and a flyover is rare enough that a seeded soak may never produce one.
    for (const kind of ['plane', 'heli', 'drone'] as const) {
      for (const vx of [140, -140]) {
        const { ctx, log } = recordingContext();
        const scene: Scene = {
          ...buildScene(2),
          aircraft: { kind, x: 120, y: 90, vx, vy: 4, rotor: 1.2 },
        };
        renderFrame(ctx, PALETTE_DARK, VIEW, scene);
        expect(log.calls).toContain('ellipse'); // the shadow on the city below
        expect(log.saves).toBe(log.restores);
      }
    }
  });

  it('draws the incident badge for a stalled car', () => {
    const sim = new TrafficSim({ rng: seededRng(4) });
    const agent = sim.makeAgent(VIEW);
    agent.stalled = true;
    sim.agents.push(agent);
    const { ctx, log } = recordingContext();
    renderFrame(ctx, PALETTE_DARK, VIEW, {
      agents: sim.agents,
      incidents: [{ agent, t: 3 }],
      clouds: [],
      aircraft: null,
      elapsed: 12,
    });
    expect(log.calls).toContain('fillText'); // the "!" in the badge
    expect(log.saves).toBe(log.restores);
  });

  it('scales its work with the viewport, not with wall-clock time', () => {
    const small = recordingContext();
    const large = recordingContext();
    const scene = buildScene(5);
    renderFrame(small.ctx, PALETTE_DARK, { left: 0, top: 0, width: 320, height: 240 }, scene);
    renderFrame(large.ctx, PALETTE_DARK, { left: 0, top: 0, width: 1600, height: 1200 }, scene);
    expect(large.log.calls.length).toBeGreaterThan(small.log.calls.length);
  });
});

describe('Sky', () => {
  it('populates and recycles clouds inside the viewport', () => {
    const sky = new Sky({ rng: seededRng(42), aircraft: false });
    sky.populate(VIEW, 8);
    expect(sky.clouds).toHaveLength(8);

    // Long enough that every cloud drifts past the right edge and respawns.
    for (let step = 0; step < 2_000; step += 1) sky.update(1 / 30, VIEW);
    const margin = 400;
    for (const cloud of sky.clouds) {
      expect(cloud.x).toBeGreaterThan(VIEW.left - margin);
      expect(cloud.x).toBeLessThan(VIEW.left + VIEW.width + margin);
      expect(cloud.r).toBeGreaterThan(0);
    }
  });

  it('never spawns aircraft when they are disabled', () => {
    const sky = new Sky({ rng: seededRng(9), aircraft: false });
    sky.populate(VIEW, 4);
    for (let step = 0; step < 5_000; step += 1) sky.update(1 / 30, VIEW);
    expect(sky.aircraft).toBeNull();
  });

  it('spawns each aircraft kind and lets it leave the frame', () => {
    // A flyover is 0.4% per second, so a seeded soak may never produce one —
    // script the RNG instead and drive all three kinds through spawn → exit.
    function scriptedRng(values: readonly number[]): () => number {
      let index = 0;
      return () => values[index++ % values.length] as number;
    }
    // [spawn roll, kind roll, fromLeft, speed, y, vy]
    for (const kindRoll of [0.1, 0.5, 0.9]) {
      const sky = new Sky({ rng: scriptedRng([0.001, kindRoll, 0.2, 0.5, 0.5, 0.5]) });
      sky.update(1, VIEW);
      expect(sky.aircraft).not.toBeNull();

      // Fly on until it exits the frame and the slot clears.
      for (let step = 0; step < 400 && sky.aircraft !== null; step += 1) sky.update(1 / 10, VIEW);
      expect(sky.aircraft).toBeNull();
    }
  });

  it('is deterministic for a given seed', () => {
    const first = new Sky({ rng: seededRng(123) });
    const second = new Sky({ rng: seededRng(123) });
    first.populate(VIEW, 5);
    second.populate(VIEW, 5);
    expect(first.clouds).toEqual(second.clouds);
  });
});

describe('device benchmark', () => {
  it('maps timings onto the documented factor range', () => {
    expect(factorFromMs(8)).toBeCloseTo(1, 5); // the reference device
    expect(factorFromMs(1)).toBe(1.2); // clamped at the top
    expect(factorFromMs(1_000)).toBe(0.25); // clamped at the bottom
    expect(factorFromMs(0)).toBe(1.2); // too fast to measure
    expect(factorFromMs(Number.NaN)).toBe(1.2); // broken clock
  });

  it('benchmarks the host once and memoizes the result', () => {
    const first = measurePerfFactor();
    expect(first).toBeGreaterThanOrEqual(0.25);
    expect(first).toBeLessThanOrEqual(1.2);
    expect(measurePerfFactor()).toBe(first); // second call is free
  });

  it('caps DPR in three steps', () => {
    expect(dprCapFor(1.2)).toBe(2);
    expect(dprCapFor(0.9)).toBe(2);
    expect(dprCapFor(0.89)).toBe(1.5);
    expect(dprCapFor(0.5)).toBe(1.5);
    expect(dprCapFor(0.49)).toBe(1);
    expect(dprCapFor(0.25)).toBe(1);
  });
});
