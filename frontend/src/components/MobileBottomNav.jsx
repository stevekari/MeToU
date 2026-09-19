import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const conversations = useSelector((state) => state.chat?.conversations || {});

  // Calculate total unread messages across all conversations
  const totalUnread = useMemo(() => {
    return Object.values(conversations).reduce((sum, conv) => sum + (conv.unread || 0), 0);
  }, [conversations]);

  const isFriendsActive = location.pathname === '/friends';
  const isCallsActive = location.pathname === '/calls';
  const isSettingsActive = location.pathname === '/settings';
  const isChatOpen = location.pathname.startsWith('/chat/');

  // If in an active chat screen on mobile, hide bottom menu so chat input gets full space
  if (isChatOpen) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* 1. Chats */}
      <button
        type="button"
        className={`mobile-nav-item ${isFriendsActive ? 'active' : ''}`}
        onClick={() => navigate('/friends')}
        aria-label={t('chats')}
      >
        <div className="mobile-nav-icon-wrap">
          <i className="fa-solid fa-comments" />
          {totalUnread > 0 && (
            <span className="mobile-nav-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
          )}
        </div>
        <span className="mobile-nav-label">{t('chats')}</span>
      </button>

      {/* 2. Calls */}
      <button
        type="button"
        className={`mobile-nav-item ${isCallsActive ? 'active' : ''}`}
        onClick={() => navigate('/calls')}
        aria-label={t('calls')}
      >
        <div className="mobile-nav-icon-wrap">
          <i className="fa-solid fa-phone" />
        </div>
        <span className="mobile-nav-label">{t('calls')}</span>
      </button>

      {/* 3. Settings */}
      <button
        type="button"
        className={`mobile-nav-item ${isSettingsActive ? 'active' : ''}`}
        onClick={() => navigate('/settings')}
        aria-label={t('settings')}
      >
        <div className="mobile-nav-icon-wrap">
          <i className="fa-solid fa-gear" />
        </div>
        <span className="mobile-nav-label">{t('settings')}</span>
      </button>

      {/* 4. Theme Toggle */}
      <button
        type="button"
        className="mobile-nav-item"
        onClick={toggleTheme}
        aria-label={t('toggleTheme')}
      >
        <div className="mobile-nav-icon-wrap">
          <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
        </div>
        <span className="mobile-nav-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>
    </nav>
  );
}
