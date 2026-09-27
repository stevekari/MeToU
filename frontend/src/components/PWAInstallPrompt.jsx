import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import gcLogo from '../assets/gc.png';
import '../styles/pwa.css';

export default function PWAInstallPrompt() {
  const { isStandalone, installApp } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

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

  if (isStandalone || !showPrompt) return null;

  const handleInstall = async () => {
    const res = await installApp();
    if (res?.success) {
      setShowPrompt(false);
      sessionStorage.setItem('giochat_pwa_dismissed', '1');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('giochat_pwa_dismissed', '1');
  };

  return (
    <div className="pwa-floating-bar" role="banner">
      <div className="pwa-floating-left">
        <img src={gcLogo} alt="GioChat" className="pwa-floating-icon" />
        <div className="pwa-floating-info">
          <span className="pwa-floating-title">Install GioChat</span>
          <span className="pwa-floating-subtitle">Add to screen for fast chat</span>
        </div>
      </div>

      <div className="pwa-floating-actions">
        <button type="button" className="pwa-btn-install" onClick={handleInstall}>
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
  );
}
