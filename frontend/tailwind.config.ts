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
        'enterprise': '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'enterprise-md': '0 4px 6px -1px rgba(15,23,42,0.07), 0 2px 4px -2px rgba(15,23,42,0.05)',
        'enterprise-lg': '0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.04)',
        'enterprise-xl': '0 20px 25px -5px rgba(15,23,42,0.10), 0 8px 10px -6px rgba(15,23,42,0.06)',
      },
      borderRadius: {
        'enterprise': '16px',
        'enterprise-lg': '20px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
        'pulse-critical': 'pulse-critical 2s infinite',
        float: 'float 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease forwards',
        'spin-slow': 'spin 3s linear infinite',
        shimmer: 'shimmer 2s infinite linear',
        'breathing-glow': 'breathing-glow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px var(--color-accent-20)' },
          '50%': { boxShadow: '0 0 40px var(--color-accent-30, var(--color-accent-20))' },
        },
        'pulse-critical': {
          '0%, 100%': { boxShadow: '0 0 0 0 var(--color-critical-30)' },
          '50%': { boxShadow: '0 0 0 8px transparent' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'breathing-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
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
