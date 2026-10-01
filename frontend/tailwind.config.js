/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          hover: '#5B21B6',
          light: '#EDE9FE',
          soft: '#F3E8FF'
        },
        brand: {
          navy: '#7C3AED',
          'navy-dark': '#5B21B6',
          'navy-hover': '#5B21B6',
          blue: '#6D28D9',
          'blue-secondary': '#8B5CF6',
          'blue-soft': '#EDE9FE',
          text: '#0F172A',
          muted: '#475569',
          subtle: '#64748B',
          border: '#E2E8F0',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          'grey-light': '#F1F5F9',
          success: '#16A34A',
        },
        portal: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          navy: {
            DEFAULT: '#7C3AED',
            dark: '#5B21B6',
            hover: '#5B21B6',
            light: '#EDE9FE',
          },
          blue: {
            DEFAULT: '#6D28D9',
            medium: '#8B5CF6',
            soft: '#EDE9FE',
            light: '#EDE9FE',
          },
          border: '#E2E8F0',
          grey: {
            light: '#F1F5F9',
          },
          text: {
            primary: '#0F172A',
            secondary: '#475569',
            muted: '#64748B',
          },
          success: {
            DEFAULT: '#16A34A',
            light: '#DCFCE7',
          },
          danger: '#DC2626',
        },
        nec: {
          navy: '#7C3AED',
          'navy-hover': '#5B21B6',
          blue: '#6D28D9',
          royal: '#8B5CF6',
          green: '#16A34A',
          card: '#FFFFFF',
          border: '#E2E8F0',
          text: '#0F172A',
          muted: '#475569',
          bg: '#F8FAFC',
        },
        dashboard: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          primary: '#7C3AED',
          secondary: '#6D28D9',
          accent: '#8B5CF6',
          border: '#E2E8F0',
        }
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
