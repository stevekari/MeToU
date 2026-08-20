import { useEffect, useRef, useState } from 'react';
import { uploadMedia } from '../api/mediaApi';
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

export default function ChatInput({ onSend }) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [recordingError, setRecordingError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const inputRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    return () => {
      if (voiceDraft?.previewUrl) {
        URL.revokeObjectURL(voiceDraft.previewUrl);
      }
    };
  }, [voiceDraft]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(JSON.stringify({ type: 'text', text: trimmed }));
    setText('');
  };

  const addEmoji = (emoji) => {
    setText((currentText) => `${currentText}${emoji}`);
    inputRef.current?.focus();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const clearVoiceDraft = () => {
    if (voiceDraft?.previewUrl) {
      URL.revokeObjectURL(voiceDraft.previewUrl);
    }
    setVoiceDraft(null);
  };

  const sendVoiceDraft = async () => {
    if (!voiceDraft?.file) return;

    try {
      setRecordingError('');
      setUploadingVoice(true);
      const uploaded = await uploadMedia(voiceDraft.file, 'audio');
      onSend(
        JSON.stringify({
          type: 'audio',
          mediaUrl: uploaded.url,
          durationSec: voiceDraft.durationSec,
        })
      );
      clearVoiceDraft();
    } catch (error) {
      const backendError = error?.response?.data?.error;
      setRecordingError(backendError || t('voiceUploadFailed'));
    } finally {
      setUploadingVoice(false);
    }
  };

  const startRecording = async () => {
    if (!window.MediaRecorder) {
      setRecordingError(t('voiceUnsupported'));
      return;
    }


    function stopHandlers() {
      return (
        <i className="fa-solid fa-stop" style={{ color: 'white' }}></i>
      )
    }
    try {
      setRecordingError('');
      clearVoiceDraft();
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
      setRecordingError(t('microphoneDenied'));
    }
  };

  function sendHandler(){
    return(
      <i className="fa-solid fa-paper-plane"></i>
    )
  }

  function voiceHandler(){
    return(
      <i className="fa-solid fa-microphone"></i>
    )
  }

  function cancelHandler(){
    return(
      <i className="fa-solid fa-xmark"></i>
    )
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <div className="emoji-picker-wrap">
        <button
          type="button"
          className="chat-action"
          onClick={() => setShowEmojiPicker((visible) => !visible)}
          aria-label="Add emoji"
          title="Add emoji"
          disabled={uploadingVoice}
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
        className={`chat-action voice-action ${recording ? 'recording' : ''}`}
        onClick={recording ? stopRecording : startRecording}
        title={recording ? t('stopRecording') : t('recordVoice')}
        disabled={uploadingVoice}
      >
        {recording ? <><i className="fa-solid fa-stop" aria-hidden="true"></i><span className="voice-action-label">Stop</span></> : voiceHandler()}
      </button>

      <input
        ref={inputRef}
        type="text"
        value={text}
        placeholder={t('typeMessage')}
        onChange={(e) => setText(e.target.value)}
        disabled={uploadingVoice}
      />
      <button type="submit" className="chat-submit" disabled={uploadingVoice}>
        {sendHandler()}
      </button>

      {voiceDraft && (
        <div className="voice-draft">
          <div className="voice-draft-title">{t('voiceReady', { duration: voiceDraft.durationSec })}</div>
          <audio controls preload="metadata" src={voiceDraft.previewUrl} className="voice-draft-audio">
            {t('audioUnsupported')}
          </audio>
          <div className="voice-draft-actions">
            <button
              type="button"
              className="chat-submit"
              onClick={sendVoiceDraft}
              disabled={uploadingVoice}
            >
              {uploadingVoice ? t('sending') : t('send')}
            </button>
            <button
              type="button"
              className="chat-action"
              onClick={clearVoiceDraft}
              disabled={uploadingVoice}
            >
              {cancelHandler()}
            </button>
          </div>
        </div>
      )}

      {recordingError && <div className="chat-input-error">{recordingError}</div>}
    </form>
  );
}
