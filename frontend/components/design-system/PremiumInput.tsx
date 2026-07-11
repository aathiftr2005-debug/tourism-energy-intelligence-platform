'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const PremiumInput = forwardRef<HTMLInputElement, Props>(({ label, hint, icon, className = '', ...rest }, ref) => {
  return (
    <div className={`premium-input-wrapper ${className}`}>
      {label && <label className="premium-input-label">{label}</label>}
      <div className="premium-input-container">
        {icon && <span className="premium-input-icon">{icon}</span>}
        <input ref={ref} className={`premium-input ${icon ? 'premium-input--with-icon' : ''}`} {...rest} />
      </div>
      {hint && <span className="premium-input-hint">{hint}</span>}
    </div>
  );
});

PremiumInput.displayName = 'PremiumInput';
export default PremiumInput;
