import { describe, expect, it } from 'bun:test';
import { type Agent, MIN_GAP, TrafficSim, type Viewport } from './traffic';
import { CELL, CYCLE, hasRoundabout, lightGreen, roadInfo, roadLimit } from './world';

/** Deterministic LCG so simulation runs are reproducible. */
function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const VIEW: Viewport = { left: -600, top: -600, width: 1200, height: 1200 };

/** A two-way horizontal grid line without a roundabout at junction `ci`. */
function findPlainJunction(): { line: number; ci: number } {
  for (let line = 0; line < 300; line += 1) {
    const info = roadInfo('h', line);
    if (info.oneWay) continue;
    for (let ci = 0; ci < 300; ci += 1) {
      if (!hasRoundabout(ci, line)) return { line, ci };
    }
  }
  throw new Error('no plain junction found');
}

/** A time at which the h-axis light at (ci, cj) is red / green. */
function findLightTime(ci: number, cj: number, green: boolean): number {
  for (let t = 0; t < CYCLE; t += 0.01) {
    if (lightGreen(t, ci, cj, 'h') === green) return t;
  }
  throw new Error('light phase not found');
}

function roadAgent(sim: TrafficSim, line: number, x: number): Agent {
  const a = sim.makeAgent(VIEW);
  const info = roadInfo('h', line);
  Object.assign(a, {
    axis: 'h',
    dir: 1,
    lane: 0,
    mode: 'road',
    x,
    y: line * CELL,
    speed: roadLimit(info),
    speedFactor: 1,
    stalled: false,
    pendingTurn: false,
  });
  a.perp = sim.targetPerp(a);
  sim.agents.push(a);
  return a;
}

describe('red lights', () => {
  it('a car brakes for a red light and stops at the line', () => {
    const { line, ci } = findPlainJunction();
    const sim = new TrafficSim({ rng: () => 0.99, incidents: false }); // rng 0.99 → never turns
    // Park sim time so the light is red for the whole approach.
    sim.elapsed = findLightTime(ci, line, false);
    const node = ci * CELL;
    // Start INSIDE the block before the junction (CELL=170 — any further back
    // and the car would face the PREVIOUS junction's light first).
    const a = roadAgent(sim, line, node - 150);

    // Step in tiny increments with elapsed frozen (re-pin each step).
    const redTime = sim.elapsed;
    for (let n = 0; n < 800; n += 1) {
      sim.step(0.016, VIEW);
      sim.elapsed = redTime; // hold the light red
    }
    // Braking is asymptotic (target ∝ distance): "stopped" means < 1 px/s.
    expect(a.speed).toBeLessThan(1);
    expect(a.x).toBeLessThan(node); // stopped before the junction
    expect(node - a.x).toBeLessThan(40); // ... at the stop line, not miles away
  });

  it('a car sails through a green light', () => {
    const { line, ci } = findPlainJunction();
    const sim = new TrafficSim({ rng: () => 0.99, incidents: false });
    sim.elapsed = findLightTime(ci, line, true);
    const node = ci * CELL;
    const a = roadAgent(sim, line, node - 60);

    const greenTime = sim.elapsed;
    for (let n = 0; n < 200; n += 1) {
      sim.step(0.016, VIEW);
      sim.elapsed = greenTime;
    }
    expect(a.x).toBeGreaterThan(node); // crossed the junction
    expect(a.speed).toBeGreaterThan(0);
  });
});

describe('car following', () => {
  it('a follower never overlaps its leader and matches a stopped queue', () => {
    const { line, ci } = findPlainJunction();
    const sim = new TrafficSim({ rng: () => 0.99, incidents: false });
    sim.elapsed = findLightTime(ci, line, false);
    const node = ci * CELL;
    const lead = roadAgent(sim, line, node - 80);
    const follower = roadAgent(sim, line, node - 130);

    const redTime = sim.elapsed;
    for (let n = 0; n < 400; n += 1) {
      sim.step(0.016, VIEW);
      sim.elapsed = redTime;
    }
    expect(lead.x - follower.x).toBeGreaterThanOrEqual(MIN_GAP - 1e-6);
    expect(follower.speed).toBeLessThan(1); // queued behind the (near-)stopped leader
  });
});

