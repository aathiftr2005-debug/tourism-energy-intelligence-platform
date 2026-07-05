'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';
import { THEMES, type ThemeId } from '@/lib/theme/themes';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">System configuration and preferences</p>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Appearance</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative rounded-2xl p-5 text-left transition-all duration-300 border ${
                  active
                    ? 'border-[var(--color-accent)] shadow-[0_0_25px_var(--color-accent-5)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }`}
                style={{
                  background: active
                    ? 'var(--color-accent-8)'
                    : 'var(--color-card)',
                }}
              >
                <div className="text-3xl mb-3">{t.icon}</div>
                <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{t.label}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{t.description}</div>
                {active && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
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
