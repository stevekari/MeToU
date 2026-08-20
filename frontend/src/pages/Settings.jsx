import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { updateProfile } from '../api/userApi';
import { uploadMedia } from '../api/mediaApi';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';

export default function Settings({ user, onProfileUpdate }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const onlineIds = useSelector(s => s.presence?.onlineIds || []);
  const { language, setLanguage, languageOptions, t } = useLanguage();

  // FIX 1: safe initial state + sync when user prop changes
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const avatarPreview = resolveAvatarUrl(avatarUrl, username);

  const onPickAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowed = new Set(['image/png', 'image/jpeg', 'image/jpg']);
    if (!allowed.has(file.type.toLowerCase())) {
      setStatus({ type: 'error', text: t('onlyImages') });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setStatus({ type: 'error', text: t('maxFile') });
      return;
    }

    try {
      setUploadingAvatar(true);
      setStatus(null);
      const uploaded = await uploadMedia(file, 'image');
      setAvatarUrl(uploaded.url);
      setStatus({ type: 'success', text: t('avatarUploaded') });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || err.response?.data?.message || t('avatarUploadFailed') });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || username.trim().length < 3) {
      setStatus({ type: 'error', text: t('usernameMin') });
      return;
    }
    if (newPassword &&!currentPassword) {
      setStatus({ type: 'error', text: t('enterCurrent') });
      return;
    }

    setStatus(null);
    setIsSaving(true);
    try {
      const updated = await updateProfile({
        username: username.trim(),
        avatarUrl: avatarUrl.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      onProfileUpdate(updated);
      setCurrentPassword('');
      setNewPassword('');
      setStatus({ type: 'success', text: t('profileUpdated') });
      // FIX: don't kick user instantly
      // navigate('/friends');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.response?.data || t('updateFailed');
      setStatus({ type: 'error', text: typeof msg === 'string'? msg : JSON.stringify(msg) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <button className={tab==='profile'? 'active':''} onClick={()=>setTab('profile')}><i className="fa-solid fa-user"></i> {t('profile')}</button>
        <button className={tab==='appearance'? 'active':''} onClick={()=>setTab('appearance')}><i className="fa-solid fa-palette"></i> {t('appearance')}</button>
        <button className={tab==='security'? 'active':''} onClick={()=>setTab('security')}><i className="fa-solid fa-lock"></i> {t('security')}</button>
      </aside>

      <div className="settings-content">
        {tab==='profile' && (
          <form className="settings-card" onSubmit={handleSubmit}>
            <h1>{t('settings')}</h1>
            <p className="settings-sub">{t('onlineFriends', { count: onlineIds.length })}</p>

            <div className="avatar-editor">
              <img className="settings-avatar-preview" src={avatarPreview} alt={t('preview')} />
              <div>
                <label className="btn-file">
                  <i className="fa-solid fa-upload"></i> {t('uploadAvatar')}
                  <input type="file" hidden accept=".png,.jpg,.jpeg" onChange={onPickAvatar} disabled={uploadingAvatar} />
                </label>
                {uploadingAvatar && <div className="settings-uploading">{t('uploading')}</div>}
              </div>
            </div>

            <label>{t('username')}</label>
            <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder={t('username')} />

            <label>{t('avatarUrl')} <span className="muted">{t('autoFilled')}</span></label>
            <input value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} placeholder="https://..." />

            {status && <div className={`settings-status ${status.type}`}>{status.text}</div>}

            <div className="settings-actions">
              <button type="submit" disabled={uploadingAvatar || isSaving}>{isSaving? t('saving') : t('saveChanges')}</button>
              <button type="button" className="settings-cancel" onClick={()=>navigate('/friends')}>{t('cancel')}</button>
            </div>
          </form>
        )}

        {tab==='security' && (
          <form className="settings-card" onSubmit={handleSubmit}>
            <h2>{t('changePassword')}</h2>
            <label>{t('currentPassword')}</label>
            <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} placeholder={t('requiredPassword')} />
            <label>{t('newPassword')}</label>
            <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder={t('minPassword')} />
            {status && <div className={`settings-status ${status.type}`}>{status.text}</div>}
            <button type="submit" disabled={isSaving}>{t('updatePassword')}</button>
          </form>
        )}

        {tab==='appearance' && (
          <div className="settings-card">
            <h2>{t('appearance')}</h2>
            <div className="setting-row">
              <div><h4>{t('theme')}</h4><p>{t('themeDescription')}</p></div>
              <button type="button" onClick={toggleTheme} className="theme-toggle big"><i className={`fa-solid ${theme==='dark'? 'fa-sun' : 'fa-moon'}`}></i> {theme}</button>
            </div>
            <div className="setting-row">
              <div><h4>{t('language')}</h4></div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label={t('language')}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="setting-row">
              <div><h4>{t('onlineStatus')}</h4><p>{t('onlineDescription')}</p></div>
              <span className="badge success">{t('activeOnline', { count: onlineIds.length })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}