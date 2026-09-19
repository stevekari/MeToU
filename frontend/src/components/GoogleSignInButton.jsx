import { useState } from 'react';
import { signInWithGoogle } from '../firebase';
import { loginWithGoogleApi } from '../api/authApi';
import { useLanguage } from '../contexts/LanguageContext';

export default function GoogleSignInButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const lang = useLanguage();
  const t = lang?.t || ((k) => k);

  const handleGoogleClick = async () => {
    if (loading) return;
    setLoading(true);
    onError?.('');

    try {
      const googleUser = await signInWithGoogle();
      const response = await loginWithGoogleApi(googleUser);
      onSuccess?.(response);
    } catch (err) {
      console.error('Google Sign-In failed', err);
      const msg = err.response?.data || err.message || t('loginFailed');
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="google-auth-btn"
      onClick={handleGoogleClick}
      disabled={loading}
      aria-label={t('continueWithGoogle')}
    >
      {loading ? (
        <i className="fa-solid fa-circle-notch fa-spin"></i>
      ) : (
        <svg className="google-icon-svg" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      )}
      <span>{loading ? t('loading') || 'Signing in...' : t('continueWithGoogle')}</span>
    </button>
  );
}

