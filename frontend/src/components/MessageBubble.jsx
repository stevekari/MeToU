import { useState } from 'react';
import { parseMessageContent } from '../utils/messageContent';
import { resolveBackendUrl } from '../utils/apiBaseUrl';
import VoiceMessage from './VoiceMessage';
import { useLanguage } from '../contexts/LanguageContext';

function formatMessageTime(timestamp) {
  const value = Array.isArray(timestamp)
    ? new Date(
        timestamp[0],
        timestamp[1] - 1,
        timestamp[2],
        timestamp[3] ?? 0,
        timestamp[4] ?? 0,
        timestamp[5] ?? 0,
        Math.floor((timestamp[6] ?? 0) / 1000000),
      )
    : new Date(timestamp);

  if (Number.isNaN(value.getTime())) return '';
  return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function resolveMediaUrl(parsed) {
  const src = parsed.mediaUrl || parsed.dataUrl;
  return resolveBackendUrl(src);
}

export default function MessageBubble({ message, isMine }) {
  const { t } = useLanguage();
  const [showFullImage, setShowFullImage] = useState(false);
  const time = formatMessageTime(message.timestamp);
  const isSeen = Boolean(message.seen || message.read || message.seenAt || message.readAt);
  const parsed = parseMessageContent(message.content);
  const mediaSrc = resolveMediaUrl(parsed);

  return (
    <div className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
      <div className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${parsed.type === 'audio' ? 'audio-bubble' : ''}`}>
        {parsed.type === 'text' && <div className="message-content">{parsed.text}</div>}

        {parsed.type === 'image' && (
          <>
            <img
              className="message-image clickable-image"
              src={mediaSrc}
              alt={parsed.fileName || t('sharedPhoto')}
              onClick={() => setShowFullImage(true)}
              loading="lazy"
            />
            {showFullImage && (
              <div className="image-lightbox-overlay" onClick={() => setShowFullImage(false)}>
                <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
                  <img src={mediaSrc} alt={parsed.fileName || t('sharedPhoto')} className="image-lightbox-img" />
                  <button
                    type="button"
                    className="image-lightbox-close"
                    onClick={() => setShowFullImage(false)}
                    aria-label="Close"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                  <a
                    href={mediaSrc}
                    target="_blank"
                    rel="noreferrer"
                    download={parsed.fileName || 'photo'}
                    className="image-lightbox-download"
                    title="Download"
                  >
                    <i className="fa-solid fa-download"></i>
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {parsed.type === 'audio' && (
          <VoiceMessage src={mediaSrc} durationSec={parsed.durationSec} isMine={isMine} />
        )}

        {parsed.type === 'call' && (
          <div className={`call-history ${parsed.status}`}>
            <i className={`fa-solid ${parsed.mediaType === 'video' ? 'fa-video' : 'fa-phone'}`}></i>
            <span>{t(parsed.mediaType === 'video' ? 'videoCall' : 'voiceCall')}</span>
            <small>{t(parsed.status === 'completed' ? 'callCompleted' : 'callMissed')}</small>
          </div>
        )}

        <div className="message-meta">
          <span className="message-time">{time}</span>
          {isMine && <span className={`message-status ${isSeen ? 'seen' : ''}`}>{isSeen ? '✓✓' : '✓'}</span>}
        </div>
      </div>
    </div>
  );
}