import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNetworkSuggestions, getMyConnections, toggleConnectUser, getBusinesses } from '../api/networkApi';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import '../styles/network.css';

export default function Network({ currentUserId }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('suggestions'); // suggestions | connections | businesses
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [suggestions, setSuggestions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectedMap, setConnectedMap] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sugData, connData, bizData] = await Promise.all([
        getNetworkSuggestions().catch(() => []),
        getMyConnections().catch(() => []),
        getBusinesses().catch(() => []),
      ]);
      setSuggestions(sugData || []);
      setConnections(connData || []);
      setBusinesses(bizData || []);

      const map = {};
      (connData || []).forEach((c) => {
        map[c.userId] = true;
      });
      setConnectedMap(map);
    } catch (err) {
      console.error('Failed to load network data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (targetUserId) => {
    try {
      const isCurrentlyConnected = !!connectedMap[targetUserId];
      setConnectedMap((prev) => ({ ...prev, [targetUserId]: !isCurrentlyConnected }));
      await toggleConnectUser(targetUserId);
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  const roles = [
    { label: 'All', value: 'ALL' },
    { label: 'Software Developer', value: 'DEVELOPER' },
    { label: 'UI/UX Designer', value: 'DESIGNER' },
    { label: 'Java / Backend', value: 'JAVA' },
    { label: 'Businesses', value: 'BUSINESS' },
  ];

  const filterList = (list) => {
    return list.filter((item) => {
      const name = (item.displayName || item.username || '').toLowerCase();
      const headline = (item.headline || '').toLowerCase();
      const skills = (item.skills || '').toLowerCase();
      const company = (item.company || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesQuery = !query || name.includes(query) || headline.includes(query) || skills.includes(query) || company.includes(query);

      let matchesRole = true;
      if (roleFilter === 'DEVELOPER') {
        matchesRole = headline.includes('dev') || skills.includes('react') || skills.includes('javascript') || skills.includes('code');
      } else if (roleFilter === 'DESIGNER') {
        matchesRole = headline.includes('design') || headline.includes('ui') || headline.includes('ux') || skills.includes('figma');
      } else if (roleFilter === 'JAVA') {
        matchesRole = headline.includes('java') || skills.includes('java') || skills.includes('spring');
      } else if (roleFilter === 'BUSINESS') {
        matchesRole = item.isBusiness === true;
      }

      return matchesQuery && matchesRole;
    });
  };

  return (
    <div className="network-container">
      {/* Hero Section */}
      <section className="network-hero">
        <h1>Grow your professional network</h1>
        <p>Connect with developers, designers, product creators, and innovative businesses on GioChat.</p>

        <div className="network-filter-bar">
          <input
            type="text"
            className="network-search-input"
            placeholder="🔍 Search by name, title, skill (e.g. React, Java, UI/UX)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`post-type-pill ${roleFilter === r.value ? 'active' : ''}`}
                onClick={() => setRoleFilter(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="network-tabs">
        <button
          type="button"
          className={`network-tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          <i className="fa-solid fa-user-plus"></i> People you may know ({suggestions.length})
        </button>
        <button
          type="button"
          className={`network-tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          <i className="fa-solid fa-users"></i> My Network ({connections.length})
        </button>
        <button
          type="button"
          className={`network-tab-btn ${activeTab === 'businesses' ? 'active' : ''}`}
          onClick={() => setActiveTab('businesses')}
        >
          <i className="fa-solid fa-briefcase"></i> Businesses & Directory ({businesses.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
          <p style={{ marginTop: '12px' }}>Finding network connections...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: People you may know */}
          {activeTab === 'suggestions' && (
            <div className="network-grid">
              {filterList(suggestions).length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <i className="fa-solid fa-user-group fa-3x" style={{ marginBottom: '12px' }}></i>
                  <h3>No suggestions match your filter</h3>
                  <p>Try searching for a different skill or role.</p>
                </div>
              ) : (
                filterList(suggestions).map((item) => {
                  const avatar = resolveAvatarUrl(item.avatarUrl, item.displayName || item.username);
                  const isConnected = !!connectedMap[item.userId];
                  const skillsList = (item.skills || 'React, JavaScript, Web')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);

                  return (
                    <div key={item.userId} className="network-card">
                      <div
                        className="network-card-banner"
                        style={item.bannerUrl ? { backgroundImage: `url(${item.bannerUrl})` } : {}}
                      />
                      <div className="network-card-body">
                        <img className="network-card-avatar" src={avatar} alt={item.displayName || item.username} />
                        <Link to={`/profile/${item.userId}`} className="network-card-name">
                          {item.displayName || item.username}
                          {item.isBusiness && <span className="post-badge-business">Business</span>}
                        </Link>
                        <div className="network-card-headline">
                          {item.headline || 'Software Developer & Creator'}
                        </div>
                        {item.location && (
                          <div className="network-card-location">
                            <i className="fa-solid fa-location-dot"></i> {item.location}
                          </div>
                        )}
                        <div className="network-skills-row">
                          {skillsList.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="network-skill-badge">
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="network-card-actions">
                          <button
                            type="button"
                            className={`btn-network-connect ${isConnected ? 'connected' : ''}`}
                            onClick={() => handleConnect(item.userId)}
                          >
                            <i className={`fa-solid ${isConnected ? 'fa-check' : 'fa-user-plus'}`}></i>
                            {isConnected ? 'Connected' : 'Connect'}
                          </button>
                          <button
                            type="button"
                            className="btn-network-message"
                            onClick={() => navigate('/friends')}
                            title="Open Message"
                          >
                            <i className="fa-solid fa-message"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: My Network Connections */}
          {activeTab === 'connections' && (
            <div className="network-grid">
              {filterList(connections).length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <i className="fa-solid fa-user-check fa-3x" style={{ marginBottom: '12px' }}></i>
                  <h3>No connections yet</h3>
                  <p>Explore "People you may know" and click Connect to build your circle.</p>
                </div>
              ) : (
                filterList(connections).map((item) => {
                  const avatar = resolveAvatarUrl(item.avatarUrl, item.displayName || item.username);
                  return (
                    <div key={item.userId} className="network-card">
                      <div
                        className="network-card-banner"
                        style={item.bannerUrl ? { backgroundImage: `url(${item.bannerUrl})` } : {}}
                      />
                      <div className="network-card-body">
                        <img className="network-card-avatar" src={avatar} alt={item.displayName || item.username} />
                        <Link to={`/profile/${item.userId}`} className="network-card-name">
                          {item.displayName || item.username}
                        </Link>
                        <div className="network-card-headline">
                          {item.headline || 'Professional Connection'}
                        </div>
                        <div className="network-card-actions">
                          <button
                            type="button"
                            className="btn-network-connect connected"
                            onClick={() => handleConnect(item.userId)}
                          >
                            Connected
                          </button>
                          <button
                            type="button"
                            className="btn-network-message"
                            onClick={() => navigate('/friends')}
                          >
                            <i className="fa-solid fa-message"></i> Message
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: Businesses & Directory */}
          {activeTab === 'businesses' && (
            <div className="network-grid">
              {filterList(businesses).length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <i className="fa-solid fa-building fa-3x" style={{ marginBottom: '12px' }}></i>
                  <h3>No business profiles found</h3>
                  <p>You can turn your profile into a Business profile in Profile Settings.</p>
                </div>
              ) : (
                filterList(businesses).map((item) => {
                  const avatar = resolveAvatarUrl(item.avatarUrl, item.displayName || item.username);
                  const isConnected = !!connectedMap[item.userId];
                  const services = (item.businessServices || 'Web Development, Mobile Applications, Cloud Solutions')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);

                  return (
                    <div key={item.userId} className="network-card business-card">
                      <div
                        className="network-card-banner"
                        style={item.bannerUrl ? { backgroundImage: `url(${item.bannerUrl})` } : {}}
                      />
                      <div className="network-card-body">
                        <img className="network-card-avatar" src={avatar} alt={item.displayName || item.username} />
                        <Link to={`/profile/${item.userId}`} className="network-card-name">
                          {item.displayName || item.username}
                          <i className="fa-solid fa-circle-check" style={{ color: '#3b82f6', fontSize: '0.85rem' }}></i>
                        </Link>
                        <div className="network-card-headline">{item.headline || 'Technology & Software Solutions'}</div>
                        <div className="network-card-location">
                          <i className="fa-solid fa-location-dot"></i> {item.location || 'Barcelona, Spain'}
                          <span style={{ marginLeft: '8px', color: '#3b82f6', fontWeight: 600 }}>
                            {item.followersCount || 1245} followers
                          </span>
                        </div>

                        <div className="business-services-list">
                          <strong style={{ color: 'var(--text-main, #fff)', fontSize: '0.78rem' }}>Services:</strong>
                          {services.slice(0, 3).map((service, idx) => (
                            <div key={idx}>• {service}</div>
                          ))}
                        </div>

                        <div className="network-card-actions">
                          <button
                            type="button"
                            className={`btn-network-connect ${isConnected ? 'connected' : ''}`}
                            onClick={() => handleConnect(item.userId)}
                          >
                            {isConnected ? 'Following' : 'Follow'}
                          </button>
                          <button
                            type="button"
                            className="btn-network-message"
                            onClick={() => navigate('/friends')}
                          >
                            Contact
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
