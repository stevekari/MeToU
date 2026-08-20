import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export function useWebRTCCall({ conversationId, currentUserId, sendSignal, onSignal }) {
  const { t } = useLanguage();
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const callIdRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const timeoutRef = useRef(null);
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState(null);
  const [isRinging, setIsRinging] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState('');

  const closePeer = useCallback((notify = true) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (notify && callIdRef.current) {
      sendSignal({
        callType: 'call-end',
        callId: callIdRef.current,
        mediaType: callType || 'voice',
        status: callState === 'connected' ? 'completed' : 'missed',
      });
    }
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setCallType(null);
    setIsRinging(true);
    pendingOfferRef.current = null;
    pendingIceCandidatesRef.current = [];
    callIdRef.current = null;
  }, [callState, callType, sendSignal]);

  const createPeer = useCallback(async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          callType: 'ice-candidate',
          callId: callIdRef.current,
          candidate: event.candidate,
        });
      }
    };
    peer.ontrack = (event) => setRemoteStream(event.streams[0]);
    peer.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(peer.connectionState)) closePeer(false);
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
      setIsRinging(true);
      callIdRef.current = `${currentUserId}-${Date.now()}`;
      timeoutRef.current = window.setTimeout(() => closePeer(true), 40000);
      const peer = await createPeer(type);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      sendSignal({ callType: 'call-offer', callId: callIdRef.current, mediaType: type, ringing: true, offer });
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
      callIdRef.current = offerSignal.callId;
      pendingIceCandidatesRef.current = (offerSignal.pendingIceCandidates || [])
        .map((candidate) => new RTCIceCandidate(candidate));
      const peer = await createPeer(offerSignal.mediaType);
      await peer.setRemoteDescription(new RTCSessionDescription(offerSignal.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      for (const candidate of pendingIceCandidatesRef.current) {
        await peer.addIceCandidate(candidate).catch(() => {});
      }
      pendingIceCandidatesRef.current = [];
      sendSignal({ callType: 'call-answer', callId: callIdRef.current, answer });
      setCallState('connected');
      timeoutRef.current && window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
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
    } else if (onSignal.callType === 'call-received' && onSignal.callId === callIdRef.current) {
      setIsRinging(true);
    } else if (onSignal.callType === 'call-answer' && peerRef.current) {
      peerRef.current.setRemoteDescription(new RTCSessionDescription(onSignal.answer))
        .then(async () => {
          for (const candidate of pendingIceCandidatesRef.current) {
            await peerRef.current.addIceCandidate(candidate).catch(() => {});
          }
          pendingIceCandidatesRef.current = [];
          setCallState('connected');
        })
        .catch(() => setError(t('connectionError')));
    } else if (onSignal.callType === 'ice-candidate') {
      const candidate = new RTCIceCandidate(onSignal.candidate);
      if (peerRef.current?.remoteDescription) {
        peerRef.current.addIceCandidate(candidate).catch(() => {});
      } else {
        pendingIceCandidatesRef.current.push(candidate);
      }
    } else if (onSignal.callType === 'call-end') {
      closePeer(false);
    }
  }, [callState, closePeer, conversationId, currentUserId, onSignal]);

  useEffect(() => {
    if (callState !== 'incoming') return undefined;
    const timeoutId = window.setTimeout(() => closePeer(true), 40000);
    return () => window.clearTimeout(timeoutId);
  }, [callState, closePeer]);

  useEffect(() => () => {
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  return {
    callState,
    callType,
    isRinging,
    localStream,
    remoteStream,
    error,
    startCall,
    acceptCall,
    endCall: () => closePeer(true),
    rejectCall: () => closePeer(true),
  };
}
