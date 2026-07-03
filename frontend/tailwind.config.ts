import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'tei-bg': '#0a0e1a',
        'tei-card': 'rgba(255,255,255,0.05)',
        'tei-secondary': '#111827',
        'tei-border': 'rgba(255,255,255,0.08)',
        'tei-text': '#f0f0ff',
        'tei-muted': 'rgba(255,255,255,0.5)',
        cyan: { 400: '#00d4ff', 500: '#00b8e6' },
        purple: { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
        critical: '#ef4444',
        elevated: '#f59e0b',
        normal: '#10b981',
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
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
        'gradient-primary': 'linear-gradient(135deg, #00d4ff, #7c3aed)',
        'gradient-stress': 'linear-gradient(90deg, #10b981, #f59e0b, #ef4444)',
      },
    },
  },
  plugins: [],
};

export default config;
