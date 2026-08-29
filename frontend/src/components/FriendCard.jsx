import { useDispatch, useSelector } from 'react-redux';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { parseMessageContent } from '../utils/messageContent';
import { useLanguage } from '../contexts/LanguageContext';
import { markAsRead } from '../store/slices/chatSlice';

function formatPreview(raw, t) {
  if (!raw) return t('startConversation');
  try {
    const parsed = typeof raw === 'string'? JSON.parse(raw) : raw;
    // if it's already parsed by parseMessageContent
    const content = parsed.type? parsed : parseMessageContent(typeof raw === 'string'? raw : JSON.stringify(raw));

    if (content.type === 'audio') return t('voiceMessage');
    if (content.type === 'image') return t('photo');
    if (content.type === 'text') return content.text || raw;
    return content.text || t('newMessage');
  } catch {
    // plain string fallback
    return typeof raw === 'string'? raw : t('newMessage');
  }
}

export default function FriendCard({ friend, lastMessage, lastMessageAt, unreadCount = 0, conversationId, onClick, active = false }) {
  const dispatch = useDispatch();
  const friendId = friend.userId || friend._id || friend.id;
  const userStatuses = useSelector((s) => s.presence?.userStatuses || {});
  const onlineIds = useSelector((s) => s.presence?.onlineIds || []);
  const typingMap = useSelector((s) => s.presence?.typing || {});
  const lastSeenMap = useSelector((s) => s.presence?.lastSeen || {});
  const storedConversation = useSelector((state) => conversationId ? state.chat?.conversations?.[String(conversationId)] : null);
  const { t } = useLanguage();

  const explicitStatus = userStatuses[String(friendId)] || userStatuses[Number(friendId)];
  const isPresent = onlineIds.some((i) => String(i) === String(friendId));
  const isBusy = explicitStatus === 'busy';
  const isOnline = explicitStatus ? explicitStatus === 'online' : isPresent;
  const isOffline = explicitStatus === 'offline' || (!explicitStatus && !isPresent);

  const statusType = isBusy ? 'busy' : isOnline ? 'online' : 'offline';
  const statusLabel = isBusy ? t('busy') : isOnline ? t('online') : t('offline');

  const isTyping = typingMap[conversationId] === friendId || typingMap[friendId] === friendId;
  const avatarSrc = resolveAvatarUrl(friend.avatarUrl || friend.avatar, friend.username);
  const rawUnread = storedConversation?.unread ?? unreadCount;
  const effectiveUnread = active ? 0 : rawUnread;
  const visibleLastMessage = storedConversation?.lastMessage ?? lastMessage;
  const visibleLastMessageAt = storedConversation?.lastMessageAt ?? lastMessageAt;

  const time = visibleLastMessageAt ? new Date(visibleLastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const handleClick = (e) => {
    if (conversationId) {
      dispatch(markAsRead(conversationId));
    }
    onClick?.(e);
  };

  return (
    <div className={`friend-card ${active ? 'active' : ''}`} onClick={handleClick}>
      <div className="friend-avatar-wrap">
        <img className="friend-avatar" src={avatarSrc} alt={friend.username} />
        <span
          className={`online-dot ${statusType}`}
          aria-label={statusLabel}
          title={statusLabel}
        ></span>
      </div>

      <div className="friend-info">
        <div className="friend-top">
          <div className="friend-name">{friend.username}</div>
          {time && <div className="friend-time">{time}</div>}
        </div>

        <div className="friend-bottom">
          <div className={`friend-preview ${isTyping ? 'typing' : ''}`}>
            {isTyping ? (
              <span className="typing-text">{t('typing')}</span>
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

        {isOffline && !isTyping && lastSeenMap[friendId] && (
          <div className="last-seen">{t('lastSeen')} {new Date(lastSeenMap[friendId]).toLocaleTimeString()}</div>
        )}
      </div>
    </div>
  );
}