import { useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Mark } from './icons/Mark';
import { Share } from './icons/Share';
import { Plus } from './icons/Plus';

interface InstallPromptProps {
  taskCount: number;
}

const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 24 },
};

export function InstallPrompt({ taskCount }: InstallPromptProps) {
  const { state, promptInstall, dismiss } = useInstallPrompt(taskCount);
  const [sheetOpen, setSheetOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  if (!state) return null;

  const transition = reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 260, damping: 30, mass: 0.9 };

  if (sheetOpen) {
    return (
      <motion.div
        className="install-sheet-scrim"
        onClick={() => setSheetOpen(false)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <motion.div
          className="install-sheet"
          onClick={(e) => e.stopPropagation()}
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition }}
          exit={{ opacity: 0, y: 24, transition: { duration: 0.15 } }}
        >
          <p className="install-sheet-title">add reflow to your home screen</p>
          <ol className="install-sheet-steps">
            <li><Share width={18} height={18} /> tap the share icon</li>
            <li><Plus width={18} height={18} /> choose "add to home screen"</li>
            <li>tap "add"</li>
          </ol>
          <button
            className="install-sheet-done"
            onClick={() => {
              dismiss();
              setSheetOpen(false);
            }}
          >
            got it
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="install-banner"
      initial={slideUp.initial}
      animate={{ ...slideUp.animate, transition }}
      exit={{ ...slideUp.exit, transition: { duration: 0.18 } }}
    >
      <Mark className="install-banner-mark" width={32} height={32} />
      <span className="install-banner-copy">keep reflow one tap away</span>
      <div className="install-banner-actions">
        <button
          className="install-banner-install"
          onClick={() => (state === 'ios' ? setSheetOpen(true) : promptInstall())}
        >
          install
        </button>
        <button className="install-banner-dismiss" onClick={dismiss}>not now</button>
      </div>
    </motion.div>
  );
}
