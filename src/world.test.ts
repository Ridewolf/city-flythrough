import { describe, expect, it } from 'bun:test';
import { dprCapFor, factorFromMs } from './perf';
import {
  blockBox,
  blockKind,
  CELL,
  CYCLE,
  GREEN_DUR,
  hash,
  hasRoundabout,
  LANE_W,
  laneOffset,
  lightGreen,
  roadInfo,
  roadLimit,
  roadWidth,
} from './world';

describe('hash', () => {
  it('is deterministic and in [0, 1)', () => {
    for (let i = -50; i < 50; i += 7) {
      for (let j = -50; j < 50; j += 11) {
        const v = hash(i, j, 3);
        expect(v).toBe(hash(i, j, 3));
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    }
  });

  it('salt changes the value', () => {
    expect(hash(5, 7, 1)).not.toBe(hash(5, 7, 2));
  });
});

describe('roadInfo', () => {
  it('is deterministic and structurally valid across many lines', () => {
    for (let line = -200; line < 200; line += 1) {
      for (const axis of ['h', 'v'] as const) {
        const info = roadInfo(axis, line);
        expect(info).toEqual(roadInfo(axis, line));
        expect([1, 2, 3]).toContain(info.lanes);
        if (info.oneWay) expect(info.lanes).toBe(1); // alleys are single-lane
        expect([1, -1]).toContain(info.fixedDir);
      }
    }
  });

  it('produces every road class somewhere', () => {
    const seen = new Set<string>();
    for (let line = 0; line < 400; line += 1) {
      const info = roadInfo('h', line);
      seen.add(info.oneWay ? 'alley' : `lanes${info.lanes}`);
    }
    expect(seen).toEqual(new Set(['alley', 'lanes1', 'lanes2', 'lanes3']));
  });

  it('wider roads are faster', () => {
    const alley = { lanes: 1, oneWay: true, fixedDir: 1 as const };
    const two = { lanes: 1, oneWay: false, fixedDir: 1 as const };
    const four = { lanes: 2, oneWay: false, fixedDir: 1 as const };
    const avenue = { lanes: 3, oneWay: false, fixedDir: 1 as const };
    expect(roadLimit(alley)).toBeLessThan(roadLimit(two));
    expect(roadLimit(two)).toBeLessThan(roadLimit(four));
    expect(roadLimit(four)).toBeLessThan(roadLimit(avenue));
    expect(roadWidth(alley)).toBeLessThan(roadWidth(avenue));
  });
});

describe('laneOffset', () => {
  const four = { lanes: 2, oneWay: false, fixedDir: 1 as const };

  it('opposite directions sit on opposite sides of the centreline', () => {
    expect(laneOffset('h', 1, 0, four)).toBe(-laneOffset('h', -1, 0, four));
    expect(laneOffset('v', 1, 0, four)).toBe(-laneOffset('v', -1, 0, four));
  });

  it('outer lanes sit further out; one-way roads have no offset', () => {
    expect(Math.abs(laneOffset('h', 1, 1, four))).toBeGreaterThan(
      Math.abs(laneOffset('h', 1, 0, four)),
    );
    expect(laneOffset('h', 1, 0, { lanes: 1, oneWay: true, fixedDir: 1 })).toBe(0);
    expect(Math.abs(laneOffset('h', 1, 0, four))).toBe(0.5 * LANE_W);
  });
});

describe('lightGreen', () => {
  it('h and v are never green at the same junction simultaneously', () => {
    for (let t = 0; t < CYCLE * 2; t += 0.05) {
      for (const [ci, cj] of [
        [0, 0],
        [3, 7],
        [-4, 12],
      ] as const) {
        expect(lightGreen(t, ci, cj, 'h') && lightGreen(t, ci, cj, 'v')).toBe(false);
      }
    }
  });

  it('each axis gets a green window every cycle', () => {
    let hGreen = 0;
    let vGreen = 0;
    for (let t = 0; t < CYCLE; t += 0.05) {
      if (lightGreen(t, 5, 5, 'h')) hGreen += 1;
      if (lightGreen(t, 5, 5, 'v')) vGreen += 1;
    }
    // Each axis is green for GREEN_DUR out of CYCLE.
    expect(hGreen * 0.05).toBeCloseTo(GREEN_DUR, 0);
    expect(vGreen * 0.05).toBeCloseTo(GREEN_DUR, 0);
  });

  it('is periodic with the cycle', () => {
    expect(lightGreen(1.23, 2, 3, 'h')).toBe(lightGreen(1.23 + CYCLE, 2, 3, 'h'));
  });
});

describe('blocks and roundabouts', () => {
  it('blockBox stays inside its cell', () => {
    for (let i = -20; i < 20; i += 3) {
      for (let j = -20; j < 20; j += 3) {
        const box = blockBox(i, j);
        expect(box.x).toBeGreaterThan(i * CELL);
        expect(box.y).toBeGreaterThan(j * CELL);
        expect(box.x + box.w).toBeLessThan((i + 1) * CELL);
        expect(box.y + box.h).toBeLessThan((j + 1) * CELL);
      }
    }
  });

  it('roundabouts are the rare junction type (~10%)', () => {
    let count = 0;
    const total = 40 * 40;
    for (let i = 0; i < 40; i += 1)
      for (let j = 0; j < 40; j += 1) if (hasRoundabout(i, j)) count += 1;
    expect(count / total).toBeGreaterThan(0.05);
    expect(count / total).toBeLessThan(0.16);
  });

  it('block kinds are deterministic and cover all three types', () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 30; i += 1)
      for (let j = 0; j < 30; j += 1) {
        expect(blockKind(i, j)).toBe(blockKind(i, j));
        kinds.add(blockKind(i, j));
      }
    expect(kinds).toEqual(new Set(['park', 'plaza', 'buildings']));
  });
});

describe('perf mapping', () => {
  it('clamps the factor to [0.25, 1.2] and rewards fast devices', () => {
    expect(factorFromMs(8)).toBe(1); // reference device
    expect(factorFromMs(4)).toBeCloseTo(1.2, 6); // 2× faster → capped
    expect(factorFromMs(80)).toBe(0.25); // 10× slower → floored
    expect(factorFromMs(0)).toBe(1.2); // coarsened clock: too fast to measure
    expect(factorFromMs(Number.NaN)).toBe(1.2);
  });

  it('maps factors onto DPR caps', () => {
    expect(dprCapFor(1.0)).toBe(2);
    expect(dprCapFor(0.7)).toBe(1.5);
    expect(dprCapFor(0.3)).toBe(1);
  });
});
