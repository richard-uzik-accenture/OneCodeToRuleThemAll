import type { Transition, Variants } from 'framer-motion';

/**
 * Shared motion vocabulary for screen- and step-level transitions.
 *
 * branding.md §6: "slow to settle, fast to decide." Arrivals use the reflow
 * timing (~380ms, gentle spring, near-zero overshoot); nothing jarring, no
 * horizontal viewport slides (reads the same on mobile and desktop).
 *
 * These govern the *boundaries* between screens/steps. Per-element micro-
 * interactions live on the components themselves.
 */

// Matches --duration-reflow / --ease-reflow in tokens.css, expressed for framer-motion.
export const reflowSpring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 30,
  mass: 0.9,
};

const reflowTween: Transition = {
  duration: 0.38,
  ease: [0.22, 0.61, 0.36, 1],
};

/**
 * Top-level page transition: calm cross-fade with a soft vertical rise.
 * Same on mobile and desktop — no horizontal slide.
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: reflowSpring },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

/**
 * Morning-flow step transition: directional cross-fade forward — each step
 * enters from the right and exits left, reinforcing forward progress.
 */
export const stepVariants: Variants = {
  initial: { opacity: 0, x: 24 },
  enter: { opacity: 1, x: 0, transition: reflowTween },
  exit: { opacity: 0, x: -24, transition: { duration: 0.18, ease: 'easeIn' } },
};
