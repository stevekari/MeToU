import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(
    typeof window !== 'undefined' ? window.deferredPrompt || null : null
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(isApp);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Detect Android
    const android = /android/.test(userAgent);
    setIsAndroid(android);

    const updatePrompt = (e) => {
      const prompt = e?.detail || window.deferredPrompt;
      if (prompt) {
        setDeferredPrompt(prompt);
      }
    };

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
      window.dispatchEvent(new CustomEvent('pwa-prompt-ready', { detail: e }));
    };

    const handleAppInstalled = () => {
      window.deferredPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('pwa-prompt-ready', updatePrompt);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwa-installed', handleAppInstalled);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
    }

    return () => {
      window.removeEventListener('pwa-prompt-ready', updatePrompt);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-installed', handleAppInstalled);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.deferredPrompt : null);
    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === 'accepted') {
          window.deferredPrompt = null;
          setDeferredPrompt(null);
          setIsStandalone(true);
          return { success: true };
        }
        return { success: false, outcome: 'dismissed' };
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
    return { success: false, notSupported: true, isIOS, isAndroid };
  };

  return {
    canInstall: !isStandalone,
    hasPrompt: !!(deferredPrompt || (typeof window !== 'undefined' && window.deferredPrompt)),
    isStandalone,
    isIOS,
    isAndroid,
    installApp,
  };
}
