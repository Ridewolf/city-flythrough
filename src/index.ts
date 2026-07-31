/**
 * The orchestrator: camera, frame loop, adaptive performance, lifecycle.
 * `createCityFlythrough(canvas)` is the whole public API — everything below
 * it (world, traffic, sky, renderer) is exported for reuse and testing.
 */
import { dprCapFor, measurePerfFactor } from './perf';
import { PALETTE_DARK, PALETTE_LIGHT, type Palette, renderFrame } from './render';
import { Sky } from './sky';
import { TrafficSim, type Viewport } from './traffic';

export { dprCapFor, factorFromMs, measurePerfFactor } from './perf';
export { PALETTE_DARK, PALETTE_LIGHT, type Palette, renderFrame, type Scene } from './render';
export { type Aircraft, CLOUD_SHAPES, type Cloud, Sky } from './sky';
export {
  type Agent,
  ARROW_COLORS,
  type Incident,
  TrafficSim,
  type TrafficSimOptions,
  type Viewport,
} from './traffic';
export * from './world';

const CAM_SPEED = 34;
const AGENT_BASE = 80;
const CLOUD_BASE = 16;
const MIN_AGENTS = 16;
const MIN_CLOUDS = 4;
const AGENT_BASE_MINIMAL = 14;
const CLOUD_BASE_MINIMAL = 4;
const MIN_AGENTS_MINIMAL = 8;
const MIN_CLOUDS_MINIMAL = 2;
// Runtime guard: if the average frame over a ~2s window is slower than this
// (under 25 fps — thermal throttling the benchmark missed), shed a quarter of
// the cars and check again next window.
const SHED_FRAME_S = 0.04;
const SHED_WINDOW_S = 2;
const FPS_CAP = 60;
const FPS_CAP_MINIMAL = 30;

export interface CityFlythroughOptions {
  /**
   * Bare-bones variant for pages where the backdrop is scenery, not the main
   * act: entity budgets cut, DPR cap lowered, aircraft and incidents off,
   * frame cap 30 fps.
   */
  minimal?: boolean;
  /** Colour theme; switchable at runtime via `setTheme`. Default `'dark'`. */
  theme?: 'dark' | 'light';
  /** Custom palette override (wins over `theme`). */
  palette?: Palette;
  /** Injectable RNG for deterministic scenes. Default `Math.random`. */
  rng?: () => number;
  /** Respect `prefers-reduced-motion` (render one static frame). Default true. */
  respectReducedMotion?: boolean;
}

export interface CityFlythrough {
  start(): void;
  stop(): void;
  setTheme(theme: 'dark' | 'light'): void;
  /** Live handles for inspection/tests. */
  readonly sim: TrafficSim;
  readonly sky: Sky;
  destroy(): void;
}

export function createCityFlythrough(
  canvas: HTMLCanvasElement,
  options: CityFlythroughOptions = {},
): CityFlythrough {
  const minimal = options.minimal ?? false;
  const rng = options.rng ?? Math.random;

  let palette = options.palette ?? (options.theme === 'light' ? PALETTE_LIGHT : PALETTE_DARK);

  const reduced =
    (options.respectReducedMotion ?? true) &&
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  // Benchmark BEFORE the first resize — the DPR cap depends on the factor.
  const factor = measurePerfFactor();
  const dprCap = minimal ? Math.min(dprCapFor(factor), 1.5) : dprCapFor(factor);
  const frameInterval = 1000 / (minimal ? FPS_CAP_MINIMAL : FPS_CAP);
  const minAgents = minimal ? MIN_AGENTS_MINIMAL : MIN_AGENTS;
  const minClouds = minimal ? MIN_CLOUDS_MINIMAL : MIN_CLOUDS;

  const sim = new TrafficSim({ rng, incidents: !minimal });
  const sky = new Sky({ rng, aircraft: !minimal });

  let ctx: CanvasRenderingContext2D | null = null;
  let raf = 0;
  let running = false;
  let lastTs = 0;
  let viewW = 0;
  let viewH = 0;
  let camX = rng() * 10000;
  let camY = rng() * 10000;
  let heading = 0.6;
  let elapsed = 0;
  let frameAcc = 0;
  let frameCount = 0;

  const view = (): Viewport => ({
    left: camX - viewW / 2,
    top: camY - viewH / 2,
    width: viewW,
    height: viewH,
  });

  function resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    viewW = canvas.clientWidth || window.innerWidth;
    viewH = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    ctx = canvas.getContext('2d');
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(dt: number): void {
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const v = view();
    if (!reduced) {
      sim.step(dt, v);
      sim.recycleOffscreen(v);
      sky.update(dt, v);
    }
    renderFrame(ctx, palette, v, {
      agents: sim.agents,
      incidents: sim.incidents,
      clouds: sky.clouds,
      aircraft: sky.aircraft,
      elapsed: sim.elapsed,
    });
  }

  function frame(ts: number): void {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    // Frame-rate cap: skip this vsync until frameInterval has elapsed since
    // the last RENDERED frame. lastTs only advances on a real render, so dt
    // stays accurate — we just draw less often.
    if (frameInterval && lastTs && ts - lastTs < frameInterval) return;
    const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    elapsed += dt;
    heading += Math.sin(elapsed * 0.08) * 0.25 * dt;
    camX += Math.cos(heading) * CAM_SPEED * dt;
    camY += Math.sin(heading) * CAM_SPEED * dt;
    draw(dt);
    frameAcc += dt;
    frameCount += 1;
    if (frameAcc >= SHED_WINDOW_S) {
      const avg = frameAcc / frameCount;
      frameAcc = 0;
      frameCount = 0;
      if (avg > SHED_FRAME_S) {
        sim.shed(minAgents);
        if (sky.clouds.length > minClouds) {
          sky.clouds.length = Math.max(minClouds, Math.floor(sky.clouds.length * 0.75));
        }
      }
    }
  }

  const onResize = (): void => resize();

  resize();
  const v0 = view();
  const agentBase = minimal ? AGENT_BASE_MINIMAL : AGENT_BASE;
  const cloudBase = minimal ? CLOUD_BASE_MINIMAL : CLOUD_BASE;
  for (let n = 0; n < Math.max(minAgents, Math.round(agentBase * factor)); n += 1) {
    sim.agents.push(sim.makeAgent(v0));
  }
  sky.populate(v0, Math.max(minClouds, Math.round(cloudBase * factor)));
  window.addEventListener('resize', onResize);

  return {
    sim,
    sky,
    start(): void {
      if (running) return;
      if (reduced) {
        draw(0); // a single static frame
        return;
      }
      running = true;
      lastTs = 0;
      raf = requestAnimationFrame(frame);
    },
    stop(): void {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    setTheme(theme): void {
      palette = theme === 'light' ? PALETTE_LIGHT : PALETTE_DARK;
    },
    destroy(): void {
      this.stop();
      window.removeEventListener('resize', onResize);
    },
  };
}
