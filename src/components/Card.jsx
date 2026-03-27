import React from 'react';

const Card = ({
  children,
  header,
  icon: Icon,
  badge,
  hoverable = false,
  onClick,
  className = '',
  style = {},
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const cardStyles = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--color-border)',
    padding: '24px',
    transition: 'var(--transition)',
    boxShadow: isHovered && hoverable ? 'var(--shadow-md)' : 'var(--shadow-card)',
    cursor: hoverable && onClick ? 'pointer' : 'default',
    transform: isHovered && hoverable ? 'translateY(-2px)' : 'translateY(0)',
    ...style,
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--color-border)',
  };

  const iconStyles = {
    color: 'var(--color-accent)',
    flexShrink: 0,
  };

  const titleStyles = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--color-text)',
    flex: 1,
  };

  const badgeStyles = {
    fontSize: '12px',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: 'var(--color-accent)',
    color: 'white',
  };

  return (
    <div
      style={cardStyles}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      {...(hoverable && onClick && { role: 'button', tabIndex: 0 })}
    >
      {header && (
        <div style={headerStyles}>
          {Icon && <Icon size={24} style={iconStyles} />}
          <h3 style={titleStyles}>{header}</h3>
          {badge && <span style={badgeStyles}>{badge}</span>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
