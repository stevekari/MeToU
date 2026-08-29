import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { getMessages, getMyConversations, startConversation } from '../api/conversationApi';
import { searchUsers, getPresenceMap } from '../api/userApi';
import { useWebSocket } from '../hooks/useWebSocket';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import FriendCard from '../components/FriendCard';
import { getMessagePreview } from '../utils/messageContent';
import { resolveAvatarUrl } from '../utils/avatarUrl';
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
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friend, setFriend] = useState(selectedFriend ?? null);
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [callSignal, setCallSignal] = useState(location.state?.incomingCall ?? null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
  }, [messages, scrollToBottom]);

  const userStatuses = useSelector((s) => s.presence?.userStatuses || {});
  const onlineIds = useSelector((s) => s.presence?.onlineIds || []);

  const sortConversations = (items) => {
    return [...items].sort((a, b) => {
      const timeA = new Date(a.lastMessageAt || a.lastMessageTime || a.createdAt || 0).getTime();
      const timeB = new Date(b.lastMessageAt || b.lastMessageTime || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  };

  const handleIncoming = useCallback((message) => {
    setMessages((prev) => {
      if (message.id && prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });

    setConversations((prev) => {
      const updated = prev.map((c) =>
        String(c.conversationId) === String(message.conversationId)
          ? {
              ...c,
              lastMessage: message.content,
              lastMessageTime: message.timestamp || new Date().toISOString(),
              lastMessageAt: message.timestamp || new Date().toISOString(),
            }
          : c
      );
      return sortConversations(updated);
    });
  }, []);

  const { sendMessage, sendCallSignal } = useWebSocket(conversationId, handleIncoming, setCallSignal);

  const handleSend = useCallback((content) => {
    sendMessage(content);
    setConversations((prev) => {
      const updated = prev.map((c) =>
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
  }, [conversationId, sendMessage]);

  const call = useWebRTCCall({
    conversationId,
    currentUserId,
    sendSignal: sendCallSignal,
    onSignal: callSignal,
    autoAccept: Boolean(location.state?.autoAccept),
  });
  const friendId = friend?.userId || friend?._id || friend?.id;

  const friendExplicitStatus = friendId ? (userStatuses[String(friendId)] || userStatuses[Number(friendId)]) : null;
  const isFriendPresent = friendId ? onlineIds.some((i) => String(i) === String(friendId)) : false;
  const isFriendBusy = friendExplicitStatus === 'busy';
  const isFriendOnline = friendExplicitStatus ? friendExplicitStatus === 'online' : isFriendPresent;
  const friendStatusType = isFriendBusy ? 'busy' : isFriendOnline ? 'online' : 'offline';
  const friendStatusLabel = isFriendBusy ? t('busy') : isFriendOnline ? t('online') : t('offline');

  useEffect(() => {
    if (selectedFriend) {
      setFriend(selectedFriend);
    }
  }, [selectedFriend]);

  useEffect(() => {
    setSidebarLoading(true);
    getMyConversations()
      .then((conversationsData) => {
        const sorted = sortConversations(conversationsData);
        setConversations(sorted);

        if (!selectedFriend) {
          const currentConversation = sorted.find(
            (c) => String(c.conversationId) === String(conversationId)
          );
          setFriend(currentConversation?.otherUser ?? null);
        }
      })
      .finally(() => setSidebarLoading(false));
  }, [conversationId, selectedFriend]);

  useEffect(() => {
    setLoading(true);
    getMessages(conversationId)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [conversationId]);

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

  return (
    <div className="chat-layout-page">
      <aside className="chat-sidebar">
        <h2>{t('friends')} <span className="friends-count">({t('friendsCount', { count: conversations.length })})</span></h2>

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
                    <FriendCard friend={nextFriend} onClick={() => selectFromSearch(nextFriend)} />
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="friends-list">
          {sidebarLoading && <div className="empty-state">{t('loadingFriends')}</div>}
          {!sidebarLoading && conversations.length === 0 && (
            <div className="empty-state">{t('noConversations')}</div>
          )}
          {!sidebarLoading &&
            conversations.map((conv) => (
              <FriendCard
                key={conv.conversationId}
                friend={conv.otherUser}
                conversationId={conv.conversationId}
                lastMessage={getMessagePreview(conv.lastMessage)}
                lastMessageAt={conv.lastMessageAt ?? conv.lastMessageTime}
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
                <div className="friend-avatar-wrap">
                  <img
                    src={resolveAvatarUrl(friend.avatarUrl, friend.username)}
                    alt={friend.username}
                  />
                  <span className={`online-dot ${friendStatusType}`} title={friendStatusLabel}></span>
                </div>
                <div className="chat-header-details">
                  <h2>{friend.username}</h2>
                  <span className={`chat-header-status ${friendStatusType}`}>{friendStatusLabel}</span>
                </div>
              </div>
              <div className="call-buttons">
                <button type="button" onClick={() => call.startCall('voice')} disabled={call.callState !== 'idle'} aria-label="Start voice call" title="Start voice call">
                  <i className="fa-solid fa-phone"></i>
                </button>
                <button type="button" onClick={() => call.startCall('video')} disabled={call.callState !== 'idle'} aria-label="Start video call" title="Start video call">
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
          {!loading && messages.length === 0 && friend && (
            <div className="empty-state">{t('sayHi', { username: friend.username })}</div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id ?? `${m.senderId}-${m.timestamp}`} message={m} isMine={m.senderId === currentUserId} />
          ))}
          <div ref={messagesEndRef} />
        </div>

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

        <ChatInput onSend={handleSend} />
      </section>
    </div>
  );
}
