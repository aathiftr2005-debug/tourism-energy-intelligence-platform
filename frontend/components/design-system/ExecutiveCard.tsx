'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
}

export default function ExecutiveCard({ children, className = '', title, subtitle, icon }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`executive-card ${className}`}
    >
      {(title || icon) && (
        <div className="executive-card__header">
          {icon && <div className="executive-card__icon">{icon}</div>}
          {title && (
            <div>
              <h2 className="executive-card__title">{title}</h2>
              {subtitle && <p className="executive-card__subtitle">{subtitle}</p>}
            </div>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}
