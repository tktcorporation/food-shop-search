/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // GourmetSpot Design System - Clean & Pop
        // オレンジ系メイン + 白ベース + 明確なコントラスト
        primary: {
          DEFAULT: '#F97316', // Vivid orange - main
          50: '#FFF7ED', // Very light orange tint
          100: '#FFEDD5', // Light orange
          200: '#FED7AA', // Soft orange
          300: '#FDBA74', // Medium light orange
          400: '#FB923C', // Medium orange
          500: '#F97316', // Main orange (default)
          600: '#EA580C', // Hover state
          700: '#C2410C', // Active/pressed state
        },
        // Surface colors - 白ベースでクリーン
        surface: {
          DEFAULT: '#FFFFFF', // Pure white background
          card: '#FFFFFF', // Card background
          muted: '#F9FAFB', // Slightly off-white (gray-50)
          elevated: '#FFFFFF', // Elevated elements
        },
        // Text colors - しっかりしたコントラスト
        text: {
          DEFAULT: '#1F2937', // Dark gray (gray-800) - primary text
          muted: '#6B7280', // Medium gray (gray-500) - secondary text
          light: '#9CA3AF', // Light gray (gray-400) - tertiary text
          inverse: '#FFFFFF', // White text on dark backgrounds
        },
        // Neutral grays for borders, dividers
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Success state - 営業中、確認
        success: {
          DEFAULT: '#10B981', // Emerald-500
          light: '#D1FAE5', // Emerald-100
          dark: '#059669', // Emerald-600
        },
        // Error state - エラー、警告
        error: {
          DEFAULT: '#EF4444', // Red-500
          light: '#FEE2E2', // Red-100
          dark: '#DC2626', // Red-600
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
        // Clean shadows - neutral gray base
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
        // Card shadow - slightly elevated
        card: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        // Focus ring shadow - orange tint
        focus: '0 0 0 3px rgba(249, 115, 22, 0.3)',
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
