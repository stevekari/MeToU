import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getMyConversations } from '../api/conversationApi';
import { getWsUrl } from '../utils/apiBaseUrl';
import { setUserStatus, setUserStatuses } from '../store/slices/presenceSlice';

export function useIncomingCallNotifications(userId, onMessage) {
  const dispatch = useDispatch();
  const myStatus = useSelector((state) => state.presence?.myStatus || 'online');
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
    if (!userId) return undefined;
    const token = localStorage.getItem('token');
    const client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        // Subscribe to global presence updates
        client.subscribe('/topic/presence', (frame) => {
          try {
            const body = JSON.parse(frame.body);
            if (body.userId) {
              dispatch(setUserStatus(body));
            }
          } catch (e) {
            console.warn('Presence parse error', e);
          }
        });

        // Subscribe to full presence list
        client.subscribe('/topic/presence.list', (frame) => {
          try {
            const body = JSON.parse(frame.body);
            dispatch(setUserStatuses(body));
          } catch (e) {
            console.warn('Presence list parse error', e);
          }
        });

        // Publish my current presence status
        const currentSavedStatus = localStorage.getItem('gio_user_status') || 'online';
        client.publish({
          destination: '/app/presence.status',
          body: JSON.stringify({ status: currentSavedStatus }),
        });
        client.publish({
          destination: '/app/presence.get',
          body: '{}',
        });

        // Subscribe to each conversation topic
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

            if (signal.callType === 'call-answer') {
              setIncomingCall(null);
              return;
            }

            if (signal.callType === 'call-end') {
              setIncomingCall(null);
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
  }, [conversations, userId, dispatch]);

  // Broadcast when myStatus changes
  useEffect(() => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: '/app/presence.status',
        body: JSON.stringify({ status: myStatus }),
      });
    }
  }, [myStatus]);

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
