---
"@ridewolf/city-flythrough": minor
---

Add `onOverlay`, so a consumer can draw on top of the finished scene, and export
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
