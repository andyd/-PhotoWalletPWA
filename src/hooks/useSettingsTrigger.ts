import { useCallback, useRef } from 'react';

interface UseSettingsTriggerOptions {
  onOpenSettings: () => void;
  doubleTapThreshold?: number;
  lowerScreenPercentage?: number;
}

export const useSettingsTrigger = ({
  onOpenSettings,
  doubleTapThreshold = 300,
  lowerScreenPercentage = 10,
}: UseSettingsTriggerOptions) => {
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disabledUntilRef = useRef<number>(0);

  const handleTouch = useCallback((event: React.TouchEvent | TouchEvent) => {
    if (event.touches.length !== 1) return;

    const now = Date.now();

    // Check if temporarily disabled
    if (now < disabledUntilRef.current) {
      return;
    }

    const touch = event.touches[0];
    const screenHeight = window.innerHeight;
    const lowerScreenThreshold = screenHeight - (screenHeight * lowerScreenPercentage / 100);

    // Check if tap is in lower 10% of screen
    if (touch.clientY >= lowerScreenThreshold) {
      onOpenSettings();
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
  }, [onOpenSettings, doubleTapThreshold, lowerScreenPercentage]);

  const handleClick = useCallback((event: React.MouseEvent | MouseEvent) => {
    const now = Date.now();

    // Check if temporarily disabled
    if (now < disabledUntilRef.current) {
      return;
    }

    const screenHeight = window.innerHeight;
    const lowerScreenThreshold = screenHeight - (screenHeight * lowerScreenPercentage / 100);

    // Check if click is in lower 10% of screen
    if (event.clientY >= lowerScreenThreshold) {
      onOpenSettings();
      return;
    }

    // Handle double-click detection for mouse events
    tapCountRef.current += 1;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (tapCountRef.current === 1) {
      timeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, doubleTapThreshold);
    } else if (tapCountRef.current === 2) {
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
  }, [onOpenSettings, doubleTapThreshold, lowerScreenPercentage]);

  // For React event handlers
  const bindTouch = {
    onTouchStart: handleTouch,
  };

  const bindClick = {
    onClick: handleClick,
  };

  // For vanilla DOM event listeners
  const addEventListeners = useCallback((element: HTMLElement) => {
    element.addEventListener('touchstart', handleTouch as EventListener);
    element.addEventListener('click', handleClick as EventListener);

    return () => {
      element.removeEventListener('touchstart', handleTouch as EventListener);
      element.removeEventListener('click', handleClick as EventListener);
    };
  }, [handleTouch, handleClick]);

  const temporarilyDisable = useCallback((duration: number = 1000) => {
    disabledUntilRef.current = Date.now() + duration;
  }, []);

  return {
    bindTouch,
    bindClick,
    addEventListeners,
    temporarilyDisable,
  };
};