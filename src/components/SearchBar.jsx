import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({
  placeholder = 'Search...',
  onSearch,
  debounceDelay = 300,
  onClear,
  className = '',
  style = {},
}) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef(null);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearch(newValue);
    }, debounceDelay);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
    onClear?.();
  };

  const containerStyles = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    ...style,
  };

  const searchWrapperStyles = {
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyles = {
    width: '100%',
    padding: '10px 16px 10px 40px',
    fontSize: '14px',
    border: `1px solid ${isFocused ? 'var(--color-primary)' : 'var(--color-border)'}`,
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
    transition: 'var(--transition-fast)',
    fontFamily: 'var(--font-family)',
  };

  const iconWrapperStyles = {
    position: 'absolute',
    left: '12px',
    color: 'var(--color-text-light)',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
  };

  const clearButtonStyles = {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-light)',
    padding: '4px',
    display: value ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-fast)',
  };

  return (
    <div style={containerStyles} className={className}>
      <div style={searchWrapperStyles}>
        <div style={iconWrapperStyles}>
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={inputStyles}
        />
        <button
          onClick={handleClear}
          style={clearButtonStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-light)';
          }}
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
