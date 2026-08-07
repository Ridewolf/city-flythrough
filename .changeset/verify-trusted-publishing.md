---
"@ridewolf/city-flythrough": patch
---

Verify this package's own trusted publisher. `0.1.0` was published by hand — npm cannot
configure a trusted publisher for a package that does not exist on the registry yet — so
the release workflow has never authenticated as itself here. `track-playback@0.1.1` has
since proved the workflow is correct, but each package carries its own trusted-publisher
entry, typed in separately, and a mistake in this one would first surface during a release
that mattered.

No functional change: the tarball is identical to `0.1.0` apart from the version and this
changelog entry. `0.1.1` is the first version published from CI, so it is also the first
to carry a provenance attestation.
