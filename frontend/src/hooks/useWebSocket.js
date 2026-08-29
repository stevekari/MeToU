import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getWsUrl, getNativeWsUrl } from '../utils/apiBaseUrl';
import { sendMessageRest } from '../api/conversationApi';
import { setUserStatus, setUserStatuses } from '../store/slices/presenceSlice';

// Connects to the STOMP broker and subscribes to a single conversation's topic.
// Call sendMessage(content) to publish; onMessage(msg) fires for every incoming frame.
export function useWebSocket(conversationId, onMessage, onCallSignal) {
  const dispatch = useDispatch();
  const myStatus = useSelector((state) => state.presence?.myStatus || 'online');
  const clientRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const onCallSignalRef = useRef(onCallSignal);
  const pendingCallSignalsRef = useRef([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onCallSignalRef.current = onCallSignal;
  }, [onCallSignal]);

  useEffect(() => {
    if (!conversationId) return;

    const token = localStorage.getItem('token');

    const client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);

        // Presence subscriptions
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

        client.subscribe('/topic/presence.list', (frame) => {
          try {
            const body = JSON.parse(frame.body);
            dispatch(setUserStatuses(body));
          } catch (e) {
            console.warn('Presence list parse error', e);
          }
        });

        // Publish my status
        const currentSavedStatus = localStorage.getItem('gio_user_status') || 'online';
        client.publish({
          destination: '/app/presence.status',
          body: JSON.stringify({ status: currentSavedStatus }),
        });
        client.publish({
          destination: '/app/presence.get',
          body: '{}',
        });

        client.subscribe(`/topic/conversation.${conversationId}`, (frame) => {
          const body = JSON.parse(frame.body);
          if (body.callType) {
            onCallSignalRef.current?.(body);
          } else {
            onMessageRef.current(body);
          }
        });
        pendingCallSignalsRef.current.forEach((signal) => {
          client.publish({
            destination: '/app/call.signal',
            body: JSON.stringify({ conversationId, ...signal }),
          });
        });
        pendingCallSignalsRef.current = [];
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message'], frame.body);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (client.active) {
        client.deactivate();
      }
      clientRef.current = null;
      pendingCallSignalsRef.current = [];
      setConnected(false);
    };
  }, [conversationId, dispatch]);

  useEffect(() => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: '/app/presence.status',
        body: JSON.stringify({ status: myStatus }),
      });
    }
  }, [myStatus]);

  const sendMessage = useCallback(
    (content) => {
      if (clientRef.current?.connected) {
        clientRef.current.publish({
          destination: '/app/chat.send',
          body: JSON.stringify({ conversationId, content }),
        });
        return;
      }

      sendMessageRest(conversationId, content)
        .then((saved) => onMessageRef.current(saved))
        .catch((err) => console.error('Failed to send message', err));
    },
    [conversationId]
  );

  const sendCallSignal = useCallback((signal) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: '/app/call.signal',
        body: JSON.stringify({ conversationId, ...signal }),
      });
      return;
    }
    pendingCallSignalsRef.current.push(signal);
  }, [conversationId]);

  return { connected, sendMessage, sendCallSignal };
}
