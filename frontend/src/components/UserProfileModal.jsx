import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserProfile } from '../api/userApi';
import {
  startConversation,
  sendFriendRequest,
  getConversationWithUser,
  acceptChatRequest,
  declineChatRequest,
} from '../api/conversationApi';
import { formatJoinedDate, formatLastSeenText } from '../utils/timeAgo';
import '../styles/profileModal.css';

export default function UserProfileModal({ user, userId, onClose, onStartCall }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user && Boolean(userId));
  const [relationship, setRelationship] = useState({ exists: false, status: 'NONE', isInitiator: false, conversationId: null });
  const [relLoading, setRelLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

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

  useEffect(() => {
    const friendId = profile?.id || userId;
    if (friendId) {
      getConversationWithUser(friendId)
        .then((rel) => {
          if (rel && rel.status) {
            setRelationship(rel);
          }
        })
        .catch(() => {});
    }
  }, [profile, userId]);

  if (!profile && !loading) return null;

  const displayName = profile?.displayName || profile?.username || 'User';
  const username = profile?.username || '';
  const avatarUrl = profile?.avatarUrl;
  const bio = profile?.bio || 'No bio provided yet.';
  const joinedText = formatJoinedDate(profile?.createdAt);
  const statusText = formatLastSeenText(isOnline, lastSeenVal, statusStr);

  const handleSendFriendRequest = async () => {
    const friendIdToUse = profile?.id || profile?.userId || userId;
    if (!friendIdToUse) return;
    try {
      setRelLoading(true);
      const res = await sendFriendRequest(friendIdToUse);
      setRelationship({
        exists: true,
        status: 'PENDING',
        isInitiator: true,
        conversationId: res?.conversationId || relationship?.conversationId,
      });
      setActionSuccessMsg('Friend request sent!');
      setTimeout(() => setActionSuccessMsg(''), 3500);
    } catch (err) {
      console.error('Failed to send friend request', err);
    } finally {
      setRelLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      setRelLoading(true);
      await acceptChatRequest(relationship.conversationId);
      setRelationship((prev) => ({ ...prev, status: 'ACCEPTED' }));
      setActionSuccessMsg('Request accepted!');
      setTimeout(() => setActionSuccessMsg(''), 3500);
    } catch (err) {
      console.error('Failed to accept request', err);
    } finally {
      setRelLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    try {
      setRelLoading(true);
      await declineChatRequest(relationship.conversationId);
      setRelationship((prev) => ({ ...prev, status: 'DECLINED' }));
    } catch (err) {
      console.error('Failed to decline request', err);
    } finally {
      setRelLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const friendIdToUse = profile?.id || profile?.userId || userId;
    if (!friendIdToUse) return;
    try {
      const res = await startConversation(friendIdToUse);
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

  const isAccepted = relationship.status === 'ACCEPTED';
  const isPending = relationship.status === 'PENDING';
  const isDeclined = relationship.status === 'DECLINED';
  const isNone = !relationship.exists || relationship.status === 'NONE';

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

          {actionSuccessMsg && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ade80',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              textAlign: 'center',
              margin: '10px 0'
            }}>
              <i className="fa-solid fa-circle-check"></i> {actionSuccessMsg}
            </div>
          )}
        </div>

        <div className="profile-modal-actions">
          {isAccepted && (
            <>
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
            </>
          )}

          {isPending && relationship.isInitiator && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px', alignItems: 'center' }}>
              <button type="button" className="profile-action-btn primary" disabled style={{ opacity: 0.85, width: '100%' }}>
                <i className="fa-regular fa-clock"></i>
                <span>Request Sent (Pending)</span>
              </button>
              {relationship.conversationId && (
                <button
                  type="button"
                  className="profile-action-btn secondary"
                  onClick={() => {
                    onClose();
                    navigate(`/chat/${relationship.conversationId}`, { state: { friend: profile } });
                  }}
                  style={{ width: '100%' }}
                >
                  <i className="fa-solid fa-comments"></i>
                  <span>Open Chat</span>
                </button>
              )}
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Waiting for user to accept your friend request</span>
            </div>
          )}

          {isPending && !relationship.isInitiator && (
            <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
              <button type="button" className="profile-action-btn primary" onClick={handleAcceptRequest} disabled={relLoading} style={{ flex: 1 }}>
                <i className="fa-solid fa-check"></i>
                <span>Accept</span>
              </button>
              <button type="button" className="profile-action-btn secondary" onClick={handleDeclineRequest} disabled={relLoading} style={{ flex: 1 }}>
                <i className="fa-solid fa-xmark"></i>
                <span>Decline</span>
              </button>
            </div>
          )}

          {isDeclined && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: '#fca5a5', textAlign: 'center' }}>
                <i className="fa-solid fa-circle-exclamation"></i> Previous request was declined
              </div>
              <button type="button" className="profile-action-btn primary" onClick={handleSendFriendRequest} disabled={relLoading} style={{ width: '100%' }}>
                <i className="fa-solid fa-rotate-right"></i>
                <span>Send Request Again</span>
              </button>
            </div>
          )}

          {isNone && (
            <button type="button" className="profile-action-btn primary" onClick={handleSendFriendRequest} disabled={relLoading} style={{ width: '100%' }}>
              <i className="fa-solid fa-user-plus"></i>
              <span>Send Friend Request</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

