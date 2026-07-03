'use client';

import { motion } from 'framer-motion';
import { LAYERS } from './data';
import type { ActiveLayer } from './types';

interface Props {
  activeLayer: ActiveLayer;
  onLayerChange: (layer: ActiveLayer) => void;
}

export default function LayerToggle({ activeLayer, onLayerChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(10,14,26,0.9)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Layers
        </span>
      </div>

      <div className="space-y-1.5">
        {LAYERS.map((layer) => {
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id as ActiveLayer)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: isActive ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isActive ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: isActive ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                <span className="text-sm">{layer.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium truncate" style={{ color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.6)' }}>
                  {layer.label}
                </div>
                <div className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {layer.description}
                </div>
              </div>
              {isActive && (
                <motion.div
                  layoutId="layerIndicator"
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: '#00d4ff', boxShadow: '0 0 6px rgba(0,212,255,0.5)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
