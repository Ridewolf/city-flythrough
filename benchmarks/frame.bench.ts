/**
 * The backdrop claims it scales itself to the device, so the interesting number
 * is the per-frame cost at a given entity count — that is what the adaptive
 * budget actually trades away.
 *
 *   bun run bench
 *
 * The simulation runs headlessly with a seeded RNG; rendering runs against a
 * no-op context, so this measures our own work rather than the GPU's.
 */
import { bench, boxplot, run, summary } from 'mitata';
import { PALETTE_DARK, renderFrame, type Scene } from '../src/render';
import { Sky } from '../src/sky';
import { TrafficSim, type Viewport } from '../src/traffic';
import { hash, roadInfo } from '../src/world';

const VIEW: Viewport = { left: 0, top: 0, width: 1280, height: 800 };

function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function simWith(agents: number): TrafficSim {
  const sim = new TrafficSim({ rng: seededRng(1) });
  for (let i = 0; i < agents; i += 1) sim.agents.push(sim.makeAgent(VIEW));
  for (let step = 0; step < 60; step += 1) sim.step(1 / 60, VIEW); // settle into traffic
  return sim;
}

/** A context that accepts every call and does nothing — measures our own work. */
function noopContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => {} };
  return new Proxy({} as Record<string, unknown>, {
    get: (_t, property: string) => () => {
      if (property.startsWith('create')) return gradient;
      if (property === 'measureText') return { width: 8 };
      return undefined;
    },
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
}

const COUNTS = [40, 120, 300];
const SIMS = new Map(COUNTS.map((count) => [count, simWith(count)]));
const sky = new Sky({ rng: seededRng(2) });
sky.populate(VIEW, 10);
const ctx = noopContext();

function sceneOf(sim: TrafficSim): Scene {
  return {
    agents: sim.agents,
    incidents: sim.incidents,
    clouds: sky.clouds,
    aircraft: sky.aircraft,
    elapsed: sim.elapsed,
  };
}

boxplot(() => {
  summary(() => {
    for (const count of COUNTS) {
      const sim = SIMS.get(count) as TrafficSim;
      bench(`sim.step · ${count} cars`, () => sim.step(1 / 60, VIEW)).gc('inner');
      bench(`renderFrame · ${count} cars`, () => {
        renderFrame(ctx, PALETTE_DARK, VIEW, sceneOf(sim));
      }).gc('inner');
    }

    // The world is a pure function of coordinates — this is what makes the
    // camera able to fly anywhere without storing anything. The arguments vary
    // per iteration on purpose: with a constant the JIT hoists the call out of
    // the loop and the "measurement" becomes 400 picoseconds of nothing.
    let line = 0;
    bench('roadInfo (world lookup)', () => roadInfo('h', line++ & 1023)).gc('inner');
    let cell = 0;
    bench('hash (world primitive)', () => hash(cell++ & 1023, cell & 511)).gc('inner');
  });
});

await run();
