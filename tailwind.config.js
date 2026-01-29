/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // GourmetSpot Design System - Soft UI Evolution + Warm Food Palette
        // Warm, approachable colors with improved contrast (WCAG AA+)
        primary: {
          DEFAULT: '#B45309', // Soft amber brown
          50: '#FFFBEB', // Very soft cream
          100: '#FEF3C7', // Light cream
          200: '#FDE68A', // Soft gold
          300: '#FCD34D', // Warm yellow
          400: '#FBBF24', // Amber
          500: '#D97706', // Main amber (softer)
          600: '#B45309', // Deep amber
          700: '#92400E', // Rich brown
        },
        // Soft accent colors for actions
        accent: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#D97706',
        },
        // Surface colors for Soft UI depth
        surface: {
          DEFAULT: '#FFFBEB', // Warm cream background
          card: '#FFFFFF', // Pure white cards
          muted: '#FEF3C7', // Muted cream
          elevated: '#FFFFFF', // Elevated elements
        },
        // Text colors with warm undertones
        text: {
          DEFAULT: '#78350F', // Warm brown (readable)
          muted: '#92400E', // Softer brown
          light: '#B45309', // Light text
          inverse: '#FFFFFF', // White text
        },
        // Success/Error states
        success: {
          DEFAULT: '#059669',
          light: '#D1FAE5',
        },
        error: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
      },
      fontFamily: {
        // Soft UI Evolution typography - friendly and modern
        heading: ['Nunito', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        // Soft UI Evolution - moderate rounding (8-12px)
        DEFAULT: '10px',
        sm: '6px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        // Soft UI Evolution shadows - softer than flat, clearer than neumorphism
        sm: '0 1px 3px rgba(120, 53, 15, 0.08)',
        DEFAULT:
          '0 2px 8px rgba(120, 53, 15, 0.08), 0 1px 3px rgba(120, 53, 15, 0.04)',
        md: '0 4px 12px rgba(120, 53, 15, 0.1), 0 2px 4px rgba(120, 53, 15, 0.04)',
        lg: '0 8px 24px rgba(120, 53, 15, 0.1), 0 4px 8px rgba(120, 53, 15, 0.04)',
        xl: '0 16px 32px rgba(120, 53, 15, 0.12), 0 8px 16px rgba(120, 53, 15, 0.06)',
        // Soft inner shadow for inputs
        inner: 'inset 0 1px 2px rgba(120, 53, 15, 0.06)',
        // Focus ring shadow
        focus: '0 0 0 3px rgba(245, 158, 11, 0.3)',
      },
      transitionDuration: {
        // Soft UI Evolution - modern animations (200-300ms)
        DEFAULT: '200ms',
        fast: '150ms',
        normal: '250ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        // Smooth easing
        soft: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
