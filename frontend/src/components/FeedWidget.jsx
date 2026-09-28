import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeedPosts, createPost, toggleLikePost, getPostComments, addPostComment } from '../api/postApi';
import { uploadMedia } from '../api/mediaApi';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { useToast } from '../contexts/ToastContext';
import '../styles/feed.css';

export default function FeedWidget({ user, compact = false }) {
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create post state
  const [postType, setPostType] = useState('STANDARD');
  const [content, setContent] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments state: { [postId]: { isOpen, list, input, loading } }
  const [commentsState, setCommentsState] = useState({});

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const data = await getFeedPosts();
      setPosts(data || []);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploadingImage(true);
      const res = await uploadMedia(file, 'image');
      setMediaUrl(res.url);
      toast.success('Image attached to post', 'Media Uploaded');
    } catch (err) {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl) return;

    try {
      setIsSubmitting(true);
      const newPost = await createPost({
        content: content.trim(),
        postType,
        mediaUrl: mediaUrl || null,
        mediaType: mediaUrl ? 'IMAGE' : null,
        projectTitle: projectTitle.trim() || null,
        projectUrl: projectUrl.trim() || null,
        jobTitle: jobTitle.trim() || null,
        jobCompany: jobCompany.trim() || null,
      });

      setPosts([newPost, ...posts]);
      setContent('');
      setMediaUrl('');
      setProjectTitle('');
      setProjectUrl('');
      setJobTitle('');
      setJobCompany('');
      setPostType('STANDARD');
      toast.success('Your post is now visible on the feed!', 'Post Published');
    } catch (err) {
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  const toggleCommentsDrawer = async (postId) => {
    if (commentsState[postId]?.isOpen) {
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], isOpen: false },
      }));
      return;
    }

    setCommentsState((prev) => ({
      ...prev,
      [postId]: { ...prev[postId], isOpen: true, loading: true, list: prev[postId]?.list || [] },
    }));

    try {
      const comments = await getPostComments(postId);
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], isOpen: true, loading: false, list: comments || [] },
      }));
    } catch (err) {
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], isOpen: true, loading: false },
      }));
    }
  };

  const handleAddComment = async (postId) => {
    const inputVal = commentsState[postId]?.input || '';
    if (!inputVal.trim()) return;

    try {
      const newComment = await addPostComment(postId, inputVal.trim());
      setCommentsState((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          input: '',
          list: [...(prev[postId]?.list || []), newComment],
        },
      }));
      setPosts(posts.map((p) => (p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p)));
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  const currentAvatar = resolveAvatarUrl(user?.avatarUrl, user?.displayName || user?.username);

  return (
    <div className={`feed-widget-wrap ${compact ? 'compact' : ''}`} style={{ width: '100%', maxWidth: '720px', margin: '0 auto' }}>
      {/* Create Post Card */}
      <div className="create-post-card" style={{ marginBottom: '16px' }}>
        <div className="create-post-header">
          <img className="create-post-avatar" src={currentAvatar} alt="You" />
          <textarea
            className="create-post-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === 'PROJECT'
                ? '🚀 Share details about your new project or repo...'
                : postType === 'JOB'
                ? '💼 Describe the job opportunity or role...'
                : postType === 'EVENT'
                ? '🎉 Share an upcoming tech event or meetup...'
                : 'Share an update, post, or idea with friends...'
            }
            rows={content ? 3 : 2}
          />
        </div>

        {/* Post Type Selector Pills */}
        <div className="post-type-tabs">
          <button
            type="button"
            className={`post-type-pill ${postType === 'STANDARD' ? 'active' : ''}`}
            onClick={() => setPostType('STANDARD')}
          >
            <i className="fa-solid fa-pen-nib"></i> Post
          </button>
          <button
            type="button"
            className={`post-type-pill ${postType === 'PROJECT' ? 'active' : ''}`}
            onClick={() => setPostType('PROJECT')}
          >
            <i className="fa-solid fa-code"></i> Project
          </button>
          <button
            type="button"
            className={`post-type-pill ${postType === 'JOB' ? 'active' : ''}`}
            onClick={() => setPostType('JOB')}
          >
            <i className="fa-solid fa-briefcase"></i> Job
          </button>
          <button
            type="button"
            className={`post-type-pill ${postType === 'EVENT' ? 'active' : ''}`}
            onClick={() => setPostType('EVENT')}
          >
            <i className="fa-solid fa-calendar-check"></i> Event
          </button>
        </div>

        {/* Type-specific metadata fields */}
        {postType === 'PROJECT' && (
          <div className="create-post-meta-fields">
            <input
              type="text"
              placeholder="Project Title (e.g. GioChat React 18)"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
            <input
              type="url"
              placeholder="Project Link (GitHub / Demo URL)"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
            />
          </div>
        )}

        {postType === 'JOB' && (
          <div className="create-post-meta-fields">
            <input
              type="text"
              placeholder="Job Role (e.g. Senior Java Developer)"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Company / Location (e.g. TechCorp, Remote)"
              value={jobCompany}
              onChange={(e) => setJobCompany(e.target.value)}
            />
          </div>
        )}

        {/* Image preview */}
        {mediaUrl && (
          <div className="create-post-image-preview">
            <img src={mediaUrl} alt="Attachment" />
            <button type="button" className="remove-image-btn" onClick={() => setMediaUrl('')}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        <div className="create-post-footer">
          <div className="attach-actions">
            <label className="attach-btn" title="Add Image">
              <i className="fa-solid fa-image" style={{ color: '#10b981' }}></i> Photo
              <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
            {uploadingImage && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Uploading...</span>}
          </div>

          <button
            type="button"
            className="btn-post-publish"
            onClick={handleCreatePost}
            disabled={(!content.trim() && !mediaUrl) || isSubmitting || uploadingImage}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Post List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
          <p style={{ marginTop: '10px' }}>Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="feed-post-card" style={{ textAlign: 'center', padding: '30px' }}>
          <i className="fa-solid fa-newspaper fa-2x" style={{ color: '#64748b', marginBottom: '10px' }}></i>
          <h4 style={{ margin: '0 0 6px' }}>No posts yet</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            Share a post or project with your friends!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {posts.map((post) => {
            const authorAvatar = resolveAvatarUrl(post.authorAvatarUrl, post.authorDisplayName || post.authorUsername);
            const commentsInfo = commentsState[post.id] || { isOpen: false, list: [], input: '', loading: false };

            return (
              <article key={post.id} className="feed-post-card">
                {/* Author Info */}
                <div className="post-header">
                  <Link to={`/profile/${post.authorId}`} className="post-author-wrap">
                    <img className="post-author-avatar" src={authorAvatar} alt={post.authorDisplayName || post.authorUsername} />
                    <div className="post-author-info">
                      <div className="post-author-name-row">
                        <span className="post-author-name">{post.authorDisplayName || post.authorUsername}</span>
                        {post.authorIsBusiness && <span className="post-badge-business">Business</span>}
                        {post.postType && post.postType !== 'STANDARD' && (
                          <span className={`post-type-tag post-type-${post.postType}`}>{post.postType}</span>
                        )}
                      </div>
                      <span className="post-author-headline">
                        {post.authorHeadline || 'GioChat Member'}
                      </span>
                      <span className="post-time">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Content */}
                <div className="post-content">{post.content}</div>

                {/* Embedded Project / Job box */}
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

                {post.jobTitle && (
                  <div className="post-embed-box">
                    <div className="embed-row">
                      <i className="fa-solid fa-briefcase" style={{ color: '#f59e0b' }}></i>
                      <strong>{post.jobTitle}</strong>
                    </div>
                    {post.jobCompany && (
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        <i className="fa-solid fa-building"></i> {post.jobCompany}
                      </div>
                    )}
                  </div>
                )}

                {/* Media Image */}
                {post.mediaUrl && (
                  <div className="post-media-container">
                    <img src={post.mediaUrl} alt="Attachment" />
                  </div>
                )}

                {/* Stats row */}
                <div className="post-stats-row">
                  <span>
                    <i className="fa-solid fa-thumbs-up" style={{ color: '#10b981', marginRight: '4px' }}></i>
                    {post.likesCount || 0} reactions
                  </span>
                  <span>{post.commentsCount || 0} comments</span>
                </div>

                {/* Action Bar */}
                <div className="post-actions-bar">
                  <button
                    type="button"
                    className={`post-action-btn ${post.isLikedByCurrentUser ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    <i className={`fa-${post.isLikedByCurrentUser ? 'solid' : 'regular'} fa-thumbs-up`}></i>
                    <span>Like</span>
                  </button>

                  <button
                    type="button"
                    className="post-action-btn"
                    onClick={() => toggleCommentsDrawer(post.id)}
                  >
                    <i className="fa-regular fa-comment"></i>
                    <span>Comment</span>
                  </button>

                  <button
                    type="button"
                    className="post-action-btn"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(`${window.location.origin}/profile/${post.authorId}`);
                        alert('Link copied to clipboard!');
                      }
                    }}
                  >
                    <i className="fa-solid fa-share-nodes"></i>
                    <span>Share</span>
                  </button>
                </div>

                {/* Comments Drawer */}
                {commentsInfo.isOpen && (
                  <div className="post-comments-drawer">
                    <div className="comment-input-row">
                      <img className="comment-input-avatar" src={currentAvatar} alt="You" />
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Write a comment..."
                        value={commentsInfo.input || ''}
                        onChange={(e) =>
                          setCommentsState((prev) => ({
                            ...prev,
                            [post.id]: { ...prev[post.id], input: e.target.value },
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                      />
                      <button
                        type="button"
                        className="comment-submit-btn"
                        onClick={() => handleAddComment(post.id)}
                      >
                        <i className="fa-solid fa-paper-plane" style={{ fontSize: '0.8rem' }}></i>
                      </button>
                    </div>

                    {commentsInfo.loading ? (
                      <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.85rem', color: '#94a3b8' }}>
                        Loading comments...
                      </div>
                    ) : (
                      <div className="comments-list">
                        {commentsInfo.list?.map((comment) => (
                          <div key={comment.id} className="comment-bubble">
                            <img
                              className="comment-bubble-avatar"
                              src={resolveAvatarUrl(comment.authorAvatarUrl, comment.authorDisplayName || comment.authorUsername)}
                              alt={comment.authorDisplayName || comment.authorUsername}
                            />
                            <div>
                              <div className="comment-bubble-author">
                                {comment.authorDisplayName || comment.authorUsername}
                              </div>
                              <div className="comment-bubble-text">{comment.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
