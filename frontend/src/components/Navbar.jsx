import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import chatImg from '../assets/chat.jpeg';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { setMyStatus } from '../store/slices/presenceSlice';
import { resolveAvatarUrl } from '../utils/avatarUrl';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, languageOptions, t } = useLanguage();
  const { isStandalone, installApp } = usePWAInstall();
  const myStatus = useSelector((state) => state.presence?.myStatus || 'online');

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleStatusChange = (e) => {
    dispatch(setMyStatus(e.target.value));
  };

  const isFeed = location.pathname === '/' || location.pathname === '/feed';
  const isFriends = location.pathname === '/friends';
  const isCalls = location.pathname === '/calls';
  const isNetwork = location.pathname === '/network';
  const isProfile = location.pathname.startsWith('/profile');

  const userAvatar = resolveAvatarUrl(user?.avatarUrl, user?.displayName || user?.username);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img className="navbar-logo" src={chatImg} alt="GioChat" />
      </Link>

      {user && (
        <div className="navbar-right">
          {/* 5 Primary Desktop Nav Links */}
          <Link to="/" className={`nav-desktop-only ${isFeed ? 'active-nav-link' : ''}`}>
            <i className="fa-solid fa-house" style={{ marginRight: '6px' }}></i>
            Home
          </Link>

          <Link to="/friends" className={`nav-desktop-only ${isFriends ? 'active-nav-link' : ''}`}>
            <i className="fa-solid fa-comments" style={{ marginRight: '6px' }}></i>
            {t('chats')}
          </Link>

          <Link to="/calls" className={`nav-desktop-only ${isCalls ? 'active-nav-link' : ''}`}>
            <i className="fa-solid fa-phone" style={{ marginRight: '6px' }}></i>
            {t('calls')}
          </Link>

          <Link to="/network" className={`nav-desktop-only ${isNetwork ? 'active-nav-link' : ''}`}>
            <i className="fa-solid fa-users" style={{ marginRight: '6px' }}></i>
            Network
          </Link>

          <Link to="/profile" className={`nav-desktop-only ${isProfile ? 'active-nav-link' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <img
              src={userAvatar}
              alt="Me"
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
            />
            Profile
          </Link>

          {/* Status Indicator */}
          <div className="navbar-status-wrap">
            <span className={`status-indicator ${myStatus}`} />
            <select
              className={`navbar-status-select ${myStatus}`}
              value={myStatus}
              onChange={handleStatusChange}
              aria-label={t('myStatus')}
              title={t('myStatus')}
            >
              <option value="online">🟢 {t('online')}</option>
              <option value="busy">🟡 {t('busy')}</option>
              <option value="offline">⚪ {t('offline')}</option>
            </select>
          </div>

          {/* Language Selector */}
          <div className="navbar-lang-wrap nav-desktop-only">
            <select
              className="navbar-lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label={t('language')}
              title={t('language')}
            >
              {languageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Settings Link */}
          <Link to="/settings" className="nav-desktop-only" title={t('settings')}>
            <i className="fa-solid fa-gear"></i>
          </Link>

          {/* Install PWA Button */}
          {!isStandalone && (
            <button
              onClick={() => {
                installApp().then((res) => {
                  if (!res?.success) {
                    window.dispatchEvent(new CustomEvent('open-pwa-install-modal'));
                  }
                });
              }}
              className="navbar-install-btn"
              title="Install GioChat App"
              aria-label="Install GioChat App"
            >
              <i className="fa-solid fa-mobile-screen-button"></i>
              <span className="nav-install-text">Install</span>
            </button>
          )}

          {/* Logout */}
          <button onClick={handleLogout} className="navbar-logout-btn" title={t('logout')} aria-label={t('logout')}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span className="nav-logout-text">{t('logout')}</span>
          </button>

          {/* Desktop Quick Theme Toggle */}
          <button onClick={toggleTheme} className="theme-toggle nav-desktop-only" title={t('toggleTheme')}>
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      )}
    </nav>
  );
}
