import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import chatImg from '../assets/chat.jpeg';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { setMyStatus } from '../store/slices/presenceSlice';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
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

  return (
    <nav className="navbar">
      <Link to="/friends" className="navbar-brand">
        <img className="navbar-logo" src={chatImg} alt="GioChat" />
      </Link>

      {user && (
        <div className="navbar-right">
          <Link to="/friends" className="nav-desktop-only">{t('friends')}</Link>
          <Link to="/calls" className="nav-desktop-only">{t('calls')}</Link>
          <Link to="/settings" className="nav-desktop-only">{t('settings')}</Link>

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

          <span className="navbar-username nav-desktop-only">{user.username}</span>

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
              <span className="nav-install-text">Install App</span>
            </button>
          )}

          <button onClick={handleLogout} className="navbar-logout-btn" title={t('logout')} aria-label={t('logout')}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span className="nav-logout-text">{t('logout')}</span>
          </button>

          <button onClick={toggleTheme} className="theme-toggle nav-desktop-only" title={t('toggleTheme')}>
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      )}
    </nav>
  );
}
