import React, { useState, useEffect } from 'react';
import { getCookie, setCookie } from '../utils/cookieUtils';
import { cleanupExpiredLocalStorage } from '../utils/storageManager';

const COOKIE_CONSENT_KEY = 'gio_cookie_consent';

export default function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always true
    storageExpiry: true, // 24-hr auto cleanup
    performance: true,
  });

  useEffect(() => {
    // Run 24-hour localStorage cleanup on startup
    cleanupExpiredLocalStorage(24 * 60 * 60 * 1000);

    // Check if user has already made a choice
    const savedConsent = getCookie(COOKIE_CONSENT_KEY) || localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      // Delay showing banner slightly for smooth entrance
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      essential: true,
      storageExpiry: true,
      performance: true,
      timestamp: Date.now(),
    };
    setCookie(COOKIE_CONSENT_KEY, 'all', 1); // 1-day cookie
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setIsOpen(false);
    setShowPreferencesModal(false);
  };

  const handleEssentialOnly = () => {
    const consentData = {
      essential: true,
      storageExpiry: true,
      performance: false,
      timestamp: Date.now(),
    };
    setCookie(COOKIE_CONSENT_KEY, 'essential', 1);
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setIsOpen(false);
    setShowPreferencesModal(false);
  };

  const handleSavePreferences = () => {
    setCookie(COOKIE_CONSENT_KEY, preferences, 1);
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    setIsOpen(false);
    setShowPreferencesModal(false);
  };

  if (!isOpen && !showPreferencesModal) return null;

  return (
    <>
      {/* Floating Bottom Cookie Consent Card */}
      {isOpen && !showPreferencesModal && (
        <div style={bannerContainerStyle} role="region" aria-label="Cookie Consent">
          <div style={bannerCardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <span style={cookieIconBadgeStyle}>🍪</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  Cookies & 24-Hour Storage Policy
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.45 }}>
                  GioChat uses cookies and local storage to keep you signed in and enable real-time messaging and WebRTC calls. 
                  All temporary local storage is automatically pruned after <strong>24 hours</strong> to keep your browser light and secure.
                </p>
              </div>
            </div>

            <div style={btnRowStyle}>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(true)}
                style={secondaryBtnStyle}
              >
                Preferences
              </button>
              <button
                type="button"
                onClick={handleEssentialOnly}
                style={secondaryBtnStyle}
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                style={primaryBtnStyle}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Cookie Preferences Modal */}
      {showPreferencesModal && (
        <div style={modalOverlayStyle} onClick={() => setShowPreferencesModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🍪</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Cookie Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.45 }}>
              Customize which cookies and storage mechanisms you allow. You can adjust these settings at any time.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {/* Option 1: Essential (Always active) */}
              <div style={prefRowStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                    Strictly Essential Cookies & Tokens
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Required for account authentication, encrypted WebSocket signaling, and incoming calls.
                  </div>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', padding: '4px 8px', borderRadius: '6px' }}>
                  Always Active
                </span>
              </div>

              {/* Option 2: 24-Hour Auto Cleanup */}
              <div style={prefRowStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                    Automatic 24-Hour Storage Purge
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Automatically deletes cached browser data older than 1 day to free up memory and storage space.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.storageExpiry}
                  onChange={(e) => setPreferences({ ...preferences, storageExpiry: e.target.checked })}
                  style={{ accentColor: '#10b981', width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              {/* Option 3: Performance & Analytics */}
              <div style={prefRowStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                    Performance & Experience Cookies
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Stores dark/light theme, language selection, and feed engagement analytics.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.performance}
                  onChange={(e) => setPreferences({ ...preferences, performance: e.target.checked })}
                  style={{ accentColor: '#10b981', width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={handleEssentialOnly}
                style={secondaryBtnStyle}
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                style={primaryBtnStyle}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Styles
const bannerContainerStyle = {
  position: 'fixed',
  bottom: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 99998,
  width: '94%',
  maxWidth: '680px',
  boxSizing: 'border-box',
  pointerEvents: 'none',
};

const bannerCardStyle = {
  pointerEvents: 'auto',
  background: 'rgba(24, 28, 38, 0.96)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '18px',
  padding: '18px 20px',
  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  animation: 'gioToastSlideDown 0.35s ease',
};

const cookieIconBadgeStyle = {
  fontSize: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '42px',
  height: '42px',
  borderRadius: '12px',
  background: 'rgba(245, 158, 11, 0.15)',
  border: '1px solid rgba(245, 158, 11, 0.3)',
  flexShrink: 0,
};

const btnRowStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  paddingTop: '8px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
};

const secondaryBtnStyle = {
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#e2e8f0',
  borderRadius: '8px',
  padding: '8px 14px',
  fontSize: '0.84rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const primaryBtnStyle = {
  background: 'var(--primary-color, #10b981)',
  border: 'none',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '8px 18px',
  fontSize: '0.84rem',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  transition: 'all 0.15s ease',
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 99999,
  padding: '16px',
};

const modalBoxStyle = {
  background: 'var(--bg-card, #1e2430)',
  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.14))',
  borderRadius: '20px',
  maxWidth: '520px',
  width: '100%',
  padding: '24px',
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
  color: '#fff',
  animation: 'gioToastSlideDown 0.25s ease',
};

const prefRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '14px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  padding: '12px 14px',
};
