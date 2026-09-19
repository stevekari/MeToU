import { useState, useEffect } from 'react';

let globalDeferredPrompt = typeof window !== 'undefined' ? window.__pwaPrompt || null : null;
const listeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.__pwaPrompt = e;
    listeners.forEach((cb) => cb(e));
  });

  window.addEventListener('pwa-prompt-ready', (e) => {
    if (e.detail) {
      globalDeferredPrompt = e.detail;
      listeners.forEach((cb) => cb(e.detail));
    }
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    window.__pwaPrompt = null;
    listeners.forEach((cb) => cb(null));
  });
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(
    typeof window !== 'undefined' ? window.__pwaPrompt || globalDeferredPrompt : null
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    const ua = (window.navigator.userAgent || '').toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    if (window.__pwaPrompt) {
      setDeferredPrompt(window.__pwaPrompt);
    }

    const updatePrompt = (prompt) => setDeferredPrompt(prompt);
    listeners.add(updatePrompt);
    return () => listeners.delete(updatePrompt);
  }, []);

  const triggerInstall = async () => {
    const promptEvent = deferredPrompt || window.__pwaPrompt || globalDeferredPrompt;
    if (promptEvent && typeof promptEvent.prompt === 'function') {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === 'accepted') {
        globalDeferredPrompt = null;
        if (typeof window !== 'undefined') window.__pwaPrompt = null;
        setDeferredPrompt(null);
      }
      return choice?.outcome;
    }
    return null;
  };

  return {
    isStandalone,
    canInstall: Boolean(deferredPrompt || (typeof window !== 'undefined' && window.__pwaPrompt)),
    isIOS,
    isAndroid,
    triggerInstall,
    deferredPrompt,
  };
}
