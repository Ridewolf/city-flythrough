import { afterEach, describe, expect, it } from 'bun:test';

import { createCityFlythrough, type OverlayFrame } from './index';
import { agentDrawPos } from './render';

/**
 * The orchestrator talks to `window` and a canvas, neither of which exists under
 * `bun test`. Stubbing both is enough — nothing here needs a real DOM, and a
 * recording context tells us more about what was drawn than a real one would.
 *
 * `prefers-reduced-motion` is reported as matching on purpose: `start()` then
 * renders exactly one static frame **synchronously**, so a frame can be asserted
 * on without a requestAnimationFrame tick or a timer.
 */
interface Recorder {
  calls: string[];
  translates: Array<[number, number]>;
  transforms: number;
}

function recordingContext(): { ctx: CanvasRenderingContext2D; log: Recorder } {
  const log: Recorder = { calls: [], translates: [], transforms: 0 };
  const gradient = { addColorStop: (): void => {} };
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_target, property: string) => {
      return (...args: unknown[]) => {
        log.calls.push(property);
        if (property === 'translate') log.translates.push([args[0] as number, args[1] as number]);
        if (property === 'setTransform') log.transforms += 1;
        if (property.startsWith('create')) return gradient;
        if (property === 'measureText') return { width: 8 };
        return undefined;
      };
    },
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, log };
}

