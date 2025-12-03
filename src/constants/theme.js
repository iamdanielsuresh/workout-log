/**
 * Theme constants for the Workout Log app
 * Professional dark theme with green accents
 */

export const colors = {
  // Primary background shades (dark)
  bg: {
    primary: '#0a0a0a',    // Main background
    secondary: '#111111',   // Card backgrounds
    tertiary: '#1a1a1a',    // Elevated elements
    hover: '#222222',       // Hover states
  },
  
  // Green accent (emerald)
  accent: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',  // Primary accent
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Text colors
  text: {
    primary: '#f5f5f5',     // Main text
    secondary: '#a3a3a3',   // Secondary text
    muted: '#737373',       // Muted/disabled
    inverse: '#0a0a0a',     // Text on accent bg
  },
  
  // Border colors
  border: {
    default: '#262626',
    light: '#333333',
    accent: '#10b981',
  },
  
  // Status colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  }
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
};

export const borderRadius = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

export const typography = {
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  }
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  glow: '0 0 20px rgba(16, 185, 129, 0.3)',
  glowLg: '0 0 40px rgba(16, 185, 129, 0.4)',
};

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
};
