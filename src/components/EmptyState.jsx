import React from 'react';
import Button from './Button';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel = 'Get Started',
  actionVariant = 'primary',
  className = '',
}) => {
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 32px',
    textAlign: 'center',
    minHeight: '400px',
    gap: '24px',
  };

  const iconWrapperStyles = {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-background)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-accent)',
  };

  const titleStyles = {
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--color-text)',
    margin: 0,
  };

  const descriptionStyles = {
    fontSize: '16px',
    color: 'var(--color-text-light)',
    maxWidth: '500px',
    margin: 0,
  };

  const actionContainerStyles = {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
  };

  return (
    <div style={containerStyles} className={className}>
      {Icon && (
        <div style={iconWrapperStyles}>
          <Icon size={48} />
        </div>
      )}
      {title && <h2 style={titleStyles}>{title}</h2>}
      {description && <p style={descriptionStyles}>{description}</p>}
      {action && (
        <div style={actionContainerStyles}>
          <Button variant={actionVariant} onClick={action}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
