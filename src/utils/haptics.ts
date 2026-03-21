export const triggerHaptic = (duration: number = 50) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    // Only vibrate if supported 
    try {
      navigator.vibrate(duration);
    } catch (e) {
      // Ignore vibration errors
    }
  }
};
