import React from 'react';
import { Loader } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const styles = {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      border: 'none',
      borderRadius: 'var(--border-radius-sm)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'var(--transition)',
      fontWeight: 600,
      fontSize: '14px',
      opacity: disabled ? 0.6 : 1,
      fontFamily: 'var(--font-family)',
      whiteSpace: 'nowrap',
    },
    sizes: {
      sm: {
        padding: '6px 12px',
        fontSize: '12px',
      },
      md: {
        padding: '10px 16px',
        fontSize: '14px',
      },
      lg: {
        padding: '14px 24px',
        fontSize: '16px',
      },
    },
    variants: {
      primary: {
        backgroundColor: '#004493',
        color: 'white',
      },
      primaryHover: {
        backgroundColor: '#0F0F1A',
      },
      secondary: {
        backgroundColor: '#F4F4F6',
        color: '#004493',
      },
      secondaryHover: {
        backgroundColor: '#E5E7EB',
      },
      accent: {
        backgroundColor: '#22C55E',
        color: 'white',
      },
      accentHover: {
        backgroundColor: '#16A34A',
      },
      danger: {
        backgroundColor: '#EF4444',
        color: 'white',
      },
      dangerHover: {
        backgroundColor: '#DC2626',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#004493',
        border: '1px solid var(--color-border)',
      },
      ghostHover: {
        backgroundColor: 'var(--color-border-light)',
      },
    },
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const getVariantStyles = () => {
    const baseVariant = styles.variants[variant];
    if (isHovered) {
      const hoverVariant = styles.variants[`${variant}Hover`];
      return { ...baseVariant, ...hoverVariant };
    }
    return baseVariant;
  };

  const buttonStyles = {
    ...styles.base,
    ...styles.sizes[size],
    ...getVariantStyles(),
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={buttonStyles}
      className={className}
      {...props}
    >
      {loading && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
      {!loading && Icon && iconPosition === 'left' && <Icon size={16} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={16} />}
    </button>
  );
};

export default Button;
