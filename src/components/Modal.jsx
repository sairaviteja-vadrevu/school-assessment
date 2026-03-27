import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeButton = true,
  closeOnEscape = true,
  closeOnOverlay = true,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease-in-out',
  };

  const sizes = {
    sm: '400px',
    md: '600px',
    lg: '800px',
  };

  const modalStyles = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    maxWidth: sizes[size],
    width: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideUp 0.3s ease-out',
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px',
    borderBottom: '1px solid var(--color-border)',
  };

  const titleStyles = {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--color-text)',
  };

  const contentStyles = {
    padding: '24px',
    overflow: 'auto',
    flex: 1,
  };

  const footerStyles = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    padding: '24px',
    borderTop: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-background)',
  };

  const closeButtonStyles = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-light)',
    transition: 'var(--transition-fast)',
    padding: '4px',
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div
        style={overlayStyles}
        onClick={(e) => {
          if (closeOnOverlay && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div style={modalStyles}>
          {(title || closeButton) && (
            <div style={headerStyles}>
              <h2 style={titleStyles}>{title}</h2>
              {closeButton && (
                <button
                  onClick={onClose}
                  style={closeButtonStyles}
                  aria-label="Close modal"
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--color-text)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--color-text-light)';
                  }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}
          <div style={contentStyles}>{children}</div>
          {footer && <div style={footerStyles}>{footer}</div>}
        </div>
      </div>
    </>
  );
};

export default Modal;
