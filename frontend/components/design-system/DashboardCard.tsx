'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

export default function DashboardCard({ children, className = '', title, subtitle, action, noPadding }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`dashboard-card ${noPadding ? 'dashboard-card--flush' : ''} ${className}`}
    >
      {(title || action) && (
        <div className="dashboard-card__header">
          <div>
            {title && <h2 className="dashboard-card__title">{title}</h2>}
            {subtitle && <p className="dashboard-card__subtitle">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </motion.div>
  );
}
