'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function AnimatedCounter({ value, precision = 0 }: { value: number; precision?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(current);
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return <>{display.toFixed(precision)}</>;
}

import data from '@/data/kpis.json';
import type { KpiCard } from '@/lib/types';

export default function KpiCards() {
  const cards = data.cards as KpiCard[];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 * i }}
          className="rounded-2xl p-4 relative overflow-hidden w-full"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: `2px solid ${card.color}`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">{card.icon}</span>
            <span className="text-caption text-[10px] uppercase tracking-wider font-medium truncate max-w-[50%]">
              {card.label.split(' ').pop()}
            </span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ color: card.color, textShadow: `0 0 20px ${card.color}25` }}
            >
              <AnimatedCounter value={card.value} precision={card.precision} />
            </span>
            {card.suffix && (
              <span className="text-muted text-xs font-medium">{card.suffix}</span>
            )}
          </div>
          <p className="text-caption text-[11px] mt-1 font-medium">
            {card.label}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{
            background: `linear-gradient(90deg, transparent, ${card.color}40, transparent)`,
          }} />
        </motion.div>
      ))}
    </div>
  );
}
