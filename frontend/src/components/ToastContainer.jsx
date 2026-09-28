import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { togglePostLike } from '../api/postApi';

export default function ToastContainer() {
  const { toasts, removeToast, handleConfirmAction } = useToast();
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState({});
  const [likingMap, setLikingMap] = useState({});

  if (!toasts || toasts.length === 0) return null;

  const handleQuickLike = async (e, toast) => {
    e.stopPropagation();
    const postId = toast.post?.id || toast.postId;
    if (!postId || likingMap[postId]) return;

    setLikingMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await togglePostLike(postId, 'LIKE');
      setLikedPosts((prev) => ({
        ...prev,
        [postId]: res?.isLikedByMe ?? !prev[postId],
      }));
    } catch (err) {
      console.error('Failed to quick like post:', err);
    } finally {
      setLikingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleViewPost = (toast) => {
    removeToast(toast.id);
    navigate('/feed');
  };

  const handleQuickComment = (e, toast) => {
    e.stopPropagation();
    removeToast(toast.id);
    navigate('/feed', { state: { openCommentPostId: toast.post?.id || toast.postId } });
  };

  return (
    <div style={containerStyle} aria-live="polite">
      {toasts.map((item) => {
        const isPost = item.type === 'post';
        const isSocial = item.type === 'post' || item.type === 'like' || item.type === 'comment';
        const isConfirm = item.type === 'confirm';
        const postId = item.post?.id || item.postId;
        const isLiked = likedPosts[postId] || item.post?.isLikedByMe;

        return (
          <div
            key={item.id}
            style={{
              ...toastBaseStyle,
              ...(item.type === 'delete' ? deleteToastStyle : {}),
              ...(item.type === 'block' ? blockToastStyle : {}),
              ...(item.type === 'success' ? successToastStyle : {}),
              ...(isSocial ? socialToastStyle : {}),
              ...(isConfirm ? confirmToastStyle : {}),
            }}
            className="gio-toast-item"
            role="alert"
          >
            {/* Top row: Icon/Avatar + Header Info + Close */}
            <div style={toastHeaderRowStyle}>
              <div style={toastLeftInfoStyle}>
                {isSocial && (item.author?.avatarUrl || item.post?.author?.avatarUrl) ? (
                  <img
                    src={item.author?.avatarUrl || item.post?.author?.avatarUrl}
                    alt="Author avatar"
                    style={avatarStyle}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span style={iconBadgeStyle(item.type)}>
                    {item.icon || (item.type === 'delete' ? '🗑️' : item.type === 'block' ? '🔒' : item.type === 'success' ? '✅' : isConfirm ? '⚠️' : '✨')}
                  </span>
                )}
                <div>
                  <div style={titleStyle}>
                    {item.title || (isConfirm ? 'Confirmation Required' : item.type === 'delete' ? 'Item Deleted' : 'Notification')}
                  </div>
                  {isSocial && <div style={metaSubtextStyle}>Just now • GioFeed</div>}
                  {isConfirm && <div style={metaSubtextStyle}>Action cannot be undone</div>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => isConfirm ? handleConfirmAction(item.id, false) : removeToast(item.id)}
                style={closeBtnStyle}
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>

            {/* Message / Snippet Preview */}
            {(item.message || item.snippet) && (
              <div style={messageStyle}>
                {item.message || item.snippet}
              </div>
            )}

            {/* Interactive Confirm Action Buttons */}
            {isConfirm && (
              <div style={confirmButtonsRowStyle}>
                <button
                  type="button"
                  onClick={() => handleConfirmAction(item.id, false)}
                  style={cancelConfirmBtnStyle}
                >
                  {item.cancelText || 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmAction(item.id, true)}
                  style={{
                    ...confirmActionButtonStyle,
                    backgroundColor: item.danger ? '#ef4444' : 'var(--primary, #10b981)',
                    boxShadow: item.danger ? '0 4px 14px rgba(239, 68, 68, 0.4)' : '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <span>{item.icon || (item.danger ? '🗑️' : '✓')}</span>
                  <span>{item.confirmText || 'Yes, Delete'}</span>
                </button>
              </div>
            )}

            {/* Interactive Actions for Post Popups */}
            {isPost && postId && (
              <div style={actionButtonsRowStyle}>
                <button
                  type="button"
                  onClick={(e) => handleQuickLike(e, item)}
                  style={{
                    ...quickActionBtnStyle,
                    color: isLiked ? '#ef4444' : 'inherit',
                    borderColor: isLiked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.15)',
                    backgroundColor: isLiked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <span style={{ transform: isLiked ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.2s' }}>
                    {isLiked ? '❤️' : '🤍'}
                  </span>
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleQuickComment(e, item)}
                  style={quickActionBtnStyle}
                >
                  <span>💬</span>
                  <span>Comment</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleViewPost(item)}
                  style={{
                    ...quickActionBtnStyle,
                    backgroundColor: 'var(--primary, #10b981)',
                    color: '#fff',
                    borderColor: 'transparent',
                    fontWeight: 600,
                  }}
                >
                  <span>👁️ View</span>
                </button>
              </div>
            )}

            {/* Custom Single Action (if provided) */}
            {item.actionText && item.onAction && (
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    item.onAction();
                    removeToast(item.id);
                  }}
                  style={{
                    ...quickActionBtnStyle,
                    backgroundColor: 'var(--primary, #10b981)',
                    color: '#fff',
                  }}
                >
                  {item.actionText}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Inline Styles for crisp layout & high-priority z-index
const containerStyle = {
  position: 'fixed',
  top: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 999999,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  width: '92%',
  maxWidth: '480px',
  pointerEvents: 'none',
};

const toastBaseStyle = {
  pointerEvents: 'auto',
  background: 'rgba(24, 26, 32, 0.94)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '16px',
  padding: '14px 18px',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)',
  color: '#f3f4f6',
  animation: 'gioToastSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
  transition: 'all 0.3s ease',
  fontSize: '13.5px',
};

const deleteToastStyle = {
  borderLeft: '4px solid #ef4444',
  background: 'rgba(28, 20, 22, 0.96)',
};

const blockToastStyle = {
  borderLeft: '4px solid #f59e0b',
  background: 'rgba(28, 24, 18, 0.96)',
};

const successToastStyle = {
  borderLeft: '4px solid #10b981',
  background: 'rgba(18, 28, 24, 0.96)',
};

const socialToastStyle = {
  borderLeft: '4px solid #3b82f6',
  background: 'rgba(20, 24, 34, 0.96)',
};

const confirmToastStyle = {
  borderLeft: '4px solid #ef4444',
  background: 'rgba(30, 20, 24, 0.97)',
  boxShadow: '0 20px 48px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(239, 68, 68, 0.25)',
};

const toastHeaderRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
};

const toastLeftInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flex: 1,
};

const avatarStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid rgba(255, 255, 255, 0.2)',
};

const iconBadgeStyle = (type) => ({
  fontSize: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '34px',
  height: '34px',
  borderRadius: '10px',
  background:
    type === 'delete' || type === 'confirm'
      ? 'rgba(239, 68, 68, 0.2)'
      : type === 'block'
      ? 'rgba(245, 158, 11, 0.2)'
      : type === 'success'
      ? 'rgba(16, 185, 129, 0.2)'
      : 'rgba(59, 130, 246, 0.2)',
});

const titleStyle = {
  fontWeight: 600,
  fontSize: '14.5px',
  color: '#ffffff',
  lineHeight: 1.25,
};

const metaSubtextStyle = {
  fontSize: '11px',
  color: '#9ca3af',
  marginTop: '2px',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#9ca3af',
  cursor: 'pointer',
  fontSize: '16px',
  padding: '4px 6px',
  borderRadius: '6px',
  lineHeight: 1,
};

const messageStyle = {
  marginTop: '8px',
  color: '#e5e7eb',
  fontSize: '13.5px',
  lineHeight: 1.45,
  wordBreak: 'break-word',
};

const confirmButtonsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '14px',
  paddingTop: '10px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
};

const cancelConfirmBtnStyle = {
  padding: '7px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  background: 'rgba(255, 255, 255, 0.08)',
  color: '#d1d5db',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const confirmActionButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 16px',
  borderRadius: '8px',
  border: 'none',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const actionButtonsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '10px',
  paddingTop: '8px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
};

const quickActionBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'rgba(255, 255, 255, 0.06)',
  color: '#f3f4f6',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
