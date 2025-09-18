import { useCallback, useRef } from 'react';

interface UseSettingsTriggerOptions {
  onOpenSettings: () => void;
  doubleTapThreshold?: number;
}

export const useSettingsTrigger = ({
  onOpenSettings,
  doubleTapThreshold = 300,
}: UseSettingsTriggerOptions) => {
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disabledUntilRef = useRef<number>(0);

  const handleDoubleTap = useCallback((_event: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();

    // Check if temporarily disabled
    if (now < disabledUntilRef.current) {
      return;
    }

    // Handle double-tap detection
    tapCountRef.current += 1;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (tapCountRef.current === 1) {
      // First tap - start timer
      timeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, doubleTapThreshold);
    } else if (tapCountRef.current === 2) {
      // Second tap - check if within threshold
      if (now - lastTapRef.current < doubleTapThreshold) {
        onOpenSettings();
      }
      tapCountRef.current = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    lastTapRef.current = now;
  }, [onOpenSettings, doubleTapThreshold]);

  // For React event handlers - only use touch events to avoid interfering with clicks
  const bindDoubleTap = {
    onTouchStart: handleDoubleTap,
  };

  const temporarilyDisable = useCallback((duration: number = 1000) => {
    disabledUntilRef.current = Date.now() + duration;
  }, []);

  return {
    bindDoubleTap,
    temporarilyDisable,
  };
};