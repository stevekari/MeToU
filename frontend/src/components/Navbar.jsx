import { Link, useNavigate } from 'react-router-dom';
import gioImg from '../assets/gio.png'; 
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const {theme, toggleTheme } = useTheme()

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/friends" className="navbar-brand">
        {/* <img className='img-round' src={gioImg} alt=""  /> */}
        <span className='giochat'>GIOCHAT</span>
      </Link>

      {user && (
        <div className="navbar-right">
          <Link to="/friends">Friends</Link>
          <Link to="/settings">Settings</Link>
          <span className="navbar-username">{user.username}</span>
          <button onClick={handleLogout}>Log out</button>
          <button onClick={toggleTheme} className="theme-toggle" title="Toggle theme">
  <i className={`fa-solid ${theme === 'dark'? 'fa-sun' : 'fa-moon'}`}></i>
</button>
        </div>
      )}
    </nav>
  );
}
