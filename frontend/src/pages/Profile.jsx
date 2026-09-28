import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFullProfile, updateFullProfile, trackProfileView, getProfileAnalytics } from '../api/profileApi';
import { getUserPosts, toggleLikePost } from '../api/postApi';
import { toggleConnectUser } from '../api/networkApi';
import { uploadMedia } from '../api/mediaApi';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import '../styles/profile.css';
import '../styles/feed.css';

export default function Profile({ user: currentUser, onProfileUpdate }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const targetId = userId || currentUser?.userId || currentUser?.id;
  const isOwnProfile = !userId || String(userId) === String(currentUser?.userId || currentUser?.id);

  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // posts | about | analytics
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editHeadline, setEditHeadline] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editPortfolioUrl, setEditPortfolioUrl] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editIsBusiness, setEditIsBusiness] = useState(false);
  const [editBusinessServices, setEditBusinessServices] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!targetId) return;
    loadProfileData();
    if (!isOwnProfile) {
      trackProfileView(targetId).catch(() => {});
    }
  }, [targetId, isOwnProfile]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profData, postsData, analyticsData] = await Promise.all([
        getFullProfile(targetId).catch(() => currentUser),
        getUserPosts(targetId).catch(() => []),
        getProfileAnalytics(targetId).catch(() => null),
      ]);

      setProfile(profData);
      setPosts(postsData || []);
      setAnalytics(analyticsData);

      // Populate edit fields
      if (profData) {
        setEditHeadline(profData.headline || '');
        setEditCompany(profData.company || '');
        setEditLocation(profData.location || '');
        setEditSkills(profData.skills || '');
        setEditPortfolioUrl(profData.portfolioUrl || '');
        setEditBio(profData.bio || '');
        setEditBannerUrl(profData.bannerUrl || '');
        setEditIsBusiness(!!profData.isBusiness);
        setEditBusinessServices(profData.businessServices || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await updateFullProfile({
        displayName: profile?.displayName || profile?.username,
        bio: editBio,
        headline: editHeadline,
        company: editCompany,
        location: editLocation,
        skills: editSkills,
        portfolioUrl: editPortfolioUrl,
        bannerUrl: editBannerUrl,
        isBusiness: editIsBusiness,
        businessServices: editBusinessServices,
      });

      setProfile(updated);
      if (onProfileUpdate) onProfileUpdate(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      alert('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = await uploadMedia(file, 'image');
      setEditBannerUrl(res.url);
      const updated = await updateFullProfile({
        ...profile,
        bannerUrl: res.url,
      });
      setProfile(updated);
      if (onProfileUpdate) onProfileUpdate(updated);
    } catch (err) {
      alert('Failed to upload banner');
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnected(!isConnected);
      await toggleConnectUser(targetId);
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  const handleLike = async (postId) => {
    try {
      const updated = await toggleLikePost(postId, 'LIKE');
      setPosts(posts.map((p) => (p.id === postId ? updated : p)));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
        <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
        <p style={{ marginTop: '14px' }}>Loading profile...</p>
      </div>
    );
  }

  const avatar = resolveAvatarUrl(profile?.avatarUrl, profile?.displayName || profile?.username);
  const skillsList = (profile?.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyViews = analytics?.weeklyViews || [24, 45, 68, 92, 140, 85, 110];
  const maxView = Math.max(...weeklyViews, 1);

  return (
    <div className="profile-container">
      {/* Main Profile Header Card */}
      <div className="profile-card-main">
        {/* Cover Banner */}
        <div
          className="profile-cover"
          style={profile?.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : {}}
        >
          {isOwnProfile && (
            <label className="profile-cover-edit-btn">
              <i className="fa-solid fa-camera"></i> Change Banner
              <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
            </label>
          )}
        </div>

        <div className="profile-header-content">
          {/* Avatar & Action Button Row */}
          <div className="profile-avatar-row">
            <img className="profile-avatar-lg" src={avatar} alt={profile?.displayName || profile?.username} />
            <div className="profile-actions-top">
              {isOwnProfile ? (
                <button
                  type="button"
                  className="btn-network-connect"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <i className="fa-solid fa-pen-to-square"></i> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={`btn-network-connect ${isConnected ? 'connected' : ''}`}
                    onClick={handleConnect}
                  >
                    <i className={`fa-solid ${isConnected ? 'fa-check' : 'fa-user-plus'}`}></i>
                    {isConnected ? 'Connected' : 'Connect'}
                  </button>
                  <button
                    type="button"
                    className="btn-network-message"
                    onClick={() => navigate('/friends')}
                  >
                    <i className="fa-solid fa-message"></i> Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Identity & Professional Details */}
          <div className="profile-identity">
            <h1>
              {profile?.displayName || profile?.username}
              {profile?.isBusiness && <span className="post-badge-business">Business</span>}
            </h1>
            <div className="headline">
              {profile?.headline || 'Professional Member • GioChat'}
            </div>

            <div className="profile-meta-tags">
              {profile?.company && (
                <span className="profile-meta-tag">
                  <i className="fa-solid fa-building"></i> {profile.company}
                </span>
              )}
              {profile?.location && (
                <span className="profile-meta-tag">
                  <i className="fa-solid fa-location-dot"></i> {profile.location}
                </span>
              )}
              {profile?.portfolioUrl && (
                <a
                  href={profile.portfolioUrl.startsWith('http') ? profile.portfolioUrl : `https://${profile.portfolioUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="profile-meta-tag"
                  style={{ color: '#10b981', textDecoration: 'none', fontWeight: 500 }}
                >
                  <i className="fa-solid fa-link"></i> {profile.portfolioUrl}
                </a>
              )}
            </div>

            {/* Network stats count */}
            <div className="profile-stats-bar">
              <div className="profile-stat-box">
                <strong>{profile?.followersCount || 0}</strong> connections
              </div>
              <div className="profile-stat-box">
                <strong>{profile?.profileViews || 0}</strong> profile views
              </div>
              <div className="profile-stat-box">
                <strong>{profile?.postImpressions || 0}</strong> impressions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="profile-nav-tabs">
        <button
          type="button"
          className={`profile-nav-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <i className="fa-solid fa-signs-post"></i> Posts ({posts.length})
        </button>
        <button
          type="button"
          className={`profile-nav-tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <i className="fa-solid fa-circle-info"></i> About & Skills
        </button>
        <button
          type="button"
          className={`profile-nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <i className="fa-solid fa-chart-line"></i> Analytics & Performance
        </button>
      </div>

      {/* TAB 1: User Posts */}
      {activeTab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {posts.length === 0 ? (
            <div className="feed-post-card" style={{ textAlign: 'center', padding: '36px' }}>
              <i className="fa-solid fa-newspaper fa-3x" style={{ color: '#64748b', marginBottom: '12px' }}></i>
              <h3>No posts shared yet</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
                Posts created by this user will appear here.
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="feed-post-card">
                <div className="post-header">
                  <div className="post-author-wrap">
                    <img className="post-author-avatar" src={avatar} alt={profile?.displayName || profile?.username} />
                    <div className="post-author-info">
                      <div className="post-author-name-row">
                        <span className="post-author-name">{profile?.displayName || profile?.username}</span>
                        {post.postType && post.postType !== 'STANDARD' && (
                          <span className={`post-type-tag post-type-${post.postType}`}>{post.postType}</span>
                        )}
                      </div>
                      <span className="post-time">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="post-content">{post.content}</div>

                {post.projectTitle && (
                  <div className="post-embed-box">
                    <div className="embed-row">
                      <i className="fa-solid fa-code-branch" style={{ color: '#10b981' }}></i>
                      <strong>{post.projectTitle}</strong>
                    </div>
                    {post.projectUrl && (
                      <a href={post.projectUrl} target="_blank" rel="noreferrer" className="embed-link">
                        <i className="fa-solid fa-arrow-up-right-from-square"></i> View Project
                      </a>
                    )}
                  </div>
                )}

                {post.mediaUrl && (
                  <div className="post-media-container">
                    <img src={post.mediaUrl} alt="Attachment" />
                  </div>
                )}

                <div className="post-stats-row">
                  <span>
                    <i className="fa-solid fa-thumbs-up" style={{ color: '#10b981', marginRight: '4px' }}></i>
                    {post.likesCount || 0} reactions
                  </span>
                  <span>{post.commentsCount || 0} comments</span>
                </div>

                <div className="post-actions-bar">
                  <button
                    type="button"
                    className={`post-action-btn ${post.isLikedByCurrentUser ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    <i className={`fa-${post.isLikedByCurrentUser ? 'solid' : 'regular'} fa-thumbs-up`}></i>
                    <span>Like</span>
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* TAB 2: About & Skills */}
      {activeTab === 'about' && (
        <div className="analytics-card">
          <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', color: '#fff' }}>About</h3>
          <p style={{ color: 'var(--text-muted, #94a3b8)', lineHeight: '1.6', fontSize: '0.95rem' }}>
            {profile?.bio || 'No bio added yet.'}
          </p>

          <h3 style={{ margin: '24px 0 12px', fontSize: '1.1rem', color: '#fff' }}>Skills & Endorsements</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skillsList.length === 0 ? (
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No skills listed yet.</span>
            ) : (
              skillsList.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#10b981',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                  }}
                >
                  {skill}
                </span>
              ))
            )}
          </div>

          {profile?.isBusiness && (
            <>
              <h3 style={{ margin: '24px 0 12px', fontSize: '1.1rem', color: '#fff' }}>
                Business Services & Offerings
              </h3>
              <div className="business-services-list" style={{ padding: '12px 16px' }}>
                {(profile?.businessServices || 'Web Development, Mobile Applications, Cloud Solutions')
                  .split(',')
                  .map((service, idx) => (
                    <div key={idx} style={{ fontSize: '0.9rem', margin: '4px 0' }}>
                      <i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '8px' }}></i>
                      {service.trim()}
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: Visual Analytics Dashboard */}
      {activeTab === 'analytics' && (
        <>
          {/* Personal Profile Analytics */}
          <div className="analytics-card">
            <div className="analytics-header">
              <div>
                <h2>Profile Analytics</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                  Past 7 days performance and audience engagement
                </p>
              </div>
              <span className="analytics-badge">
                <i className="fa-solid fa-arrow-trend-up"></i> +14.2% this week
              </span>
            </div>

            <div className="analytics-metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Profile Views</div>
                <div className="metric-value-row">
                  <span className="metric-value">{profile?.profileViews || 1284}</span>
                  <span className="metric-trend">
                    <i className="fa-solid fa-arrow-up"></i> 18%
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Post Impressions</div>
                <div className="metric-value-row">
                  <span className="metric-value">{profile?.postImpressions || 8421}</span>
                  <span className="metric-trend">
                    <i className="fa-solid fa-arrow-up"></i> 24%
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">New Followers / Network</div>
                <div className="metric-value-row">
                  <span className="metric-value">{profile?.followersCount || 83}</span>
                  <span className="metric-trend">
                    <i className="fa-solid fa-arrow-up"></i> +8
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Post Interactions</div>
                <div className="metric-value-row">
                  <span className="metric-value">421</span>
                  <span className="metric-trend">
                    <i className="fa-solid fa-arrow-up"></i> 32%
                  </span>
                </div>
              </div>
            </div>

            {/* Visual 7-day Bar Graph */}
            <div className="chart-container">
              <div className="chart-title">
                <i className="fa-solid fa-chart-column" style={{ color: '#10b981', marginRight: '6px' }}></i>
                Profile Views Over Time
              </div>
              <div className="chart-bars-wrap">
                {weeklyViews.map((views, index) => {
                  const heightPct = Math.max(15, Math.round((views / maxView) * 100));
                  return (
                    <div key={index} className="chart-col">
                      <div
                        className="chart-bar"
                        style={{ height: `${heightPct}%` }}
                        data-val={`${views} views`}
                      />
                      <span className="chart-day">{days[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Business Campaign Analytics */}
          {profile?.isBusiness && (
            <div className="analytics-card" style={{ borderTop: '3px solid #3b82f6' }}>
              <div className="analytics-header">
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-bullhorn" style={{ color: '#3b82f6' }}></i>
                    Campaign & Business Analytics
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                    Commercial lead generation and customer conversion
                  </p>
                </div>
              </div>

              <div className="analytics-metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Total Reach</div>
                  <div className="metric-value">18,421</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Ad / Post Impressions</div>
                  <div className="metric-value">25,891</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Profile Visits</div>
                  <div className="metric-value">1,284</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Website Clicks</div>
                  <div className="metric-value">342</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Direct Inquiries</div>
                  <div className="metric-value">128</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Edit Professional Profile</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Professional Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer | React & Spring Boot"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GioTech Solutions"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Barcelona, Spain"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Java, Spring Boot, WebRTC, Figma"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Portfolio / GitHub Link
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username or portfolio link"
                  value={editPortfolioUrl}
                  onChange={(e) => setEditPortfolioUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Bio / About
                </label>
                <textarea
                  rows={3}
                  placeholder="Write a brief professional summary..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="businessCheck"
                  checked={editIsBusiness}
                  onChange={(e) => setEditIsBusiness(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                />
                <label htmlFor="businessCheck" style={{ fontSize: '0.9rem', color: '#fff', cursor: 'pointer' }}>
                  Enable Business / Company Account
                </label>
              </div>

              {editIsBusiness && (
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Services Offered (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Web Development, Mobile Applications, Cloud Solutions"
                    value={editBusinessServices}
                    onChange={(e) => setEditBusinessServices(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    background: 'var(--primary-color, #10b981)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px 22px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