describe('stalled cars', () => {
  it('a stalled car blocks its lane; traffic queues behind it', () => {
    const { line, ci } = findPlainJunction();
    const sim = new TrafficSim({ rng: () => 0.99, incidents: false });
    sim.elapsed = findLightTime(ci, line, true); // green — only the stall blocks
    const stalled = roadAgent(sim, line, ci * CELL - 100);
    stalled.stalled = true;
    stalled.speed = 0;
    const follower = roadAgent(sim, line, ci * CELL - 180);

    const t = sim.elapsed;
    for (let n = 0; n < 300; n += 1) {
      sim.step(0.016, VIEW);
      sim.elapsed = t;
    }
    expect(stalled.x).toBe(ci * CELL - 100); // never moved
    expect(stalled.x - follower.x).toBeGreaterThanOrEqual(MIN_GAP - 1e-6);
  });
});

describe('roundabouts', () => {
  function findRoundaboutOnTwoWay(): { line: number; ci: number } {
    for (let line = 0; line < 400; line += 1) {
      if (roadInfo('h', line).oneWay) continue;
      for (let ci = 0; ci < 400; ci += 1) {
        if (hasRoundabout(ci, line)) return { line, ci };
      }
    }
    throw new Error('no roundabout found');
  }

  it('a car enters the ring and eventually exits back onto a road', () => {
    const { line, ci } = findRoundaboutOnTwoWay();
    const rng = seededRng(42);
    const sim = new TrafficSim({ rng, incidents: false });
    const a = roadAgent(sim, line, ci * CELL - 120);

    let sawRing = false;
    for (let n = 0; n < 3000 && !(sawRing && a.mode === 'road'); n += 1) {
      sim.step(0.016, VIEW);
      if (a.mode === 'ring') sawRing = true;
    }
    expect(sawRing).toBe(true); // circulated the ring
    expect(a.mode).toBe('road'); // ... and exited
    expect(a.lastK).toBeLessThanOrEqual(3); // never loops forever
  });
});

describe('long-run stability', () => {
  it('a seeded 60-second run stays finite and lane-disciplined', () => {
    const rng = seededRng(7);
    const sim = new TrafficSim({ rng, incidents: true });
    for (let n = 0; n < 40; n += 1) sim.agents.push(sim.makeAgent(VIEW));

    for (let n = 0; n < 3600; n += 1) {
      sim.step(1 / 60, VIEW);
      sim.recycleOffscreen(VIEW);
    }

    for (const a of sim.agents) {
      expect(Number.isFinite(a.x)).toBe(true);
      expect(Number.isFinite(a.y)).toBe(true);
      expect(Number.isFinite(a.speed)).toBe(true);
      expect(a.speed).toBeGreaterThanOrEqual(0);
      expect(a.speed).toBeLessThanOrEqual(94 * 1.15 + 1); // max limit × max factor
      if (a.mode === 'road') {
        // The car sits on a grid line (within its lane offset envelope).
        const fixed = a.axis === 'h' ? a.y : a.x;
        const nearest = Math.round(fixed / CELL) * CELL;
        expect(Math.abs(fixed - nearest)).toBeLessThan(1e-6);
      }
    }
  });

  it('shed removes a quarter of the cars but respects the floor', () => {
    const sim = new TrafficSim({ rng: seededRng(1) });
    for (let n = 0; n < 40; n += 1) sim.agents.push(sim.makeAgent(VIEW));
    sim.shed(16);
    expect(sim.agents.length).toBe(30); // 75% of 40
    for (let n = 0; n < 10; n += 1) sim.shed(16);
    expect(sim.agents.length).toBe(16); // never below the floor
  });
});
