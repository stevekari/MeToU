import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export function useWebRTCCall({ conversationId, currentUserId, sendSignal, onSignal }) {
  const { t } = useLanguage();
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState('');

  const closePeer = useCallback((notify = true) => {
    if (notify) sendSignal({ callType: 'call-end' });
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setCallType(null);
    pendingOfferRef.current = null;
  }, [sendSignal]);

  const createPeer = useCallback(async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.onicecandidate = (event) => {
      if (event.candidate) sendSignal({ callType: 'ice-candidate', candidate: event.candidate });
    };
    peer.ontrack = (event) => setRemoteStream(event.streams[0]);
    peer.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(peer.connectionState)) closePeer(false);
    };

    peerRef.current = peer;
    localStreamRef.current = stream;
    setLocalStream(stream);
    setCallType(type);
    return peer;
  }, [closePeer, sendSignal]);

  const startCall = useCallback(async (type) => {
    if (callState !== 'idle') return;
    try {
      setError('');
      setCallState('calling');
      const peer = await createPeer(type);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      sendSignal({ callType: 'call-offer', mediaType: type, offer });
    } catch {
      setError(t('callError'));
      closePeer(false);
    }
  }, [callState, closePeer, createPeer, sendSignal]);

  const acceptCall = useCallback(async () => {
    const offerSignal = pendingOfferRef.current;
    if (!offerSignal) return;
    try {
      setError('');
      const peer = await createPeer(offerSignal.mediaType);
      await peer.setRemoteDescription(new RTCSessionDescription(offerSignal.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      sendSignal({ callType: 'call-answer', answer });
      setCallState('connected');
      pendingOfferRef.current = null;
    } catch {
      setError(t('acceptCallError'));
      closePeer(false);
    }
  }, [closePeer, createPeer, sendSignal]);

  useEffect(() => {
    if (!onSignal || !conversationId) return;
    if (String(onSignal.senderId) === String(currentUserId)) return;

    if (onSignal.callType === 'call-offer' && callState === 'idle') {
      pendingOfferRef.current = onSignal;
      setCallType(onSignal.mediaType);
      setCallState('incoming');
    } else if (onSignal.callType === 'call-answer' && peerRef.current) {
      peerRef.current.setRemoteDescription(new RTCSessionDescription(onSignal.answer))
        .then(() => setCallState('connected'))
        .catch(() => setError(t('connectionError')));
    } else if (onSignal.callType === 'ice-candidate' && peerRef.current) {
      peerRef.current.addIceCandidate(new RTCIceCandidate(onSignal.candidate)).catch(() => {});
    } else if (onSignal.callType === 'call-end') {
      closePeer(false);
    }
  }, [callState, closePeer, conversationId, currentUserId, onSignal]);

  useEffect(() => () => closePeer(false), [closePeer]);

  return {
    callState,
    callType,
    localStream,
    remoteStream,
    error,
    startCall,
    acceptCall,
    endCall: () => closePeer(true),
    rejectCall: () => closePeer(true),
  };
}
