import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { callSounds } from '../utils/callSounds';

// Debug flag – set to true to enable verbose logging
const DEBUG = true;

export function useWebRTCCall({ conversationId, currentUserId, sendSignal, onSignal, autoAccept = false }) {
  const { t } = useLanguage();
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const callIdRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const timeoutRef = useRef(null);
  const currentFacingModeRef = useRef('user');

  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [callType, setCallType] = useState(null); // 'voice' | 'video'
  const [isRinging, setIsRinging] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState('');
  const [isMutedAudio, setIsMutedAudio] = useState(false);
  const [isMutedVideo, setIsMutedVideo] = useState(false);

  const log = (...args) => {
    if (DEBUG) console.log('[WebRTCCall]', ...args);
  };

  const stopCallSounds = useCallback(() => {
    callSounds.stop();
  }, []);

  const closePeer = useCallback((notify = true) => {
    log('Closing peer, notify:', notify);
    stopCallSounds();
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
      callSounds.playEndedSound();
    }
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
    setCallState('idle');
    setCallType(null);
    setIsRinging(true);
    setIsMutedAudio(false);
    setIsMutedVideo(false);
    pendingOfferRef.current = null;
    pendingIceCandidatesRef.current = [];
    callIdRef.current = null;
  }, [callState, callType, sendSignal, stopCallSounds]);

  const getMediaStream = useCallback(async (type, facingMode = 'user') => {
    log('Getting media stream for', type, 'facingMode', facingMode);
    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    if (type === 'video') {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          },
        });
      } catch (err) {
        log('Advanced video constraints failed, trying basic video:', err);
        try {
          return await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
        } catch (basicErr) {
          log('Video unavailable, falling back to voice only:', basicErr);
          return await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
            video: false,
          });
        }
      }
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });
    } catch (audioErr) {
      log('Basic audio fallback:', audioErr);
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    }
  }, []);

  const createPeer = useCallback(async (type) => {
    log('Creating peer for type', type);
    const stream = await getMediaStream(type, currentFacingModeRef.current);
    log('Acquired local media stream', stream);
    const turnUrls = (import.meta.env.VITE_TURN_URLS || import.meta.env.VITE_TURN_URL || '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);
    const turnUsername = import.meta.env.VITE_TURN_USERNAME;
    const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      {
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turn:openrelay.metered.ca:443?transport=tcp',
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ];

    if (turnUrls.length > 0 && turnUsername && turnCredential) {
      iceServers.push({
        urls: turnUrls,
        username: turnUsername,
        credential: turnCredential,
      });
    }

    const peer = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10,
    });

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        log('Sending ICE candidate', event.candidate.candidate);
        sendSignal({
          callType: 'ice-candidate',
          callId: callIdRef.current,
          candidate: event.candidate.toJSON ? event.candidate.toJSON() : {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        });
      }
    };

    peer.ontrack = (event) => {
      log('Received remote track', event.track.kind);
      let stream = event.streams[0];
      if (!stream) {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        remoteStreamRef.current.addTrack(event.track);
        stream = remoteStreamRef.current;
      } else {
        remoteStreamRef.current = stream;
      }
      setRemoteStream(new MediaStream(stream.getTracks()));
      log('Updated remote stream with tracks:', stream.getTracks().map((t) => t.kind));
    };

    peer.oniceconnectionstatechange = () => {
      log('ICE connection state changed to', peer.iceConnectionState);
      if (peer.iceConnectionState === 'connected' || peer.iceConnectionState === 'completed') {
        setError('');
        setCallState('connected');
        stopCallSounds();
      }
    };

    peer.onconnectionstatechange = () => {
      log('Connection state changed to', peer.connectionState);
      if (peer.connectionState === 'failed') {
        setError(t('connectionError'));
      } else if (peer.connectionState === 'connected') {
        setError('');
        setCallState('connected');
        stopCallSounds();
        callSounds.playConnectedSound();
      }
    };

    peerRef.current = peer;
    localStreamRef.current = stream;
    setLocalStream(stream);
    setCallType(type);
    return peer;
  }, [getMediaStream, sendSignal, stopCallSounds, t]);

  const startCall = useCallback(async (type) => {
    log('Attempting to start call, current state:', callState);
    if (callState !== 'idle') return;
    try {
      setError('');
      setCallState('calling');
      setIsRinging(true);
      callSounds.startOutgoingRingback();

      callIdRef.current = `${currentUserId}-${Date.now()}`;
      timeoutRef.current = window.setTimeout(() => closePeer(true), 45000);

      const peer = await createPeer(type);
      log('Peer created, creating offer');
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video',
      });
      await peer.setLocalDescription(offer);
      log('Local description set, sending signal');
      sendSignal({ callType: 'call-offer', callId: callIdRef.current, mediaType: type, ringing: true, offer });
    } catch (err) {
      console.error('Failed to start call:', err);
      stopCallSounds();
      setError(t('callError'));
      closePeer(false);
    }
  }, [callState, closePeer, createPeer, sendSignal, stopCallSounds, t, currentUserId]);

  const acceptCall = useCallback(async (customOffer) => {
    const offerSignal = customOffer || pendingOfferRef.current;
    if (!offerSignal) return;
    try {
      log('Accepting call with offer ID', offerSignal.callId);
      stopCallSounds();
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
      callSounds.playConnectedSound();

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      pendingOfferRef.current = null;
    } catch (err) {
      console.error('Failed to accept call:', err);
      stopCallSounds();
      setError(t('acceptCallError'));
      closePeer(false);
    }
  }, [closePeer, createPeer, sendSignal, stopCallSounds, t]);

  const toggleMuteAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextEnabled = !audioTracks[0].enabled;
        audioTracks.forEach((track) => {
          track.enabled = nextEnabled;
        });
        setIsMutedAudio(!nextEnabled);
        log('Audio mute toggle, now muted:', !nextEnabled);
      }
    }
  }, []);

  const toggleMuteVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextEnabled = !videoTracks[0].enabled;
        videoTracks.forEach((track) => {
          track.enabled = nextEnabled;
        });
        setIsMutedVideo(!nextEnabled);
        log('Video mute toggle, now muted:', !nextEnabled);
      }
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (callType !== 'video' || !peerRef.current || !localStreamRef.current) return;
    try {
      const nextFacing = currentFacingModeRef.current === 'user' ? 'environment' : 'user';
      currentFacingModeRef.current = nextFacing;

      const newStream = await getMediaStream('video', nextFacing);
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        localStreamRef.current.removeTrack(oldVideoTrack);
      }
      localStreamRef.current.addTrack(newVideoTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

      const sender = peerRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
        log('Switched camera to', nextFacing);
      }
    } catch (err) {
      console.warn('Switch camera error:', err);
    }
  }, [callType, getMediaStream]);

  // Handle incoming signals
  useEffect(() => {
    if (!onSignal || !conversationId) return;
    if (String(onSignal.senderId) === String(currentUserId)) return;

    if (onSignal.callType === 'call-offer') {
      if (callState === 'idle') {
        pendingOfferRef.current = onSignal;
        setCallType(onSignal.mediaType);
        setCallState('incoming');
        callSounds.startIncomingRingtone();
        log('Received call offer, set to incoming');
      }
    } else if (onSignal.callType === 'call-received' && onSignal.callId === callIdRef.current) {
      setIsRinging(true);
    } else if (onSignal.callType === 'call-answer' && peerRef.current) {
      stopCallSounds();
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      peerRef.current.setRemoteDescription(new RTCSessionDescription(onSignal.answer))
        .then(async () => {
          for (const candidate of pendingIceCandidatesRef.current) {
            await peerRef.current.addIceCandidate(candidate).catch(() => {});
          }
          pendingIceCandidatesRef.current = [];
          setCallState('connected');
          callSounds.playConnectedSound();
          log('Call answered, connection established');
        })
        .catch((err) => {
          log('Failed to set remote description on answer:', err);
          setError(t('connectionError'));
        });
    } else if (onSignal.callType === 'ice-candidate') {
      const candidate = new RTCIceCandidate(onSignal.candidate);
      if (peerRef.current?.remoteDescription) {
        peerRef.current.addIceCandidate(candidate).catch(() => {});
      } else {
        pendingIceCandidatesRef.current.push(candidate);
      }
      log('Received ICE candidate from remote');
    } else if (onSignal.callType === 'call-end') {
      stopCallSounds();
      callSounds.playEndedSound();
      closePeer(false);
      log('Remote ended call');
    }
  }, [callState, closePeer, conversationId, currentUserId, onSignal, stopCallSounds, t]);

  // Auto-accept incoming call if requested
  useEffect(() => {
    if (autoAccept && pendingOfferRef.current && callState === 'incoming') {
      log('Auto-accepting incoming call');
      acceptCall();
    }
  }, [autoAccept, callState, acceptCall]);

  // Ringing timeout for unanswered incoming calls
  useEffect(() => {
    if (callState !== 'incoming') return undefined;
    const timeoutId = window.setTimeout(() => closePeer(true), 45000);
    return () => window.clearTimeout(timeoutId);
  }, [callState, closePeer]);

  // Teardown cleanup
  useEffect(() => {
    return () => {
      stopCallSounds();
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [stopCallSounds]);

  return {
    callState,
    callType,
    isRinging,
    localStream,
    remoteStream,
    error,
    isMutedAudio,
    isMutedVideo,
    startCall,
    acceptCall,
    endCall: () => closePeer(true),
    rejectCall: () => closePeer(true),
    toggleMuteAudio,
    toggleMuteVideo,
    switchCamera,
  };
}