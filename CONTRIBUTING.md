# Contributing to @ridewolf/city-flythrough

General Ridewolf contribution rules (code of conduct, PR conventions, commit style) live
in the [organization-wide guide](https://github.com/Ridewolf/.github/blob/main/CONTRIBUTING.md) —
this file covers what's specific to this repository.

## Development setup

Requires [Bun](https://bun.sh) ≥ 1.1.

```bash
git clone https://github.com/Ridewolf/city-flythrough.git
cd city-flythrough
bun install

bun test              # 22 tests, headless
bun run lint          # biome check
bun run typecheck     # tsc --noEmit (strict)
bun run build         # dist/ — ESM + .d.ts
```

## What contributions help most

- **New block types and palettes** — waterfronts, rail lines, stadiums; a dawn or
  neon theme.
- **Vehicle variety** — buses with stops, emergency vehicles that others yield to,
  pedestrians at crossings.
- **More traffic realism** — turn signals, yellow-light dilemma zones, unequal light
  phases on avenues.

## Conventions

- **The world stays a pure function of coordinates.** Nothing about a road, block, or
  junction may be stored — that's what makes the endless camera free.
- **All randomness flows through the injected RNG.** A seeded run must be reproducible;
  the soak test depends on it.
- Canvas calls live only in `render.ts`; the simulation must stay runnable headlessly.
- New behaviours need an invariant test, not just a screenshot.
