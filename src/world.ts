/**
 * The deterministic world: every road, block, roundabout, and traffic-light
 * phase is a pure function of grid coordinates (plus elapsed time for the
 * lights). No state is stored — the world is stable under camera movement
 * because it is *recomputed*, identically, every frame.
 */

/** Grid cell size in px — the distance between adjacent roads. */
export const CELL = 170;
export const LANE_W = 7;
export const ROUNDABOUT_R = 26;

/** Traffic-light timing: h green → clear → v green → clear. */
export const GREEN_DUR = 3.2;
export const CLEAR_DUR = 0.7;
export const CYCLE = GREEN_DUR * 2 + CLEAR_DUR * 2;

export type Axis = 'h' | 'v';

/** Deterministic hash of grid coordinates → [0, 1). */
export function hash(x: number, y: number, salt = 0): number {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + salt * 2147483647;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return ((h >>> 0) % 100000) / 100000;
}

export interface RoadInfo {
  /** Lanes per direction. */
  lanes: number;
  oneWay: boolean;
  fixedDir: 1 | -1;
}

/** Deterministic road class for a grid line: alley, 2-lane, 4-lane, avenue. */
export function roadInfo(axis: Axis, line: number): RoadInfo {
  const r = hash(line, axis === 'h' ? 0 : 1, 70);
  if (r < 0.16) {
    return {
      lanes: 1,
      oneWay: true,
      fixedDir: hash(line, axis === 'h' ? 2 : 3, 71) < 0.5 ? 1 : -1,
    };
  }
  if (r < 0.7) return { lanes: 1, oneWay: false, fixedDir: 1 };
  if (r < 0.9) return { lanes: 2, oneWay: false, fixedDir: 1 };
  return { lanes: 3, oneWay: false, fixedDir: 1 };
}

export function roadWidth(info: RoadInfo): number {
  return (info.oneWay ? 1 : info.lanes * 2) * LANE_W + 4;
}

/** Speed limit by road class — narrow alleys are slow, avenues fast. */
export function roadLimit(info: RoadInfo): number {
  if (info.oneWay) return 34;
  if (info.lanes >= 3) return 94;
  if (info.lanes === 2) return 74;
  return 52;
}

export function hasRoundabout(ci: number, cj: number): boolean {
  return hash(ci, cj, 30) >= 0.9;
}

/** Perpendicular centreline offset for a lane (right-hand-ish handedness). */
export function laneOffset(axis: Axis, dir: 1 | -1, lane: number, info: RoadInfo): number {
  if (info.oneWay) return 0;
  const sign = axis === 'h' ? (dir > 0 ? 1 : -1) : dir > 0 ? -1 : 1;
  return sign * (lane + 0.5) * LANE_W;
}

/**
 * Traffic-light phase for a junction. Each junction's cycle is offset by its
 * hash so the grid doesn't blink in unison; h and v greens never overlap
 * (separated by all-red clearance intervals).
 */
export function lightGreen(elapsed: number, ci: number, cj: number, axis: Axis): boolean {
  const offset = hash(ci, cj, 60) * CYCLE;
  const local = (((elapsed + offset) % CYCLE) + CYCLE) % CYCLE;
  if (axis === 'h') return local < GREEN_DUR;
  const vStart = GREEN_DUR + CLEAR_DUR;
  return local >= vStart && local < vStart + GREEN_DUR;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The buildable interior of a block — the cell minus its bounding roads. */
export function blockBox(i: number, j: number): Box {
  const lw = roadWidth(roadInfo('v', i)) / 2 + 5;
  const rw = roadWidth(roadInfo('v', i + 1)) / 2 + 5;
  const tw = roadWidth(roadInfo('h', j)) / 2 + 5;
  const bw = roadWidth(roadInfo('h', j + 1)) / 2 + 5;
  return {
    x: i * CELL + lw,
    y: j * CELL + tw,
    w: CELL - lw - rw,
    h: CELL - tw - bw,
  };
}

export type BlockKind = 'park' | 'plaza' | 'buildings';

/** What occupies a block: mostly buildings, some parks, a few round plazas. */
export function blockKind(i: number, j: number): BlockKind {
  const kind = hash(i, j, 10);
  if (kind < 0.15) return 'park';
  if (kind < 0.24) return 'plaza';
  return 'buildings';
}
