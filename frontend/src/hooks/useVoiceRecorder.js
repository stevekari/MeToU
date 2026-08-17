import { useRef, useState } from 'react';
import { pickAudioMimeType, getExtensionFromMimeType } from '../utils/pickAudioMimeType';

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const streamRef = useRef(null);

  const clearVoiceDraft = () => {
    if (voiceDraft?.previewUrl) {
      URL.revokeObjectURL(voiceDraft.previewUrl);
    }
    setVoiceDraft(null);
  };

  const startRecording = async () => {
    if (!window.MediaRecorder) {
      setError('Voice recording is not supported in this browser.');
      return;
    }
    try {
      setError('');
      clearVoiceDraft();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMimeType = pickAudioMimeType();
      const recorder = preferredMimeType
       ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        setRecording(false);
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());

        const mimeType = recorder.mimeType || preferredMimeType || 'audio/webm';
        const extension = getExtensionFromMimeType(mimeType);
        const file = new File([blob], `voice-${Date.now()}.${extension}`, { type: mimeType });
        const previewUrl = URL.createObjectURL(blob);

        setVoiceDraft({ file, previewUrl, durationSec, mimeType });
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError('Microphone permission denied or unavailable.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  return {
    recording,
    voiceDraft,
    error,
    setError,
    startRecording,
    stopRecording,
    clearVoiceDraft,
    setVoiceDraft,
  };
}