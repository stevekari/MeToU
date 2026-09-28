import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNetworkSuggestions, getMyConnections, toggleConnectUser, getBusinesses, getJobs } from '../api/networkApi';
import { createPost } from '../api/postApi';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { useToast } from '../contexts/ToastContext';
import '../styles/network.css';

export default function Network({ currentUserId }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('suggestions'); // suggestions | connections | jobs | businesses
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [suggestions, setSuggestions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectedMap, setConnectedMap] = useState({});
  const [appliedJobsMap, setAppliedJobsMap] = useState({});
  const [savedJobsMap, setSavedJobsMap] = useState({});

  // Post a Job modal state
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [jobCompanyInput, setJobCompanyInput] = useState('');
  const [jobLocationInput, setJobLocationInput] = useState('');
  const [jobSalaryInput, setJobSalaryInput] = useState('');
  const [jobTypeInput, setJobTypeInput] = useState('Full-time');
  const [jobSkillsInput, setJobSkillsInput] = useState('');
  const [jobDescInput, setJobDescInput] = useState('');
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sugData, connData, bizData, jobData] = await Promise.all([
        getNetworkSuggestions().catch(() => []),
        getMyConnections().catch(() => []),
        getBusinesses().catch(() => []),
        getJobs().catch(() => []),
      ]);
      setSuggestions(sugData || []);
      setConnections(connData || []);
      setBusinesses(bizData || []);
      setJobs(jobData || []);

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
      if (!isCurrentlyConnected) {
        toast.success('Connection request sent!', 'Network Updated');
      } else {
        toast.info('Disconnected from user', 'Network Updated');
      }
    } catch (err) {
      toast.error('Failed to update connection');
    }
  };

  const handleEasyApply = (job) => {
    setAppliedJobsMap((prev) => ({ ...prev, [job.id]: true }));
    toast.success(
      `Your GioChat profile has been submitted to ${job.company || 'the hiring team'} for ${job.title}!`,
      'Application Submitted 🚀'
    );
  };

  const handleToggleSaveJob = (jobId) => {
    const isSaved = !!savedJobsMap[jobId];
    setSavedJobsMap((prev) => ({ ...prev, [jobId]: !isSaved }));
    if (!isSaved) {
      toast.success('Job saved to your list', 'Saved');
    } else {
      toast.info('Job removed from saved list');
    }
  };

  const handleCreateJobPost = async (e) => {
    e.preventDefault();
    if (!jobTitleInput.trim() || !jobDescInput.trim()) {
      toast.error('Please enter a job title and description');
      return;
    }

    try {
      setIsSubmittingJob(true);
      const postPayload = {
        content: `💼 Hiring: ${jobTitleInput.trim()} at ${jobCompanyInput.trim() || 'Our Company'}\n\n${jobDescInput.trim()}\n\nLocation: ${jobLocationInput.trim() || 'Remote'}\nSalary: ${jobSalaryInput.trim() || 'Competitive'}\nSkills: ${jobSkillsInput.trim() || 'Tech'}`,
        postType: 'JOB',
        jobTitle: jobTitleInput.trim(),
        jobCompany: jobCompanyInput.trim(),
        jobLocation: jobLocationInput.trim(),
      };

      await createPost(postPayload);
      toast.success('Job opening posted to GioChat Network & Feed!', 'Job Opportunity Live 💼');
      setIsPostJobModalOpen(false);

      // Reset fields
      setJobTitleInput('');
      setJobCompanyInput('');
      setJobLocationInput('');
      setJobSalaryInput('');
      setJobSkillsInput('');
      setJobDescInput('');

      // Reload jobs
      const freshJobs = await getJobs();
      setJobs(freshJobs || []);
      setActiveTab('jobs');
    } catch (err) {
      toast.error('Failed to post job. Please try again.');
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const roles = [
    { label: 'All', value: 'ALL' },
    { label: 'Developers', value: 'DEVELOPER' },
    { label: 'Designers', value: 'DESIGNER' },
    { label: 'Java / Backend', value: 'JAVA' },
    { label: '💼 Jobs & Hiring', value: 'JOBS' },
    { label: 'Businesses', value: 'BUSINESS' },
  ];

  const filterPeople = (list) => {
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
      } else if (roleFilter === 'JOBS') {
        return false;
      }

      return matchesQuery && matchesRole;
    });
  };

  const filterJobs = (jobList) => {
    return jobList.filter((j) => {
      const title = String(j.title || '').toLowerCase();
      const comp = String(j.company || '').toLowerCase();
      const loc = String(j.location || '').toLowerCase();
      const desc = String(j.description || '').toLowerCase();
      const sk = String(j.skills || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesQuery = !query || title.includes(query) || comp.includes(query) || loc.includes(query) || desc.includes(query) || sk.includes(query);

      let matchesRole = true;
      if (roleFilter === 'DEVELOPER') {
        matchesRole = title.includes('dev') || title.includes('react') || sk.includes('react') || sk.includes('code') || sk.includes('frontend') || sk.includes('backend');
      } else if (roleFilter === 'DESIGNER') {
        matchesRole = title.includes('design') || title.includes('ui') || title.includes('ux') || sk.includes('figma');
      } else if (roleFilter === 'JAVA') {
        matchesRole = title.includes('java') || sk.includes('java') || sk.includes('spring');
      }

      return matchesQuery && matchesRole;
    });
  };

  return (
    <div className="network-container">
      {/* Hero Section */}
      <section className="network-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1>Grow your professional network</h1>
            <p>Connect with developers, designers, product creators, innovative businesses, and career opportunities on GioChat.</p>
          </div>
          <button
            type="button"
            className="btn-easy-apply"
            onClick={() => setIsPostJobModalOpen(true)}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
          >
            <i className="fa-solid fa-plus"></i> Post a Job
          </button>
        </div>

        <div className="network-filter-bar">
          <input
            type="text"
            className="network-search-input"
            placeholder="🔍 Search by name, title, skill (e.g. React, Java, UI/UX, Remote)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`post-type-pill ${roleFilter === r.value ? 'active' : ''}`}
                onClick={() => {
                  setRoleFilter(r.value);
                  if (r.value === 'JOBS') {
                    setActiveTab('jobs');
                  }
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="network-tabs" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
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
          className={`network-tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <i className="fa-solid fa-briefcase"></i> Job Center & Opportunities ({jobs.length})
        </button>
        <button
          type="button"
          className={`network-tab-btn ${activeTab === 'businesses' ? 'active' : ''}`}
          onClick={() => setActiveTab('businesses')}
        >
          <i className="fa-solid fa-building"></i> Businesses ({businesses.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
          <p style={{ marginTop: '12px' }}>Finding network connections & opportunities...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: People you may know */}
          {activeTab === 'suggestions' && (
            <div className="network-grid">
              {filterPeople(suggestions).length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <i className="fa-solid fa-user-group fa-3x" style={{ marginBottom: '12px' }}></i>
                  <h3>No suggestions match your filter</h3>
                  <p>Try searching for a different skill or role in the search bar above.</p>
                </div>
              ) : (
                filterPeople(suggestions).map((item) => {
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
              {filterPeople(connections).length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <i className="fa-solid fa-user-check fa-3x" style={{ marginBottom: '12px' }}></i>
                  <h3>No connections yet</h3>
                  <p>Explore "People you may know" and click Connect to build your circle.</p>
                </div>
              ) : (
                filterPeople(connections).map((item) => {
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

          {/* TAB 3: Job Center & Opportunities */}
          {activeTab === 'jobs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filterJobs(jobs).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-card, #1e2430)', borderRadius: '16px', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' }}>
                  <i className="fa-solid fa-briefcase fa-3x" style={{ color: '#10b981', marginBottom: '14px' }}></i>
                  <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '6px' }}>No Job Openings Match Your Search</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 16px' }}>
                    Try searching for skills like <strong>React, Java, UI/UX, Flutter, Fullstack</strong> or post a new job opening for the GioChat community!
                  </p>
                  <button
                    type="button"
                    className="btn-easy-apply"
                    onClick={() => setIsPostJobModalOpen(true)}
                  >
                    <i className="fa-solid fa-plus"></i> Post a Job Opening
                  </button>
                </div>
              ) : (
                filterJobs(jobs).map((job) => {
                  const isApplied = !!appliedJobsMap[job.id];
                  const isSaved = !!savedJobsMap[job.id];
                  const skills = (job.skills || 'React, Java, Web')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);

                  return (
                    <div key={job.id} className="job-card">
                      {/* Job Header */}
                      <div className="job-header-row">
                        <div className="job-title-group">
                          <div className="job-title">
                            {job.title}
                            <span className="job-badge-hiring">Hiring Now</span>
                          </div>
                          <div className="job-company-row">
                            <i className="fa-solid fa-building"></i>
                            <span>{job.company || 'GioTech Partner'}</span>
                            <span style={{ color: '#64748b' }}>•</span>
                            <span style={{ color: '#94a3b8', fontWeight: 400 }}>{job.location || 'Remote'}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`btn-job-icon ${isSaved ? 'saved' : ''}`}
                          onClick={() => handleToggleSaveJob(job.id)}
                          title={isSaved ? 'Saved' : 'Save Job'}
                        >
                          <i className={`fa-${isSaved ? 'solid' : 'regular'} fa-bookmark`}></i>
                        </button>
                      </div>

                      {/* Chips / Salary / Type */}
                      <div className="job-meta-chips">
                        <span className="job-chip salary">
                          <i className="fa-solid fa-money-bill-wave"></i> {job.salary || '$90,000 - $130,000 / yr'}
                        </span>
                        <span className="job-chip">
                          <i className="fa-solid fa-clock"></i> {job.type || 'Full-time'}
                        </span>
                        <span className="job-chip">
                          <i className="fa-solid fa-users"></i> {job.applicantsCount || 14} applicants
                        </span>
                      </div>

                      {/* Description snippet */}
                      <div className="job-description">
                        {job.description}
                      </div>

                      {/* Required skills */}
                      <div className="job-skills-list">
                        {skills.map((skill, idx) => (
                          <span key={idx} className="job-skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Footer Actions */}
                      <div className="job-footer-actions">
                        <span className="job-posted-time">
                          <i className="fa-regular fa-clock"></i> {job.timeAgo || 'Recently posted'}
                        </span>

                        <div className="job-btn-group">
                          <button
                            type="button"
                            className="btn-job-icon"
                            onClick={() => navigate('/friends')}
                            title="Message Hiring Team"
                          >
                            <i className="fa-solid fa-comment-dots"></i> Message Recruiter
                          </button>

                          <button
                            type="button"
                            className={`btn-easy-apply ${isApplied ? 'applied' : ''}`}
                            onClick={() => !isApplied && handleEasyApply(job)}
                          >
                            <i className={`fa-solid ${isApplied ? 'fa-circle-check' : 'fa-bolt'}`}></i>
                            {isApplied ? 'Applied' : '⚡ Easy Apply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: Businesses & Directory */}
          {activeTab === 'businesses' && (
            <div className="network-grid">
              {filterPeople(businesses).length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <i className="fa-solid fa-building fa-3x" style={{ marginBottom: '12px' }}></i>
                  <h3>No business profiles found</h3>
                  <p>You can turn your profile into a Business profile in Profile Settings.</p>
                </div>
              ) : (
                filterPeople(businesses).map((item) => {
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

      {/* Post a Job Modal */}
      {isPostJobModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setIsPostJobModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #1e2430)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              color: '#fff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                💼 Post a Job Opening
              </h2>
              <button
                type="button"
                onClick={() => setIsPostJobModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJobPost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior React Developer, UI/UX Designer..."
                  value={jobTitleInput}
                  onChange={(e) => setJobTitleInput(e.target.value)}
                  style={modalInputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Company</label>
                  <input
                    type="text"
                    placeholder="e.g. GioTech Solutions"
                    value={jobCompanyInput}
                    onChange={(e) => setJobCompanyInput(e.target.value)}
                    style={modalInputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, Barcelona, Madrid..."
                    value={jobLocationInput}
                    onChange={(e) => setJobLocationInput(e.target.value)}
                    style={modalInputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Salary / Rate</label>
                  <input
                    type="text"
                    placeholder="e.g. $90k - $120k / yr"
                    value={jobSalaryInput}
                    onChange={(e) => setJobSalaryInput(e.target.value)}
                    style={modalInputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Employment Type</label>
                  <select
                    value={jobTypeInput}
                    onChange={(e) => setJobTypeInput(e.target.value)}
                    style={modalInputStyle}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract / Freelance</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Required Skills (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, TypeScript, Node.js, Java"
                  value={jobSkillsInput}
                  onChange={(e) => setJobSkillsInput(e.target.value)}
                  style={modalInputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Job Description & Responsibilities *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the role, responsibilities, and how candidates can apply..."
                  value={jobDescInput}
                  onChange={(e) => setJobDescInput(e.target.value)}
                  style={{ ...modalInputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsPostJobModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJob}
                  className="btn-easy-apply"
                >
                  {isSubmittingJob ? 'Publishing...' : 'Publish Job Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const modalInputStyle = {
  width: '100%',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#ffffff',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};
