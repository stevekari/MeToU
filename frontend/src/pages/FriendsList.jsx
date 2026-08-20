import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers } from "../api/userApi";
import { getMyConversations, startConversation } from "../api/conversationApi";
import FriendCard from "../components/FriendCard";
import { getMessagePreview } from "../utils/messageContent";
import { useLanguage } from '../contexts/LanguageContext';
import { useDispatch, useSelector } from 'react-redux';
import { setConversations as setConversationState } from '../store/slices/chatSlice';

export default function FriendsList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const liveConversations = useSelector((state) => state.chat.conversations);
  const { t } = useLanguage();

  useEffect(() => {
    getMyConversations()
     .then((items) => {
       setConversations(items);
      dispatch(setConversationState(items));
     })
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
    try {
      const { conversationId } = await startConversation(friend.id);
      navigate(`/chat/${conversationId}`, { state: { friend } });
    } catch (e) {
      console.error(e);
    }
  };

  const showSearchPopup = searchFocused && trimmedSearch.length >= 3;

  const selectFromSearch = (friend) => {
    setSearch("");
    setSearchFocused(false);
    openChat(friend);
  };

  if (loading) return <div className="page-loading">{t('loadingFriends')}</div>;

  return (
    <div className="friends-page-layout">
      <aside className="chat-sidebar friends-sidebar">
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
                onClick={() => setSearch("")}
                aria-label={t('clearSearch')}
              >
                ×
              </button>
            )}
          </div>

          {showSearchPopup && (
            <div className="search-popup">
              {searchLoading && (
                <div className="search-popup-empty">{t('searching')}</div>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <div className="search-popup-empty">{t('noFriendsFound')}</div>
              )}
              {!searchLoading &&
                searchResults.map((friend, index) => (
                  <div
                    key={friend.id}
                    className="search-popup-item"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectFromSearch(friend)}
                  >
                    <FriendCard friend={friend} />
                  </div>
                ))}
            </div>
          )}
        </div>

        {conversations.length === 0 && (
          <p className="empty-state">
            {t('noConversations')}
          </p>
        )}

        <div className="friends-list">
          {conversations.map((conv) => (
            <FriendCard
              key={conv.conversationId}
              friend={conv.otherUser}
              conversationId={conv.conversationId}
              lastMessage={getMessagePreview(liveConversations[conv.conversationId]?.lastMessage ?? conv.lastMessage)}
              lastMessageAt={liveConversations[conv.conversationId]?.lastMessageAt ?? conv.lastMessageTime}
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
          {t('selectFriend')}
        </div>
      </section>
    </div>
  );
}