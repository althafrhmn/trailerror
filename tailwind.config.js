/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4F46E5',  // Indigo-600
          DEFAULT: '#4338CA', // Indigo-700
          dark: '#3730A3',   // Indigo-800
        },
        secondary: {
          light: '#F8FAFC',  // Slate-50
          DEFAULT: '#F1F5F9', // Slate-100
          dark: '#E2E8F0',   // Slate-200
        },
        accent: {
          light: '#818CF8',  // Indigo-400
          DEFAULT: '#6366F1', // Indigo-500
          dark: '#4F46E5',   // Indigo-600
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-in': 'slideIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        'hover': '0 4px 20px -2px rgba(79, 70, 229, 0.2)',
      },
    },
  },
  plugins: [],
} 