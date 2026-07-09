/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        phone: { max: '430px' },
      },
      colors: {
        primary: {
          50: '#f3f0ff',
          100: '#e9e2ff',
          200: '#d4c8ff',
          300: '#b4a3ff',
          400: '#8b75f5',
          500: '#5B3FD4',
          600: '#4c35b0',
          700: '#3d2a8c',
          800: '#2f216b',
          900: '#22184d',
        },
        danger: '#DC2626',
        success: '#16A34A',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        fab: '0 4px 12px rgba(91, 63, 212, 0.4)',
      },
    },
  },
  plugins: [],
};
