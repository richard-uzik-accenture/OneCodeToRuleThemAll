const SWIPE_VELOCITY_PX_S = 500;

export function decideSwipe(offsetX: number, velocityX: number, thresholdPx: number): 1 | -1 | null {
  if (offsetX > thresholdPx || (velocityX > SWIPE_VELOCITY_PX_S && offsetX > 0)) return 1;
  if (offsetX < -thresholdPx || (velocityX < -SWIPE_VELOCITY_PX_S && offsetX < 0)) return -1;
  return null;
}
