import { useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function IncomingCallPopup({ call, onAccept, onDecline }) {
  const ringtoneContextRef = useRef(null);
  const { t } = useLanguage();
  const videoCall = call.mediaType === 'video';

  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return undefined;

    const ring = () => {
      const context = ringtoneContextRef.current || new AudioContext();
      ringtoneContextRef.current = context;
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
    const intervalId = window.setInterval(ring, 1800);
    return () => {
      window.clearInterval(intervalId);
      ringtoneContextRef.current?.close().catch(() => {});
      ringtoneContextRef.current = null;
    };
  }, []);

  return (
    <div className="incoming-call-popup" role="dialog" aria-modal="true" aria-label={videoCall ? t('incomingVideoCall') : t('incomingVoiceCall')}>
      <div className="incoming-call-card">
        <div className="incoming-call-avatar">
          {call.friend?.username?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <i className={`fa-solid ${videoCall ? 'fa-video' : 'fa-phone'} call-icon`}></i>
        <strong>{call.friend?.username || 'Someone'}</strong>
        <span>{t(videoCall ? 'incomingVideoCall' : 'incomingVoiceCall')}</span>
        <div className="incoming-call-actions">
          <button type="button" className="call-accept" onClick={onAccept}>{t('accept')}</button>
          <button type="button" className="call-end" onClick={onDecline}>{t('decline')}</button>
        </div>
      </div>
    </div>
  );
}
