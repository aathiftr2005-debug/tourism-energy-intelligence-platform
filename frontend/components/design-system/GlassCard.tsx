'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', blur = 'md', hover = true, onClick }: Props) {
  const blurMap = { sm: 'blur(8px)', md: 'blur(16px)', lg: 'blur(24px)' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      className={`glass-panel ${hover ? 'glass-panel--hover' : ''} ${className}`}
      style={{ backdropFilter: blurMap[blur], WebkitBackdropFilter: blurMap[blur] }}
    >
      {children}
    </motion.div>
  );
}
