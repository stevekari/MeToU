import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePWA } from '../hooks/usePWA';
import gcLogo from '../assets/gc.png';
import '../styles/pwa.css';

export default function PWAInstallBanner() {
  const { t } = useLanguage();
  const { isStandalone, canInstall, isIOS, isAndroid, triggerInstall } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('ios');

  useEffect(() => {
    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    const isDismissed = sessionStorage.getItem('pwa_install_dismissed') === 'true';
    if (!isDismissed) {
      // Auto-show banner after 1.5 seconds if not dismissed
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isStandalone]);

  useEffect(() => {
    if (isIOS) setActiveGuideTab('ios');
    else if (isAndroid) setActiveGuideTab('android');
    else setActiveGuideTab('desktop');
  }, [isIOS, isAndroid]);

  const handleInstallClick = async () => {
    if (canInstall) {
      const outcome = await triggerInstall();
      if (outcome === 'accepted') {
        setIsVisible(false);
        return;
      }
    }
    // Open the device-specific installation guide
    setShowGuideModal(true);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowGuideModal(false);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (isStandalone || (!isVisible && !showGuideModal)) return null;

  return (
    <>
      {isVisible && (
        <div className="pwa-install-banner" role="region" aria-label={t('installApp')}>
          <div className="pwa-banner-content">
            <img src={gcLogo} alt="GioChat" className="pwa-banner-icon" />
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
      )}

      {showGuideModal && (
        <div className="pwa-ios-modal-backdrop" onClick={() => setShowGuideModal(false)}>
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pwa-ios-modal-close"
              onClick={() => setShowGuideModal(false)}
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="pwa-modal-header">
              <img src={gcLogo} alt="GioChat" className="pwa-ios-modal-icon" />
              <div>
                <h3 className="pwa-ios-modal-title">Install GioChat</h3>
                <p className="pwa-modal-subtitle">Add to your home screen or desktop for full-screen calling & fast access.</p>
              </div>
            </div>

            <div className="pwa-device-tabs">
              <button
                type="button"
                className={`pwa-tab-btn ${activeGuideTab === 'ios' ? 'active' : ''}`}
                onClick={() => setActiveGuideTab('ios')}
              >
                <i className="fa-brands fa-apple"></i> iPhone / iPad
              </button>
              <button
                type="button"
                className={`pwa-tab-btn ${activeGuideTab === 'android' ? 'active' : ''}`}
                onClick={() => setActiveGuideTab('android')}
              >
                <i className="fa-brands fa-android"></i> Android
              </button>
              <button
                type="button"
                className={`pwa-tab-btn ${activeGuideTab === 'desktop' ? 'active' : ''}`}
                onClick={() => setActiveGuideTab('desktop')}
              >
                <i className="fa-solid fa-desktop"></i> Desktop / Mac
              </button>
            </div>

            <div className="pwa-guide-steps">
              {activeGuideTab === 'ios' && (
                <>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <div>
                      Tap the <strong>Share</strong> button <i className="fa-solid fa-arrow-up-from-bracket pwa-share-icon"></i> in Safari’s bottom toolbar.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <div>
                      Scroll down and tap <strong>Add to Home Screen</strong> <i className="fa-regular fa-square-plus pwa-plus-icon"></i>.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">3</span>
                    <div>
                      Tap <strong>Add</strong> in the top-right corner.
                    </div>
                  </div>
                </>
              )}

              {activeGuideTab === 'android' && (
                <>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <div>
                      Tap the <strong>three dots menu (⋮)</strong> at the top right of Chrome or your browser.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <div>
                      Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">3</span>
                    <div>
                      Confirm <strong>Install</strong> to add GioChat to your home screen!
                    </div>
                  </div>
                </>
              )}

              {activeGuideTab === 'desktop' && (
                <>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <div>
                      Click the <strong>Install icon</strong> <i className="fa-solid fa-download pwa-share-icon"></i> on the right side of the browser URL address bar.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <div>
                      Or open the browser menu (⋮) and choose <strong>Install GioChat</strong>.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">3</span>
                    <div>
                      Click <strong>Install</strong> to launch as a standalone desktop app.
                    </div>
                  </div>
                </>
              )}
            </div>

            {canInstall && (
              <button
                type="button"
                className="pwa-modal-install-action"
                onClick={async () => {
                  await triggerInstall();
                  setShowGuideModal(false);
                }}
              >
                <i className="fa-solid fa-download"></i> Install Now
              </button>
            )}

            <button
              type="button"
              className="pwa-ios-modal-done-btn"
              onClick={() => setShowGuideModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
