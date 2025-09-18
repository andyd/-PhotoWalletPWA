import { useState, useRef, useCallback } from 'react';
import { useSpring } from 'react-spring';
import { useDrag, usePinch, useWheel } from '@use-gesture/react';
import { GESTURE_CONFIG } from '../utils/constants';

export interface GestureState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface UseGesturesOptions {
  onSwipe?: (direction: 'left' | 'right') => void;
  onDoubleTap?: () => void;
  initialScale?: number;
  maxScale?: number;
  minScale?: number;
}

export const useGestures = ({
  onSwipe,
  onDoubleTap,
  initialScale = 1,
  maxScale = GESTURE_CONFIG.ZOOM_MAX,
  minScale = GESTURE_CONFIG.ZOOM_MIN,
}: UseGesturesOptions = {}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const lastTapRef = useRef<number>(0);

  const [{ x, y, scale, rotation }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: initialScale,
    rotation: 0,
    config: GESTURE_CONFIG.SPRING_CONFIG,
  }));

  const resetTransform = useCallback(() => {
    api.start({
      x: 0,
      y: 0,
      scale: initialScale,
      rotation: 0,
    });
    setIsZoomed(false);
  }, [api, initialScale]);

  const zoomTo = useCallback((targetScale: number, centerX = 0, centerY = 0) => {
    const clampedScale = Math.min(Math.max(targetScale, minScale), maxScale);

    api.start({
      scale: clampedScale,
      x: centerX,
      y: centerY,
    });

    setIsZoomed(clampedScale > initialScale);
  }, [api, initialScale, maxScale, minScale]);

  const dragBind = useDrag(
    ({ offset: [mx, my], movement: [dx], velocity: [vx], direction: [dirX], cancel, tap, memo }) => {
      if (tap) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;

        if (timeSinceLastTap < GESTURE_CONFIG.DOUBLE_TAP_THRESHOLD) {
          if (onDoubleTap) {
            onDoubleTap();
          } else if (isZoomed) {
            resetTransform();
          } else {
            zoomTo(2, 0, 0);
          }
        }

        lastTapRef.current = now;
        return;
      }

      if (!memo) {
        memo = {
          x: x.get(),
          y: y.get(),
          scale: scale.get(),
        };
      }

      if (!isZoomed) {
        if (Math.abs(dx) > GESTURE_CONFIG.SWIPE_THRESHOLD && Math.abs(vx) > GESTURE_CONFIG.SWIPE_VELOCITY_THRESHOLD) {
          if (onSwipe) {
            onSwipe(dirX > 0 ? 'right' : 'left');
          }
          cancel();
          return memo;
        }
      } else {
        api.start({
          x: memo.x + mx / memo.scale,
          y: memo.y + my / memo.scale,
          immediate: true,
        });
      }

      return memo;
    },
    {
      axis: isZoomed ? undefined : 'x',
      bounds: isZoomed ? { left: -200, right: 200, top: -200, bottom: 200 } : undefined,
      rubberband: true,
    }
  );

  const pinchBind = usePinch(
    ({ offset: [s, a], origin: [ox, oy], memo }) => {
      if (!memo) {
        memo = {
          x: x.get(),
          y: y.get(),
          scale: scale.get(),
        };
      }

      const newScale = Math.min(Math.max(s * memo.scale, minScale), maxScale);

      api.start({
        scale: newScale,
        x: memo.x + (ox - window.innerWidth / 2) / newScale,
        y: memo.y + (oy - window.innerHeight / 2) / newScale,
        rotation: memo.scale > 1 ? a : 0,
        immediate: true,
      });

      setIsZoomed(newScale > initialScale);

      return memo;
    },
    {
      scaleBounds: { min: minScale, max: maxScale },
      rubberband: true,
    }
  );

  const wheelBind = useWheel(
    ({ delta: [, deltaY], ctrlKey }) => {
      if (!ctrlKey) return;

      const currentScale = scale.get();
      const factor = 1 + Math.abs(deltaY) * 0.01;
      const newScale = deltaY < 0 ? currentScale * factor : currentScale / factor;

      zoomTo(newScale);
    },
    {
      preventDefault: true,
    }
  );

  return {
    bind: {
      ...dragBind(),
      ...pinchBind(),
      ...wheelBind(),
    },
    style: {
      transform: x
        .to([0, 1], [0, 1])
        .to((x) => `translate3d(${x}px, ${y.get()}px, 0) scale(${scale.get()}) rotate(${rotation.get()}deg)`),
    },
    state: {
      x: x.get(),
      y: y.get(),
      scale: scale.get(),
      rotation: rotation.get(),
    },
    isZoomed,
    resetTransform,
    zoomTo,
  };
};