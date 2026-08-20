import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { useLanguage } from '../contexts/LanguageContext';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { language, setLanguage, languageOptions, t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await login(username, password);
      onLogin(response);
      navigate('/friends');
    } catch (err) {
      setError(err.response?.data || t('loginFailed'));
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>{t('welcomeBack')}</h1>

        <label htmlFor="language">{t('language')}</label>
        <select
          id="language"
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setLanguage(e.target.value);
          }}
        >
          {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>

        <label>{t('username')}</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required />

        <label>{t('password')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="auth-error">{String(error)}</div>}

        <button type="submit">{t('login')}</button>

        <p className="auth-switch">
         {t('noAccount')} <Link to="/register"> <span className='Register_C'>{t('register')}</span></Link>
        </p>
      </form>
    </div>
  );
}
