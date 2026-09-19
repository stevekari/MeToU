import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function MediaLightbox({
  src,
  fileName,
  senderName,
  time,
  onClose,
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = (e) => {
    e?.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    setScale(1);
    setRotation(0);
  };

  const handleDoubleTap = (e) => {
    e.stopPropagation();
    setScale((prev) => (prev > 1 ? 1 : 2));
  };

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotate();
      } else if (e.key === '0') {
        handleReset();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="wa-media-viewer-overlay" onClick={handleClose} role="dialog" aria-modal="true">
      {/* Top Navigation Bar */}
      <div className="wa-media-viewer-header" onClick={(e) => e.stopPropagation()}>
        <div className="wa-media-sender-info">
          <button
            type="button"
            className="wa-media-btn wa-media-back-btn"
            onClick={handleClose}
            aria-label="Back"
            title="Back (Esc)"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div className="wa-media-title-group">
            <span className="wa-media-sender-name">{senderName || 'Photo'}</span>
            {time && <span className="wa-media-timestamp">{time}</span>}
          </div>
        </div>

        <div className="wa-media-actions">
          <button
            type="button"
            className="wa-media-btn"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            title="Zoom out (-)"
            aria-label="Zoom out"
          >
            <i className="fa-solid fa-magnifying-glass-minus"></i>
          </button>
          <button
            type="button"
            className="wa-media-btn"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            title="Zoom in (+)"
            aria-label="Zoom in"
          >
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </button>
          <button
            type="button"
            className="wa-media-btn"
            onClick={handleRotate}
            title="Rotate (R)"
            aria-label="Rotate"
          >
            <i className="fa-solid fa-rotate-right"></i>
          </button>
          <a
            href={src}
            download={fileName || 'photo'}
            target="_blank"
            rel="noreferrer"
            className="wa-media-btn"
            title="Download"
            aria-label="Download"
            onClick={(e) => e.stopPropagation()}
          >
            <i className="fa-solid fa-download"></i>
          </a>
          <button
            type="button"
            className="wa-media-btn wa-media-close-btn"
            onClick={handleClose}
            title="Close (Esc)"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      {/* Main Photo Canvas */}
      <div className="wa-media-viewer-body" onClick={handleClose}>
        <div
          className="wa-media-img-container"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleTap}
        >
          <img
            src={src}
            alt={fileName || 'Photo'}
            className="wa-media-img"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Info Bar (if fileName is meaningful) */}
      {fileName && (
        <div className="wa-media-viewer-footer" onClick={(e) => e.stopPropagation()}>
          <span className="wa-media-filename">{fileName}</span>
        </div>
      )}
    </div>,
    document.body
  );
}

