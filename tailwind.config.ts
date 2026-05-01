import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        void:    '#0A0A0A',
        surface: '#0f0f0f',
        card:    '#141414',
        border:  '#1f1f1f',
        border2: '#2a2a2a',
        // Primary brand — design yellow
        brand:   '#FFE600',
        'brand-dim': 'rgba(255,230,0,0.12)',
        'brand-border': 'rgba(255,230,0,0.25)',
        text1:   '#F5F5F5',
        text2:   '#A3A3A3',
        text3:   '#525252',
        text4:   '#333333',
      },
      backgroundImage: {
        'brand-subtle': 'linear-gradient(135deg, rgba(255,230,0,0.10) 0%, rgba(255,230,0,0.06) 100%)',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '10px',
        xl: '14px',
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
