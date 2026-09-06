/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        clay: {
          bg: '#EEF2F6',
          card: '#FFFFFF',
          teal: '#00B894',
          'teal-dark': '#009575',
          coral: '#FF6B4A',
          'coral-dark': '#E05333',
          navy: '#0F172A',
          slate: '#1E293B',
          yellow: '#FFC048',
          purple: '#6C5CE7',
          mint: '#55EFC4',
        }
      },
      boxShadow: {
        'clay-card': '14px 18px 36px rgba(15, 23, 42, 0.08), inset 3px 3px 6px rgba(255, 255, 255, 0.95), inset -3px -3px 6px rgba(0, 0, 0, 0.05)',
        'clay-card-hover': '18px 24px 44px rgba(15, 23, 42, 0.12), inset 3px 3px 6px rgba(255, 255, 255, 0.95), inset -3px -3px 6px rgba(0, 0, 0, 0.05)',
        'clay-btn': '6px 8px 18px rgba(0, 184, 148, 0.35), inset 2px 2px 4px rgba(255, 255, 255, 0.7), inset -2px -2px 4px rgba(0, 0, 0, 0.15)',
        'clay-coral': '6px 8px 18px rgba(255, 107, 74, 0.35), inset 2px 2px 4px rgba(255, 255, 255, 0.7), inset -2px -2px 4px rgba(0, 0, 0, 0.15)',
        'clay-pressed': 'inset 3px 3px 7px rgba(0, 0, 0, 0.18), inset -2px -2px 4px rgba(255, 255, 255, 0.6)',
        'clay-pill': '8px 12px 24px rgba(15, 23, 42, 0.06), inset 2px 2px 5px rgba(255, 255, 255, 0.9), inset -2px -2px 4px rgba(0, 0, 0, 0.04)',
        'clay-float': '0 20px 40px -15px rgba(0, 184, 148, 0.25)',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      }
    },
  },
  plugins: [],
};
