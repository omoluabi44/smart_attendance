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
      fontFamily: {
        sans: ['var(--font-roboto)', 'Roboto', 'sans-serif'],
        roboto: ['var(--font-roboto)', 'Roboto', 'sans-serif'],
        mono: ['var(--font-roboto)', 'Roboto', 'sans-serif'],
        montserrat: ['var(--font-roboto)', 'Roboto', 'sans-serif'],
      },
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
      },
      colors: {
        // Complete Brand Blue Palette generated from #007BFF (blue-500), #3395FF (blue-400), #0069D9 (blue-600)
        blue: {
          50: '#EBF5FF',
          100: '#D6EAFF',
          200: '#ADD5FF',
          300: '#70B5FF',
          400: '#3395FF',
          500: '#007BFF',
          600: '#0069D9',
          700: '#0052AD',
          800: '#003D82',
          900: '#002957',
          950: '#001530',
        },
        obsidian: {
          950: '#050B16',
          900: '#081121',
          800: '#0D1B33',
          700: '#162A4A',
        },
        vision: {
          blue: '#007BFF',
          cyan: '#00B4D8',
          emerald: '#10B981',
          amber: '#F59E0B',
          crimson: '#F43F5E',
        },
        bases: '#FFFFFF',
      },
      keyframes: {
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
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        scanline: {
          '0%': { top: '4%', opacity: '0.2' },
          '50%': { top: '92%', opacity: '0.95' },
          '100%': { top: '4%', opacity: '0.2' },
        },
        reticlePulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.65', transform: 'scale(0.985)' },
        },
      },
      animation: {
        fadeCycle: 'fadeCycle 6s infinite ease-in-out',
        slideCycle: 'slideCycle 12s infinite ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
        scanline: 'scanline 3.6s ease-in-out infinite',
        'reticle-pulse': 'reticlePulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

export default config;
