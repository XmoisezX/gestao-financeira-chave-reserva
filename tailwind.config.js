/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF4FF',
          100: '#DBE6FE',
          200: '#BFCFFE',
          300: '#93AEFB',
          400: '#6085F7',
          500: '#3B63F2',
          600: '#2548E8',
          700: '#1D37D4',
          800: '#1E2FAC',
          900: '#1E2D88',
          950: '#0F1740',
        },
        surface: {
          DEFAULT: 'var(--bg-surface)',
          hover: 'var(--bg-surface-hover)',
          elevated: 'var(--bg-elevated)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'brand': 'var(--shadow-brand)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
      },
      animation: {
        'fade-in': 'cr-fadeIn 0.15s ease',
        'slide-up': 'cr-slideUp 0.2s ease',
        'slide-down': 'cr-slideDown 0.15s ease',
        'scale-in': 'cr-scaleIn 0.2s ease',
      }
    },
  },
  plugins: [],
}
