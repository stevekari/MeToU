import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getMyConversations } from '../api/conversationApi';
import { getWsUrl } from '../utils/apiBaseUrl';
import { setUserStatus, setUserStatuses, setTyping, clearTyping } from '../store/slices/presenceSlice';
import { updateMessage, markMessagesAsReadInConv } from '../store/slices/chatSlice';
import { callSounds } from '../utils/callSounds';

export function useIncomingCallNotifications(userId, onMessage) {
  const dispatch = useDispatch();
  const myStatus = useSelector((state) => state.presence?.myStatus || 'online');
  const clientRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const subscriptionsRef = useRef(new Map());
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

  const syncSubscriptions = useCallback(
    (client) => {
      if (!client?.connected || !userId) return;

      conversations.forEach((conversation) => {
        const convId = String(conversation.conversationId);
        if (subscriptionsRef.current.has(convId)) return;

        // Main conversation channel (messages, calls, edits, deletes)
        const sub = client.subscribe(`/topic/conversation.${convId}`, (frame) => {
          try {
            const signal = JSON.parse(frame.body);
            if (!signal.callType) {
              if (signal.action === 'MESSAGE_EDIT' || signal.action === 'MESSAGE_DELETE') {
                dispatch(updateMessage({ conversationId: convId, message: signal }));
              }
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

            if (signal.callType === 'call-end') {
              callSounds.stop();
              callSounds.playEndedSound();
              setIncomingCall(null);
              return;
            }

            if (signal.callType === 'call-answer') {
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
          } catch (err) {
            console.warn('Signal parsing error', err);
          }
        });

        // Typing channel
        const typingSub = client.subscribe(`/topic/conversation.${convId}.typing`, (frame) => {
          try {
            const typingData = JSON.parse(frame.body);
            if (String(typingData.userId) !== String(userId)) {
              dispatch(setTyping(typingData));
            }
          } catch (err) {
            console.warn('Typing parse error', err);
          }
        });

        // Read receipts channel
        const receiptsSub = client.subscribe(`/topic/conversation.${convId}.receipts`, (frame) => {
          try {
            const receiptData = JSON.parse(frame.body);
            dispatch(markMessagesAsReadInConv({
              conversationId: convId,
              readerId: receiptData.readerId,
            }));
          } catch (err) {
            console.warn('Receipts parse error', err);
          }
        });

        subscriptionsRef.current.set(convId, {
          unsubscribe: () => {
            try { sub.unsubscribe(); } catch (_) {}
            try { typingSub.unsubscribe(); } catch (_) {}
            try { receiptsSub.unsubscribe(); } catch (_) {}
          }
        });
      });
    },
    [conversations, userId, dispatch]
  );

  // Stable single-connection lifecycle
  useEffect(() => {
    if (!userId) return undefined;
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    let isSubscribed = true;

    const client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (!isSubscribed) return;

        // Global presence updates
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

        // Full presence list
        client.subscribe('/topic/presence.list', (frame) => {
          try {
            const body = JSON.parse(frame.body);
            dispatch(setUserStatuses(body));
          } catch (e) {
            console.warn('Presence list parse error', e);
          }
        });

        // Publish my initial presence status
        const currentSavedStatus = localStorage.getItem('gio_user_status') || 'online';
        client.publish({
          destination: '/app/presence.status',
          body: JSON.stringify({ status: currentSavedStatus }),
        });
        client.publish({
          destination: '/app/presence.get',
          body: '{}',
        });

        syncSubscriptions(client);
      },
      onStompError: () => {},
    });

    client.activate();
    clientRef.current = client;

    return () => {
      isSubscribed = false;
      subscriptionsRef.current.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch (_) {}
      });
      subscriptionsRef.current.clear();
      if (client.active) {
        client.deactivate();
      }
      clientRef.current = null;
    };
  }, [userId, dispatch, syncSubscriptions]);

  // Keep conversation topics in sync as new conversations are loaded
  useEffect(() => {
    if (clientRef.current?.connected) {
      syncSubscriptions(clientRef.current);
    }
  }, [conversations, syncSubscriptions]);

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
          callerId: incomingCall.friend?.id || incomingCall.senderId,
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

  return { incomingCall, dismissCall, declineCall, clientRef };
}
