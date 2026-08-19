import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DEV_MODE, mockSession } from '../lib/devMock';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(DEV_MODE ? mockSession : null);
  const [loading, setLoading] = useState(!DEV_MODE);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (DEV_MODE) return;

    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
        setLoading(false);
      })
      .catch((err) => {
        console.error('getSession failed', err);
        setSessionError("couldn't verify your session — check your connection and try again");
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    if (DEV_MODE) {
      setSession(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('signOut failed', error);
      setSessionError("couldn't sign you out — check your connection and try again");
    }
  }

  return { session, loading, sessionError, dismissSessionError: () => setSessionError(null), signIn, signUp, signOut };
}
