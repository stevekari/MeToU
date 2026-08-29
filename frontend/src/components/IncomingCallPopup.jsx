import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { callSounds } from '../utils/callSounds';
import { resolveAvatarUrl } from '../utils/avatarUrl';

export default function IncomingCallPopup({ call, onAccept, onDecline }) {
  const { t } = useLanguage();
  const videoCall = call.mediaType === 'video';

  useEffect(() => {
    callSounds.startIncomingRingtone();

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const callerName = call.friend?.username || 'Someone';
        const title = videoCall ? t('incomingVideoCall') : t('incomingVoiceCall');
        new Notification(title, {
          body: `${callerName} is calling you`,
          icon: '/favicon.svg',
          tag: `call-${call.callId}`,
          renotify: true,
        });
      } catch {}
    }

    return () => {
      callSounds.stop();
    };
  }, [call.callId, call.friend?.username, t, videoCall]);

  const handleAccept = () => {
    callSounds.stop();
    onAccept();
  };

  const handleDecline = () => {
    callSounds.stop();
    callSounds.playEndedSound();
    onDecline();
  };

  const avatarSrc = resolveAvatarUrl(call.friend?.avatarUrl, call.friend?.username);

  return (
    <div className="incoming-call-popup" role="dialog" aria-modal="true" aria-label={videoCall ? t('incomingVideoCall') : t('incomingVoiceCall')}>
      <div className="incoming-call-card ringing-pulse">
        <div className="incoming-call-avatar-wrapper">
          {call.friend?.avatarUrl ? (
            <img
              src={avatarSrc}
              alt={call.friend?.username || 'Caller'}
              className="incoming-call-avatar-img"
            />
          ) : (
            <div className="incoming-call-avatar">
              {call.friend?.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <span className="ringing-waves"></span>
        </div>

        <div className="incoming-call-type-badge">
          <i className={`fa-solid ${videoCall ? 'fa-video' : 'fa-phone'} call-icon`}></i>
          <span>{t(videoCall ? 'videoCall' : 'voiceCall')}</span>
        </div>

        <strong className="incoming-caller-name">{call.friend?.username || 'Someone'}</strong>
        <span className="incoming-call-status">{t(videoCall ? 'incomingVideoCall' : 'incomingVoiceCall')}</span>

        <div className="incoming-call-actions">
          <button type="button" className="call-accept" onClick={handleAccept}>
            <i className={`fa-solid ${videoCall ? 'fa-video' : 'fa-phone'}`}></i> {t('accept')}
          </button>
          <button type="button" className="call-end" onClick={handleDecline}>
            <i className="fa-solid fa-phone-slash"></i> {t('decline')}
          </button>
        </div>
      </div>
    </div>
  );
}
