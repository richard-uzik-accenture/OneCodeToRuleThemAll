import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthProps {
  onBack: () => void;
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
    if (error) setError(error);
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, width: 280 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ justifySelf: 'start', background: 'none', border: 'none', color: 'var(--dusk)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          ← back
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'lowercase', color: 'var(--violet)' }}>
          reflow
        </h1>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
        />
        {error && <p style={{ color: 'var(--dusk)' }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? (mode === 'signin' ? 'signing in…' : 'creating account…') : mode === 'signin' ? 'sign in' : 'sign up'}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          style={{ background: 'none', border: 'none', color: 'var(--dusk)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          {mode === 'signin' ? "don't have an account? sign up" : 'already have an account? sign in'}
        </button>
      </form>
    </div>
  );
}
