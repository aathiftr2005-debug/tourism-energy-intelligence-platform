'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';
import { THEMES } from '@/lib/theme/themes';
import { ThemeSwitcher } from '@/components/design-system/ThemeSwitcher';

export default function SettingsPage() {
  const { theme } = useTheme();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">System configuration and preferences</p>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Appearance</h2>
        <div className="py-4">
          <ThemeSwitcher />
        </div>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Configuration</h2>
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <span style={{ color: 'var(--color-muted)' }}>API Endpoint</span>
            <span className="font-mono text-xs truncate max-w-[55%] text-right" style={{ color: 'var(--color-muted)' }}>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <span style={{ color: 'var(--color-muted)' }}>Application Version</span>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span style={{ color: 'var(--color-muted)' }}>Theme</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>{THEMES.find(t => t.id === theme)?.label || 'Dark Space'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
