import { useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { resolveAvatarUrl } from '../utils/avatarUrl';

export default function CallPanel({
  callState,
  callType,
  isRinging,
  localStream,
  remoteStream,
  error,
  friend,
  isMutedAudio = false,
  isMutedVideo = false,
  toggleMuteAudio,
  toggleMuteVideo,
  switchCamera,
  onAccept,
  onEnd,
}) {
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream, callState, callType]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, callState, callType]);

  if (callState === 'idle') return null;

  const incoming = callState === 'incoming';
  const calling = callState === 'calling';
  const connected = callState === 'connected';
  const videoCall = callType === 'video';

  const avatarSrc = resolveAvatarUrl(friend?.avatarUrl, friend?.username);
  const friendName = friend?.username || 'Friend';

  return (
    <div className={`call-panel ${videoCall ? 'video-call-active' : 'voice-call-active'} state-${callState}`}>
      {/* Remote Audio Track for voice calls or background audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {videoCall && (
        <div className="video-streams-container">
          {connected && remoteStream ? (
            <video
              ref={remoteVideoRef}
              className="remote-video"
              autoPlay
              playsInline
            />
          ) : (
            <div className="video-connecting-placeholder">
              <div className="video-avatar-pulse">
                {friend?.avatarUrl ? (
                  <img src={avatarSrc} alt={friendName} className="call-friend-avatar" />
                ) : (
                  <div className="call-friend-initial">{friendName.charAt(0).toUpperCase()}</div>
                )}
                <span className="pulse-ring"></span>
              </div>
              <p className="connecting-text">
                {calling ? t(isRinging ? 'ringing' : 'calling') : incoming ? t('incomingVideoCall') : t('videoCall')}
              </p>
            </div>
          )}

          {/* Local Video Picture-in-Picture */}
          <video
            ref={localVideoRef}
            className={`local-video ${isMutedVideo ? 'camera-off' : ''}`}
            autoPlay
            muted
            playsInline
          />
        </div>
      )}

      {!videoCall && (
        <div className="voice-call-container">
          <div className="voice-avatar-wrapper">
            {friend?.avatarUrl ? (
              <img src={avatarSrc} alt={friendName} className="voice-friend-avatar" />
            ) : (
              <div className="voice-friend-initial">{friendName.charAt(0).toUpperCase()}</div>
            )}
            <span className={`voice-pulse-ring ${connected ? 'connected-pulse' : 'calling-pulse'}`}></span>
          </div>

          <strong className="voice-caller-name">{friendName}</strong>
          <span className="voice-call-status">
            {incoming
              ? t('incomingVoiceCall')
              : calling
                ? t(isRinging ? 'ringing' : 'calling')
                : t('voiceCall')}
          </span>
        </div>
      )}

      {error && <div className="call-error-banner">{error}</div>}

      {/* Action and Control Bar */}
      <div className="call-control-bar">
        {incoming ? (
          <div className="incoming-actions">
            <button
              type="button"
              className="btn-call-action btn-accept"
              onClick={onAccept}
              title={t('accept')}
              aria-label={t('accept')}
            >
              <i className={`fa-solid ${videoCall ? 'fa-video' : 'fa-phone'}`}></i>
              <span>{t('accept')}</span>
            </button>
            <button
              type="button"
              className="btn-call-action btn-hangup"
              onClick={onEnd}
              title={t('decline')}
              aria-label={t('decline')}
            >
              <i className="fa-solid fa-phone-slash"></i>
              <span>{t('decline')}</span>
            </button>
          </div>
        ) : (
          <div className="active-call-controls">
            {connected && toggleMuteAudio && (
              <button
                type="button"
                className={`btn-call-ctrl ${isMutedAudio ? 'active-mute' : ''}`}
                onClick={toggleMuteAudio}
                title={isMutedAudio ? t('unmute') : t('mute')}
                aria-label={isMutedAudio ? t('unmute') : t('mute')}
              >
                <i className={`fa-solid ${isMutedAudio ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
              </button>
            )}

            {videoCall && connected && toggleMuteVideo && (
              <button
                type="button"
                className={`btn-call-ctrl ${isMutedVideo ? 'active-mute' : ''}`}
                onClick={toggleMuteVideo}
                title={isMutedVideo ? t('turnCameraOn') : t('turnCameraOff')}
                aria-label={isMutedVideo ? t('turnCameraOn') : t('turnCameraOff')}
              >
                <i className={`fa-solid ${isMutedVideo ? 'fa-video-slash' : 'fa-video'}`}></i>
              </button>
            )}

            {videoCall && connected && switchCamera && (
              <button
                type="button"
                className="btn-call-ctrl"
                onClick={switchCamera}
                title={t('switchCamera')}
                aria-label={t('switchCamera')}
              >
                <i className="fa-solid fa-camera-rotate"></i>
              </button>
            )}

            <button
              type="button"
              className="btn-call-ctrl btn-hangup"
              onClick={onEnd}
              title={t('endCall')}
              aria-label={t('endCall')}
            >
              <i className="fa-solid fa-phone-slash"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
