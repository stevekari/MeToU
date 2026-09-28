import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toastData) => {
    const id = ++toastIdCounter;
    const newToast = {
      id,
      type: toastData.type || 'info', // 'success' | 'error' | 'info' | 'delete' | 'post' | 'like' | 'comment'
      title: toastData.title,
      message: toastData.message || '',
      icon: toastData.icon,
      duration: toastData.duration !== undefined ? toastData.duration : 5000,
      post: toastData.post,
      author: toastData.author,
      snippet: toastData.snippet,
      onLike: toastData.onLike,
      onComment: toastData.onComment,
      onView: toastData.onView,
      actionText: toastData.actionText,
      onAction: toastData.onAction,
      createdAt: Date.now(),
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Show up to 5 toasts

    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    show: addToast,
    success: (message, title = 'Success') => addToast({ type: 'success', title, message, icon: '✅' }),
    error: (message, title = 'Error') => addToast({ type: 'error', title, message, icon: '⚠️' }),
    info: (message, title = 'Notification') => addToast({ type: 'info', title, message, icon: 'ℹ️' }),
    delete: (message, title = 'Deleted') => addToast({ type: 'delete', title, message, icon: '🗑️' }),
    block: (message, title = 'Blocked') => addToast({ type: 'block', title, message, icon: '🔒' }),
    unblock: (message, title = 'Unblocked') => addToast({ type: 'unblock', title, message, icon: '🔓' }),
    post: (options) => addToast({ type: 'post', duration: 7000, ...options }),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      toast: {
        show: () => {},
        success: (m) => console.log('Toast:', m),
        error: (m) => console.error('Toast Error:', m),
        info: (m) => console.log('Toast Info:', m),
        delete: (m) => console.log('Toast Delete:', m),
        block: (m) => console.log('Toast Block:', m),
        unblock: (m) => console.log('Toast Unblock:', m),
        post: () => {},
        remove: () => {},
      },
      toasts: [],
      removeToast: () => {},
    };
  }
  return ctx;
}
