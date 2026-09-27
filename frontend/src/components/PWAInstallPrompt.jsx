import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import gcLogo from '../assets/gc.png';
import '../styles/pwa.css';

export default function PWAInstallPrompt() {
  const { isStandalone, isIOS, isAndroid, hasPrompt, installApp } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if (isStandalone) {
      setShowPrompt(false);
      return;
    }

    const dismissed = sessionStorage.getItem('giochat_pwa_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isStandalone]);

  useEffect(() => {
    const handleOpenModal = () => {
      setShowGuideModal(true);
    };
    window.addEventListener('open-pwa-install-modal', handleOpenModal);
    return () => window.removeEventListener('open-pwa-install-modal', handleOpenModal);
  }, []);

  if (isStandalone && !showGuideModal) return null;

  const handleInstallClick = async () => {
    const res = await installApp();
    if (res?.success) {
      setShowPrompt(false);
      setShowGuideModal(false);
      sessionStorage.setItem('giochat_pwa_dismissed', '1');
    } else {
      // If browser doesn't support automatic prompt, show easy visual steps modal
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('giochat_pwa_dismissed', '1');
  };

  return (
    <>
      {showPrompt && !showGuideModal && (
        <div className="pwa-floating-bar" role="banner">
          <div className="pwa-floating-left">
            <img src={gcLogo} alt="GioChat" className="pwa-floating-icon" />
            <div className="pwa-floating-info">
              <span className="pwa-floating-title">Install GioChat App</span>
              <span className="pwa-floating-subtitle">Fast, full-screen chat & calls</span>
            </div>
          </div>

          <div className="pwa-floating-actions">
            <button type="button" className="pwa-btn-install" onClick={handleInstallClick}>
              <i className="fa-solid fa-download"></i> Install
            </button>
            <button
              type="button"
              className="pwa-btn-close"
              onClick={handleDismiss}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="pwa-modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="pwa-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="pwa-modal-close"
              onClick={() => setShowGuideModal(false)}
              aria-label="Close"
            >
              &times;
            </button>

            <div className="pwa-modal-header">
              <img src={gcLogo} alt="GioChat" className="pwa-modal-logo" />
              <h3>Install GioChat on Your Device</h3>
              <p>Add GioChat directly to your home screen or desktop for the best experience.</p>
            </div>

            {hasPrompt ? (
              <div className="pwa-modal-direct">
                <p>Click below to install instantly:</p>
                <button type="button" className="pwa-modal-btn-install" onClick={handleInstallClick}>
                  <i className="fa-solid fa-download"></i> Install GioChat Now
                </button>
              </div>
            ) : isIOS ? (
              <div className="pwa-modal-steps">
                <div className="pwa-step-item">
                  <span className="pwa-step-num">1</span>
                  <div className="pwa-step-text">
                    Tap the <strong>Share</strong> button <i className="fa-solid fa-arrow-up-from-bracket" style={{ color: '#38bdf8' }}></i> in the Safari toolbar.
                  </div>
                </div>
                <div className="pwa-step-item">
                  <span className="pwa-step-num">2</span>
                  <div className="pwa-step-text">
                    Scroll down and tap <strong>Add to Home Screen</strong> <i className="fa-regular fa-square-plus" style={{ color: '#4ade80' }}></i>.
                  </div>
                </div>
                <div className="pwa-step-item">
                  <span className="pwa-step-num">3</span>
                  <div className="pwa-step-text">
                    Tap <strong>Add</strong> in the top-right corner to finish.
                  </div>
                </div>
              </div>
            ) : (
              <div className="pwa-modal-steps">
                <div className="pwa-step-item">
                  <span className="pwa-step-num">1</span>
                  <div className="pwa-step-text">
                    Tap the <strong>three dots menu</strong> <i className="fa-solid fa-ellipsis-vertical"></i> in Chrome or your browser.
                  </div>
                </div>
                <div className="pwa-step-item">
                  <span className="pwa-step-num">2</span>
                  <div className="pwa-step-text">
                    Select <strong>Install App</strong> or <strong>Add to Home screen</strong> <i className="fa-solid fa-download" style={{ color: '#6366f1' }}></i>.
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="pwa-modal-done-btn"
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
