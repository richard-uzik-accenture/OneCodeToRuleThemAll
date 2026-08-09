import { useRef, useState } from 'react';
import { useDragControls } from 'framer-motion';

const LONG_PRESS_MS = 350;
const MOVE_CANCEL_THRESHOLD_PX = 10;

export function useLongPressDrag() {
  const dragControls = useDragControls();
  const [charging, setCharging] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  function cancel() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPointRef.current = null;
    setCharging(false);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse') {
      dragControls.start(e);
      return;
    }
    startPointRef.current = { x: e.clientX, y: e.clientY };
    setCharging(true);
    timerRef.current = window.setTimeout(() => {
      dragControls.start(e);
      timerRef.current = null;
      setCharging(false);
    }, LONG_PRESS_MS);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!startPointRef.current || timerRef.current === null) return;
    const dx = e.clientX - startPointRef.current.x;
    const dy = e.clientY - startPointRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD_PX) cancel();
  }

  return { dragControls, charging, onPointerDown, onPointerMove, onPointerUp: cancel, onPointerCancel: cancel };
}
