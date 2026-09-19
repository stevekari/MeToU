import { useDispatch, useSelector } from 'react-redux';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { parseMessageContent } from '../utils/messageContent';
import { formatTimeAgo } from '../utils/timeAgo';
import { useLanguage } from '../contexts/LanguageContext';
import { markAsRead } from '../store/slices/chatSlice';

function formatPreview(raw, t) {
  if (!raw) return t('startConversation');
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const content = parsed.type ? parsed : parseMessageContent(typeof raw === 'string' ? raw : JSON.stringify(raw));

    if (content.type === 'audio') return t('voiceMessage');
    if (content.type === 'image') return `📷 ${t('photo')}`;
    if (content.type === 'document' || content.type === 'file') return `📄 ${content.fileName || 'Document'}`;
    if (content.type === 'call') return content.status === 'missed' ? `📞 Missed call` : `📞 Call`;
    if (content.text) return content.text;
    return raw;
  } catch {
  }
}

export default function FriendCard({
  friend,
  lastMessage,
  lastMessageAt,
  unreadCount = 0,
  conversationId,
  onClick,
  onAvatarClick,
  active = false
}) {
  const dispatch = useDispatch();
  const friendId = friend?.userId || friend?._id || friend?.id;
  const userStatuses = useSelector((s) => s.presence?.userStatuses || {});
  const onlineIds = useSelector((s) => s.presence?.onlineIds || []);
  const typingMap = useSelector((s) => s.presence?.typing || {});
  const lastSeenMap = useSelector((s) => s.presence?.lastSeen || {});
  const storedConversation = useSelector((state) => conversationId ? state.chat?.conversations?.[String(conversationId)] : null);
  const { t } = useLanguage();

  const presenceObj = userStatuses[String(friendId)] || {};
  const isExplicitPresent = onlineIds.some((i) => String(i) === String(friendId));
  const isOnline = presenceObj.online ?? isExplicitPresent;
  const statusStr = presenceObj.status || (isOnline ? 'online' : 'offline');
  const isBusy = statusStr === 'busy';

  const statusType = isBusy ? 'busy' : isOnline ? 'online' : 'offline';
  const statusLabel = isBusy ? t('busy') : isOnline ? t('online') : t('offline');

  const typingState = typingMap[String(conversationId)] || typingMap[String(friendId)];
  const isTyping = Boolean(typingState?.isTyping);

  const avatarSrc = resolveAvatarUrl(friend?.avatarUrl || friend?.avatar, friend?.username);
  const displayName = friend?.displayName || presenceObj?.displayName || friend?.username || 'User';
  const rawUnread = storedConversation?.unread ?? unreadCount;
  const effectiveUnread = active ? 0 : rawUnread;
  const visibleLastMessage = storedConversation?.lastMessage ?? lastMessage;
  const visibleLastMessageAt = storedConversation?.lastMessageAt ?? lastMessageAt;

  const time = visibleLastMessageAt ? new Date(visibleLastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const lastSeenTimestamp = presenceObj.lastSeen || lastSeenMap[String(friendId)] || friend?.lastSeen;
  const lastSeenRelative = !isOnline && lastSeenTimestamp ? formatTimeAgo(lastSeenTimestamp) : null;

  const handleClick = (e) => {
    if (conversationId) {
      dispatch(markAsRead(conversationId));
    }
    onClick?.(e);
  };

  const handleAvatarClick = (e) => {
    if (onAvatarClick) {
      e.stopPropagation();
      onAvatarClick(friend);
    }
  };

  return (
    <div className={`friend-card ${active ? 'active' : ''}`} onClick={handleClick}>
      <div className="friend-avatar-wrap" onClick={handleAvatarClick} title="View profile">
        <img className="friend-avatar" src={avatarSrc} alt={displayName} />
        <span
          className={`online-dot ${statusType}`}
          aria-label={statusLabel}
          title={statusLabel}
        ></span>
      </div>

      <div className="friend-info">
        <div className="friend-top">
          <div className="friend-name-wrap">
            <span className="friend-name">{displayName}</span>
            {friend?.username && friend.username !== displayName && (
              <span className="friend-username-sub">@{friend.username}</span>
            )}
          </div>
          {time && <div className="friend-time">{time}</div>}
        </div>

        <div className="friend-bottom">
          <div className={`friend-preview ${isTyping ? 'typing' : ''}`}>
            {isTyping ? (
              <span className="typing-text">
                <span className="typing-dots"><span>.</span><span>.</span><span>.</span></span> {t('typing')}
              </span>
            ) : visibleLastMessage ? (
              formatPreview(visibleLastMessage, t)
            ) : (
              <span className={`friend-status-pill ${statusType}`}>
                {statusLabel}
              </span>
            )}
          </div>
          {effectiveUnread > 0 && <div className="unread-badge">{effectiveUnread > 99 ? '99+' : effectiveUnread}</div>}
        </div>

        {!isOnline && !isTyping && lastSeenRelative && (
          <div className="last-seen">
            <i className="fa-regular fa-clock" style={{ marginRight: '4px', fontSize: '0.75rem' }}></i>
            {t('lastSeen')} {lastSeenRelative}
          </div>
        )}
      </div>
    </div>
  );
}