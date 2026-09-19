import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  getMessages,
  getMyConversations,
  startConversation,
  getConversationDetails,
  acceptChatRequest,
  declineChatRequest,
} from '../api/conversationApi';
import { searchUsers, getPresenceMap } from '../api/userApi';
import { useWebSocket } from '../hooks/useWebSocket';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import FriendCard from '../components/FriendCard';
import UserProfileModal from '../components/UserProfileModal';
import { getMessagePreview } from '../utils/messageContent';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { formatTimeAgo } from '../utils/timeAgo';
import { useLanguage } from '../contexts/LanguageContext';
import { useWebRTCCall } from '../hooks/useWebRTCCall';
import CallPanel from '../components/CallPanel';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveConversation } from '../store/slices/chatSlice';
import { setUserStatuses } from '../store/slices/presenceSlice';

export default function Chat({ currentUserId }) {
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedFriend = location.state?.friend;
  const { t } = useLanguage();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setActiveConversation(conversationId));
    return () => dispatch(setActiveConversation(null));
  }, [conversationId, dispatch]);

  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationStatus, setConversationStatus] = useState('ACCEPTED');
  const [conversationInitiatorId, setConversationInitiatorId] = useState(null);
  const [requestActionLoading, setRequestActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friend, setFriend] = useState(selectedFriend ?? null);
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [callSignal, setCallSignal] = useState(location.state?.incomingCall ?? null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const safeMessages = Array.isArray(messages) ? messages : [];
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  useEffect(() => {
    scrollToBottom(safeMessages.length <= 1 ? 'auto' : 'smooth');
  }, [safeMessages.length, scrollToBottom]);

  const userStatuses = useSelector((s) => s.presence?.userStatuses || {});
  const onlineIds = useSelector((s) => s.presence?.onlineIds || []);
  const typingMap = useSelector((s) => s.presence?.typing || {});

  const sortConversations = (items) => {
    if (!Array.isArray(items)) return [];
    return [...items].sort((a, b) => {
      const timeA = new Date(a.lastMessageAt || a.lastMessageTime || a.createdAt || 0).getTime();
      const timeB = new Date(b.lastMessageAt || b.lastMessageTime || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  };

  const handleIncoming = useCallback((message) => {
    if (!message) return;

    if (message.type === 'CONVERSATION_ACCEPTED' || message.status === 'ACCEPTED') {
      setConversationStatus('ACCEPTED');
    }
    if (message.type === 'CONVERSATION_DECLINED' || message.status === 'DECLINED') {
      setConversationStatus('DECLINED');
    }

    setMessages((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (message.id && list.some((m) => m.id === message.id)) {
        return list.map((m) => (m.id === message.id ? { ...m, ...message } : m));
      }
      return message.content ? [...list, message] : list;
    });

  }, []);

  const handleReceipt = useCallback((receipt) => {
    if (!receipt) return;
    setMessages((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((msg) => {
        if (String(msg.senderId) === String(currentUserId)) {
          return { ...msg, status: 'READ', readAt: receipt.readAt };
        }
        return msg;
      });
    });
  }, [currentUserId]);

  const {
    sendMessage,
    sendTyping,
    sendReadReceipt,
    sendEdit,
    sendDelete,
    sendCallSignal,
  } = useWebSocket(conversationId, handleIncoming, setCallSignal, handleReceipt);


  const handleSend = useCallback(
    (content, replyToId, replyToSenderName, replyToContent) => {
      sendMessage(content, replyToId, replyToSenderName, replyToContent);
      setConversations((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const updated = list.map((c) =>
          String(c.conversationId) === String(conversationId)
            ? {
                ...c,
                lastMessage: content,
                lastMessageTime: new Date().toISOString(),
                lastMessageAt: new Date().toISOString(),
              }
            : c
        );
        return sortConversations(updated);
      });
    },
    [conversationId, sendMessage]
  );

  const handleSaveEdit = useCallback(
    (messageId, newContent) => {
      sendEdit(messageId, newContent);
      setEditingMessage(null);
      setMessages((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((m) =>
          m.id === messageId
            ? { ...m, content: newContent, isEdited: true, editedAt: new Date().toISOString() }
            : m
        );
      });
    },
    [sendEdit]
  );

  const handleDelete = useCallback(
    (messageId) => {
      sendDelete(messageId);
      setMessages((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: 'This message was deleted' }
            : m
        );
      });
    },
    [sendDelete]
  );

  const handleReply = useCallback((message) => {
    const isMine = message.senderId === currentUserId;
    const senderName = isMine ? 'You' : (friend?.displayName || friend?.username || 'Friend');
    let snippet = message.content;
    try {
      const parsed = JSON.parse(message.content);
      snippet = parsed.text || (parsed.type ? `[${parsed.type}]` : message.content);
    } catch (_) {}

    setReplyingTo({
      id: message.id,
      senderName,
      isMine,
      content: snippet,
      contentSnippet: snippet.length > 60 ? snippet.slice(0, 60) + '...' : snippet,
    });
  }, [currentUserId, friend]);

  const handleScrollToMessage = useCallback((targetMsgId) => {
    const el = document.getElementById(`msg-${targetMsgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('message-highlight');
      setTimeout(() => el.classList.remove('message-highlight'), 1800);
    }
  }, []);

  const call = useWebRTCCall({
    conversationId,
    currentUserId,
    sendSignal: sendCallSignal,
    onSignal: callSignal,
    autoAccept: Boolean(location.state?.autoAccept),
  });

  const friendId = friend?.userId || friend?._id || friend?.id;
  const friendPresence = friendId ? userStatuses[String(friendId)] : null;
  const isFriendPresent = friendId ? onlineIds.some((i) => String(i) === String(friendId)) : false;
  const isFriendOnline = friendPresence?.online ?? isFriendPresent;
  const friendCustomStatus = friendPresence?.status || (isFriendOnline ? 'online' : 'offline');
  const isFriendBusy = friendCustomStatus === 'busy';

  const friendStatusType = isFriendBusy ? 'busy' : isFriendOnline ? 'online' : 'offline';
  const friendLastSeenTime = friendPresence?.lastSeen || friend?.lastSeen;
  const friendLastSeenText = !isFriendOnline && friendLastSeenTime ? `Last seen ${formatTimeAgo(friendLastSeenTime)}` : null;
  const friendStatusLabel = isFriendBusy
    ? t('busy')
    : isFriendOnline
      ? t('online')
      : (friendLastSeenText || t('offline'));

  const typingState = typingMap[String(conversationId)];
  const isOtherTyping = Boolean(typingState?.isTyping && String(typingState.userId) !== String(currentUserId));

  useEffect(() => {
    if (selectedFriend) {
      setFriend(selectedFriend);
    }
  }, [selectedFriend]);

  const autoStartCallType = location.state?.startCallType;
  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (autoStartCallType && call.callState === 'idle' && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      const timer = setTimeout(() => {
        call.startCall(autoStartCallType);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoStartCallType, call]);

  useEffect(() => {
    setSidebarLoading(true);
    getMyConversations()
      .then((conversationsData) => {
        const sorted = sortConversations(conversationsData);
        setConversations(sorted);

        const currentConversation = sorted.find(
          (c) => String(c.conversationId) === String(conversationId)
        );
        if (currentConversation) {
          if (currentConversation.status) {
            setConversationStatus(currentConversation.status);
          }
          if (currentConversation.initiatorId != null) {
            setConversationInitiatorId(currentConversation.initiatorId);
          }
          if (!selectedFriend && currentConversation.otherUser) {
            setFriend(currentConversation.otherUser);
          }
        }
      })
      .finally(() => setSidebarLoading(false));
  }, [conversationId, selectedFriend]);

  useEffect(() => {
    if (!conversationId) return;
    getConversationDetails(conversationId)
      .then((conv) => {
        if (conv) {
          if (conv.status) setConversationStatus(conv.status);
          if (conv.initiatorId != null) setConversationInitiatorId(conv.initiatorId);
          if (conv.otherUser && !selectedFriend) {
            setFriend(conv.otherUser);
          }
        }
      })
      .catch(() => {});
  }, [conversationId, selectedFriend]);

  const handleAcceptRequest = async () => {
    try {
      setRequestActionLoading(true);
      await acceptChatRequest(conversationId);
      setConversationStatus('ACCEPTED');
      setConversations((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((c) =>
          String(c.conversationId) === String(conversationId) ? { ...c, status: 'ACCEPTED' } : c
        );
      });
    } catch (err) {
      console.error('Failed to accept chat request:', err);
    } finally {
      setRequestActionLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    try {
      setRequestActionLoading(true);
      await declineChatRequest(conversationId);
      setConversationStatus('DECLINED');
      setConversations((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((c) =>
          String(c.conversationId) === String(conversationId) ? { ...c, status: 'DECLINED' } : c
        );
      });
    } catch (err) {
      console.error('Failed to decline chat request:', err);
    } finally {
      setRequestActionLoading(false);
    }
  };


  useEffect(() => {
    setLoading(true);
    getMessages(conversationId)
      .then((msgs) => {
        setMessages(Array.isArray(msgs) ? msgs : []);
        sendReadReceipt();
      })
      .catch(() => {
        setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [conversationId, sendReadReceipt]);

  const trimmedSearch = search.trim();
  const showSearchPopup = searchFocused && trimmedSearch.length >= 3;

  useEffect(() => {
    if (trimmedSearch.length < 3) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const timer = setTimeout(() => {
      Promise.all([searchUsers(trimmedSearch), getPresenceMap().catch(() => ({}))])
        .then(([results, presence]) => {
          if (!cancelled) {
            if (presence && typeof presence === 'object') {
              dispatch(setUserStatuses(presence));
            }
            setSearchResults(results);
          }
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedSearch, dispatch]);

  const openChat = async (nextFriend) => {
    const { conversationId: nextConversationId } = await startConversation(nextFriend.id);
    navigate(`/chat/${nextConversationId}`, { state: { friend: nextFriend } });
  };

  const selectFromSearch = (nextFriend) => {
    setSearch('');
    setSearchFocused(false);
    openChat(nextFriend);
  };

  const friendDisplayName = friend?.displayName || friend?.username || 'User';

  const isPending = conversationStatus === 'PENDING';
  const isDeclined = conversationStatus === 'DECLINED';
  const isAccepted = conversationStatus === 'ACCEPTED' || (!isPending && !isDeclined);
  const isInitiator = conversationInitiatorId != null && String(conversationInitiatorId) === String(currentUserId);
  const isRecipient = isPending && !isInitiator;

  return (
    <div className="chat-layout-page">
      <aside className="chat-sidebar">
        <h2>{t('friends')} <span className="friends-count">({t('friendsCount', { count: safeConversations.length })})</span></h2>

        <div className="friends-search">
          <div className="search-bar">
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            />
            {search && (
              <button
                className="search-clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSearch('')}
                aria-label={t('clearSearch')}
              >
                ×
              </button>
            )}
          </div>

          {showSearchPopup && (
            <div className="search-popup">
              {searchLoading && <div className="search-popup-empty">{t('searching')}</div>}
              {!searchLoading && searchResults.length === 0 && (
                <div className="search-popup-empty">{t('noFriendsFound')}</div>
              )}
              {!searchLoading &&
                searchResults.map((nextFriend, index) => (
                  <div
                    key={nextFriend.id}
                    className="search-popup-item"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <FriendCard
                      friend={nextFriend}
                      onAvatarClick={(f) => setSelectedProfileUser(f)}
                      onClick={() => selectFromSearch(nextFriend)}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="friends-list">
          {sidebarLoading && <div className="empty-state">{t('loadingFriends')}</div>}
          {!sidebarLoading && safeConversations.length === 0 && (
            <div className="no-chats-box">
              <i className="fa-solid fa-comments no-chats-icon" />
              <h3 className="no-chats-title">{t('noChats')}</h3>
              <p className="no-chats-desc">{t('noChatsDesc')}</p>
            </div>
          )}
          {!sidebarLoading &&
            safeConversations.map((conv) => (
              <FriendCard
                key={conv.conversationId}
                friend={conv.otherUser}
                conversationId={conv.conversationId}
                lastMessage={getMessagePreview(conv.lastMessage)}
                lastMessageAt={conv.lastMessageAt ?? conv.lastMessageTime}
                onAvatarClick={(f) => setSelectedProfileUser(f)}
                onClick={() => navigate(`/chat/${conv.conversationId}`, { state: { friend: conv.otherUser } })}
                active={friend?.id === conv.otherUser?.id}
              />
            ))}
        </div>
      </aside>

      <section className="chat-page">
        <div className="chat-header">
          {friend && (
            <>
              <div className="chat-header-user">
                <button
                  type="button"
                  className="chat-back-btn"
                  onClick={() => navigate('/friends')}
                  title={t('friends') || 'Back'}
                  aria-label="Back to friends"
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <div
                  className="friend-avatar-wrap clickable"
                  onClick={() => setSelectedProfileUser(friend)}
                  title="View profile"
                >
                  <img
                    src={resolveAvatarUrl(friend.avatarUrl, friendDisplayName)}
                    alt={friendDisplayName}
                  />
                  <span className={`online-dot ${friendStatusType}`} title={friendStatusLabel}></span>
                </div>
                <div
                  className="chat-header-details clickable"
                  onClick={() => setSelectedProfileUser(friend)}
                >
                  <div className="chat-header-name-row">
                    <h2>{friendDisplayName}</h2>
                    {friend.username && friend.username !== friendDisplayName && (
                      <span className="chat-header-handle">@{friend.username}</span>
                    )}
                  </div>
                  <span className={`chat-header-status ${friendStatusType}`}>
                    {isOtherTyping ? (
                      <span className="typing-header-text">
                        <span className="typing-dots"><span>.</span><span>.</span><span>.</span></span> typing...
                      </span>
                    ) : (
                      friendStatusLabel
                    )}
                  </span>
                </div>
              </div>
              <div className="call-buttons">
                <button
                  type="button"
                  onClick={() => call.startCall('voice')}
                  disabled={call.callState !== 'idle' || !isAccepted}
                  aria-label="Start voice call"
                  title={!isAccepted ? 'Calls available once request is accepted' : 'Start voice call'}
                >
                  <i className="fa-solid fa-phone"></i>
                </button>
                <button
                  type="button"
                  onClick={() => call.startCall('video')}
                  disabled={call.callState !== 'idle' || !isAccepted}
                  aria-label="Start video call"
                  title={!isAccepted ? 'Calls available once request is accepted' : 'Start video call'}
                >
                  <i className="fa-solid fa-video"></i>
                </button>
              </div>
            </>
          )}
          {!friend && (
            <h2>
              {t('openChat')}{' '}
              <button className="link-button" onClick={() => navigate('/friends')}>
                {t('friendsList')}
              </button>
            </h2>
          )}
        </div>

        <div className="chat-messages">
          {loading && <div className="page-loading">{t('loadingConversation')}</div>}
          {!loading && safeMessages.length === 0 && friend && (
            <div className="empty-state">{t('sayHi', { username: friendDisplayName })}</div>
          )}
          {safeMessages.map((m) => (
            <MessageBubble
              key={m.id ?? `${m.senderId}-${m.timestamp}`}
              message={m}
              isMine={m.senderId === currentUserId}
              onReply={handleReply}
              onEdit={(msg) => {
                setEditingMessage(msg);
                setReplyingTo(null);
              }}
              onDelete={handleDelete}
              onScrollToMessage={handleScrollToMessage}
            />
          ))}

          {/* Typing bubble inside chat area */}
          {isOtherTyping && (
            <div className="message-row theirs typing-row">
              <div className="message-bubble theirs typing-bubble">
                <span className="typing-bubble-text">{friendDisplayName} is typing</span>
                <span className="typing-dots-anim">
                  <span></span><span></span><span></span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Request Status Banners */}
        {isRecipient && (
          <div className="chat-request-bar incoming-request">
            <div className="chat-request-bar-content">
              <div className="chat-request-icon-wrap">
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <div className="chat-request-info">
                <strong>{friendDisplayName}</strong> sent you a chat request.
                <span>Accept to start chatting and making voice & video calls.</span>
              </div>
            </div>
            <div className="chat-request-buttons">
              <button
                type="button"
                className="btn-req-accept"
                onClick={handleAcceptRequest}
                disabled={requestActionLoading}
              >
                <i className="fa-solid fa-check"></i> Accept
              </button>
              <button
                type="button"
                className="btn-req-decline"
                onClick={handleDeclineRequest}
                disabled={requestActionLoading}
              >
                <i className="fa-solid fa-xmark"></i> Decline
              </button>
            </div>
          </div>
        )}

        {isPending && isInitiator && (
          <div className="chat-request-bar pending-request">
            <i className="fa-regular fa-clock pending-clock-icon"></i>
            <div className="chat-request-info">
              <span>Waiting for <strong>{friendDisplayName}</strong> to accept your chat request.</span>
            </div>
          </div>
        )}

        {isDeclined && (
          <div className="chat-request-bar declined-request">
            <i className="fa-solid fa-ban declined-ban-icon"></i>
            <div className="chat-request-info">
              <span>This chat request was declined.</span>
            </div>
          </div>
        )}

        <CallPanel
          callState={call.callState}
          callType={call.callType}
          isRinging={call.isRinging}
          localStream={call.localStream}
          remoteStream={call.remoteStream}
          error={call.error}
          friend={friend}
          isMutedAudio={call.isMutedAudio}
          isMutedVideo={call.isMutedVideo}
          toggleMuteAudio={call.toggleMuteAudio}
          toggleMuteVideo={call.toggleMuteVideo}
          switchCamera={call.switchCamera}
          onAccept={call.acceptCall}
          onEnd={call.callState === 'incoming' ? call.rejectCall : call.endCall}
        />

        <ChatInput
          onSend={handleSend}
          onTyping={sendTyping}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          editingMessage={editingMessage}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingMessage(null)}
          disabled={!isAccepted && isRecipient ? true : isDeclined ? true : false}
          disabledPlaceholder={
            isRecipient
              ? 'Accept chat request to send messages...'
              : isDeclined
              ? 'Chat request was declined'
              : ''
          }
        />
      </section>


      {selectedProfileUser && (
        <UserProfileModal
          user={selectedProfileUser}
          userId={selectedProfileUser.id || selectedProfileUser.userId}
          onClose={() => setSelectedProfileUser(null)}
          onStartCall={(f, type) => {
            setSelectedProfileUser(null);
            call.startCall(type);
          }}
        />
      )}
    </div>
  );
}
