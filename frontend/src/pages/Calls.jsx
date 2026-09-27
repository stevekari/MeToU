import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getCalls, getMyConversations, getMessages, startConversation } from '../api/conversationApi';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { useLanguage } from '../contexts/LanguageContext';
import { setUserStatuses } from '../store/slices/presenceSlice';
import { getPresenceMap } from '../api/userApi';
import '../styles/calls.css';

export default function Calls({ currentUserId }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useLanguage();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'missed' | 'received' | 'outgoing'
  const [search, setSearch] = useState('');

  const onlineIds = useSelector((state) => state.presence?.onlineUserIds || []);
  const userStatuses = useSelector((state) => state.presence?.userStatuses || {});

  const fetchCallsData = useCallback(async () => {
    setLoading(true);
    try {
      let callList = [];
      try {
        const apiCalls = await getCalls();
        if (Array.isArray(apiCalls)) {
          callList = apiCalls;
        }
      } catch {
        // Fallback: fetch from conversations and messages
        const conversations = await getMyConversations().catch(() => []);
        const aggregatedCalls = [];

        for (const conv of conversations) {
          try {
            const msgs = await getMessages(conv.conversationId);
            for (const msg of msgs) {
              if (msg.content && msg.content.includes('"type":"call"')) {
                try {
                  const parsed = JSON.parse(msg.content);
                  if (parsed.type === 'call') {
                    const isCaller = String(parsed.callerId || msg.senderId) === String(currentUserId);
                    let direction = 'missed';
                    if (isCaller) {
                      direction = 'outgoing';
                    } else if (parsed.status === 'completed') {
                      direction = 'received';
                    } else {
                      direction = 'missed';
                    }

                    aggregatedCalls.push({
                      id: msg.id || `${conv.conversationId}-${msg.timestamp}`,
                      conversationId: conv.conversationId,
                      otherUser: conv.otherUser,
                      senderId: msg.senderId,
                      callerId: parsed.callerId || msg.senderId,
                      mediaType: parsed.mediaType || 'voice',
                      status: parsed.status || 'missed',
                      timestamp: msg.timestamp,
                      direction,
                    });
                  }
                } catch {
                  // ignore parse error
                }
              }
            }
          } catch {
            // ignore
          }
        }
        callList = aggregatedCalls;
      }

      // Sort newest first
      callList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setCalls(callList);
    } catch (err) {
      console.error('Error fetching calls:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchCallsData();
    getPresenceMap()
      .then((presence) => {
        if (presence && typeof presence === 'object') {
          dispatch(setUserStatuses(presence));
        }
      })
      .catch(() => {});
  }, [fetchCallsData, dispatch]);

  const handleStartCall = async (friend, callType = 'voice', existingConversationId = null) => {
    const friendId = friend?.id || friend?.userId;
    if (!friendId && !existingConversationId) return;

    if (existingConversationId) {
      navigate(`/chat/${existingConversationId}`, {
        state: { friend, startCallType: callType },
      });
      return;
    }

    try {
      const res = await startConversation(friendId);
      navigate(`/chat/${res.conversationId}`, {
        state: { friend, startCallType: callType },
      });
    } catch (err) {
      console.error('Failed to initiate call conversation:', err);
    }
  };

  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'missed' && c.direction === 'missed') ||
        (filter === 'received' && c.direction === 'received') ||
        (filter === 'outgoing' && c.direction === 'outgoing');

      const matchesSearch =
        !search.trim() ||
        c.otherUser?.username?.toLowerCase().includes(search.trim().toLowerCase()) ||
        c.otherUser?.displayName?.toLowerCase().includes(search.trim().toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [calls, filter, search]);

  const formatCallTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return timeStr;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timeStr}`;
    }

    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  return (
    <div className="calls-page-container">
      <div className="calls-card">
        {/* Header */}
        <div className="calls-header">
          <div className="calls-header-title-row">
            <h2 className="calls-title">{t('calls')}</h2>
            <div className="calls-filter-tabs">
              <button
                type="button"
                className={`calls-filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                {t('allCalls') || 'All'}
              </button>
              <button
                type="button"
                className={`calls-filter-tab ${filter === 'missed' ? 'active' : ''}`}
                onClick={() => setFilter('missed')}
              >
                {t('missedCalls') || 'Missed'}
              </button>
              <button
                type="button"
                className={`calls-filter-tab ${filter === 'received' ? 'active' : ''}`}
                onClick={() => setFilter('received')}
              >
                {t('received') || 'Received'}
              </button>
              <button
                type="button"
                className={`calls-filter-tab ${filter === 'outgoing' ? 'active' : ''}`}
                onClick={() => setFilter('outgoing')}
              >
                {t('outgoing') || 'Called'}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="calls-search-wrap">
            <i className="fa-solid fa-magnifying-glass calls-search-icon" />
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="calls-search-input"
            />
            {search && (
              <button
                type="button"
                className="calls-search-clear"
                onClick={() => setSearch('')}
                aria-label={t('clearSearch')}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        </div>

        {/* Call List Content */}
        <div className="calls-list-content">
          {loading && <div className="empty-state">{t('loadingFriends')}</div>}

          {!loading && filteredCalls.length === 0 && (
            <div className="no-chats-box">
              <i className="fa-solid fa-phone-slash no-chats-icon" />
              <h3 className="no-chats-title">{t('noCalls')}</h3>
              <p className="no-chats-desc">{t('noCallsDesc')}</p>
            </div>
          )}

          {!loading && filteredCalls.length > 0 && (
            <div className="calls-items-list">
              {filteredCalls.map((callItem) => {
                const friend = callItem.otherUser;
                const friendId = friend?.id || friend?.userId;
                const explicitStatus = friendId ? userStatuses[String(friendId)] : null;
                const isPresent = friendId ? onlineIds.some((id) => String(id) === String(friendId)) : false;
                const isOnline = explicitStatus ? explicitStatus === 'online' : isPresent;
                const isBusy = explicitStatus === 'busy';
                const statusClass = isBusy ? 'busy' : isOnline ? 'online' : 'offline';

                const isMissed = callItem.direction === 'missed';
                const isOutgoing = callItem.direction === 'outgoing';
                const isReceived = callItem.direction === 'received';
                const defaultCallType = callItem.mediaType || 'voice';

                return (
                  <div
                    key={callItem.id}
                    className="call-item-row"
                    onClick={() => handleStartCall(friend, defaultCallType, callItem.conversationId)}
                    role="button"
                    tabIndex={0}
                    title={`Tap to call ${friend?.username || 'user'} (${defaultCallType})`}
                  >
                    {/* Avatar */}
                    <div
                      className="friend-avatar-wrap"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/chat/${callItem.conversationId}`, { state: { friend } });
                      }}
                      title="Open chat"
                    >
                      <img
                        src={resolveAvatarUrl(friend?.avatarUrl, friend?.username)}
                        alt={friend?.username || 'User'}
                        className="friend-avatar"
                      />
                      <span className={`online-dot ${statusClass}`} />
                    </div>

                    {/* Info - WhatsApp Style Clickable to Call */}
                    <div className="call-item-info">
                      <span className={`call-item-name ${isMissed ? 'missed' : ''}`}>
                        {friend?.displayName || friend?.username || 'User'}
                      </span>
                      <div className="call-item-details">
                        {/* 
                          Arrow Signs per specification:
                          - top arrow for missed call (Red)
                          - forward arrow for outgoing/calling (Green)
                          - down arrow for received call (Green)
                        */}
                        {isMissed && (
                          <span className="call-arrow-badge missed" title={t('missed')}>
                            <i className="fa-solid fa-arrow-up call-arrow missed" />
                          </span>
                        )}
                        {isOutgoing && (
                          <span className="call-arrow-badge outgoing" title={t('outgoing')}>
                            <i className="fa-solid fa-arrow-up-right call-arrow outgoing" />
                          </span>
                        )}
                        {isReceived && (
                          <span className="call-arrow-badge received" title={t('received')}>
                            <i className="fa-solid fa-arrow-down call-arrow received" />
                          </span>
                        )}

                        <span className={`call-status-text ${isMissed ? 'missed' : ''}`}>
                          {isMissed ? t('missed') : isOutgoing ? t('outgoing') : t('received')}
                        </span>
                        <span className="call-time-divider">•</span>
                        <span className="call-time-text">{formatCallTime(callItem.timestamp)}</span>
                      </div>
                    </div>

                    {/* Action Call Buttons */}
                    <div className="call-item-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="call-quick-btn voice"
                        onClick={() => handleStartCall(friend, 'voice', callItem.conversationId)}
                        title={t('startVoiceCall')}
                        aria-label={t('startVoiceCall')}
                      >
                        <i className="fa-solid fa-phone" />
                      </button>
                      <button
                        type="button"
                        className="call-quick-btn video"
                        onClick={() => handleStartCall(friend, 'video', callItem.conversationId)}
                        title={t('startVideoCall')}
                        aria-label={t('startVideoCall')}
                      >
                        <i className="fa-solid fa-video" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
