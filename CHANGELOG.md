# @ridewolf/city-flythrough

## 0.2.0

### Minor Changes

- [#5](https://github.com/Ridewolf/city-flythrough/pull/5) [`c693b2c`](https://github.com/Ridewolf/city-flythrough/commit/c693b2c030128ce0c92cfb83358218870af0c519) Thanks [@oxygrimmkiv](https://github.com/oxygrimmkiv)! - Add `onOverlay`, so a consumer can draw on top of the finished scene, and export
  `agentDrawPos` so it can pin what it draws to a car.

  The scene owns its frame loop, which left no way to add anything to it: an app
  wanting a label above a moving car had to either fork the renderer or run a
  second canvas and re-derive the camera. `onOverlay` runs once per rendered
  frame, after the scene, with the context already under the world transform —
  the same one `renderFrame` draws in — so `agentDrawPos(car)` is directly usable
  and no viewport arithmetic is needed. The transform is translate-only, so text
  and line widths keep their pixel sizes.

  The callback also receives `dt`, `elapsed`, `view` and the live `agents` array
  (not a copy), which is what an overlay needs to animate and to notice when the
  sim recycles the car it was following.

  Both are additive: existing callers are unaffected.

## 0.1.1

### Patch Changes

- [#3](https://github.com/Ridewolf/city-flythrough/pull/3) [`523de0d`](https://github.com/Ridewolf/city-flythrough/commit/523de0d15b62d700817280d644c825bf30edc108) Thanks [@oxygrimmkiv](https://github.com/oxygrimmkiv)! - Verify this package's own trusted publisher. `0.1.0` was published by hand — npm cannot
  configure a trusted publisher for a package that does not exist on the registry yet — so
  the release workflow has never authenticated as itself here. `track-playback@0.1.1` has
  since proved the workflow is correct, but each package carries its own trusted-publisher
  entry, typed in separately, and a mistake in this one would first surface during a release
  that mattered.

  No functional change: the tarball is identical to `0.1.0` apart from the version and this
  changelog entry. `0.1.1` is the first version published from CI, so it is also the first
  to carry a provenance attestation.

## 0.1.0 — 2026-07-31

### Minor Changes

- First public release: a procedural city with living traffic on a 2D canvas — deterministic world
  generation, real traffic lights and roundabouts, lane discipline, and a three-layer adaptive
  performance envelope.
