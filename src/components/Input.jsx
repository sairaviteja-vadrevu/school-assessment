import React from 'react';

const Input = ({
  label,
  placeholder = '',
  value,
  onChange,
  error,
  icon: Icon,
  type = 'text',
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  };

  const labelStyles = {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text)',
  };

  const inputWrapperStyles = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyles = {
    width: '100%',
    padding: Icon ? '10px 16px 10px 40px' : '10px 16px',
    fontSize: '14px',
    border: `1px solid ${error ? 'var(--color-danger)' : isFocused ? 'var(--color-text)' : 'var(--color-border)'}`,
    borderRadius: 'var(--border-radius-sm)',
    transition: 'var(--transition-fast)',
    fontFamily: 'var(--font-family)',
    backgroundColor: disabled ? 'var(--color-border-light)' : 'white',
    color: 'var(--color-text)',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
  };

  const iconStyles = {
    position: 'absolute',
    left: '12px',
    color: error ? 'var(--color-danger)' : 'var(--color-text-light)',
    pointerEvents: 'none',
  };

  const errorStyles = {
    fontSize: '12px',
    color: 'var(--color-danger)',
    marginTop: '4px',
  };

  return (
    <div style={containerStyles} className={className}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <div style={inputWrapperStyles}>
        {Icon && <Icon size={18} style={iconStyles} />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={inputStyles}
          {...props}
        />
      </div>
      {error && <span style={errorStyles}>{error}</span>}
    </div>
  );
};

const Textarea = ({
  label,
  placeholder = '',
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  rows = 4,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  };

  const labelStyles = {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text)',
  };

  const textareaStyles = {
    width: '100%',
    padding: '10px 16px',
    fontSize: '14px',
    border: `1px solid ${error ? 'var(--color-danger)' : isFocused ? 'var(--color-text)' : 'var(--color-border)'}`,
    borderRadius: 'var(--border-radius-sm)',
    transition: 'var(--transition-fast)',
    fontFamily: 'var(--font-family)',
    backgroundColor: disabled ? 'var(--color-border-light)' : 'white',
    color: 'var(--color-text)',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
    resize: 'vertical',
    minHeight: `${rows * 24}px`,
  };

  const errorStyles = {
    fontSize: '12px',
    color: 'var(--color-danger)',
    marginTop: '4px',
  };

  return (
    <div style={containerStyles} className={className}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={textareaStyles}
        {...props}
      />
      {error && <span style={errorStyles}>{error}</span>}
    </div>
  );
};

export { Input as default, Textarea };
