import { useSelector } from 'react-redux';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { parseMessageContent } from '../utils/messageContent';
import { useLanguage } from '../contexts/LanguageContext';

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
  const friendId = friend.userId || friend._id || friend.id;
  const onlineIds = useSelector(s => s.presence?.onlineIds || []);
  const typingMap = useSelector(s => s.presence?.typing || {});
  const lastSeenMap = useSelector(s => s.presence?.lastSeen || {});
  const { t } = useLanguage();

  const isOnline = onlineIds.includes(friendId);
  const isTyping = typingMap[conversationId] === friendId || typingMap[friendId] === friendId;
  const avatarSrc = resolveAvatarUrl(friend.avatarUrl || friend.avatar, friend.username);

  const time = lastMessageAt? new Date(lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`friend-card ${active? 'active' : ''}`} onClick={onClick}>
      <div className="friend-avatar-wrap">
        <img className="friend-avatar" src={avatarSrc} alt={friend.username} />
        {isOnline && <span className="online-dot online" aria-label="Online"></span>}
      </div>

      <div className="friend-info">
        <div className="friend-top">
          <div className="friend-name">{friend.username}</div>
          {time && <div className="friend-time">{time}</div>}
        </div>

        <div className="friend-bottom">
          <div className={`friend-preview ${isTyping? 'typing' : ''}`}>
            {isTyping? <span className="typing-text">{t('typing')}</span> : formatPreview(lastMessage, t)}
          </div>
          {unreadCount > 0 && <div className="unread-badge">{unreadCount > 9? '9+' : unreadCount}</div>}
        </div>

        {!isOnline &&!isTyping && lastSeenMap[friendId] && (
          <div className="last-seen">{t('lastSeen')} {new Date(lastSeenMap[friendId]).toLocaleTimeString()}</div>
        )}
      </div>
    </div>
  );
}