function fakeCanvas(ctx: CanvasRenderingContext2D): HTMLCanvasElement {
  return {
    clientWidth: 800,
    clientHeight: 600,
    width: 0,
    height: 0,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
}

const g = globalThis as {
  window?: unknown;
  requestAnimationFrame?: unknown;
  cancelAnimationFrame?: unknown;
};
const originalWindow = g.window;
const originalRaf = g.requestAnimationFrame;
const originalCancelRaf = g.cancelAnimationFrame;

/** `reducedMotion: false` puts the scene on the animated path instead of the
 *  single static frame, which is the only way to reach the frame loop. */
function stubWindow(reducedMotion = true): { resize: () => void; removed: string[] } {
  const listeners: Record<string, () => void> = {};
  const removed: string[] = [];
  g.window = {
    devicePixelRatio: 1,
    innerWidth: 800,
    innerHeight: 600,
    matchMedia: () => ({ matches: reducedMotion }),
    addEventListener: (type: string, cb: () => void) => {
      listeners[type] = cb;
    },
    removeEventListener: (type: string) => {
      removed.push(type);
    },
  };
  return { resize: () => listeners.resize?.(), removed };
}

/** Hand-cranked requestAnimationFrame: the loop schedules, we decide when (and
 *  at what timestamp) each frame actually runs. */
function stubRaf(): { tick: (ts: number) => void; cancelled: number[] } {
  let pending: ((ts: number) => void) | null = null;
  let id = 0;
  const cancelled: number[] = [];
  g.requestAnimationFrame = (cb: (ts: number) => void): number => {
    pending = cb;
    id += 1;
    return id;
  };
  g.cancelAnimationFrame = (handle: number): void => {
    cancelled.push(handle);
    pending = null;
  };
  return {
    tick: (ts: number) => {
      const cb = pending;
      pending = null;
      cb?.(ts);
    },
    cancelled,
  };
}

afterEach(() => {
  if (originalWindow === undefined) delete g.window;
  else g.window = originalWindow;
  if (originalRaf === undefined) delete g.requestAnimationFrame;
  else g.requestAnimationFrame = originalRaf;
  if (originalCancelRaf === undefined) delete g.cancelAnimationFrame;
  else g.cancelAnimationFrame = originalCancelRaf;
});

describe('onOverlay', () => {
  it('runs once per rendered frame, after the scene', () => {
    stubWindow();
    const { ctx, log } = recordingContext();
    const frames: OverlayFrame[] = [];

    const fly = createCityFlythrough(fakeCanvas(ctx), {
      rng: () => 0.5,
      onOverlay: (_c, frame) => frames.push(frame),
    });
    fly.start();

    expect(frames).toHaveLength(1);
    // Everything the scene draws is logged before the overlay's own save.
    expect(log.calls.length).toBeGreaterThan(1);
    fly.destroy();
  });

  it('hands over the frame the scene was drawn from', () => {
    stubWindow();
    const { ctx } = recordingContext();
    let frame: OverlayFrame | null = null;

    const fly = createCityFlythrough(fakeCanvas(ctx), {
      rng: () => 0.5,
      onOverlay: (_c, f) => {
        frame = f;
      },
    });
    fly.start();

    expect(frame).not.toBeNull();
    const f = frame as unknown as OverlayFrame;
    // The static reduced-motion frame advances no clock.
    expect(f.dt).toBe(0);
    expect(f.view.width).toBe(800);
    expect(f.view.height).toBe(600);
    // The live array, not a copy — an overlay tracking one car has to be able to
    // notice when the sim recycles it.
    expect(f.agents).toBe(fly.sim.agents);
    expect(f.agents.length).toBeGreaterThan(0);
    fly.destroy();
  });

  it('draws in world coordinates, so agentDrawPos needs no conversion', () => {
    stubWindow();
    const { ctx, log } = recordingContext();
    let translateAtCall: [number, number] | undefined;
    let frame: OverlayFrame | null = null;

    const fly = createCityFlythrough(fakeCanvas(ctx), {
      rng: () => 0.5,
      onOverlay: (_c, f) => {
        // The last translate issued before this call is the one the package
        // applied for the overlay.
        translateAtCall = log.translates[log.translates.length - 1];
        frame = f;
      },
    });
    fly.start();

    const f = frame as unknown as OverlayFrame;
    expect(translateAtCall).toEqual([-f.view.left, -f.view.top]);

    // Which is exactly the transform renderFrame draws the world under, so a
    // car's painted position is usable as-is rather than viewport-adjusted.
    const agent = f.agents[0];
    if (!agent) throw new Error('the scene should have populated agents');
    const { px, py } = agentDrawPos(agent);
    expect(px).toBeCloseTo(agent.x + (agent.axis === 'v' ? agent.perp : 0));
    expect(py).toBeCloseTo(agent.y + (agent.axis === 'h' ? agent.perp : 0));

    fly.destroy();
  });

  it('is optional — a scene without one still renders', () => {
    stubWindow();
    const { ctx, log } = recordingContext();
    const fly = createCityFlythrough(fakeCanvas(ctx), { rng: () => 0.5 });
    expect(() => fly.start()).not.toThrow();
    expect(log.calls.length).toBeGreaterThan(0);
    fly.destroy();
  });

  it('reports a real dt once the scene is animating', () => {
    stubWindow(false);
    const raf = stubRaf();
    const { ctx } = recordingContext();
    const frames: OverlayFrame[] = [];

    const fly = createCityFlythrough(fakeCanvas(ctx), {
      rng: () => 0.5,
      onOverlay: (_c, f) => frames.push({ ...f }),
    });
    fly.start();

    // Timestamps as a browser hands them over: page-relative and non-zero. The
    // first frame has nothing to measure against, so its dt is 0.
    raf.tick(16);
    raf.tick(49);
    raf.tick(82);

    const [first, second] = frames;
    const last = frames[frames.length - 1];
    if (!first || !second || !last) throw new Error('expected at least two rendered frames');

    expect(first.dt).toBe(0);
    expect(second.dt).toBeGreaterThan(0);
    // The sim advances on the animated path, unlike the static frame.
    expect(last.elapsed).toBeGreaterThan(0);
    fly.destroy();
  });
});

describe('lifecycle', () => {
  it('start is idempotent and stop cancels the pending frame', () => {
    stubWindow(false);
    const raf = stubRaf();
    const { ctx } = recordingContext();
    const fly = createCityFlythrough(fakeCanvas(ctx), { rng: () => 0.5 });

    fly.start();
    fly.start(); // no second loop
    raf.tick(16);
    fly.stop();
    expect(raf.cancelled.length).toBe(1);

    // A tick after stop must not draw: the loop bails on `running`.
    let drewAfterStop = false;
    const fly2 = createCityFlythrough(fakeCanvas(ctx), {
      rng: () => 0.5,
      onOverlay: () => {
        drewAfterStop = true;
      },
    });
    fly2.start();
    fly2.stop();
    raf.tick(32);
    expect(drewAfterStop).toBe(false);
    fly2.destroy();
    fly.destroy();
  });

  it('sheds cars when frames come in too slowly', () => {
    stubWindow(false);
    const raf = stubRaf();
    const { ctx } = recordingContext();
    const fly = createCityFlythrough(fakeCanvas(ctx), { rng: () => 0.5 });
    fly.start();

    const before = fly.sim.agents.length;
    // dt is clamped to 50ms/frame — well past the 40ms shed threshold — so a
    // couple of seconds of these trips the runtime guard.
    let ts = 0;
    for (let i = 0; i < 60; i += 1) {
      ts += 100;
      raf.tick(ts);
    }
    expect(fly.sim.agents.length).toBeLessThan(before);
    fly.destroy();
  });

  it('setTheme swaps the palette without restarting the scene', () => {
    stubWindow();
    const { ctx } = recordingContext();
    const fly = createCityFlythrough(fakeCanvas(ctx), { rng: () => 0.5, theme: 'dark' });
    fly.start();
    expect(() => fly.setTheme('light')).not.toThrow();
    expect(() => fly.setTheme('dark')).not.toThrow();
    fly.destroy();
  });

  it('resizes the backing store on a window resize, and unhooks on destroy', () => {
    const win = stubWindow();
    const { ctx } = recordingContext();
    const canvas = fakeCanvas(ctx);
    const fly = createCityFlythrough(canvas, { rng: () => 0.5 });

    // Bigger viewport, then the event the package listens for.
    (canvas as unknown as { clientWidth: number }).clientWidth = 1600;
    (canvas as unknown as { clientHeight: number }).clientHeight = 900;
    win.resize();
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(900);

    fly.destroy();
    expect(win.removed).toContain('resize');
  });
});
