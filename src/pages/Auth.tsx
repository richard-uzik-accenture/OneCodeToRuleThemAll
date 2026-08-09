import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mark } from '../components/icons/Mark';
import { ChevronLeft } from '../components/icons/ChevronLeft';

interface AuthProps {
  onBack: () => void;
}

const KNOWN_ERRORS: Record<string, string> = {
  'Invalid login credentials': "that password doesn't match",
  'User already registered': 'looks like you already have an account — try signing in',
};

function toBrandVoice(message: string): string {
  return KNOWN_ERRORS[message] ?? message;
}

export function Auth({ onBack }: AuthProps) {
  const { signIn, signUp } = useAuth();
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
    if (error) setError(toBrandVoice(error));
  }

  return (
    <div className="auth-shell">
      <button type="button" onClick={onBack} className="auth-back" aria-label="back">
        <ChevronLeft />
      </button>
      <div className="auth-frame">
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
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? (mode === 'signin' ? 'signing in…' : 'creating account…') : mode === 'signin' ? 'sign in' : 'sign up'}
            </button>
          </form>

          <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="auth-switch">
            {mode === 'signin' ? "don't have an account? sign up" : 'already have an account? sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
