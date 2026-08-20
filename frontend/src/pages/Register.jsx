import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/authApi';
import { useLanguage } from '../contexts/LanguageContext';

export default function Register({ onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await register(username, email, password);
      onLogin(response);
      navigate('/friends');
    } catch (err) {
      setError(err.response?.data || t('registrationFailed'));
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>{t('createAccount')}</h1>

        <label>{t('username')}</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required />

        <label>{t('email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>{t('password')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="auth-error">{String(error)}</div>}

        <button type="submit">{t('register')}</button>

        <p className="auth-switch">
          {t('haveAccount')} <Link to="/login"> <span>{t('login')}</span></Link>
        </p>
      </form>
    </div>
  );
}
