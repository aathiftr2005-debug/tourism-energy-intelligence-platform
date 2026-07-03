'use client';

import { motion } from 'framer-motion';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <img src="/images/map-bg.jpg" alt="" aria-hidden="true" className="w-full h-full object-cover opacity-[0.05]" />
        <div className="absolute inset-0 bg-[#0a0e1a]/70" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#f0f0ff' }}>Something went wrong</h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          Try Again
        </button>
      </motion.div>
    </div>
  );
}
