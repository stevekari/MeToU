import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePWA } from '../hooks/usePWA';
import gcLogo from '../assets/gc.png';
import '../styles/pwa.css';

export default function PWAInstallBanner() {
  const { t } = useLanguage();
  const { isStandalone, triggerInstall } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    const isDismissed = sessionStorage.getItem('pwa_install_dismissed') === 'true';
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isStandalone]);

  const handleInstallClick = async () => {
    try {
      const outcome = await triggerInstall();
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
    } catch (err) {
      console.warn('[PWA] direct install error:', err);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (isStandalone || !isVisible) return null;

  return (
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
  );
}
