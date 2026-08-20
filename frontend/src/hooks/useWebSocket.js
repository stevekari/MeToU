import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getWsUrl } from '../utils/apiBaseUrl';
import { sendMessageRest } from '../api/conversationApi';

// Connects to the STOMP broker and subscribes to a single conversation's topic.
// Call sendMessage(content) to publish; onMessage(msg) fires for every incoming frame.
export function useWebSocket(conversationId, onMessage, onCallSignal) {
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
      client.deactivate();
      clientRef.current = null;
      pendingCallSignalsRef.current = [];
      setConnected(false);
    };
  }, [conversationId]);

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
