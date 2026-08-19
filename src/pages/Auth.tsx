import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Mark } from '../components/icons/Mark';
import { ChevronLeft } from '../components/icons/ChevronLeft';
import { BorderGlow } from '../components/BorderGlow';

interface AuthProps {
  onBack: () => void;
}

const KNOWN_ERRORS: Record<string, string> = {
  'Invalid login credentials': "that email or password doesn't match",
  'User already registered': 'looks like you already have an account — try signing in',
  'Email not confirmed': 'that email still needs confirming — check your inbox',
  'Password should be at least 6 characters': 'needs to be at least 6 characters',
  'Signup requires a valid password': 'that password looks too short — try a longer one',
  'Unable to validate email address: invalid format': "that doesn't look like a valid email",
};

function fallbackError(mode: 'signin' | 'signup'): string {
  return mode === 'signin'
    ? "couldn't sign you in — check your details and try again"
    : "couldn't create your account — check your details and try again";
}

function toBrandVoice(message: string, mode: 'signin' | 'signup'): string {
  if (KNOWN_ERRORS[message]) return KNOWN_ERRORS[message];
  if (/rate limit|security purposes/i.test(message)) {
    return "too many tries — wait a moment and try again";
  }
  return fallbackError(mode);
}

export function Auth({ onBack }: AuthProps) {
  const { signIn, signUp } = useAuth();
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (error) setError(toBrandVoice(error, mode));
  }

  return (
    <div className="auth-shell">
      <button type="button" onClick={onBack} className="auth-back" aria-label="back">
        <ChevronLeft />
      </button>
      <div className="auth-frame">
        <BorderGlow borderRadius={24} glowRadius={28} edgeSensitivity={40}>
          <div className="auth-card">
            <Mark className="auth-mark" aria-hidden="true" />
            <h1 className="auth-wordmark">reflow</h1>

            <form onSubmit={handleSubmit} className="auth-form">
              <input
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="auth-input"
                required
              />
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="auth-input"
                required
              />
              <AnimatePresence>
                {error && (
                  <motion.p
                    className="auth-error"
                    role="alert"
                    initial={reducedMotion ? false : { opacity: 0, height: 0, marginBottom: -10 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <button type="submit" className="auth-submit" disabled={submitting}>
                {submitting ? (mode === 'signin' ? 'signing in…' : 'creating account…') : mode === 'signin' ? 'sign in' : 'sign up'}
              </button>
            </form>

            <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="auth-switch">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mode}
                  initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'inline-block' }}
                >
                  {mode === 'signin' ? "don't have an account? sign up" : 'already have an account? sign in'}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </BorderGlow>
      </div>
    </div>
  );
}
