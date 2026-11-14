/**
 * Triggers tangible haptic vibration feedback on supported mobile devices
 * using the Web Vibration API (`window.navigator.vibrate(50)`).
 */
export function triggerHapticFeedback(duration: number | number[] = 50): void {
  if (typeof window === "undefined" || typeof window.navigator === "undefined") {
    return;
  }
  try {
    if (typeof window.navigator.vibrate === "function") {
      window.navigator.vibrate(duration);
    }
  } catch {
    // Ignore errors in browsers or WebViews that restrict vibration
  }
}
