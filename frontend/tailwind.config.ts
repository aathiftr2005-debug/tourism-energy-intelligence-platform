import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'tei-bg': 'var(--color-bg)',
        'tei-card': 'var(--color-card)',
        'tei-secondary': 'var(--color-bg-secondary)',
        'tei-border': 'var(--color-border)',
        'tei-text': 'var(--color-text)',
        'tei-muted': 'var(--color-muted)',
        cyan: { 400: 'var(--color-accent)', 500: 'var(--color-accent)' },
        purple: { 400: 'var(--color-accent-secondary)', 500: 'var(--color-accent-secondary)', 600: 'var(--color-accent-secondary)' },
        critical: 'var(--color-critical)',
        elevated: 'var(--color-elevated)',
        normal: 'var(--color-normal)',
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': 'var(--light-card-shadow)',
        'card-md': 'var(--light-card-shadow-md)',
        'card-lg': 'var(--light-card-shadow-lg)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
        'pulse-critical': 'pulse-critical 2s infinite',
        float: 'float 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease forwards',
        'spin-slow': 'spin 3s linear infinite',
        shimmer: 'shimmer 2s infinite linear',
        'breathing-glow': 'breathing-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,212,255,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0,212,255,0.6)' },
        },
        'pulse-critical': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(239,68,68,0.3)' },
          '50%': { boxShadow: '0 0 60px rgba(239,68,68,0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'breathing-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--color-gradient-primary)',
        'gradient-stress': 'linear-gradient(90deg, #10b981, #f59e0b, #ef4444)',
      },
    },
  },
  plugins: [],
};

export default config;
