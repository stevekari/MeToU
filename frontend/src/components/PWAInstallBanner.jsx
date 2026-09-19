import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import gioLogo from '../assets/gio.png';
import '../styles/pwa.css';

export default function PWAInstallBanner() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      return;
    }

    // Check if user dismissed it in this session
    const isDismissed = sessionStorage.getItem('pwa_install_dismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|edge|opr/.test(userAgent);

    if (isIosDevice && isSafari) {
      setIsIOS(true);
      setIsVisible(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent automatic browser mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSModal(false);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="pwa-install-banner" role="region" aria-label={t('installApp')}>
        <div className="pwa-banner-content">
          <img src={gioLogo} alt="GioChat" className="pwa-banner-icon" />
          <div className="pwa-banner-text">
            <span className="pwa-banner-title">{t('installApp')}</span>
            <span className="pwa-banner-desc">{t('installAppDesc')}</span>
          </div>
        </div>
        <div className="pwa-banner-actions">
          <button
            type="button"
            className="pwa-install-btn"
            onClick={handleInstallClick}
          >
            <i className="fa-solid fa-download" style={{ marginRight: '6px' }}></i>
            {t('install')}
          </button>
          <button
            type="button"
            className="pwa-dismiss-btn"
            onClick={handleDismiss}
            aria-label={t('cancel')}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      {showIOSModal && (
        <div className="pwa-ios-modal-backdrop" onClick={() => setShowIOSModal(false)}>
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pwa-ios-modal-close"
              onClick={() => setShowIOSModal(false)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <img src={gioLogo} alt="GioChat" className="pwa-ios-modal-icon" />
            <h3 className="pwa-ios-modal-title">{t('installApp')}</h3>
            <p className="pwa-ios-modal-instruction">
              1. Tap the <strong>Share</strong> button <i className="fa-solid fa-arrow-up-from-bracket pwa-share-icon"></i> in Safari’s bottom toolbar.
            </p>
            <p className="pwa-ios-modal-instruction">
              2. Scroll down and select <strong>Add to Home Screen</strong> <i className="fa-regular fa-square-plus pwa-plus-icon"></i>.
            </p>
            <p className="pwa-ios-modal-instruction">
              3. Tap <strong>Add</strong> at the top right to install GioChat on your screen!
            </p>
            <button
              type="button"
              className="pwa-ios-modal-done-btn"
              onClick={() => setShowIOSModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

