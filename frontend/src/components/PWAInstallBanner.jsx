import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import gcLogo from '../assets/gc.png';
import '../styles/pwa.css';

export default function PWAInstallBanner() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(
    typeof window !== 'undefined' ? window.deferredPrompt || window.__pwaPrompt || null : null
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isApp);

    if (isApp) return;

    // Detect platform
    const ua = (window.navigator.userAgent || '').toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    // Listen for install prompt events
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      window.__pwaPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      window.deferredPrompt = null;
      window.__pwaPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      setIsVisible(false);
      setShowSheet(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.deferredPrompt || window.__pwaPrompt) {
      setDeferredPrompt(window.deferredPrompt || window.__pwaPrompt);
    }

    // Auto-show banner after 1.5 seconds if not already dismissed in this session
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.deferredPrompt || window.__pwaPrompt;
    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        promptEvent.prompt();
      } catch (err) {
        console.warn('[PWA] direct prompt error:', err);
      }
    }

    // If native prompt is not directly callable (e.g. iOS Safari), show lightweight slide-up sheet
    setShowSheet(true);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowSheet(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (isStandalone || (!isVisible && !showSheet)) return null;

  return (
    <>
      {isVisible && !showSheet && (
        <div className="pwa-install-banner" role="region" aria-label="Install GioChat">
          <div className="pwa-banner-content">
            <img src={gcLogo} alt="GioChat" className="pwa-banner-icon" />
            <div className="pwa-banner-text">
              <span className="pwa-banner-title">Install GioChat</span>
              <span className="pwa-banner-desc">Add to Home screen for quick chats</span>
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
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}

      {/* Lightweight Sheet for iOS Safari or browsers where manual action is required */}
      {showSheet && (
        <div className="pwa-sheet-backdrop" onClick={() => setShowSheet(false)}>
          <div className="pwa-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-sheet-header">
              <img src={gcLogo} alt="GioChat" className="pwa-sheet-logo" />
              <div className="pwa-sheet-title-box">
                <h4>Install GioChat to Screen</h4>
                <p>Use GioChat full-screen like a mobile app</p>
              </div>
              <button
                type="button"
                className="pwa-sheet-close-btn"
                onClick={() => setShowSheet(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="pwa-sheet-instruction">
              {isIOS ? (
                <>
                  <div className="pwa-sheet-step">
                    <span className="pwa-step-badge">1</span>
                    <span>Tap the <strong>Share</strong> button <i className="fa-solid fa-arrow-up-from-bracket" style={{ color: '#38bdf8' }}></i> at the bottom of Safari</span>
                  </div>
                  <div className="pwa-sheet-step">
                    <span className="pwa-step-badge">2</span>
                    <span>Select <strong>Add to Home Screen</strong> <i className="fa-regular fa-square-plus" style={{ color: '#22c55e' }}></i></span>
                  </div>
                </>
              ) : (
                <>
                  <div className="pwa-sheet-step">
                    <span className="pwa-step-badge">1</span>
                    <span>Tap the <strong>three dots (⋮)</strong> menu at the top right of Chrome</span>
                  </div>
                  <div className="pwa-sheet-step">
                    <span className="pwa-step-badge">2</span>
                    <span>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong></span>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              className="pwa-sheet-action-btn"
              onClick={() => setShowSheet(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
