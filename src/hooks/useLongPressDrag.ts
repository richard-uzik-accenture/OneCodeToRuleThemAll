import { useRef, useState } from 'react';
import { useDragControls } from 'framer-motion';

export const LONG_PRESS_MS = 350;
const MOVE_CANCEL_THRESHOLD_PX = 10;

export function useLongPressDrag() {
  const dragControls = useDragControls();
  const [charging, setCharging] = useState(false);
  const [dragging, setDragging] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  function cancel() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPointRef.current = null;
    setCharging(false);
    setDragging(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse') {
      dragControls.start(e);
      setDragging(true);
      return;
    }
    // Touch: prevent text selection and focus acquisition during long-press
    e.preventDefault();
    startPointRef.current = { x: e.clientX, y: e.clientY };
    setCharging(true);
    timerRef.current = window.setTimeout(() => {
      window.getSelection()?.removeAllRanges();
      timerRef.current = null;
      startPointRef.current = null;
      setCharging(false);
      setDragging(true);
      dragControls.start(e);
    }, LONG_PRESS_MS);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!startPointRef.current || timerRef.current === null) return;
    const dx = e.clientX - startPointRef.current.x;
    const dy = e.clientY - startPointRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD_PX) cancel();
  }

  return { dragControls, charging, dragging, onPointerDown, onPointerMove, onPointerUp: cancel, onPointerCancel: cancel };
}
