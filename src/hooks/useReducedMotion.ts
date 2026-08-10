import { useEffect, useState } from 'react';

/**
 * Tracks the user's `prefers-reduced-motion` setting at runtime.
 *
 * The CSS media query in global.css only neutralises CSS transitions;
 * framer-motion's JS-driven page/step transitions need this to collapse to
 * instant. Used to swap animated variants for a plain fade (or nothing).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
