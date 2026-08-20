import { Link, useNavigate } from 'react-router-dom';
import chatImg from '../assets/chat.jpeg';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const {theme, toggleTheme } = useTheme()
  const { t } = useLanguage();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/friends" className="navbar-brand">
        <img className="navbar-logo" src={chatImg} alt="GioChat" />
      </Link>

      {user && (
        <div className="navbar-right">
          <Link to="/friends">{t('friends')}</Link>
          <Link to="/settings">{t('settings')}</Link>
          <span className="navbar-username">{user.username}</span>
          <button onClick={handleLogout}>{t('logout')}</button>
          <button onClick={toggleTheme} className="theme-toggle" title={t('toggleTheme')}>
  <i className={`fa-solid ${theme === 'dark'? 'fa-sun' : 'fa-moon'}`}></i>
</button>
        </div>
      )}
    </nav>
  );
}
