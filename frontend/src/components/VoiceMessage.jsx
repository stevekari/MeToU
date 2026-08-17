import { useEffect, useRef, useState } from 'react';


function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VoiceMessage({ src, durationSec, isMine }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSec || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / (audio.duration || duration || 1)) * 100);
    };
    const onLoaded = () => {
      if (!durationSec) setDuration(audio.duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, [duration, durationSec]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      await audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const newTime = pct * (audioRef.current.duration || duration);
    audioRef.current.currentTime = newTime;
    setProgress(pct * 100);
  };

  // fake waveform bars
  const bars = [4, 9, 16, 8, 20, 12, 18, 6, 14, 10, 22, 7, 15, 11, 18, 9, 13, 5, 16, 10];

  return (
    <div className={`voice-msg ${isMine ? 'mine' : 'theirs'}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button className="voice-play-btn" onClick={togglePlay} type="button">
        {isPlaying ? <i className="fa-solid fa-pause"></i> : <i className="fa-solid fa-play"></i>}
      </button>

      <div className="voice-body">
        <div className="voice-wave-wrap" onClick={handleSeek}>
          <div className="voice-wave">
            {bars.map((h, i) => (
              <span
                key={i}
                className="bar"
                style={{
                  height: `${h}px`,
                  opacity: (i / bars.length) * 100 < progress ? 1 : 0.35,
                  background: isMine ? (progress > (i / bars.length) * 100 ? '#fff' : 'rgba(255,255,255,0.6)') : undefined
                }}
              />
            ))}
          </div>
          <div className="voice-progress-track">
            <div className="voice-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="voice-time">
          <span>{isPlaying ? formatTime(currentTime) : formatTime(duration)}</span>
          <i className="fa-solid fa-microphone voice-mic-icon"></i>
        </div>
      </div>
    </div>
  );
}