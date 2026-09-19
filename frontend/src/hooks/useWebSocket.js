import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getWsUrl } from '../utils/apiBaseUrl';
import { sendMessageRest, markConversationAsRead, editMessage as apiEditMessage, deleteMessage as apiDeleteMessage } from '../api/conversationApi';
import { setUserStatus, setUserStatuses, setTyping } from '../store/slices/presenceSlice';
import { updateMessage, markMessagesAsReadInConv } from '../store/slices/chatSlice';

export function useWebSocket(conversationId, onMessage, onCallSignal, onReceipt) {
  const dispatch = useDispatch();
  const myStatus = useSelector((state) => state.presence?.myStatus || 'online');
  const clientRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const onCallSignalRef = useRef(onCallSignal);
  const onReceiptRef = useRef(onReceipt);
  const pendingCallSignalsRef = useRef([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onCallSignalRef.current = onCallSignal;
  }, [onCallSignal]);

  useEffect(() => {
    onReceiptRef.current = onReceipt;
  }, [onReceipt]);

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

        // Main conversation channel
        client.subscribe(`/topic/conversation.${conversationId}`, (frame) => {
          try {
            const body = JSON.parse(frame.body);
            if (body.callType) {
              onCallSignalRef.current?.(body);
            } else {
              if (body.action === 'MESSAGE_EDIT' || body.action === 'MESSAGE_DELETE') {
                dispatch(updateMessage({ conversationId, message: body }));
              }
              onMessageRef.current?.(body);
            }
          } catch (err) {
            console.warn('Conversation frame error', err);
          }
        });

        // Typing channel
        client.subscribe(`/topic/conversation.${conversationId}.typing`, (frame) => {
          try {
            const typingData = JSON.parse(frame.body);
            dispatch(setTyping(typingData));
          } catch (err) {
            console.warn('Typing frame error', err);
          }
        });

        // Read receipts channel
        client.subscribe(`/topic/conversation.${conversationId}.receipts`, (frame) => {
          try {
            const receiptData = JSON.parse(frame.body);
            dispatch(markMessagesAsReadInConv({
              conversationId,
              readerId: receiptData.readerId,
            }));
            onReceiptRef.current?.(receiptData);
          } catch (err) {
            console.warn('Receipt frame error', err);
          }
        });

        // Mark as read on connect
        client.publish({
          destination: '/app/chat.read',
          body: JSON.stringify({ conversationId }),
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
        console.error('STOMP error', frame.headers?.['message'], frame.body);
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
    (content, replyToId = null, replyToSenderName = null, replyToContent = null) => {
      if (clientRef.current?.connected) {
        clientRef.current.publish({
          destination: '/app/chat.send',
          body: JSON.stringify({
            conversationId,
            content,
            replyToId,
            replyToSenderName,
            replyToContent
          }),
        });
        return;
      }

      sendMessageRest(conversationId, content, replyToId, replyToSenderName, replyToContent)
        .then((saved) => onMessageRef.current?.(saved))
        .catch((err) => console.error('Failed to send message', err));
    },
    [conversationId]
  );

  const sendTyping = useCallback(
    (isTyping) => {
      if (clientRef.current?.connected) {
        clientRef.current.publish({
          destination: '/app/chat.typing',
          body: JSON.stringify({ conversationId, isTyping }),
        });
      }
    },
    [conversationId]
  );

  const sendReadReceipt = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: '/app/chat.read',
        body: JSON.stringify({ conversationId }),
      });
    } else if (conversationId) {
      markConversationAsRead(conversationId);
    }
  }, [conversationId]);

  const sendEdit = useCallback(
    (messageId, content) => {
      if (clientRef.current?.connected) {
        clientRef.current.publish({
          destination: '/app/chat.edit',
          body: JSON.stringify({ conversationId, messageId, content }),
        });
      } else if (messageId) {
        apiEditMessage(messageId, content);
      }
    },
    [conversationId]
  );

  const sendDelete = useCallback(
    (messageId) => {
      if (clientRef.current?.connected) {
        clientRef.current.publish({
          destination: '/app/chat.delete',
          body: JSON.stringify({ conversationId, messageId }),
        });
      } else if (messageId) {
        apiDeleteMessage(messageId);
      }
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

  return {
    connected,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    sendEdit,
    sendDelete,
    sendCallSignal
  };
}
