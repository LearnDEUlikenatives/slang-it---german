import confetti from 'canvas-confetti';

/**
 * Safe wrapper around canvas-confetti that ensures any promise rejection
 * (e.g., in headless browsers, unsupported environments, or unmounted DOM)
 * is safely caught without leaking unhandled promise rejections.
 */
export function fireConfetti(options?: confetti.Options): void {
  try {
    const result = confetti(options);
    if (result && typeof result.then === 'function') {
      result.catch(() => {
        // Silently handle canvas-confetti rejections in restricted environments
      });
    }
  } catch {
    // Silently ignore synchronous errors if canvas is unsupported
  }
}

export default fireConfetti;
