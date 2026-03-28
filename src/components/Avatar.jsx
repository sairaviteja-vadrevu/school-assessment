import React from 'react';

const Avatar = ({
  name = '',
  src,
  size = 'md',
  className = '',
  style = {},
}) => {
  const sizes = {
    sm: '32px',
    md: '48px',
    lg: '64px',
    xl: '80px',
  };

  const fontSizes = {
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  };

  const avatarStyles = {
    width: sizes[size],
    height: sizes[size],
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: fontSizes[size],
    fontWeight: 700,
    backgroundColor: src ? 'transparent' : '#004493',
    color: 'white',
    overflow: 'hidden',
    flexShrink: 0,
    ...style,
  };

  const getInitials = (fullName) => {
    return fullName
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div style={avatarStyles} className={className}>
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        getInitials(name || 'User')
      )}
    </div>
  );
};

export default Avatar;
