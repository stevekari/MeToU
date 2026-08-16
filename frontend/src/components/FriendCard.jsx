import { resolveAvatarUrl } from '../utils/avatarUrl';

export default function FriendCard({ friend, lastMessage, onClick, active = false }) {
  return (
    <div className={`friend-card ${active ? 'active' : ''}`} onClick={onClick}>
      <img
        className="friend-avatar"
        src={resolveAvatarUrl(friend.avatarUrl, friend.username)}
        alt={friend.username}
      />
      <div className="friend-info">
        <div className="friend-name">{friend.username}</div>
        {lastMessage && <div className="friend-preview">{lastMessage}</div>}
      </div>
    </div>
  );
}
