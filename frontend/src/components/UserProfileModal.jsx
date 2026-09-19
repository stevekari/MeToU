import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserProfile } from '../api/userApi';
import { startConversation } from '../api/conversationApi';
import { formatJoinedDate, formatLastSeenText } from '../utils/timeAgo';
import '../styles/profileModal.css';

export default function UserProfileModal({ user, userId, onClose, onStartCall }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user && Boolean(userId));

  const targetId = String(user?.id || user?.userId || userId);
  const presenceState = useSelector((state) => state.presence?.userStatuses?.[targetId]);
  const isOnline = presenceState?.online ?? (presenceState?.status && presenceState?.status !== 'offline');
  const statusStr = presenceState?.status || profile?.customStatus || (isOnline ? 'online' : 'offline');
  const lastSeenVal = presenceState?.lastSeen || profile?.lastSeen;

  useEffect(() => {
    if (userId && (!user || !user.bio)) {
      setLoading(true);
      getUserProfile(userId)
        .then((data) => setProfile(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [userId, user]);

  if (!profile && !loading) return null;

  const displayName = profile?.displayName || profile?.username || 'User';
  const username = profile?.username || '';
  const avatarUrl = profile?.avatarUrl;
  const bio = profile?.bio || 'No bio provided yet.';
  const joinedText = formatJoinedDate(profile?.createdAt);
  const statusText = formatLastSeenText(isOnline, lastSeenVal, statusStr);

  const handleSendMessage = async () => {
    try {
      const res = await startConversation(profile.id);
      onClose();
      navigate(`/chat/${res.conversationId}`, { state: { friend: profile } });
    } catch (err) {
      console.error('Failed to start chat', err);
    }
  };

  const handleStartCall = (type) => {
    onClose();
    if (onStartCall) {
      onStartCall(profile, type);
    } else {
      handleSendMessage();
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="profile-modal-close-btn" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="profile-modal-header">
          <div className="profile-modal-avatar-wrapper">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="profile-modal-avatar" />
            ) : (
              <div className="profile-modal-avatar-fallback">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={`profile-modal-status-badge ${isOnline ? (statusStr === 'busy' ? 'busy' : 'online') : 'offline'}`} />
          </div>

          <h2 className="profile-modal-name">{displayName}</h2>
          <p className="profile-modal-handle">@{username}</p>

          <div className={`profile-modal-status-pill ${isOnline ? (statusStr === 'busy' ? 'busy' : 'online') : 'offline'}`}>
            <span className="profile-status-dot" />
            <span>{statusText}</span>
          </div>
        </div>

        <div className="profile-modal-body">
          <div className="profile-modal-section">
            <span className="profile-modal-section-title">About</span>
            <p className="profile-modal-bio">{bio}</p>
          </div>

          <div className="profile-modal-meta">
            <div className="profile-meta-item">
              <i className="fa-regular fa-calendar"></i>
              <span>{joinedText}</span>
            </div>
            {profile?.email && (
              <div className="profile-meta-item">
                <i className="fa-regular fa-envelope"></i>
                <span>{profile.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="profile-modal-actions">
          <button type="button" className="profile-action-btn primary" onClick={handleSendMessage}>
            <i className="fa-solid fa-comment-dots"></i>
            <span>Message</span>
          </button>
          <button type="button" className="profile-action-btn secondary" onClick={() => handleStartCall('voice')}>
            <i className="fa-solid fa-phone"></i>
            <span>Voice</span>
          </button>
          <button type="button" className="profile-action-btn secondary" onClick={() => handleStartCall('video')}>
            <i className="fa-solid fa-video"></i>
            <span>Video</span>
          </button>
        </div>
      </div>
    </div>
  );
}

