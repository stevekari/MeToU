import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const confirmResolversRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    // If it was a confirmation waiting for response, resolve false on dismiss
    if (confirmResolversRef.current.has(id)) {
      const resolve = confirmResolversRef.current.get(id);
      confirmResolversRef.current.delete(id);
      resolve(false);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toastData) => {
    const id = ++toastIdCounter;
    const isConfirm = toastData.type === 'confirm';
    const duration = isConfirm ? 0 : (toastData.duration !== undefined ? toastData.duration : 5000);

    const newToast = {
      id,
      type: toastData.type || 'info', // 'success' | 'error' | 'info' | 'delete' | 'block' | 'unblock' | 'post' | 'confirm'
      title: toastData.title,
      message: toastData.message || '',
      icon: toastData.icon,
      duration,
      post: toastData.post,
      author: toastData.author,
      snippet: toastData.snippet,
      onLike: toastData.onLike,
      onComment: toastData.onComment,
      onView: toastData.onView,
      actionText: toastData.actionText,
      onAction: toastData.onAction,
      confirmText: toastData.confirmText || 'Confirm',
      cancelText: toastData.cancelText || 'Cancel',
      danger: toastData.danger !== false,
      createdAt: Date.now(),
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const askConfirm = useCallback(({ title, message, icon = '❓', confirmText = 'Confirm', cancelText = 'Cancel', danger = true }) => {
    return new Promise((resolve) => {
      const id = addToast({
        type: 'confirm',
        title: title || 'Are you sure?',
        message,
        icon,
        confirmText,
        cancelText,
        danger,
        duration: 0,
      });

      confirmResolversRef.current.set(id, resolve);
    });
  }, [addToast]);

  const handleConfirmAction = useCallback((id, result) => {
    if (confirmResolversRef.current.has(id)) {
      const resolve = confirmResolversRef.current.get(id);
      confirmResolversRef.current.delete(id);
      resolve(result);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    show: addToast,
    success: (message, title = 'Success') => addToast({ type: 'success', title, message, icon: '✅' }),
    error: (message, title = 'Error') => addToast({ type: 'error', title, message, icon: '⚠️' }),
    info: (message, title = 'Notification') => addToast({ type: 'info', title, message, icon: 'ℹ️' }),
    delete: (message, title = 'Deleted') => addToast({ type: 'delete', title, message, icon: '🗑️' }),
    block: (message, title = 'Blocked') => addToast({ type: 'block', title, message, icon: '🔒' }),
    unblock: (message, title = 'Unblocked') => addToast({ type: 'unblock', title, message, icon: '🔓' }),
    post: (options) => addToast({ type: 'post', duration: 7000, ...options }),
    confirm: askConfirm,
    askConfirm,
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast, handleConfirmAction }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
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
        confirm: () => Promise.resolve(window.confirm('Are you sure?')),
        askConfirm: () => Promise.resolve(window.confirm('Are you sure?')),
        remove: () => {},
      },
      toasts: [],
      removeToast: () => {},
      handleConfirmAction: () => {},
    };
  }
  return ctx;
}
