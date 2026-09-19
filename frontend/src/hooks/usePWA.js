import { useState, useEffect } from 'react';

let globalDeferredPrompt = null;
const listeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    listeners.forEach((cb) => cb(e));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    listeners.forEach((cb) => cb(null));
  });
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
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

    const updatePrompt = (prompt) => setDeferredPrompt(prompt);
    listeners.add(updatePrompt);
    return () => listeners.delete(updatePrompt);
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
      }
      return choice.outcome;
    }
    return null;
  };

  return {
    isStandalone,
    canInstall: Boolean(deferredPrompt),
    isIOS,
    isAndroid,
    triggerInstall,
    deferredPrompt,
  };
}

