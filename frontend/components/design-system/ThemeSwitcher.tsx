'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';
import type { ThemeId } from '@/lib/theme/themes';

const THEME_OPTIONS: { id: ThemeId; icon: string; label: string }[] = [
  { id: 'light', icon: '☀', label: 'Light' },
  { id: 'dark', icon: '☽', label: 'Dark' },
  { id: 'high-contrast', icon: '⚡', label: 'Contrast' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="theme-switcher"
      role="radiogroup"
      aria-label="Select theme"
    >
      {THEME_OPTIONS.map((option) => {
        const active = theme === option.id;
        return (
          <motion.button
            key={option.id}
            role="radio"
            aria-checked={active}
            aria-label={`${option.label} theme`}
            onClick={() => setTheme(option.id)}
            className={`theme-chip ${active ? 'theme-chip--active' : ''}`}
            animate={
              active
                ? { y: -3, scale: 1.03 }
                : { y: 0, scale: 1 }
            }
            whileHover={!active ? { y: -1 } : undefined}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            {active && <span className="theme-chip__shimmer" aria-hidden="true" />}
            <span
              className="theme-chip__icon"
              style={{
                transform: active ? 'scale(1.05)' : 'scale(0.95)',
                transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              aria-hidden="true"
            >
              {option.icon}
            </span>
            <span className="theme-chip__label">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
