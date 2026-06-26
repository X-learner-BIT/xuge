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
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        secondary: {
          DEFAULT: '#14b8a6',
          light: '#5eead4',
        },
        accent: '#a78bfa',
        bg: '#f0f2f5',
        'bg-card': '#ffffff',
        'bg-glass': 'rgba(255,255,255,0.7)',
        'text-primary': '#1e293b',
        'text-secondary': '#64748b',
        'text-muted': '#94a3b8',
        border: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        'xl': '10px',
        'lg': '6px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'card-lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
        'card-xl': '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
        'primary': '0 4px 14px rgba(99,102,241,0.25)',
        'primary-hover': '0 6px 20px rgba(99,102,241,0.35)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
