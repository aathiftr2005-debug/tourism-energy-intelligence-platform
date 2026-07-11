'use client';

import { motion } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlowCard({ children, className = '', onClick }: Props) {
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return (
    <motion.div
      whileHover={isTouch ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`rounded-xl border p-5 cursor-pointer transition-colors ${className}`}
      style={{
        background: 'var(--color-card)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--light-card-shadow)',
      }}
    >
      {children}
    </motion.div>
  );
}
