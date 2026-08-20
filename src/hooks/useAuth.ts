import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DEV_MODE, mockSession } from '../lib/devMock';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(DEV_MODE ? mockSession : null);
  const [loading, setLoading] = useState(!DEV_MODE);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (DEV_MODE) return;

    // Deliberately not using getSession() to seed initial state: it reads
    // straight from local storage and can resolve before the client has
    // validated/refreshed the token against the server, which raced a
    // PostgREST request into an RLS rejection right after sign-in. The
    // INITIAL_SESSION event from onAuthStateChange only fires once the
    // client has settled on a real, validated session (or confirmed there
    // isn't one), so it's the only signal `loading` should key off.
    const timeout = window.setTimeout(() => {
      setSessionError("couldn't verify your session — check your connection and try again");
      setLoading(false);
    }, 10000);

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      window.clearTimeout(timeout);
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null, confirmationSent: !error && !data.session };
  }

  async function signInWithGoogle() {
    if (DEV_MODE) {
      setSession(mockSession);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  }

  async function signInWithGithub() {
    if (DEV_MODE) {
      setSession(mockSession);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    if (DEV_MODE) {
      setSession(null);
      return;
    }
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      console.error('signOut failed', error);
      setSessionError("couldn't sign you out — check your connection and try again");
    }
  }

  return {
    session,
    loading,
    sessionError,
    dismissSessionError: () => setSessionError(null),
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    signingOut,
  };
}
