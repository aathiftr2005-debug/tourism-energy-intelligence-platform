'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  id?: string;
}

export default function SectionContainer({ children, className = '', title, subtitle, icon, action, id }: Props) {
  return (
    <section id={id} className={`section-container ${className}`}>
      {(title || icon || action) && (
        <div className="section-container__header">
          {(icon || title) && (
            <div className="section-container__header-left">
              {icon && <div className="section-container__icon">{icon}</div>}
              {title && (
                <div>
                  <h2 className="section-container__title">{title}</h2>
                  {subtitle && <p className="section-container__subtitle">{subtitle}</p>}
                </div>
              )}
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
