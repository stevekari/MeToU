import { useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function CallPanel({ callState, callType, isRinging, localStream, remoteStream, error, onAccept, onEnd }) {
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const ringtoneContextRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (callState !== 'incoming') return undefined;

    let intervalId;
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    const ring = () => {
      if (!AudioContext) return;
      const context = ringtoneContextRef.current || new AudioContext();
      ringtoneContextRef.current = context;
      if (context.state === 'suspended') context.resume().catch(() => {});

      const now = context.currentTime;
      [660, 880].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gain.gain.setValueAtTime(0.0001, now + index * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.16 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.16 + 0.14);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(now + index * 0.16);
        oscillator.stop(now + index * 0.16 + 0.15);
      });
    };

    ring();
    intervalId = window.setInterval(ring, 1800);

    return () => {
      window.clearInterval(intervalId);
      ringtoneContextRef.current?.close().catch(() => {});
      ringtoneContextRef.current = null;
    };
  }, [callState]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream || null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream || null;
      if (remoteStream) remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream || null;
  }, [localStream]);

  if (callState === 'idle') return null;

  const incoming = callState === 'incoming';
  const videoCall = callType === 'video';

  return (
    <div className={`call-panel ${videoCall ? 'video-call' : 'voice-call'}`}>
      {videoCall && (
        <>
          <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />
          <video ref={localVideoRef} className="local-video" autoPlay muted playsInline />
        </>
      )}
      {!videoCall && <audio ref={remoteAudioRef} autoPlay playsInline />}
      <div className="call-panel-content">
        <i className={`fa-solid ${videoCall ? 'fa-video' : 'fa-phone'} call-icon`}></i>
        <strong>{incoming
          ? t(videoCall ? 'incomingVideoCall' : 'incomingVoiceCall')
          : callState === 'calling'
            ? t(isRinging ? 'ringing' : 'calling')
            : t(videoCall ? 'videoCall' : 'voiceCall')}</strong>
        {error && <span className="call-error">{error}</span>}
        <div className="call-actions">
          {incoming && <button type="button" className="call-accept" onClick={onAccept}>{t('accept')}</button>}
          <button type="button" className="call-end" onClick={onEnd}>{incoming ? t('decline') : t('endCall')}</button>
        </div>
      </div>
    </div>
  );
}
