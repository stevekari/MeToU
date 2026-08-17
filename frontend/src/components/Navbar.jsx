import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/friends" className="navbar-brand">
        <img src="../src/assets/gio.png" alt="giochat" width={100} />
      </Link>

      {user && (
        <div className="navbar-right">
          <Link to="/friends">Friends</Link>
          <Link to="/settings">Settings</Link>
          <span className="navbar-username">{user.username}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      )}
    </nav>
  );
}
