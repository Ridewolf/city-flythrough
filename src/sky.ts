/**
 * The sky layer: world-anchored drifting clouds (they pan with the city) and
 * a very rare aircraft flyover in screen space. RNG injected.
 */
import type { Viewport } from './traffic';

export interface Cloud {
  x: number;
  y: number;
  r: number;
  vx: number;
  alpha: number;
  shape: number;
}

export type AircraftKind = 'plane' | 'heli' | 'drone';

export interface Aircraft {
  kind: AircraftKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotor: number;
}

/** 10 distinct silhouettes — each a list of [dx, dy, radiusFactor] blobs. */
export const CLOUD_SHAPES: ReadonlyArray<ReadonlyArray<readonly [number, number, number]>> = [
  [
    [0, 0, 1],
    [-0.5, 0.18, 0.7],
    [0.55, 0.12, 0.75],
    [0.1, -0.22, 0.6],
  ], // classic puff
  [
    [-0.9, 0, 0.55],
    [-0.3, -0.05, 0.7],
    [0.3, 0, 0.72],
    [0.95, 0.05, 0.5],
  ], // stratus
  [
    [0, 0.25, 0.85],
    [-0.35, -0.1, 0.7],
    [0.3, -0.05, 0.7],
    [0, -0.45, 0.6],
    [-0.1, -0.8, 0.4],
  ], // cumulus
  [
    [0, 0, 0.55],
    [0.4, 0.08, 0.4],
    [-0.35, 0.05, 0.42],
  ], // small wisp
  [
    [-0.45, 0, 0.85],
    [0.5, 0.05, 0.8],
    [0.05, -0.2, 0.55],
  ], // fat double
  [
    [-1, 0.1, 0.5],
    [-0.4, -0.1, 0.65],
    [0.2, 0.12, 0.7],
    [0.7, -0.05, 0.55],
    [1.15, 0.15, 0.38],
  ], // ragged
  [
    [0, 0.1, 0.9],
    [-0.7, 0.2, 0.55],
    [0.7, 0.2, 0.55],
    [0, -0.35, 0.5],
  ], // flat anvil
  [
    [-0.3, 0, 0.42],
    [0.3, 0, 0.42],
    [0, -0.15, 0.36],
  ], // tiny trio
  [
    [-1.1, 0.05, 0.5],
    [-0.55, -0.05, 0.6],
    [0, 0, 0.7],
    [0.55, -0.05, 0.6],
    [1.1, 0.05, 0.5],
  ], // billowing line
  [
    [-0.25, 0.15, 0.9],
    [0.45, -0.05, 0.6],
    [0.85, 0.1, 0.42],
    [-0.7, 0.0, 0.5],
  ], // lopsided heap
];

const AIRCRAFT_RATE = 0.004; // flyovers per second (very rare)

export interface SkyOptions {
  rng?: () => number;
  /** Disable aircraft flyovers (the minimal backdrop variant). */
  aircraft?: boolean;
}

export class Sky {
  clouds: Cloud[] = [];
  aircraft: Aircraft | null = null;

  private readonly rng: () => number;
  private readonly aircraftEnabled: boolean;
  private aircraftTimer = 0;

  constructor(options: SkyOptions = {}) {
    this.rng = options.rng ?? Math.random;
    this.aircraftEnabled = options.aircraft ?? true;
  }

  makeCloud(view: Viewport, offscreen: boolean): Cloud {
    const rng = this.rng;
    return {
      x: offscreen ? view.left - 180 : view.left + rng() * view.width,
      y: view.top + rng() * view.height,
      r: 40 + rng() * 70,
      vx: 6 + rng() * 12,
      alpha: 0.5 + rng() * 0.5,
      shape: Math.floor(rng() * CLOUD_SHAPES.length),
    };
  }

  populate(view: Viewport, count: number): void {
    this.clouds = Array.from({ length: count }, () => this.makeCloud(view, false));
  }

  update(dt: number, view: Viewport): void {
    const m = 220;
    for (const cl of this.clouds) {
      cl.x += cl.vx * dt;
      // The camera curves — recycle a cloud whenever it leaves the viewport on
      // ANY side (not just the right) and respawn it within view.
      if (
        cl.x - cl.r > view.left + view.width + m ||
        cl.x + cl.r < view.left - m ||
        cl.y + cl.r < view.top - m ||
        cl.y - cl.r > view.top + view.height + m
      ) {
        Object.assign(cl, this.makeCloud(view, false));
      }
    }

    if (this.aircraft) {
      this.aircraft.x += this.aircraft.vx * dt;
      this.aircraft.y += this.aircraft.vy * dt;
      this.aircraft.rotor += dt * 26;
      if (
        this.aircraft.x < -160 ||
        this.aircraft.x > view.width + 160 ||
        this.aircraft.y < -160 ||
        this.aircraft.y > view.height + 160
      ) {
        this.aircraft = null;
      }
    } else if (this.aircraftEnabled) {
      this.aircraftTimer -= dt;
      if (this.aircraftTimer <= 0) {
        this.aircraftTimer = 1;
        if (this.rng() < AIRCRAFT_RATE) this.spawnAircraft(view);
      }
    }
  }

  private spawnAircraft(view: Viewport): void {
    const rng = this.rng;
    const roll = rng();
    const kind: AircraftKind = roll < 0.34 ? 'plane' : roll < 0.67 ? 'heli' : 'drone';
    const fromLeft = rng() < 0.5;
    const speed =
      kind === 'plane' ? 150 + rng() * 60 : kind === 'heli' ? 70 + rng() * 40 : 50 + rng() * 30;
    const yBand =
      kind === 'plane'
        ? view.height * 0.35
        : kind === 'heli'
          ? view.height * 0.5
          : view.height * 0.55;
    this.aircraft = {
      kind,
      x: fromLeft ? -140 : view.width + 140,
      y: 50 + rng() * yBand,
      vx: (fromLeft ? 1 : -1) * speed,
      vy: (rng() - 0.5) * (kind === 'drone' ? 8 : 18),
      rotor: 0,
    };
  }
}
