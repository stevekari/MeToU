import { parseMessageContent } from '../utils/messageContent';
import { resolveBackendUrl } from '../utils/apiBaseUrl';
import VoiceMessage from './VoiceMessage';

function resolveMediaUrl(parsed) {
  const src = parsed.mediaUrl || parsed.dataUrl;
  return resolveBackendUrl(src);
}

export default function MessageBubble({ message, isMine }) {
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isSeen = Boolean(message.seen || message.read || message.seenAt || message.readAt);
  const parsed = parseMessageContent(message.content);
  const mediaSrc = resolveMediaUrl(parsed);

  return (
    <div className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
      <div className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${parsed.type === 'audio' ? 'audio-bubble' : ''}`}>
        {parsed.type === 'text' && <div className="message-content">{parsed.text}</div>}

        {parsed.type === 'image' && (
          <img className="message-image" src={mediaSrc} alt={parsed.fileName || 'Shared photo'} />
        )}

        {parsed.type === 'audio' && (
          <VoiceMessage src={mediaSrc} durationSec={parsed.durationSec} isMine={isMine} />
        )}

        <div className="message-meta">
          <span className="message-time">{time}</span>
          {isMine && <span className={`message-status ${isSeen ? 'seen' : ''}`}>{isSeen ? '✓✓' : '✓'}</span>}
        </div>
      </div>
    </div>
  );
}