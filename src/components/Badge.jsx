import React from 'react';

const Badge = ({ children, variant = 'neutral', className = '', style = {} }) => {
  const variantStyles = {
    success: {
      backgroundColor: '#ECFDF5',
      color: '#059669',
      borderColor: '#D1FAE5',
    },
    warning: {
      backgroundColor: '#FFFBEB',
      color: '#D97706',
      borderColor: '#FDE68A',
    },
    danger: {
      backgroundColor: '#FEF2F2',
      color: '#DC2626',
      borderColor: '#FECACA',
    },
    info: {
      backgroundColor: '#EFF6FF',
      color: '#3B82F6',
      borderColor: '#BFDBFE',
    },
    neutral: {
      backgroundColor: '#F3F4F6',
      color: '#6B7280',
      borderColor: '#E5E7EB',
    },
    dark: {
      backgroundColor: '#1A1A2E',
      color: 'white',
      borderColor: '#1A1A2E',
    },
  };

  const badgeStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid',
    transition: 'var(--transition-fast)',
    whiteSpace: 'nowrap',
    ...variantStyles[variant],
    ...style,
  };

  return (
    <span style={badgeStyles} className={className}>
      {children}
    </span>
  );
};

export default Badge;
