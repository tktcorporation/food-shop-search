/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // GourmetSpot Design System - Vibrant & Block-based
        primary: {
          DEFAULT: '#DC2626',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#DC2626',
          600: '#B91C1C',
          700: '#991B1B',
        },
        cta: {
          DEFAULT: '#CA8A04',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#CA8A04',
          600: '#A16207',
        },
        surface: {
          DEFAULT: '#FEF2F2',
          card: '#FFFFFF',
          muted: '#F5F5F4',
        },
        text: {
          DEFAULT: '#450A0A',
          muted: '#78716C',
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
