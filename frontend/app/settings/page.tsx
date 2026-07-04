'use client';

import { motion } from 'framer-motion';

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">System configuration and preferences</p>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Configuration</h2>
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>API Endpoint</span>
            <span className="font-mono text-xs truncate max-w-[55%] text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Application Version</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Theme</span>
            <span className="text-xs font-semibold" style={{ color: '#00d4ff' }}>Dark Mode</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
