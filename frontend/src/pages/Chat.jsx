import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { getMessages, getMyConversations, startConversation } from '../api/conversationApi';
import { searchUsers } from '../api/userApi';
import { useWebSocket } from '../hooks/useWebSocket';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import FriendCard from '../components/FriendCard';
import { getMessagePreview } from '../utils/messageContent';
import { resolveAvatarUrl } from '../utils/avatarUrl';

export default function Chat({ currentUserId }) {
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedFriend = location.state?.friend;

  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friend, setFriend] = useState(selectedFriend ?? null);
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const bottomRef = useRef(null);

  const handleIncoming = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const { sendMessage } = useWebSocket(conversationId, handleIncoming);

  useEffect(() => {
    if (selectedFriend) {
      setFriend(selectedFriend);
    }
  }, [selectedFriend]);

  useEffect(() => {
    setSidebarLoading(true);
    getMyConversations()
      .then((conversationsData) => {
        setConversations(conversationsData);

        if (!selectedFriend) {
          const currentConversation = conversationsData.find(
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      searchUsers(trimmedSearch)
        .then((results) => {
          if (!cancelled) setSearchResults(results);
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
  }, [trimmedSearch]);

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
        <h2>Friends</h2>

        <div className="friends-search">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search"
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
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {showSearchPopup && (
            <div className="search-popup">
              {searchLoading && <div className="search-popup-empty">Searching...</div>}
              {!searchLoading && searchResults.length === 0 && (
                <div className="search-popup-empty">No friends found</div>
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
          {sidebarLoading && <div className="empty-state">Loading friends...</div>}
          {!sidebarLoading && conversations.length === 0 && (
            <div className="empty-state">No conversations yet — search a username above to start chatting.</div>
          )}
          {!sidebarLoading &&
            conversations.map((conv) => (
              <FriendCard
                key={conv.conversationId}
                friend={conv.otherUser}
                lastMessage={getMessagePreview(conv.lastMessage)}
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
              <img
                src={resolveAvatarUrl(friend.avatarUrl, friend.username)}
                alt={friend.username}
              />
              <h2>{friend.username}</h2>
            </>
          )}
          {!friend && (
            <h2>
              Open chat from your{' '}
              <button className="link-button" onClick={() => navigate('/friends')}>
                friends list
              </button>
            </h2>
          )}
        </div>

        <div className="chat-messages">
          {loading && <div className="page-loading">Loading conversation...</div>}
          {!loading && messages.length === 0 && friend && (
            <div className="empty-state">Say hi to {friend.username}!</div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id ?? `${m.senderId}-${m.timestamp}`} message={m} isMine={m.senderId === currentUserId} />
          ))}
          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={sendMessage} />
      </section>
    </div>
  );
}
