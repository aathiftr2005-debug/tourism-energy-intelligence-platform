'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <Image src="/images/map-bg.jpg" alt="" aria-hidden="true" fill className="object-cover opacity-[0.05]" />
        <div className="absolute inset-0" style={{ background: 'var(--color-overlay)' }} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--color-accent-8)', border: '1px solid var(--color-accent-20)' }}
        >
          <span className="text-4xl font-bold text-accent opacity-30">404</span>
        </div>
        <h1 className="text-heading text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-body text-sm mb-6 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
