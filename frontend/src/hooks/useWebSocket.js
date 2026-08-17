import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getWsUrl } from '../utils/apiBaseUrl';
import { sendMessageRest } from '../api/conversationApi';

// Connects to the STOMP broker and subscribes to a single conversation's topic.
// Call sendMessage(content) to publish; onMessage(msg) fires for every incoming frame.
export function useWebSocket(conversationId, onMessage) {
  const clientRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

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
          onMessageRef.current(body);
        });
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

  return { connected, sendMessage };
}
