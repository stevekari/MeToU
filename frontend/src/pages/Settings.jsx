import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { updateProfile } from '../api/userApi';
import { uploadMedia } from '../api/mediaApi';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function Settings({ user, onProfileUpdate }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const onlineIds = useSelector(s => s.presence?.onlineIds || []);

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
      setStatus({ type: 'error', text: 'Only PNG, JPEG, JPG allowed.' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setStatus({ type: 'error', text: 'Max 3MB.' });
      return;
    }

    try {
      setUploadingAvatar(true);
      setStatus(null);
      const uploaded = await uploadMedia(file, 'image');
      setAvatarUrl(uploaded.url);
      setStatus({ type: 'success', text: 'Avatar uploaded. Click Save to apply.' });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || err.response?.data?.message || 'Avatar upload failed.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || username.trim().length < 3) {
      setStatus({ type: 'error', text: 'Username must be at least 3 chars.' });
      return;
    }
    if (newPassword &&!currentPassword) {
      setStatus({ type: 'error', text: 'Enter current password to set new password.' });
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
      setStatus({ type: 'success', text: 'Profile updated!' });
      // FIX: don't kick user instantly
      // navigate('/friends');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.response?.data || 'Update failed';
      setStatus({ type: 'error', text: typeof msg === 'string'? msg : JSON.stringify(msg) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <button className={tab==='profile'? 'active':''} onClick={()=>setTab('profile')}><i className="fa-solid fa-user"></i> Profile</button>
        <button className={tab==='appearance'? 'active':''} onClick={()=>setTab('appearance')}><i className="fa-solid fa-palette"></i> Appearance</button>
        <button className={tab==='security'? 'active':''} onClick={()=>setTab('security')}><i className="fa-solid fa-lock"></i> Security</button>
      </aside>

      <div className="settings-content">
        {tab==='profile' && (
          <form className="settings-card" onSubmit={handleSubmit}>
            <h1>Settings</h1>
            <p className="settings-sub">{onlineIds.length} friends online • © Steve</p>

            <div className="avatar-editor">
              <img className="settings-avatar-preview" src={avatarPreview} alt="preview" />
              <div>
                <label className="btn-file">
                  <i className="fa-solid fa-upload"></i> Upload Avatar
                  <input type="file" hidden accept=".png,.jpg,.jpeg" onChange={onPickAvatar} disabled={uploadingAvatar} />
                </label>
                {uploadingAvatar && <div className="settings-uploading">Uploading...</div>}
              </div>
            </div>

            <label>Username</label>
            <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Your username" />

            <label>Avatar URL <span className="muted">(auto-filled after upload)</span></label>
            <input value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} placeholder="https://..." />

            {status && <div className={`settings-status ${status.type}`}>{status.text}</div>}

            <div className="settings-actions">
              <button type="submit" disabled={uploadingAvatar || isSaving}>{isSaving? 'Saving...' : 'Save changes'}</button>
              <button type="button" className="settings-cancel" onClick={()=>navigate('/friends')}>Cancel</button>
            </div>
          </form>
        )}

        {tab==='security' && (
          <form className="settings-card" onSubmit={handleSubmit}>
            <h2>Change Password</h2>
            <label>Current password</label>
            <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} placeholder="Required only to change password" />
            <label>New password</label>
            <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="Min 6 chars" />
            {status && <div className={`settings-status ${status.type}`}>{status.text}</div>}
            <button type="submit" disabled={isSaving}>Update password</button>
          </form>
        )}

        {tab==='appearance' && (
          <div className="settings-card">
            <h2>Appearance</h2>
            <div className="setting-row">
              <div><h4>Theme</h4><p>Switch between light and dark. Your choice is saved.</p></div>
              <button type="button" onClick={toggleTheme} className="theme-toggle big"><i className={`fa-solid ${theme==='dark'? 'fa-sun' : 'fa-moon'}`}></i> {theme}</button>
            </div>
            <div className="setting-row">
              <div><h4>Online status</h4><p>Let friends see you are online via WebSocket</p></div>
              <span className="badge success">Active • {onlineIds.length} online</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}