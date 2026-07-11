'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  padding?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function PremiumCard({ children, className = '', accent = false, padding, hover = true, onClick }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      className={`premium-card ${accent ? 'premium-card--accent' : ''} ${hover ? 'premium-card--hover' : ''} ${className}`}
      style={padding ? { padding } : undefined}
    >
      {accent && <div className="premium-card__shimmer" />}
      {children}
    </motion.div>
  );
}
