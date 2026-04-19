/**
 * Thin wrapper around the vibration API for UI feedback. Always use
 * these helpers instead of calling `navigator.vibrate` directly so
 * patterns stay consistent across the app and are easy to tune.
 *
 * The `navigator.vibrate` API is:
 *  - No-op on desktop and iOS Safari (so callers don't need to branch).
 *  - Only meaningful on Android Chrome and a handful of mobile browsers.
 *
 * Three canonical patterns — keep the vocabulary small:
 *
 *  - `tick()`   — 10 ms pulse. Acknowledge a binary action that
 *                 succeeded (join, leave, send, follow).
 *  - `confirm()` — short two-pulse. Bigger decisions (publish, delete,
 *                  block) where the user wants reassurance it happened.
 *  - `warn()`   — longer pulse for destructive or error feedback.
 */

function run(pattern) {
  if (typeof navigator === "undefined") return;
  const fn = navigator.vibrate?.bind(navigator);
  if (!fn) return;
  try {
    fn(pattern);
  } catch {
    // Some embedded webviews throw when vibration is unsupported; stay silent.
  }
}

export function tick() {
  run(10);
}

export function confirm() {
  run([15, 40, 15]);
}

export function warn() {
  run(35);
}

export default { tick, confirm, warn };
