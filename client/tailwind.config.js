/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        risk: {
          low: '#10b981',      // Emerald Green
          medium: '#f59e0b',   // Amber Yellow
          high: '#ef4444',     // Crimson Red
          critical: '#881337', // Deep Dark Red / Alert
          blocked: '#64748b'   // Slate Gray
        }
      }
    },
  },
  plugins: [],
}
