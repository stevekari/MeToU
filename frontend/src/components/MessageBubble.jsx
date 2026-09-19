import { useState, useRef, useEffect } from 'react';
import { parseMessageContent } from '../utils/messageContent';
import { resolveBackendUrl } from '../utils/apiBaseUrl';
import VoiceMessage from './VoiceMessage';
import MediaLightbox from './MediaLightbox';
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

function getFileIcon(fileName, contentType) {
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  if (ext === 'pdf' || (contentType && contentType.includes('pdf'))) {
    return 'fa-file-pdf file-icon-pdf';
  }
  if (['doc', 'docx'].includes(ext) || (contentType && contentType.includes('word'))) {
    return 'fa-file-word file-icon-word';
  }
  if (['xls', 'xlsx', 'csv'].includes(ext) || (contentType && contentType.includes('sheet'))) {
    return 'fa-file-excel file-icon-excel';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || (contentType && contentType.includes('zip'))) {
    return 'fa-file-zipper file-icon-zip';
  }
  return 'fa-file-lines file-icon-generic';
}

export default function MessageBubble({
  message,
  isMine,
  onReply,
  onEdit,
  onDelete,
  onScrollToMessage
}) {
  const { t } = useLanguage();
  const [showFullImage, setShowFullImage] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const isDeleted = Boolean(message.isDeleted);
  const isEdited = Boolean(message.isEdited);
  const time = formatMessageTime(message.timestamp);

  const isRead = message.status === 'READ' || Boolean(message.readAt) || Boolean(message.read) || Boolean(message.seen);
  const isDelivered = message.status === 'DELIVERED';

  const parsed = isDeleted ? { type: 'text', text: 'This message was deleted' } : parseMessageContent(message.content);
  const mediaSrc = resolveMediaUrl(parsed);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleCopy = () => {
    if (parsed.text) {
      navigator.clipboard?.writeText(parsed.text);
    }
    setShowMenu(false);
  };

  return (
    <div id={`msg-${message.id}`} className={`message-row ${isMine ? 'mine' : 'theirs'} ${isDeleted ? 'deleted-row' : ''}`}>
      <div className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${parsed.type === 'audio' ? 'audio-bubble' : ''} ${isDeleted ? 'deleted-bubble' : ''}`}>

        {/* Quoted Reply Preview */}
        {!isDeleted && (message.replyToId || message.replyToContent) && (
          <div
            className="reply-quote-preview"
            onClick={() => message.replyToId && onScrollToMessage?.(message.replyToId)}
            title="Click to jump to message"
          >
            <div className="reply-quote-sender">
              {message.replyToSenderName || 'Reply'}
            </div>
            <div className="reply-quote-text">
              {message.replyToContent || 'Original message'}
            </div>
          </div>
        )}

        {/* Action Menu (⋮) */}
        {!isDeleted && (
          <div className="message-actions-wrapper" ref={menuRef}>
            <button
              type="button"
              className="message-menu-trigger"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Message options"
            >
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>

            {showMenu && (
              <div className="message-dropdown-menu">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onReply?.(message);
                  }}
                >
                  <i className="fa-solid fa-reply"></i> Reply
                </button>

                {parsed.text && (
                  <button type="button" onClick={handleCopy}>
                    <i className="fa-regular fa-copy"></i> Copy
                  </button>
                )}

                {isMine && parsed.type === 'text' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit?.(message);
                    }}
                  >
                    <i className="fa-solid fa-pen"></i> Edit
                  </button>
                )}

                {isMine && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete?.(message.id);
                    }}
                  >
                    <i className="fa-solid fa-trash-can"></i> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Deleted Message State */}
        {isDeleted && (
          <div className="deleted-message-content">
            <i className="fa-solid fa-ban" style={{ marginRight: '6px', opacity: 0.7 }}></i>
            <em>This message was deleted</em>
          </div>
        )}

        {/* Text Message */}
        {!isDeleted && parsed.type === 'text' && (
          <div className="message-content">{parsed.text}</div>
        )}

        {/* Image Message */}
        {!isDeleted && parsed.type === 'image' && (
          <>
            <img
              className="message-image clickable-image"
              src={mediaSrc}
              alt={parsed.fileName || t('sharedPhoto')}
              onClick={() => setShowFullImage(true)}
              loading="lazy"
            />
            {showFullImage && (
              <MediaLightbox
                src={mediaSrc}
                fileName={parsed.fileName}
                senderName={isMine ? 'You' : message.senderName || message.senderUsername || 'Friend'}
                time={time}
                onClose={() => setShowFullImage(false)}
              />
            )}
          </>
        )}

        {/* File / Document Message */}
        {!isDeleted && parsed.type === 'file' && (
          <div className="document-message-card">
            <div className="document-card-icon">
              <i className={`fa-solid ${getFileIcon(parsed.fileName, parsed.contentType)}`}></i>
            </div>
            <div className="document-card-details">
              <span className="document-card-name" title={parsed.fileName}>
                {parsed.fileName || 'Attachment'}
              </span>
              {parsed.fileSize && (
                <span className="document-card-size">{parsed.fileSize}</span>
              )}
            </div>
            <a
              href={mediaSrc}
              target="_blank"
              rel="noreferrer"
              download={parsed.fileName || 'document'}
              className="document-download-btn"
              title="Download File"
            >
              <i className="fa-solid fa-arrow-down-to-bracket"></i>
            </a>
          </div>
        )}

        {/* Voice Message */}
        {!isDeleted && parsed.type === 'audio' && (
          <VoiceMessage src={mediaSrc} durationSec={parsed.durationSec} isMine={isMine} />
        )}

        {/* Call History Message */}
        {!isDeleted && parsed.type === 'call' && (
          <div className={`call-history ${parsed.status}`}>
            <i className={`fa-solid ${parsed.mediaType === 'video' ? 'fa-video' : 'fa-phone'}`}></i>
            <span>{t(parsed.mediaType === 'video' ? 'videoCall' : 'voiceCall')}</span>
            <small>{t(parsed.status === 'completed' ? 'callCompleted' : 'callMissed')}</small>
          </div>
        )}

        {/* Message Meta (Time, Edited label, Read Receipts) */}
        <div className="message-meta">
          {isEdited && !isDeleted && <span className="message-edited-badge">(edited)</span>}
          <span className="message-time">{time}</span>
          {isMine && !isDeleted && (
            <span
              className={`message-status ${isRead ? 'read' : isDelivered ? 'delivered' : 'sent'}`}
              title={isRead ? 'Read' : isDelivered ? 'Delivered' : 'Sent'}
            >
              {isRead ? '✓✓' : isDelivered ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}