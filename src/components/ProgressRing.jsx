import React, { useEffect, useState } from 'react';

const ProgressRing = ({
  value = 0,
  size = 100,
  strokeWidth = 8,
  color = '#1A1A2E',
  label = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  };

  const svgContainerStyles = {
    position: 'relative',
    width: size,
    height: size,
  };

  const percentageStyles = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: `${size * 0.25}px`,
    fontWeight: 700,
    color: 'var(--color-text)',
    textAlign: 'center',
  };

  const labelStyles = {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
    textAlign: 'center',
  };

  return (
    <div style={containerStyles}>
      <div style={svgContainerStyles}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>
        <div style={percentageStyles}>{displayValue}%</div>
      </div>
      {label && <div style={labelStyles}>{label}</div>}
    </div>
  );
};

export default ProgressRing;
