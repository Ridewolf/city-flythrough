<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-white.png">
    <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/logo-dark.png" alt="Ridewolf" width="260">
  </picture>
  <h1>@ridewolf/city-flythrough</h1>
  <p>A procedural city with living traffic, on a plain 2D canvas.<br>
  Deterministic world generation, real traffic lights and roundabouts,<br>
  lane discipline, and adaptive performance. Zero dependencies.</p>
</div>

<p align="center">
  <a href="https://github.com/Ridewolf/city-flythrough/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Ridewolf/city-flythrough/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@ridewolf/city-flythrough"><img alt="npm" src="https://img.shields.io/npm/v/@ridewolf/city-flythrough"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6">
  <img alt="Canvas" src="https://img.shields.io/badge/renders%20to-2D%20canvas-e8842c">
  <img alt="Dependencies" src="https://img.shields.io/badge/dependencies-0-3fb950">
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue"></a>
</p>

---

<!-- docs-i18n:switcher -->
<p align="center"><sub><b>English</b> · <a href="docs/i18n/ru/README.md">Русский</a> · <a href="docs/i18n/ro/README.md">Română</a> · <a href="docs/i18n/de/README.md">Deutsch</a> · <a href="docs/i18n/es/README.md">Español</a> · <a href="docs/i18n/fr/README.md">Français</a> · <a href="docs/i18n/it/README.md">Italiano</a> · <a href="docs/i18n/pt/README.md">Português</a> · <a href="docs/i18n/uk/README.md">Українська</a> · <a href="docs/i18n/pl/README.md">Polski</a> · <a href="docs/i18n/tr/README.md">Türkçe</a> · <a href="docs/i18n/sv/README.md">Svenska</a> · <a href="docs/i18n/nl/README.md">Nederlands</a> · <a href="docs/i18n/el/README.md">Ελληνικά</a> · <a href="docs/i18n/ar/README.md">العربية</a> · <a href="docs/i18n/he/README.md">עברית</a></sub></p>
<!-- /docs-i18n:switcher -->

<p align="center">
  <img src="https://raw.githubusercontent.com/Ridewolf/city-flythrough/main/docs/demo.gif" width="680"
       alt="The camera drifting over the procedural city: cars queue at traffic lights, circulate roundabouts and change lanes">
</p>

A camera drifts over an endless city. Roads have widths and speed limits; cars keep
to their lanes, queue at red lights, yield into roundabouts, plan proper turning
arcs, occasionally break down and jam a lane. Blocks are buildings, parks, and
plazas. Clouds drift over; very rarely, a plane crosses. None of it is recorded or
faked — it's a **real micro-simulation** over a world that is a pure function of
coordinates, so it runs forever in a few kilobytes and never repeats.

Built as a lock-screen backdrop for a production mobility app; extracted because it
turned out to be the fun kind of engineering worth sharing.

## Quickstart

```bash
bun add @ridewolf/city-flythrough
```

```ts
import { createCityFlythrough } from '@ridewolf/city-flythrough';

const flythrough = createCityFlythrough(document.querySelector('canvas'), {
  theme: 'dark',      // or 'light'; switchable live via setTheme()
  minimal: false,     // true → lighter budgets for background use
});
flythrough.start();
```

Or run the bundled demo: `bun run build && bunx serve .` →
[examples/demo.html](examples/demo.html).

## What makes it interesting

- **Deterministic world** — every road class, block, roundabout, and light phase is
  a hash of its grid coordinates. The camera can fly anywhere and come back;
  nothing is stored, nothing drifts.
- **Honest traffic** — car following with queue compression, asymptotic braking to
  stop lines, roundabout yield arcs, lane-aware turning arcs that never cross the
  oncoming side, gap-checked lane changes, rare in-lane breakdowns.
- **Adaptive performance** — a mount-time micro-benchmark scales entity budgets and
  the DPR cap to the device (0.25×–1.2×); a runtime guard sheds cars if thermals
  bite anyway; a frame cap stops 120 Hz panels from paying quadruple for a slow pan.
  `prefers-reduced-motion` renders a single static frame.
