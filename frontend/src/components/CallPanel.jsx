import { useEffect, useRef, useState, useCallback } from 'react';
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
  const { t } = useLanguage();
  const [durationSec, setDurationSec] = useState(0);

  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);

  const connected = callState === 'connected';
  const incoming = callState === 'incoming';
  const calling = callState === 'calling';
  const videoCall = callType === 'video';

  // Call duration timer
  useEffect(() => {
    if (!connected) {
      setDurationSec(0);
      return undefined;
    }
    const timer = setInterval(() => {
      setDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [connected]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Attach remote video callback
  const attachRemoteVideo = useCallback(
    (node) => {
      remoteVideoRef.current = node;
      if (node && remoteStream) {
        node.srcObject = remoteStream;
        node.play().catch(() => {});
      }
    },
    [remoteStream]
  );

  // Attach remote audio callback
  const attachRemoteAudio = useCallback(
    (node) => {
      remoteAudioRef.current = node;
      if (node && remoteStream) {
        node.srcObject = remoteStream;
        node.play().catch(() => {});
      }
    },
    [remoteStream]
  );

  // Attach local video callback
  const attachLocalVideo = useCallback(
    (node) => {
      localVideoRef.current = node;
      if (node && localStream) {
        node.srcObject = localStream;
        node.play().catch(() => {});
      }
    },
    [localStream]
  );

  // Sync streams whenever remoteStream or localStream change
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  if (callState === 'idle') return null;

  const avatarSrc = resolveAvatarUrl(friend?.avatarUrl, friend?.username);
  const friendName = friend?.username || 'Friend';

  return (
    <div className={`call-panel ${videoCall ? 'video-call-active' : 'voice-call-active'} state-${callState}`}>
      {/* Remote Audio Track for voice & video call audio */}
      <audio
        ref={attachRemoteAudio}
        autoPlay
        playsInline
        onLoadedMetadata={(e) => e.target.play().catch(() => {})}
      />

      {videoCall && (
        <div className="video-streams-container">
          {/* Remote Video element - always in DOM, displayed when stream active */}
          <video
            ref={attachRemoteVideo}
            className={`remote-video ${connected && remoteStream ? 'video-ready' : 'video-hidden'}`}
            autoPlay
            playsInline
            onLoadedMetadata={(e) => e.target.play().catch(() => {})}
          />

          {/* Placeholder while connecting or when video is loading */}
          {(!connected || !remoteStream) && (
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
            ref={attachLocalVideo}
            className={`local-video ${isMutedVideo ? 'camera-off' : ''}`}
            autoPlay
            muted
            playsInline
            onLoadedMetadata={(e) => e.target.play().catch(() => {})}
          />

          {/* Connected Call Duration Header for Video */}
          {connected && (
            <div className="video-call-header-overlay">
              <span className="video-peer-name">{friendName}</span>
              <span className="video-call-duration">{formatDuration(durationSec)}</span>
            </div>
          )}
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
            {connected
              ? formatDuration(durationSec)
              : incoming
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
              onClick={() => onAccept && onAccept()}
              title={t('accept')}
              aria-label={t('accept')}
            >
              <i className={`fa-solid ${videoCall ? 'fa-video' : 'fa-phone'}`}></i>
              <span>{t('accept')}</span>
            </button>
            <button
              type="button"
              className="btn-call-action btn-hangup"
              onClick={() => onEnd && onEnd()}
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
