import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers, getPresenceMap } from "../api/userApi";
import { getMyConversations, startConversation } from "../api/conversationApi";
import FriendCard from "../components/FriendCard";
import UserProfileModal from "../components/UserProfileModal";
import { getMessagePreview } from "../utils/messageContent";
import { useLanguage } from '../contexts/LanguageContext';
import { useDispatch, useSelector } from 'react-redux';
import { setConversations as setConversationState } from '../store/slices/chatSlice';
import { setUserStatuses } from '../store/slices/presenceSlice';

export default function FriendsList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
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

    getPresenceMap()
      .then((presence) => {
        if (presence && typeof presence === 'object') {
          dispatch(setUserStatuses(presence));
        }
      })
      .catch(() => {});
  }, [dispatch]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const timeA = new Date(liveConversations[a.conversationId]?.lastMessageAt ?? a.lastMessageTime ?? a.createdAt ?? 0).getTime();
      const timeB = new Date(liveConversations[b.conversationId]?.lastMessageAt ?? b.lastMessageTime ?? b.createdAt ?? 0).getTime();
      return timeB - timeA;
    });
  }, [conversations, liveConversations]);

  const trimmedSearch = search.trim();

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

  const handleStartCall = async (friend, type) => {
    try {
      const { conversationId } = await startConversation(friend.id);
      navigate(`/chat/${conversationId}`, {
        state: { friend, startCallOnMount: type }
      });
    } catch (e) {
      console.error(e);
    }
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
                    <FriendCard
                      friend={friend}
                      onAvatarClick={(f) => setSelectedProfileUser(f)}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>

        {conversations.length === 0 && (
          <div className="no-chats-box">
            <i className="fa-solid fa-comments no-chats-icon" />
            <h3 className="no-chats-title">{t('noChats')}</h3>
            <p className="no-chats-desc">{t('noChatsDesc')}</p>
          </div>
        )}

        <div className="friends-list">
          {sortedConversations.map((conv) => (
            <FriendCard
              key={conv.conversationId}
              friend={conv.otherUser}
              conversationId={conv.conversationId}
              lastMessage={getMessagePreview(liveConversations[conv.conversationId]?.lastMessage ?? conv.lastMessage)}
              lastMessageAt={liveConversations[conv.conversationId]?.lastMessageAt ?? conv.lastMessageTime}
              onAvatarClick={(friend) => setSelectedProfileUser(friend)}
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

      {selectedProfileUser && (
        <UserProfileModal
          user={selectedProfileUser}
          userId={selectedProfileUser.id || selectedProfileUser.userId}
          onClose={() => setSelectedProfileUser(null)}
          onStartCall={(friend, type) => handleStartCall(friend, type)}
        />
      )}
    </div>
  );
}