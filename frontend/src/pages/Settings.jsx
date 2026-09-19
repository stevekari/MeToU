import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../api/userApi';
import { uploadMedia } from '../api/mediaApi';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { setMyStatus } from '../store/slices/presenceSlice';
import { usePWA } from '../hooks/usePWA';
import gcLogo from '../assets/gc.png';

export default function Settings({ user, onProfileUpdate }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const onlineIds = useSelector((s) => s.presence?.onlineIds || []);
  const myStatus = useSelector((s) => s.presence?.myStatus || 'online');
  const { language, setLanguage, languageOptions, t } = useLanguage();
  const { isStandalone, canInstall, isIOS, isAndroid, triggerInstall } = usePWA();
  const [deviceTab, setDeviceTab] = useState(isIOS ? 'ios' : isAndroid ? 'android' : 'desktop');

  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
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
      setDisplayName(user.displayName || user.username || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const avatarPreview = resolveAvatarUrl(avatarUrl, displayName || username);

  const onPickAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowed = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
    if (!allowed.has(file.type.toLowerCase())) {
      setStatus({ type: 'error', text: t('onlyImages') });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
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
    if (newPassword && !currentPassword) {
      setStatus({ type: 'error', text: t('enterCurrent') });
      return;
    }

    setStatus(null);
    setIsSaving(true);
    try {
      const updated = await updateProfile({
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        customStatus: myStatus,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      onProfileUpdate(updated);
      setCurrentPassword('');
      setNewPassword('');
      setStatus({ type: 'success', text: t('profileUpdated') });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.response?.data || t('updateFailed');
      setStatus({ type: 'error', text: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
          <i className="fa-solid fa-user"></i> {t('profile')}
        </button>
        <button className={tab === 'appearance' ? 'active' : ''} onClick={() => setTab('appearance')}>
          <i className="fa-solid fa-palette"></i> {t('appearance')}
        </button>
        <button className={tab === 'security' ? 'active' : ''} onClick={() => setTab('security')}>
          <i className="fa-solid fa-lock"></i> {t('security')}
        </button>
        <button className={tab === 'pwa' ? 'active' : ''} onClick={() => setTab('pwa')}>
          <i className="fa-solid fa-mobile-screen"></i> {t('installApp')}
        </button>
      </aside>

      <div className="settings-content">
        {tab === 'profile' && (
          <form className="settings-card" onSubmit={handleSubmit}>
            <h1>{t('profile')}</h1>
            <p className="settings-sub">{t('onlineFriends', { count: onlineIds.length })}</p>

            <div className="avatar-editor">
              <img className="settings-avatar-preview" src={avatarPreview} alt={t('preview')} />
              <div>
                <label className="btn-file">
                  <i className="fa-solid fa-upload"></i> {t('uploadAvatar')}
                  <input type="file" hidden accept=".png,.jpg,.jpeg,.webp" onChange={onPickAvatar} disabled={uploadingAvatar} />
                </label>
                {uploadingAvatar && <div className="settings-uploading">{t('uploading')}</div>}
              </div>
            </div>

            <label>Full / Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Stephen Karikari"
            />

            <label>{t('username')} <span className="muted">(@handle)</span></label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('username')}
            />

            <label>About / Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Frontend & Java developer passionate about real-time apps..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: 'inherit',
                resize: 'vertical',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                marginBottom: '16px'
              }}
            />

            <label>{t('avatarUrl')} <span className="muted">{t('autoFilled')}</span></label>
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />

            {status && <div className={`settings-status ${status.type}`}>{status.text}</div>}

            <div className="settings-actions">
              <button type="submit" disabled={uploadingAvatar || isSaving}>{isSaving ? t('saving') : t('saveChanges')}</button>
              <button type="button" className="settings-cancel" onClick={() => navigate('/friends')}>{t('cancel')}</button>
            </div>
          </form>
        )}

        {tab === 'security' && (
          <form className="settings-card" onSubmit={handleSubmit}>
            <h2>{t('changePassword')}</h2>
            <label>{t('currentPassword')}</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t('requiredPassword')} />
            <label>{t('newPassword')}</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('minPassword')} />
            {status && <div className={`settings-status ${status.type}`}>{status.text}</div>}
            <button type="submit" disabled={isSaving}>{t('updatePassword')}</button>
          </form>
        )}

        {tab === 'appearance' && (
          <div className="settings-card">
            <h2>{t('appearance')}</h2>
            <div className="setting-row">
              <div><h4>{t('theme')}</h4><p>{t('themeDescription')}</p></div>
              <button type="button" onClick={toggleTheme} className="theme-toggle big"><i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i> {theme}</button>
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
              <div><h4>{t('myStatus')}</h4><p>{t('onlineDescription')}</p></div>
              <select
                value={myStatus}
                onChange={(e) => dispatch(setMyStatus(e.target.value))}
                className={`status-select ${myStatus}`}
                aria-label={t('myStatus')}
              >
                <option value="online">🟢 {t('statusOnline')}</option>
                <option value="busy">🟡 {t('statusBusy')}</option>
                <option value="offline">⚪ {t('statusOffline')}</option>
              </select>
            </div>
            <div className="setting-row">
              <div><h4>{t('onlineStatus')}</h4><p>{t('onlineFriends', { count: onlineIds.length })}</p></div>
              <span className="badge success">{t('activeOnline', { count: onlineIds.length })}</span>
            </div>
          </div>
        )}

        {tab === 'pwa' && (
          <div className="settings-card">
            <div className="pwa-settings-hero">
              <img src={gcLogo} alt="GioChat" className="pwa-settings-icon" />
              <div>
                <h2>{t('installApp')}</h2>
                <p className="settings-sub">{t('installAppDesc')}</p>
                <div className="pwa-status-badge">
                  <span className={`status-dot ${isStandalone ? 'online' : 'busy'}`}></span>
                  {isStandalone ? 'Installed as App' : 'Running in Web Browser'}
                </div>
              </div>
            </div>

            {canInstall && (
              <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                <button
                  type="button"
                  className="pwa-modal-install-action"
                  onClick={() => triggerInstall()}
                >
                  <i className="fa-solid fa-download"></i> Install GioChat on This Device
                </button>
              </div>
            )}

            <div className="pwa-device-tabs" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className={`pwa-tab-btn ${deviceTab === 'ios' ? 'active' : ''}`}
                onClick={() => setDeviceTab('ios')}
              >
                <i className="fa-brands fa-apple"></i> iPhone / iPad
              </button>
              <button
                type="button"
                className={`pwa-tab-btn ${deviceTab === 'android' ? 'active' : ''}`}
                onClick={() => setDeviceTab('android')}
              >
                <i className="fa-brands fa-android"></i> Android
              </button>
              <button
                type="button"
                className={`pwa-tab-btn ${deviceTab === 'desktop' ? 'active' : ''}`}
                onClick={() => setDeviceTab('desktop')}
              >
                <i className="fa-solid fa-desktop"></i> Desktop / Mac
              </button>
            </div>

            <div className="pwa-guide-steps" style={{ marginTop: '14px' }}>
              {deviceTab === 'ios' && (
                <>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <div>
                      Open <strong>Safari</strong> on your iPhone or iPad and go to GioChat.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <div>
                      Tap the <strong>Share</strong> button <i className="fa-solid fa-arrow-up-from-bracket pwa-share-icon"></i> at the bottom of the screen.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">3</span>
                    <div>
                      Scroll down and tap <strong>Add to Home Screen</strong> <i className="fa-regular fa-square-plus pwa-plus-icon"></i>.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">4</span>
                    <div>
                      Tap <strong>Add</strong> in the top-right corner to finish!
                    </div>
                  </div>
                </>
              )}

              {deviceTab === 'android' && (
                <>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <div>
                      Open <strong>Chrome</strong> or your browser on Android.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <div>
                      Tap the <strong>three dots (⋮)</strong> menu in the top right.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">3</span>
                    <div>
                      Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">4</span>
                    <div>
                      Tap <strong>Install</strong> to add GioChat directly to your phone.
                    </div>
                  </div>
                </>
              )}

              {deviceTab === 'desktop' && (
                <>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <div>
                      In <strong>Chrome</strong>, <strong>Edge</strong>, or <strong>Brave</strong>, look at the right side of the address bar.
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <div>
                      Click the <strong>Install</strong> icon <i className="fa-solid fa-download pwa-share-icon"></i> (or menu ⋮ &gt; <em>Install GioChat</em>).
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">3</span>
                    <div>
                      Click <strong>Install</strong> to add GioChat to your Dock or Applications!
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}