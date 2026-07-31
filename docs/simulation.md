# The simulation

What actually happens under the pretty pixels: a deterministic world, a real (if
tiny) traffic model, and an adaptive performance envelope. Sources:
[`src/world.ts`](../src/world.ts), [`src/traffic.ts`](../src/traffic.ts),
[`src/perf.ts`](../src/perf.ts); behaviour pinned in the two test suites.

## The deterministic world

There is no map data and no stored world. Every question — "what road is on grid
line 42?", "does junction (3, 7) have a roundabout?", "is this light green at
t = 12.3 s?" — is answered by hashing the coordinates:

- **Roads** come in four classes per grid line: one-way alleys (16%), 2-lane (54%),
  4-lane (20%), and 6-lane avenues (10%), each with its own width and speed limit.
- **Blocks** are buildings (~76%), parks (~15%), or circular plazas (~9%), composed
  from more per-cell hashes.
- **Junctions** are traffic lights, except ~10% which are roundabouts.
- **Traffic lights** run a fixed cycle (green → all-red clearance → cross green →
  clearance), phase-offset per junction by its hash so the grid doesn't blink in
  unison. The h/v greens can never overlap — pinned by a test.

Because the world is a pure function of coordinates, the camera can fly anywhere
forever and return to find everything exactly where it was — no chunk loading, no
memory growth.

## The traffic model

Cars are simple agents with real micro-traffic behaviours:

- **Car following** — same-lane cars are clamped to a minimum gap each step; a
  clamped follower adopts its leader's speed, so queues compress and move as one.
- **Red lights** — braking starts `BRAKE_DIST` before the stop line with the target
  speed proportional to remaining distance (asymptotic, so approaches look smooth),
  plus a hard stop at the line as a backstop. Cars never hop lanes while crawling.
- **Roundabouts** — entrants yield when any circulating car is within the
  `RING_YIELD` arc of their entry point; on the ring, cars exit with a fixed
  probability per quarter-turn and are forced out after a full lap (`lastK ≤ 3` —
  no eternal circling, pinned by a test).
- **Turns** — committed `PLAN_AHEAD` px before the junction and executed as an arc
  that is tangent to both the incoming and outgoing *lane centrelines* — tight for
  right turns, cross-road-sized for left — so a turning car never sweeps across
  the oncoming side. A light turning red mid-plan aborts the turn.
- **Lane changes** — attempted at a fixed rate, only above a minimum speed and only
  into a gap (`laneClear`), i.e. cars yield before merging.
- **Incidents** — rarely, a visible car stalls in-lane for a few seconds and traffic
  queues behind it. Disabled in `minimal` mode.

All randomness flows through an injected RNG, so a seeded simulation is fully
reproducible — the 60-second soak test in the suite runs 3 600 steps and asserts
every car is still finite, lane-disciplined, and under its speed limit.

## The performance envelope

Three mechanisms keep the scene smooth on whatever device opens it:

1. **Mount-time micro-benchmark** ([`perf.ts`](../src/perf.ts)) — times a
   sim-shaped workload (integer hashing + trig), best-of-two to survive a stray GC
   pause, and maps the result onto a 0.25–1.2 power factor that scales entity
   budgets and the canvas DPR cap. Weak devices get a lighter city, not a slideshow.
2. **Frame-rate cap** — the world is fully redrawn per rendered frame, so a 120 Hz
   panel would quadruple the cost for zero visible benefit at this pan speed. The
   loop skips vsyncs to hold 60 fps (30 in `minimal`), with `dt` computed from
   *rendered* frames so motion speed is unaffected.
3. **Runtime shed guard** — if the average frame over a ~2 s window is slower than
   25 fps (thermal throttling the benchmark couldn't see), a quarter of the cars
   and clouds are shed, down to a floor.

`prefers-reduced-motion` short-circuits all of it: one static frame, no loop.
