import { useEffect, useRef, useState } from 'react';
import { dismissInstallPrompt, shouldOfferInstall } from '../lib/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

const MEANINGFUL_USE_DELAY_MS = 4000;

/** Gates the install banner on "first meaningful use" — open a few seconds with at least one task — so it never interrupts first-run. */
export function useInstallPrompt(taskCount: number) {
  const [state, setState] = useState<'android' | 'ios' | null>(null);
  const capturedEvent = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      capturedEvent.current = e as BeforeInstallPromptEvent;
    }
    function onAppInstalled() {
      dismissInstallPrompt();
      setState(null);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (taskCount < 1) return;
    const timer = window.setTimeout(() => {
      const offer = shouldOfferInstall({ hasCapturedPrompt: capturedEvent.current !== null });
      setState(offer);
    }, MEANINGFUL_USE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [taskCount]);

  async function promptInstall() {
    if (!capturedEvent.current) return;
    await capturedEvent.current.prompt();
    capturedEvent.current = null;
    setState(null);
  }

  function dismiss() {
    dismissInstallPrompt();
    setState(null);
  }

  return { state, promptInstall, dismiss };
}
