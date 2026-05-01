import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        void:    '#0A0A0A',
        surface: '#111111',
        card:    '#181818',
        border:  '#262626',
        border2: '#333333',
        brand:   '#f59e0b',
        text1:   '#F5F5F5',
        text2:   '#A3A3A3',
        text3:   '#525252',
      },
      backgroundImage: {
        'brand-subtle': 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(251,191,36,0.12) 100%)',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in 0.3s ease both',
        shimmer:   'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
