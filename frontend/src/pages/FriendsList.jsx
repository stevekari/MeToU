import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers } from "../api/userApi";
import { getMyConversations, startConversation } from "../api/conversationApi";
import FriendCard from "../components/FriendCard";
import { getMessagePreview } from "../utils/messageContent";

export default function FriendsList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getMyConversations()
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);

  const trimmedSearch = search.trim();

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

  const openChat = async (friend) => {
    const { conversationId } = await startConversation(friend.id);
    navigate(`/chat/${conversationId}`, { state: { friend } });
  };

  const showSearchPopup = searchFocused && trimmedSearch.length >= 3;

  const selectFromSearch = (friend) => {
    setSearch("");
    setSearchFocused(false);
    openChat(friend);
  };

  if (loading) return <div className="page-loading">Loading friends...</div>;

  return (
    <div className="friends-page-layout">
      <aside className="chat-sidebar friends-sidebar">
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
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {showSearchPopup && (
            <div className="search-popup">
              {searchLoading && (
                <div className="search-popup-empty">Searching...</div>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <div className="search-popup-empty">No friends found</div>
              )}
              {!searchLoading &&
                searchResults.map((friend, index) => (
                  <div
                    key={friend.id}
                    className="search-popup-item"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <FriendCard
                      friend={f}
                      conversationId={f.conversationId || f._id}
                      lastMessage={conversations[f._id]?.lastMessage}
                      lastMessageAt={conversations[f._id]?.updatedAt}
                      unreadCount={conversations[f._id]?.unread}
                      active={activeId === f._id}
                      onClick={() => navigate(`/chat/${f.conversationId}`)}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>

        {conversations.length === 0 && (
          <p className="empty-state">
            No conversations yet — search a username above to start chatting.
          </p>
        )}

        <div className="friends-list">
          {conversations.map((conv) => (
            <FriendCard
              key={conv.conversationId}
              friend={conv.otherUser}
              lastMessage={getMessagePreview(conv.lastMessage)}
              onClick={() =>
                navigate(`/chat/${conv.conversationId}`, {
                  state: { friend: conv.otherUser },
                })
              }
            />
          ))}
        </div>
      </aside>

      <section className="friends-placeholder">
        <div className="empty-state">
          Select a friend on the left to start chatting.
        </div>
      </section>
    </div>
  );
}
