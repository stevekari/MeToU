import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { resolveAvatarUrl } from '../utils/avatarUrl';

export default function MobileBottomNav({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const conversations = useSelector((state) => state.chat?.conversations || {});

  // Calculate total unread messages across all conversations
  const totalUnread = useMemo(() => {
    return Object.values(conversations).reduce((sum, conv) => sum + (conv.unread || 0), 0);
  }, [conversations]);

  const isHomeActive = location.pathname === '/' || location.pathname === '/feed';
  const isFriendsActive = location.pathname === '/friends';
  const isCallsActive = location.pathname === '/calls';
  const isNetworkActive = location.pathname === '/network';
  const isProfileActive = location.pathname.startsWith('/profile');
  const isChatOpen = location.pathname.startsWith('/chat/');

  // If in an active chat screen on mobile, hide bottom menu so chat input gets full space
  if (isChatOpen) {
    return null;
  }

  const avatar = resolveAvatarUrl(user?.avatarUrl, user?.displayName || user?.username);

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* 1. Home / Feed */}
      <button
        type="button"
        className={`mobile-nav-item ${isHomeActive ? 'active' : ''}`}
        onClick={() => navigate('/')}
        aria-label="Home"
      >
        <div className="mobile-nav-icon-wrap">
          <i className="fa-solid fa-house" />
        </div>
        <span className="mobile-nav-label">Home</span>
      </button>

      {/* 2. Chats */}
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

      {/* 3. Calls */}
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

      {/* 4. Network */}
      <button
        type="button"
        className={`mobile-nav-item ${isNetworkActive ? 'active' : ''}`}
        onClick={() => navigate('/network')}
        aria-label="Network"
      >
        <div className="mobile-nav-icon-wrap">
          <i className="fa-solid fa-users" />
        </div>
        <span className="mobile-nav-label">Network</span>
      </button>

      {/* 5. Profile */}
      <button
        type="button"
        className={`mobile-nav-item ${isProfileActive ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
        aria-label="Profile"
      >
        <div className="mobile-nav-icon-wrap">
          <img
            src={avatar}
            alt="Me"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: isProfileActive ? '2px solid var(--primary-color, #10b981)' : '1px solid rgba(255,255,255,0.3)',
            }}
          />
        </div>
        <span className="mobile-nav-label">Profile</span>
      </button>
    </nav>
  );
}
