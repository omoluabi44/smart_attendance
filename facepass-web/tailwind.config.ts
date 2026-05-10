import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
      },
      colors: {
        // Your defined palette
        blue: {
          400: '#3395FF',
          500: '#007BFF',
          600: '#0069D9',
        },
        bases: '#FFFFFF',
      },
      keyframes: {
        // Your existing keyframes
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        fadeCycle: {
          '0%, 45%': { opacity: '1' },
          '50%, 95%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideCycle: {
          '0%, 45%': { transform: 'translateX(0%)' },
          '50%, 95%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        // NEW: Hero Section Keyframes
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      animation: {
        // Your existing animations
        fadeCycle: 'fadeCycle 6s infinite ease-in-out',
        slideCycle: 'slideCycle 12s infinite ease-in-out',
        // NEW: Hero Section Animations
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

export default config;