- **Testable by construction** — all randomness flows through an injected RNG. The
  suite drives seeded simulations and asserts real invariants: lights are never
  green both ways, cars never overlap, roundabouts never trap anyone, a 3 600-step
  soak stays finite and lane-disciplined.

## API

| Export | Purpose |
| --- | --- |
| `createCityFlythrough(canvas, options)` | The full backdrop: `start` / `stop` / `setTheme` / `destroy`, plus live `sim` and `sky` handles. |
| `TrafficSim`, `Sky` | The simulation layers, usable headlessly (that's how the tests run them). |
| `renderFrame`, `PALETTE_DARK`, `PALETTE_LIGHT` | The renderer and themes — bring your own loop or palette. |
| `roadInfo`, `lightGreen`, `hash`, ... | The deterministic world functions, exported individually. |
| `measurePerfFactor`, `dprCapFor` | The device benchmark, reusable for any canvas scene. |
| `agentDrawPos` | Where a car is painted, in world coordinates — for overlays that have to agree with the renderer. |

Options: `minimal`, `theme` / `palette`, `rng` (deterministic scenes),
`respectReducedMotion`, and `onOverlay`.

### Drawing on top of the scene

`onOverlay` runs once per rendered frame, after the scene, with the context
already in **world coordinates** — so `agentDrawPos(car)` lands where that car
was drawn, with no viewport arithmetic:

```ts
createCityFlythrough(canvas, {
  onOverlay: (ctx, { dt, agents }) => {
    const car = agents[0];
    if (!car) return;
    const { px, py } = agentDrawPos(car);
    ctx.fillText('42 km/h', px, py - 14);
  },
});
```

The transform is translate-only, so text and line widths keep their pixel sizes.
Anything that persists across frames should advance on `dt` and drop its subject
once it leaves `agents` — the sim recycles cars that go off-screen, and a handle
kept past that pins an overlay to a car the scene no longer draws.

## Performance

Measured with [mitata](https://github.com/evanwashere/mitata) on an Apple M4, Bun 1.3
(`bun run bench`, seeded simulation, 1280×800 viewport):

| Cars on screen | `sim.step` | `renderFrame` (JS side) |
| --- | --- | --- |
| 40 | 5.5 µs | 74 µs |
| 120 | 19.1 µs | 76 µs |
| 300 | 54.9 µs | 94 µs |

Plus the world functions the camera leans on constantly: `roadInfo` ≈ 3.6 ns, `hash` ≈ 7.3 ns
per call — cheap enough that nothing needs caching, which is why flying anywhere and coming
back costs nothing and stores nothing.

**Read these honestly.** `renderFrame` here runs against a no-op context, so the table is *our*
per-frame work, not the GPU's rasterization — on a real device fill rate dominates, and that is
exactly what the DPR cap exists to control. Tripling the traffic multiplies the simulation cost
by ten but barely moves the drawing cost, because the city itself (roads, blocks, trees) is most
of the frame. Even at 300 cars the JS side of a frame is ~0.15 ms against a 16.7 ms budget at
60 Hz, so the adaptive budget is there for weak GPUs and thermal throttling, not for the maths.

## Documentation

- [The simulation](docs/simulation.md) — the world hashing, the traffic model, and
  the three-layer performance envelope.

## Why we built this

At [Ridewolf](https://ridewolf.com) the operator app needed a lock screen that felt
alive without shipping video assets or burning batteries. A procedural city was the
answer — and somewhere between "cars should stop at lights" and "entrants must
yield to the ring", it quietly became a traffic simulation with opinions. It now
doubles as our favourite demo of adaptive canvas performance.

## Contributing

Contributions welcome — new block types, vehicle behaviours, and palettes
especially. See the [contributing guide](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md).
Run `bun test`, `bun run lint`, `bun run typecheck` before a PR. Security issues:
[SECURITY.md](https://github.com/Ridewolf/.github/blob/main/SECURITY.md) — never in a public issue.

## License

[MIT](LICENSE) © [Ridewolf](https://ridewolf.com)
