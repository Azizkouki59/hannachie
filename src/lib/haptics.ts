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

/** Ultra-light tick for mobile carousel snap points & tab glides */
export function hapticTick(): void {
  triggerHapticFeedback(14);
}

/** Crisp tactile press for chips, toggles & bottom-dock buttons */
export function hapticTap(): void {
  triggerHapticFeedback(28);
}

/** Soft release tick when dismissing a sheet or drawer via swipe */
export function hapticDismiss(): void {
  triggerHapticFeedback(22);
}

/** Distinct double-pulse confirmation on form submit or WhatsApp launch */
export function hapticSuccess(): void {
  triggerHapticFeedback([18, 35, 24]);
}

