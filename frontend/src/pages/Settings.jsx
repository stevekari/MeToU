import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../api/userApi';
import { updateFullProfile } from '../api/profileApi';
import { uploadMedia } from '../api/mediaApi';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { setMyStatus } from '../store/slices/presenceSlice';

export default function Settings({ user, onProfileUpdate }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { themeMode, setTheme } = useTheme();
  const { isStandalone, installApp } = usePWAInstall();
  const onlineIds = useSelector((s) => s.presence?.onlineIds || []);
  const myStatus = useSelector((s) => s.presence?.myStatus || 'online');
  const { language, setLanguage, languageOptions, t } = useLanguage();

  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [company, setCompany] = useState(user?.company || '');
  const [location, setLocation] = useState(user?.location || '');
  const [skills, setSkills] = useState(user?.skills || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolioUrl || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isBusiness, setIsBusiness] = useState(!!user?.isBusiness);
  const [businessServices, setBusinessServices] = useState(user?.businessServices || '');
  
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
      setHeadline(user.headline || '');
      setCompany(user.company || '');
      setLocation(user.location || '');
      setSkills(user.skills || '');
      setPortfolioUrl(user.portfolioUrl || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
      setIsBusiness(!!user.isBusiness);
      setBusinessServices(user.businessServices || '');
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
      // First update base profile
      const updated = await updateProfile({
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        customStatus: myStatus,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      // Update full professional & business properties
      const fullUpdated = await updateFullProfile({
        displayName: displayName.trim() || username.trim(),
        headline: headline.trim(),
        company: company.trim(),
        location: location.trim(),
        skills: skills.trim(),
        portfolioUrl: portfolioUrl.trim(),
        bio: bio.trim(),
        isBusiness,
        businessServices: businessServices.trim(),
      });

      const merged = { ...updated, ...fullUpdated };
      onProfileUpdate(merged);
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
      </aside>

      <div className="settings-content">
        {tab === 'profile' && (
          <form className="settings-card" onSubmit={handleSubmit}>
            <h1>Professional Profile Settings</h1>
            <p className="settings-sub">Customize how other developers and businesses see you across GioChat.</p>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
              <div>
                <label>Full / Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Stephen Karikari"
                />
              </div>
              <div>
                <label>{t('username')} <span className="muted">(@handle)</span></label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('username')}
                />
              </div>
            </div>

            <label>Professional Headline</label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Software Engineer | React, Java, Cloud Solutions"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label>Company / Organization</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. GioTech Solutions"
                />
              </div>
              <div>
                <label>Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Barcelona, Spain"
                />
              </div>
            </div>

            <label>Skills & Technologies (comma separated)</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, JavaScript, Java, Spring Boot, WebRTC, Docker"
            />

            <label>Portfolio / GitHub URL</label>
            <input
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/username or portfolio website"
            />

            <label>About / Professional Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about your experience, projects, and what you are building..."
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
                marginBottom: '16px',
              }}
            />

            {/* Business Account Option */}
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="bizToggle"
                  checked={isBusiness}
                  onChange={(e) => setIsBusiness(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                />
                <label htmlFor="bizToggle" style={{ fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                  Enable Business Account & Directory Listing
                </label>
              </div>

              {isBusiness && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Services Offered (comma separated)</label>
                  <input
                    value={businessServices}
                    onChange={(e) => setBusinessServices(e.target.value)}
                    placeholder="e.g. Web Development, Mobile Applications, Cloud Solutions"
                    style={{ marginTop: '4px' }}
                  />
                </div>
              )}
            </div>

            {status && <div className={`settings-status ${status.type}`}>{status.text}</div>}

            <div className="settings-actions">
              <button type="submit" disabled={uploadingAvatar || isSaving}>{isSaving ? t('saving') : t('saveChanges')}</button>
              <button type="button" className="settings-cancel" onClick={() => navigate('/profile')}>View Profile</button>
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
            
            {/* Theme Mode Selector: Light / Dark / System */}
            <div className="setting-row">
              <div>
                <h4>Interface Theme</h4>
                <p>Choose your preferred color theme or match your operating system.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`post-type-pill ${themeMode === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <i className="fa-solid fa-sun"></i> Light
                </button>
                <button
                  type="button"
                  className={`post-type-pill ${themeMode === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <i className="fa-solid fa-moon"></i> Dark
                </button>
                <button
                  type="button"
                  className={`post-type-pill ${themeMode === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  <i className="fa-solid fa-laptop"></i> System
                </button>
              </div>
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

            <div className="setting-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h4>📱 GioChat App (PWA)</h4>
                <p>Install GioChat on your device for instant launch and full-screen experience.</p>
              </div>
              {isStandalone ? (
                <span className="badge success" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  <i className="fa-solid fa-circle-check"></i> Installed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    installApp().then((res) => {
                      if (!res?.success) {
                        window.dispatchEvent(new CustomEvent('open-pwa-install-modal'));
                      }
                    });
                  }}
                  className="pwa-btn-install"
                  style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                >
                  <i className="fa-solid fa-download"></i> Install App
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}