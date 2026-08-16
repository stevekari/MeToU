import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = 'http://localhost:8080/ws';

// Connects to the STOMP broker and subscribes to a single conversation's topic.
// Call sendMessage(content) to publish; onMessage(msg) fires for every incoming frame.
export function useWebSocket(conversationId, onMessage) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    const token = localStorage.getItem('token');

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/conversation.${conversationId}`, (frame) => {
          const body = JSON.parse(frame.body);
          onMessage(body);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const sendMessage = useCallback(
    (content) => {
      if (!clientRef.current || !clientRef.current.connected) return;
      clientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({ conversationId, content }),
      });
    },
    [conversationId]
  );

  return { connected, sendMessage };
}
