import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({
  label,
  options = [],
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  placeholder = 'Select an option',
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    position: 'relative',
  };

  const labelStyles = {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text)',
  };

  const selectStyles = {
    padding: '10px 16px 10px 16px',
    fontSize: '14px',
    border: `1px solid ${error ? 'var(--color-danger)' : isFocused ? 'var(--color-primary)' : 'var(--color-border)'}`,
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: disabled ? 'var(--color-border-light)' : 'var(--color-surface)',
    color: value ? 'var(--color-text)' : 'var(--color-text-light)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: disabled ? 0.6 : 1,
  };

  const dropdownListStyles = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    backgroundColor: 'var(--color-surface)',
    border: `1px solid var(--color-border)`,
    borderRadius: 'var(--border-radius-sm)',
    boxShadow: 'var(--shadow-lg)',
    maxHeight: '300px',
    overflow: 'auto',
    zIndex: 10,
    animation: 'dropdownSlideDown 0.2s ease-out',
  };

  const optionStyles = {
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    fontSize: '14px',
    borderBottom: '1px solid var(--color-border-light)',
  };

  const errorStyles = {
    fontSize: '12px',
    color: 'var(--color-danger)',
    marginTop: '4px',
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div style={containerStyles} className={className} ref={containerRef}>
      <style>{`
        @keyframes dropdownSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <div
        style={selectStyles}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        role="combobox"
        aria-expanded={isOpen}
        tabIndex={disabled ? -1 : 0}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          size={18}
          style={{
            color: 'var(--color-text-light)',
            transition: 'var(--transition-fast)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {isOpen && (
        <div style={dropdownListStyles} ref={dropdownRef}>
          {options.map((option) => (
            <div
              key={option.value}
              style={{
                ...optionStyles,
                backgroundColor:
                  value === option.value ? 'var(--color-background)' : 'transparent',
                color: value === option.value ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: value === option.value ? 600 : 400,
              }}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-background)';
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {error && <span style={errorStyles}>{error}</span>}
    </div>
  );
};

export default Select;
