import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserProfile } from '../api/userApi';
import { getUserPosts, toggleLikePost, getPostComments, addPostComment } from '../api/postApi';
import {
  startConversation,
  sendFriendRequest,
  getConversationWithUser,
  acceptChatRequest,
  declineChatRequest,
} from '../api/conversationApi';
import { formatJoinedDate, formatLastSeenText } from '../utils/timeAgo';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import '../styles/profileModal.css';
import '../styles/feed.css';

export default function UserProfileModal({ user, userId, onClose, onStartCall }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user && Boolean(userId));
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'about'
  const [commentsState, setCommentsState] = useState({});
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
    const friendId = profile?.id || profile?.userId || userId;
    if (friendId) {
      getConversationWithUser(friendId)
        .then((rel) => {
          if (rel && rel.status) {
            setRelationship(rel);
          }
        })
        .catch(() => {});

      // Load their posts
      setLoadingPosts(true);
      getUserPosts(friendId)
        .then((data) => setPosts(data || []))
        .catch(() => setPosts([]))
        .finally(() => setLoadingPosts(false));
    }
  }, [profile, userId]);

  if (!profile && !loading) return null;

  const displayName = profile?.displayName || profile?.username || 'User';
  const username = profile?.username || '';
  const avatarUrl = resolveAvatarUrl(profile?.avatarUrl, displayName);
  const bio = profile?.bio || profile?.headline || 'Member of GioChat Network.';
  const joinedText = formatJoinedDate(profile?.createdAt);
  const statusText = formatLastSeenText(isOnline, lastSeenVal, statusStr);
  const friendIdToUse = profile?.id || profile?.userId || userId;

  const handleSendFriendRequest = async () => {
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
    if (!friendIdToUse) return;
    try {
      const res = await startConversation(friendIdToUse);
      onClose();
      navigate(`/chat/${res.conversationId}`, { state: { friend: profile } });
    } catch (err) {
      console.error('Failed to start chat', err);
    }
  };

  const handleViewFullProfile = () => {
    onClose();
    navigate(`/profile/${friendIdToUse}`);
  };

  const handleLike = async (postId) => {
    try {
      const updated = await toggleLikePost(postId, 'LIKE');
      setPosts(posts.map((p) => (p.id === postId ? updated : p)));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const toggleCommentsDrawer = async (postId) => {
    if (commentsState[postId]?.isOpen) {
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], isOpen: false },
      }));
      return;
    }

    setCommentsState((prev) => ({
      ...prev,
      [postId]: { ...prev[postId], isOpen: true, loading: true, list: prev[postId]?.list || [] },
    }));

    try {
      const comments = await getPostComments(postId);
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], isOpen: true, loading: false, list: comments || [] },
      }));
    } catch (err) {
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], isOpen: true, loading: false },
      }));
    }
  };

  const handleAddComment = async (postId) => {
    const inputVal = commentsState[postId]?.input || '';
    if (!inputVal.trim()) return;

    try {
      const newComment = await addPostComment(postId, inputVal.trim());
      setCommentsState((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          input: '',
          list: [...(prev[postId]?.list || []), newComment],
        },
      }));
      setPosts(posts.map((p) => (p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p)));
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  const isAccepted = relationship.status === 'ACCEPTED';
  const isPending = relationship.status === 'PENDING';
  const isDeclined = relationship.status === 'DECLINED';
  const isNone = !relationship.exists || relationship.status === 'NONE';

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button type="button" className="profile-modal-close-btn" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="profile-modal-header">
          <div className="profile-modal-avatar-wrapper" onClick={handleViewFullProfile} style={{ cursor: 'pointer' }} title="Click to view full profile">
            <img src={avatarUrl} alt={displayName} className="profile-modal-avatar" />
            <span className={`profile-modal-status-badge ${isOnline ? (statusStr === 'busy' ? 'busy' : 'online') : 'offline'}`} />
          </div>

          <h2 className="profile-modal-name" onClick={handleViewFullProfile} style={{ cursor: 'pointer' }} title="Click to view full profile">
            {displayName}
          </h2>
          <p className="profile-modal-handle">@{username}</p>

          <div className={`profile-modal-status-pill ${isOnline ? (statusStr === 'busy' ? 'busy' : 'online') : 'offline'}`}>
            <span className="profile-status-dot" />
            <span>{statusText}</span>
          </div>

          <button
            type="button"
            onClick={handleViewFullProfile}
            style={{
              marginTop: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-arrow-up-right-from-square"></i> View Full Profile & Analytics
          </button>
        </div>

        {/* Tab switcher: Posts vs About */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', padding: '0 20px', gap: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 0',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'posts' ? '#10b981' : 'var(--text-muted, #94a3b8)',
              borderBottom: activeTab === 'posts' ? '2px solid #10b981' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-signs-post"></i> Posts ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 0',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'about' ? '#10b981' : 'var(--text-muted, #94a3b8)',
              borderBottom: activeTab === 'about' ? '2px solid #10b981' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-user"></i> About & Bio
          </button>
        </div>

        <div className="profile-modal-body" style={{ padding: '16px 20px' }}>
          {activeTab === 'about' && (
            <>
              <div className="profile-modal-section">
                <span className="profile-modal-section-title">About</span>
                <p className="profile-modal-bio">{bio}</p>
              </div>

              {profile?.skills && (
                <div className="profile-modal-section" style={{ marginTop: '12px' }}>
                  <span className="profile-modal-section-title">Skills</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {profile.skills.split(',').map((s, idx) => (
                      <span key={idx} className="network-skill-badge">{s.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="profile-modal-meta" style={{ marginTop: '14px' }}>
                <div className="profile-meta-item">
                  <i className="fa-regular fa-calendar"></i>
                  <span>{joinedText}</span>
                </div>
                {profile?.location && (
                  <div className="profile-meta-item">
                    <i className="fa-solid fa-location-dot"></i>
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile?.email && (
                  <div className="profile-meta-item">
                    <i className="fa-regular fa-envelope"></i>
                    <span>{profile.email}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'posts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingPosts ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  <i className="fa-solid fa-circle-notch fa-spin"></i> Loading posts...
                </div>
              ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  <i className="fa-regular fa-newspaper fa-2x" style={{ marginBottom: '8px' }}></i>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>{displayName} hasn't posted anything yet.</p>
                </div>
              ) : (
                posts.map((post) => {
                  const commentsInfo = commentsState[post.id] || { isOpen: false, list: [], input: '', loading: false };
                  return (
                    <div key={post.id} className="feed-post-card" style={{ padding: '12px', borderRadius: '12px' }}>
                      <div className="post-header" style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
                          {post.postType && post.postType !== 'STANDARD' && (
                            <span className={`post-type-tag post-type-${post.postType}`} style={{ marginLeft: '8px' }}>
                              {post.postType}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="post-content" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                        {post.content}
                      </div>

                      {post.projectTitle && (
                        <div className="post-embed-box" style={{ padding: '8px 10px', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{post.projectTitle}</strong>
                          {post.projectUrl && (
                            <a href={post.projectUrl} target="_blank" rel="noreferrer" className="embed-link" style={{ fontSize: '0.8rem' }}>
                              View Repo &rarr;
                            </a>
                          )}
                        </div>
                      )}

                      {post.mediaUrl && (
                        <div className="post-media-container" style={{ maxHeight: '200px', marginBottom: '8px' }}>
                          <img src={post.mediaUrl} alt="Attachment" />
                        </div>
                      )}

                      <div className="post-stats-row" style={{ paddingBottom: '6px', fontSize: '0.78rem' }}>
                        <span>{post.likesCount || 0} likes</span>
                        <span>{post.commentsCount || 0} comments</span>
                      </div>

                      <div className="post-actions-bar" style={{ paddingTop: '6px' }}>
                        <button
                          type="button"
                          className={`post-action-btn ${post.isLikedByCurrentUser ? 'liked' : ''}`}
                          onClick={() => handleLike(post.id)}
                          style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                        >
                          <i className={`fa-${post.isLikedByCurrentUser ? 'solid' : 'regular'} fa-thumbs-up`}></i> Like
                        </button>
                        <button
                          type="button"
                          className="post-action-btn"
                          onClick={() => toggleCommentsDrawer(post.id)}
                          style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                        >
                          <i className="fa-regular fa-comment"></i> Comment
                        </button>
                      </div>

                      {commentsInfo.isOpen && (
                        <div className="post-comments-drawer" style={{ marginTop: '8px', paddingTop: '8px' }}>
                          <div className="comment-input-row" style={{ marginBottom: '8px' }}>
                            <input
                              type="text"
                              className="comment-input"
                              placeholder="Write a comment..."
                              value={commentsInfo.input || ''}
                              onChange={(e) =>
                                setCommentsState((prev) => ({
                                  ...prev,
                                  [post.id]: { ...prev[post.id], input: e.target.value },
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment(post.id);
                              }}
                              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                            />
                            <button
                              type="button"
                              className="comment-submit-btn"
                              onClick={() => handleAddComment(post.id)}
                              style={{ width: '28px', height: '28px' }}
                            >
                              <i className="fa-solid fa-paper-plane" style={{ fontSize: '0.75rem' }}></i>
                            </button>
                          </div>

                          {commentsInfo.loading ? (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Loading comments...</div>
                          ) : (
                            <div className="comments-list">
                              {commentsInfo.list?.map((c) => (
                                <div key={c.id} className="comment-bubble" style={{ padding: '6px 10px', fontSize: '0.82rem' }}>
                                  <div>
                                    <strong>{c.authorDisplayName || c.authorUsername}</strong>
                                    <div style={{ marginTop: '2px' }}>{c.content}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

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
              <button type="button" className="profile-action-btn secondary" onClick={() => onStartCall?.(profile, 'voice')}>
                <i className="fa-solid fa-phone"></i>
                <span>Voice</span>
              </button>
              <button type="button" className="profile-action-btn secondary" onClick={() => onStartCall?.(profile, 'video')}>
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
