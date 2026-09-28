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

    // Keyboard shortcuts for effortless answering: Enter/Space to Accept, Esc to Decline
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleAccept();
      } else if (e.key === 'Escape' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleDecline();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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
  const friendName = call.friend?.displayName || call.friend?.username || 'Someone';

  return (
    <div className="incoming-call-popup" role="dialog" aria-modal="true" aria-label={videoCall ? t('incomingVideoCall') : t('incomingVoiceCall')}>
      <div className="incoming-call-backdrop" onClick={handleDecline}></div>
      <div className="incoming-call-card ringing-pulse">
        <div className="incoming-call-avatar-wrapper">
          {call.friend?.avatarUrl ? (
            <img
              src={avatarSrc}
              alt={friendName}
              className="incoming-call-avatar-img"
            />
          ) : (
            <div className="incoming-call-avatar">
              {friendName.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <span className="ringing-waves"></span>
          <span className="ringing-waves waves-delay"></span>
        </div>

        <div className="incoming-call-type-badge">
          <i className={`fa-solid ${videoCall ? 'fa-video' : 'fa-phone'} call-icon`}></i>
          <span>{t(videoCall ? 'videoCall' : 'voiceCall')}</span>
        </div>

        <strong className="incoming-caller-name">{friendName}</strong>
        <span className="incoming-call-status">{t(videoCall ? 'incomingVideoCall' : 'incomingVoiceCall')}</span>

        <div className="incoming-call-actions">
          <button
            type="button"
            className="call-action-btn call-accept-large pulse-accept"
            onClick={handleAccept}
            title={`${t('accept')} (Press Enter or Space)`}
            aria-label={t('accept')}
            autoFocus
          >
            <div className="call-btn-circle">
              <i className={`fa-solid ${videoCall ? 'fa-video' : 'fa-phone'}`}></i>
            </div>
            <span className="call-btn-label">{t('accept')}</span>
          </button>

          <button
            type="button"
            className="call-action-btn call-end-large"
            onClick={handleDecline}
            title={`${t('decline')} (Press Esc)`}
            aria-label={t('decline')}
          >
            <div className="call-btn-circle">
              <i className="fa-solid fa-phone-slash"></i>
            </div>
            <span className="call-btn-label">{t('decline')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
