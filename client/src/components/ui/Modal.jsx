import { useEffect } from 'react';

export default function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div className="ui-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="ui-modal-header">
          <h2>{title}</h2>
          <button type="button" className="ui-modal-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
