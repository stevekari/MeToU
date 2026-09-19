import { useState, useEffect } from 'react';
import gcLogo from '../assets/gc.png';
import '../styles/pwa.css';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(
    typeof window !== 'undefined' ? window.deferredPrompt || window.__pwaPrompt || null : null
  );
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running as standalone PWA
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isApp);

    if (isApp) return;

    const handleBeforeInstall = (e) => {
    };

    const handleAppInstalled = () => {
      window.deferredPrompt = null;
      window.__pwaPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.deferredPrompt || window.__pwaPrompt) {
      setDeferredPrompt(window.deferredPrompt || window.__pwaPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.deferredPrompt || window.__pwaPrompt;
    if (!promptEvent) {
      return;
    }

    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === 'accepted') {
        window.deferredPrompt = null;
        window.__pwaPrompt = null;
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.warn('[PWA] install error:', err);
    }
  };

  if (isStandalone || !deferredPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-banner" role="region" aria-label="Install GioChat">
      <div className="pwa-banner-content">
        <img src={gcLogo} alt="GioChat" className="pwa-banner-icon" />
        <div className="pwa-banner-text">
          <span className="pwa-banner-title">Install GioChat</span>
          <span className="pwa-banner-desc">Add to Home screen or desktop</span>
        </div>
      </div>
      <div className="pwa-banner-actions">
        <button
          type="button"
          className="pwa-install-btn"
          onClick={handleInstallClick}
        >
          <i className="fa-solid fa-download" style={{ marginRight: '6px' }}></i>
          Install
        </button>
        <button
          type="button"
          className="pwa-dismiss-btn"
          onClick={() => setDeferredPrompt(null)}
          aria-label="Dismiss"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
}
