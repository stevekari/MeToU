import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../api/userApi';
import { uploadMedia } from '../api/mediaApi';
import { resolveAvatarUrl } from '../utils/avatarUrl';

export default function Settings({ user, onProfileUpdate }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [status, setStatus] = useState(null);

  const avatarPreview = resolveAvatarUrl(avatarUrl, username);

  const onPickAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/jpg']);
    if (!allowedImageTypes.has(file.type.toLowerCase())) {
      setStatus({ type: 'error', text: 'Please upload only PNG, JPEG, or JPG image.' });
      return;
    }

    try {
      setUploadingAvatar(true);
      setStatus(null);
      const uploaded = await uploadMedia(file, 'image');
      setAvatarUrl(uploaded.url);
      setStatus({ type: 'success', text: 'Avatar uploaded. Click Save changes to apply.' });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Avatar upload failed.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      const updated = await updateProfile({
        username,
        avatarUrl,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      onProfileUpdate(updated);
      setCurrentPassword('');
      setNewPassword('');
      setStatus({ type: 'success', text: 'Profile updated!' });
      navigate('/friends');
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data || 'Update failed' });
    }
  };

  const handleCancel = () => {
    navigate('/friends');
  };

  return (
    <div className="page settings-page">
      <h1>Settings</h1>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />

        <label>Avatar URL</label>
        <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />

  <label>Upload Avatar</label>
  <input type="file" accept="image/*" onChange={onPickAvatar} disabled={uploadingAvatar} />
  {uploadingAvatar && <div className="settings-uploading">Uploading avatar...</div>}

  <img className="settings-avatar-preview" src={avatarPreview} alt="Avatar preview" />

        <hr />

        <label>Current password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Required only to change password"
        />

        <label>New password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        {status && <div className={`settings-status ${status.type}`}>{String(status.text)}</div>}

        <div className="settings-actions">
          <button type="submit" disabled={uploadingAvatar}>Save changes</button>
          <button type="button" className="settings-cancel" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
