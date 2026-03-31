import { test, expect } from 'vitest';
import { triggerHaptic } from './haptics.ts';

// Helper to mock navigator
const setupNavigator = (vibrateFn: ((duration: number) => boolean) | null) => {
  if (typeof (global as any).navigator !== 'undefined') {
    Object.defineProperty(global, 'navigator', {
      value: vibrateFn ? { vibrate: vibrateFn } : {},
      configurable: true,
      writable: true
    });
  } else {
    (global as any).navigator = vibrateFn ? { vibrate: vibrateFn } : {};
  }
};

test('triggerHaptic handles missing navigator.vibrate', () => {
  setupNavigator(null);
  // Should not throw
  triggerHaptic(100);
});

test('triggerHaptic calls navigator.vibrate with correct duration', () => {
  let calledDuration: number | undefined;
  const mockVibrate = (duration: number) => {
    calledDuration = duration;
    return true;
  };

  setupNavigator(mockVibrate);

  triggerHaptic(100);
  expect(calledDuration).toBe(100);
});

test('triggerHaptic uses default duration of 50ms', () => {
  let calledDuration: number | undefined;
  const mockVibrate = (duration: number) => {
    calledDuration = duration;
    return true;
  };

  setupNavigator(mockVibrate);

  triggerHaptic();
  expect(calledDuration).toBe(50);
});

test('triggerHaptic silently catches vibration errors', () => {
  const mockVibrate = () => {
    throw new Error('Vibration failed');
  };

  setupNavigator(mockVibrate);

  // Should not throw
  triggerHaptic(100);
});
