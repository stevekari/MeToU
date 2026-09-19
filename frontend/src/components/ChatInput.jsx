import { useEffect, useRef, useState, useCallback } from 'react';
import { uploadMediaFile } from '../api/conversationApi';
import { useLanguage } from '../contexts/LanguageContext';

function pickAudioMimeType() {
  if (!window.MediaRecorder?.isTypeSupported) return '';

  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];

  return candidates.find((type) => window.MediaRecorder.isTypeSupported(type)) || '';
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const draftWaveBars = [6, 12, 20, 9, 24, 15, 18, 8, 14, 22, 11, 16, 25, 13, 19, 8, 15, 23, 12, 17, 9, 21, 14, 7];

export default function ChatInput({
  onSend,
  onTyping,
  replyingTo,
  onCancelReply,
  editingMessage,
  onSaveEdit,
  onCancelEdit
}) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [draftPlaying, setDraftPlaying] = useState(false);
  const [draftProgress, setDraftProgress] = useState(0);
  const [draftCurrentTime, setDraftCurrentTime] = useState(0);
  const [imageDraft, setImageDraft] = useState(null);
  const [documentDraft, setDocumentDraft] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [inputError, setInputError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isSendingAnim, setIsSendingAnim] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const recordingTimerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const draftAudioRef = useRef(null);
  const attachMenuRef = useRef(null);
  const { t } = useLanguage();

  const isBusy = uploadingVoice || uploadingFile;

  // Sync editing message text into input
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '');
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  // Handle outside click for attachment menu
  useEffect(() => {
    const handleOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showAttachMenu]);

  // Debounced typing handler
  const handleTextChange = (e) => {
    const nextVal = e.target.value;
    setText(nextVal);

    if (onTyping) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTyping(true);
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTyping(false);
      }, 2500);
    }
  };

  const stopTypingNow = useCallback(() => {
    if (isTypingRef.current && onTyping) {
      isTypingRef.current = false;
      onTyping(false);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    }
  }, [onTyping]);

  // Track recording elapsed timer
  useEffect(() => {
    if (recording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [recording]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (voiceDraft?.previewUrl) {
        URL.revokeObjectURL(voiceDraft.previewUrl);
      }
      if (imageDraft?.previewUrl) {
        URL.revokeObjectURL(imageDraft.previewUrl);
      }
    };
  }, [voiceDraft, imageDraft]);

  // Handle voice draft audio playback events
  useEffect(() => {
    const audio = draftAudioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setDraftCurrentTime(audio.currentTime);
      const total = audio.duration || voiceDraft?.durationSec || 1;
      setDraftProgress((audio.currentTime / total) * 100);
    };
    const onEnded = () => {
      setDraftPlaying(false);
      setDraftProgress(0);
      setDraftCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [voiceDraft]);

  const toggleDraftPlay = async () => {
    const audio = draftAudioRef.current;
    if (!audio) return;
    if (draftPlaying) {
      audio.pause();
      setDraftPlaying(false);
    } else {
      try {
        await audio.play();
        setDraftPlaying(true);
      } catch {
        setDraftPlaying(false);
      }
    }
  };

  const handleDraftSeek = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const audio = draftAudioRef.current;
    if (audio) {
      const total = audio.duration || voiceDraft?.durationSec || 1;
      audio.currentTime = pct * total;
      setDraftProgress(pct * 100);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    stopTypingNow();

    if (imageDraft) {
      sendImageDraft();
      return;
    }

    if (documentDraft) {
      sendDocumentDraft();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSendingAnim(true);
    setTimeout(() => setIsSendingAnim(false), 500);

    if (editingMessage) {
      onSaveEdit?.(editingMessage.id, trimmed);
      setText('');
      return;
    }

    const payload = {
      content: JSON.stringify({ type: 'text', text: trimmed }),
      replyToId: replyingTo?.id || null,
      replyToSenderName: replyingTo ? (replyingTo.senderName || (replyingTo.isMine ? 'You' : 'Friend')) : null,
      replyToContent: replyingTo ? (replyingTo.contentSnippet || replyingTo.content || '') : null,
    };

    onSend(payload.content, payload.replyToId, payload.replyToSenderName, payload.replyToContent);
    setText('');
    if (replyingTo && onCancelReply) {
      onCancelReply();
    }
  };

  const addEmoji = (emoji) => {
    setText((currentText) => `${currentText}${emoji}`);
    inputRef.current?.focus();
  };

  const handleImageSelect = (e) => {
    setShowAttachMenu(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setInputError(t('onlyImagesAllowed'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setInputError(t('maxImageSize'));
      return;
    }

    setInputError('');
    if (imageDraft?.previewUrl) {
      URL.revokeObjectURL(imageDraft.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setImageDraft({
      file,
      previewUrl,
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + ' KB',
    });

    e.target.value = '';
  };

  const handleDocumentSelect = (e) => {
    setShowAttachMenu(false);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setInputError('Maximum file size is 25MB');
      return;
    }

    setInputError('');
    const sizeStr = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';

    setDocumentDraft({
      file,
      fileName: file.name,
      fileSize: sizeStr,
      contentType: file.type || 'application/octet-stream',
    });

    e.target.value = '';
  };

  const clearImageDraft = () => {
    if (imageDraft?.previewUrl) {
      URL.revokeObjectURL(imageDraft.previewUrl);
    }
    setImageDraft(null);
    setInputError('');
  };

  const clearDocumentDraft = () => {
    setDocumentDraft(null);
    setInputError('');
  };

  const sendImageDraft = async () => {
    if (!imageDraft?.file) return;

    try {
      setInputError('');
      setUploadingFile(true);
      const uploaded = await uploadMediaFile(imageDraft.file, 'image');
      onSend(
        JSON.stringify({
          type: 'image',
          mediaUrl: uploaded.url,
          fileName: imageDraft.fileName,
          fileSize: imageDraft.fileSize,
        }),
        replyingTo?.id,
        replyingTo ? (replyingTo.senderName || (replyingTo.isMine ? 'You' : 'Friend')) : null,
        replyingTo?.content
      );
      clearImageDraft();
      if (replyingTo && onCancelReply) onCancelReply();

      const trimmed = text.trim();
      if (trimmed) {
        onSend(JSON.stringify({ type: 'text', text: trimmed }));
        setText('');
      }
    } catch (error) {
      const backendError = error?.response?.data?.error;
      setInputError(backendError || t('photoUploadFailed'));
    } finally {
      setUploadingFile(false);
    }
  };

  const sendDocumentDraft = async () => {
    if (!documentDraft?.file) return;

    try {
      setInputError('');
      setUploadingFile(true);
      const uploaded = await uploadMediaFile(documentDraft.file, 'file');
      onSend(
        JSON.stringify({
          type: 'file',
          mediaUrl: uploaded.url,
          fileName: uploaded.fileName || documentDraft.fileName,
          fileSize: uploaded.fileSize || documentDraft.fileSize,
          contentType: uploaded.contentType || documentDraft.contentType,
        }),
        replyingTo?.id,
        replyingTo ? (replyingTo.senderName || (replyingTo.isMine ? 'You' : 'Friend')) : null,
        replyingTo?.content
      );
      clearDocumentDraft();
      if (replyingTo && onCancelReply) onCancelReply();

      const trimmed = text.trim();
      if (trimmed) {
        onSend(JSON.stringify({ type: 'text', text: trimmed }));
        setText('');
      }
    } catch (error) {
      const backendError = error?.response?.data?.error;
      setInputError(backendError || 'Failed to upload document');
    } finally {
      setUploadingFile(false);
    }
  };

  const clearVoiceDraft = () => {
    if (voiceDraft?.previewUrl) {
      URL.revokeObjectURL(voiceDraft.previewUrl);
    }
    setVoiceDraft(null);
    setDraftPlaying(false);
    setDraftProgress(0);
    setDraftCurrentTime(0);
  };

  const sendVoiceDraft = async () => {
    if (!voiceDraft?.file) return;

    try {
      setInputError('');
      setUploadingVoice(true);
      const uploaded = await uploadMediaFile(voiceDraft.file, 'audio');
      onSend(
        JSON.stringify({
          type: 'audio',
          mediaUrl: uploaded.url,
          durationSec: voiceDraft.durationSec,
        }),
        replyingTo?.id,
        replyingTo ? (replyingTo.senderName || (replyingTo.isMine ? 'You' : 'Friend')) : null,
        replyingTo?.content
      );
      clearVoiceDraft();
      if (replyingTo && onCancelReply) onCancelReply();
    } catch (error) {
      const backendError = error?.response?.data?.error;
      setInputError(backendError || t('voiceUploadFailed'));
    } finally {
      setUploadingVoice(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      chunksRef.current = [];
      mediaRecorderRef.current.onstop = () => {
        setRecording(false);
      };
      mediaRecorderRef.current.stop();
    } else {
      setRecording(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const startRecording = async () => {
    if (!window.MediaRecorder) {
      setInputError(t('voiceUnsupported'));
      return;
    }

    try {
      setInputError('');
      clearVoiceDraft();
      clearImageDraft();
      clearDocumentDraft();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = pickAudioMimeType();
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        setRecording(false);
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));

        if (!chunksRef.current.length) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        const mimeType = recorder.mimeType || preferredMimeType || 'audio/webm';
        const extension = mimeType.includes('ogg')
          ? 'ogg'
          : mimeType.includes('mp4')
            ? 'm4a'
            : 'webm';
        const file = new File([blob], `voice-${Date.now()}.${extension}`, {
          type: mimeType,
        });
        const previewUrl = URL.createObjectURL(blob);
        setVoiceDraft({ file, previewUrl, durationSec });
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setInputError(t('microphoneDenied'));
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const previewUrl = URL.createObjectURL(file);
          setImageDraft({
            file,
            previewUrl,
            fileName: `image-${Date.now()}.${file.type.split('/')[1] || 'png'}`,
            fileSize: (file.size / 1024).toFixed(1) + ' KB',
          });
          break;
        }
      }
    }
  };

  return (
    <div className="chat-input-container">
      {/* Active Replying To Banner */}
      {replyingTo && (
        <div className="chat-reply-banner">
          <div className="chat-reply-indicator">
            <i className="fa-solid fa-reply"></i>
            <div className="chat-reply-details">
              <span className="chat-reply-name">
                Replying to {replyingTo.senderName || (replyingTo.isMine ? 'yourself' : 'Friend')}
              </span>
              <span className="chat-reply-snippet">
                {replyingTo.contentSnippet || replyingTo.content}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="chat-reply-close-btn"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Active Editing Message Banner */}
      {editingMessage && (
        <div className="chat-reply-banner editing">
          <div className="chat-reply-indicator">
            <i className="fa-solid fa-pen"></i>
            <div className="chat-reply-details">
              <span className="chat-reply-name">Editing Message</span>
              <span className="chat-reply-snippet">{editingMessage.content}</span>
            </div>
          </div>
          <button
            type="button"
            className="chat-reply-close-btn"
            onClick={() => {
              setText('');
              onCancelEdit?.();
            }}
            aria-label="Cancel editing"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <form className="chat-input" onSubmit={handleSubmit} onPaste={handlePaste}>
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.csv,.ppt,.pptx"
          onChange={handleDocumentSelect}
          style={{ display: 'none' }}
        />

        {/* 1. RECORDING BAR */}
        {recording ? (
          <div className="voice-recording-capsule">
            <div className="voice-recording-status">
              <span className="voice-record-dot" />
              <span className="voice-record-timer">{formatTime(recordingSeconds)}</span>
            </div>

            <div className="voice-recording-waves">
              {[4, 12, 22, 10, 26, 16, 20, 8, 14, 24, 18, 10, 16, 22, 12, 18].map((h, idx) => (
                <span
                  key={idx}
                  className="voice-record-wave-bar"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${(idx % 6) * 0.12}s`,
                  }}
                />
              ))}
            </div>

            <div className="voice-recording-controls">
              <button
                type="button"
                className="voice-bar-btn voice-trash-btn"
                onClick={cancelRecording}
                title={t('cancel')}
                aria-label="Discard recording"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>

              <button
                type="button"
                className="voice-bar-btn voice-stop-btn"
                onClick={stopRecording}
                title={t('stopRecording')}
                aria-label="Stop recording"
              >
                <i className="fa-solid fa-stop"></i>
              </button>
            </div>
          </div>
        ) : voiceDraft ? (
          /* 2. VOICE DRAFT BAR */
          <div className="voice-draft-capsule">
            <audio ref={draftAudioRef} src={voiceDraft.previewUrl} preload="metadata" />

            <button
              type="button"
              className="voice-draft-play-btn"
              onClick={toggleDraftPlay}
              title={draftPlaying ? 'Pause' : 'Play'}
              aria-label={draftPlaying ? 'Pause' : 'Play'}
            >
              {draftPlaying ? (
                <i className="fa-solid fa-pause"></i>
              ) : (
                <i className="fa-solid fa-play"></i>
              )}
            </button>

            <div className="voice-draft-waveform-wrap" onClick={handleDraftSeek}>
              <div className="voice-draft-waveform">
                {draftWaveBars.map((h, idx, arr) => {
                  const barPct = (idx / arr.length) * 100;
                  const isPassed = draftProgress >= barPct;
                  return (
                    <span
                      key={idx}
                      className={`voice-draft-bar-segment ${isPassed ? 'active' : ''}`}
                      style={{ height: `${h}px` }}
                    />
                  );
                })}
              </div>
              <div className="voice-draft-progress-line">
                <div
                  className="voice-draft-progress-filled"
                  style={{ width: `${draftProgress}%` }}
                />
              </div>
            </div>

            <span className="voice-draft-time">
              {draftPlaying
                ? formatTime(draftCurrentTime)
                : formatTime(voiceDraft.durationSec)}
            </span>

            <button
              type="button"
              className="voice-draft-btn voice-draft-trash-btn"
              onClick={clearVoiceDraft}
              disabled={uploadingVoice}
              title={t('cancel')}
              aria-label="Delete draft"
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>

            <button
              type="button"
              className="voice-draft-btn voice-draft-send-btn"
              onClick={sendVoiceDraft}
              disabled={uploadingVoice}
              title={t('send')}
              aria-label="Send voice message"
            >
              {uploadingVoice ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-solid fa-paper-plane"></i>
              )}
            </button>
          </div>
        ) : (
          /* 3. NORMAL CHAT INPUT BAR */
          <>
            {/* Attachment Button (+) with dropdown */}
            <div className="attach-menu-wrapper" ref={attachMenuRef}>
              <button
                type="button"
                className="chat-action attach-btn"
                onClick={() => setShowAttachMenu((prev) => !prev)}
                title="Attach image or document"
                aria-label="Attach file"
                disabled={isBusy}
              >
                <i className={`fa-solid ${showAttachMenu ? 'fa-xmark' : 'fa-plus'}`}></i>
              </button>

              {showAttachMenu && (
                <div className="attach-dropdown-menu">
                  <button
                    type="button"
                    className="attach-menu-item"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="fa-solid fa-image attach-icon-photo"></i>
                    <span>Photo / Image</span>
                  </button>
                  <button
                    type="button"
                    className="attach-menu-item"
                    onClick={() => docInputRef.current?.click()}
                  >
                    <i className="fa-solid fa-file-lines attach-icon-doc"></i>
                    <span>Document / PDF</span>
                  </button>
                </div>
              )}
            </div>

            <div className="emoji-picker-wrap">
              <button
                type="button"
                className="chat-action"
                onClick={() => setShowEmojiPicker((visible) => !visible)}
                aria-label="Add emoji"
                title="Add emoji"
                disabled={isBusy}
              >
                <span aria-hidden="true">😊</span>
              </button>
              {showEmojiPicker && (
                <div className="emoji-picker" role="group" aria-label="Emoji picker">
                  {['😊', '😂', '😍', '❤️', '👍', '👏', '🎉', '🔥', '😢', '😡', '🙏', '✨'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="emoji-option"
                      onClick={() => addEmoji(emoji)}
                      aria-label={`Add ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="chat-action voice-action"
              onClick={startRecording}
              title={t('recordVoice')}
              aria-label={t('recordVoice')}
              disabled={isBusy}
            >
              <i className="fa-solid fa-microphone"></i>
            </button>

            <input
              ref={inputRef}
              type="text"
              value={text}
              placeholder={editingMessage ? 'Update message...' : (imageDraft || documentDraft) ? 'Add a caption...' : t('typeMessage')}
              onChange={handleTextChange}
              onBlur={stopTypingNow}
              disabled={isBusy}
            />

            <button
              type="submit"
              className={`chat-submit ${isSendingAnim ? 'sending-active' : ''}`}
              disabled={isBusy || (!text.trim() && !imageDraft && !documentDraft)}
              aria-label="Send message"
            >
              {isBusy ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : editingMessage ? (
                <i className="fa-solid fa-check"></i>
              ) : (
                <i className="fa-solid fa-paper-plane"></i>
              )}
            </button>
          </>
        )}

        {/* Image Preview Draft */}
        {imageDraft && !recording && !voiceDraft && (
          <div className="image-draft-card">
            <div className="image-draft-preview-wrap">
              <img src={imageDraft.previewUrl} alt={imageDraft.fileName} className="image-draft-thumbnail" />
              <div className="image-draft-meta">
                <span className="image-draft-name">{imageDraft.fileName}</span>
                <span className="image-draft-size">{imageDraft.fileSize}</span>
              </div>
            </div>
            <div className="image-draft-actions">
              <button
                type="button"
                className="chat-submit image-send-btn"
                onClick={sendImageDraft}
                disabled={uploadingFile}
              >
                {uploadingFile ? t('uploading') : t('sendPhoto')}
              </button>
              <button
                type="button"
                className="chat-action image-cancel-btn"
                onClick={clearImageDraft}
                disabled={uploadingFile}
                title={t('cancel')}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        )}

        {/* Document Preview Draft */}
        {documentDraft && !recording && !voiceDraft && (
          <div className="image-draft-card document-draft-card">
            <div className="image-draft-preview-wrap">
              <div className="document-draft-icon">
                <i className="fa-solid fa-file-pdf"></i>
              </div>
              <div className="image-draft-meta">
                <span className="image-draft-name">{documentDraft.fileName}</span>
                <span className="image-draft-size">{documentDraft.fileSize}</span>
              </div>
            </div>
            <div className="image-draft-actions">
              <button
                type="button"
                className="chat-submit image-send-btn"
                onClick={sendDocumentDraft}
                disabled={uploadingFile}
              >
                {uploadingFile ? 'Uploading...' : 'Send File'}
              </button>
              <button
                type="button"
                className="chat-action image-cancel-btn"
                onClick={clearDocumentDraft}
                disabled={uploadingFile}
                title={t('cancel')}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        )}

        {inputError && <div className="chat-input-error">{inputError}</div>}
      </form>
    </div>
  );
}
