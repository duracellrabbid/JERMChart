/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        trust: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#0f172a',
          600: '#0284c7',
          700: '#0369a1',
          gold: '#d97706',
          navy: '#0f172a',
          teal: '#0d9488',
        },
      },
    },
  },
  plugins: [],
};
