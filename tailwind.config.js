/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // GourmetSpot Design System - Warm Bakery/Cafe palette
        primary: {
          DEFAULT: '#92400E',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#92400E',
          600: '#B45309',
          700: '#78350F',
        },
        cta: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        surface: {
          DEFAULT: '#FFFBEB',
          card: '#FFFFFF',
          muted: '#FEF3C7',
        },
        text: {
          DEFAULT: '#78350F',
          muted: '#A16207',
          inverse: '#FFFFFF',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display SC"', 'serif'],
        body: ['Karla', 'system-ui', 'sans-serif'],
        sans: ['Karla', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        DEFAULT: '0 4px 6px rgba(0,0,0,0.1)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.15)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
};
