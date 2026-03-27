import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  trendLabel,
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
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'var(--transition)',
    cursor: onClick ? 'pointer' : 'default',
    boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-card)',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    ...style,
  };

  const labelStyles = {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    margin: 0,
    fontWeight: 500,
  };

  const valueStyles = {
    fontSize: '32px',
    fontWeight: 800,
    color: 'var(--color-text)',
    margin: '4px 0 0 0',
  };

  const trendContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  };

  const trendBadgeStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: trend === 'up' ? 'var(--color-accent)' : 'var(--color-danger)',
  };

  const trendDetailsStyles = {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    margin: 0,
  };

  return (
    <div
      style={cardStyles}
      className={className}
      onMouseEnter={() => onClick && setIsHovered(true)}
      onMouseLeave={() => onClick && setIsHovered(false)}
      onClick={onClick}
      {...(onClick && { role: 'button', tabIndex: 0 })}
    >
      <div>
        <p style={labelStyles}>{label}</p>
        <h3 style={valueStyles}>{value}</h3>
      </div>

      {(trend || trendLabel) && (
        <div style={trendContainerStyles}>
          {trend && (
            <div style={trendBadgeStyles}>
              {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
          {trendLabel && <p style={trendDetailsStyles}>{trendLabel}</p>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
