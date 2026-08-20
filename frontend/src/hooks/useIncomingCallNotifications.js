import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getMyConversations } from '../api/conversationApi';
import { getWsUrl } from '../utils/apiBaseUrl';

export function useIncomingCallNotifications(userId) {
  const clientRef = useRef(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [conversations, setConversations] = useState([]);

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
            if (signal.callType && signal.callType === 'call-offer' && signal.senderId !== userId) {
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
        }),
      });
    }
    setIncomingCall(null);
  }, [incomingCall]);

  return { incomingCall, dismissCall, declineCall };
}
