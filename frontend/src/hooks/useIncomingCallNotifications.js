import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getMyConversations } from '../api/conversationApi';
import { getWsUrl } from '../utils/apiBaseUrl';

export function useIncomingCallNotifications(userId, onMessage) {
  const clientRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const [incomingCall, setIncomingCall] = useState(null);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    getMyConversations()
      .then((items) => {
        if (!cancelled) setConversations(items);
      })
      .catch(() => {
        if (!cancelled) setConversations([]);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || conversations.length === 0) return undefined;
    const token = localStorage.getItem('token');
    const client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        conversations.forEach((conversation) => {
          client.subscribe(`/topic/conversation.${conversation.conversationId}`, (frame) => {
            const signal = JSON.parse(frame.body);
            if (!signal.callType) {
              onMessageRef.current?.(signal);
              return;
            }
            if (signal.callType === 'ice-candidate' && String(signal.senderId) !== String(userId)) {
              setIncomingCall((currentCall) => {
                if (!currentCall || currentCall.callId !== signal.callId) return currentCall;
                return {
                  ...currentCall,
                  pendingIceCandidates: [
                    ...(currentCall.pendingIceCandidates || []),
                    signal.candidate,
                  ],
                };
              });
              return;
            }

            if (signal.callType === 'call-end' && String(signal.senderId) !== String(userId)) {
              setIncomingCall((currentCall) => (
                currentCall?.callId === signal.callId ? null : currentCall
              ));
              return;
            }

            if (signal.callType === 'call-offer' && String(signal.senderId) !== String(userId)) {
              if (client.connected) {
                client.publish({
                  destination: '/app/call.signal',
                  body: JSON.stringify({
                    conversationId: conversation.conversationId,
                    callType: 'call-received',
                    callId: signal.callId,
                    mediaType: signal.mediaType,
                  }),
                });
              }
              setIncomingCall({ ...signal, conversationId: conversation.conversationId, friend: conversation.otherUser });
            }
          });
        });
      },
      onStompError: (frame) => console.error('Call notification error', frame.headers['message']),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [conversations, userId]);

  const dismissCall = useCallback(() => setIncomingCall(null), []);

  const declineCall = useCallback(() => {
    if (clientRef.current?.connected && incomingCall) {
      clientRef.current.publish({
        destination: '/app/call.signal',
        body: JSON.stringify({
          conversationId: incomingCall.conversationId,
          callType: 'call-end',
          callId: incomingCall.callId,
          mediaType: incomingCall.mediaType,
          status: 'missed',
        }),
      });
    }
    setIncomingCall(null);
  }, [incomingCall]);

  useEffect(() => {
    if (!incomingCall) return undefined;
    const timeoutId = window.setTimeout(() => {
      declineCall();
    }, 40000);
    return () => window.clearTimeout(timeoutId);
  }, [incomingCall, declineCall]);

  return { incomingCall, dismissCall, declineCall };
}
