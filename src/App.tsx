import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { useReducedMotion } from './hooks/useReducedMotion';
import { pageVariants } from './lib/transitions';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Today } from './pages/Today';
import { VersionBadge } from './components/VersionBadge';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const { session, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const reducedMotion = useReducedMotion();

  // Optimistic: most visits are an already-authenticated user landing on
  // Today, so render Today immediately (it shows its own loading skeleton)
  // instead of a blank screen while the session check resolves — this keeps
  // the whole load as one continuous skeleton-to-content transition instead
  // of an extra screen swap. If it turns out there's no session, this
  // cross-fades into Landing/Auth like any other screen swap.
  const screen = loading || session ? 'today' : showAuth ? 'auth' : 'landing';

  // Note: Today's fixed-position overlays (FAB, add-task modal, compare duel,
  // morning flow) are portaled to document.body so the page-transition
  // transform on .screen-frame never becomes their containing block.
  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screen}
          className="screen-frame"
          variants={reducedMotion ? undefined : pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
        >
          {screen === 'today' && <Today />}
          {screen === 'auth' && <Auth onBack={() => setShowAuth(false)} />}
          {screen === 'landing' && <Landing onGetStarted={() => setShowAuth(true)} />}
        </motion.div>
      </AnimatePresence>
      <VersionBadge />
      <Analytics />
    </>
  );
}

export default App;
