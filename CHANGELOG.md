# @ridewolf/city-flythrough

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
