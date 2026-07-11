'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { registerApiKey } from '@/lib/api';

const endpoints = [
  { method: 'GET', path: '/api/public/forecast/{country}', desc: '12-month ensemble forecast', auth: true },
  { method: 'GET', path: '/api/public/stress-score/{country}', desc: 'Latest stress score + traffic light', auth: true },
  { method: 'GET', path: '/api/public/stress-score/all', desc: 'Stress scores for all countries', auth: true },
  { method: 'GET', path: '/api/public/regions', desc: 'Supported countries with metadata', auth: true },
  { method: 'POST', path: '/api/public/keys/register', desc: 'Request an API key', auth: false },
  { method: 'GET', path: '/api/public/docs-info', desc: 'API documentation (no auth)', auth: false },
];

export default function ApiAccessPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    const res = await registerApiKey(name, email);
    setMessage(res?.message || 'Failed to register. Check the API connection.');
    setLoading(false);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="page-header">
        <h1 className="page-title">API Access</h1>
        <p className="page-subtitle">Integrate TEI data into your applications</p>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Get Your API Key</h2>
        <div className="flex flex-wrap gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name"
            className="glass-input w-full sm:flex-1 sm:min-w-[200px]" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
            className="glass-input w-full sm:flex-1 sm:min-w-[200px]" />
          <button onClick={handleRegister} disabled={loading || !name || !email}
            className="btn-primary text-sm disabled:opacity-50 w-full sm:w-auto">
            {loading ? 'Sending...' : 'Generate API Key'}
          </button>
        </div>
        {message && (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-accent)' }}>{message}</p>
        )}
        <p className="mt-3 text-xs" style={{ color: 'var(--color-text-caption)' }}>Rate limit: 100 requests/hour per key &middot; Keys sent via email</p>
      </div>

      <div className="glass-card">
        <h2 className="section-title">API Documentation</h2>

        <div className="mb-6 space-y-3">
          <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <p className="mb-2 text-xs" style={{ color: 'var(--color-text-caption)' }}>Get forecast for Germany</p>
            <pre className="text-sm font-mono" style={{ color: 'var(--color-accent)' }}>GET /api/public/forecast/DE</pre>
            <pre className="text-xs mt-1" style={{ color: 'var(--color-text-caption)' }}>Headers: {`{ "X-API-Key": "TEI-your-key-here" }`}</pre>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <p className="mb-2 text-xs" style={{ color: 'var(--color-text-caption)' }}>Get stress score for Spain</p>
            <pre className="text-sm font-mono" style={{ color: 'var(--color-accent)' }}>GET /api/public/stress-score/ES</pre>
            <pre className="text-xs mt-1" style={{ color: 'var(--color-text-caption)' }}>Headers: {`{ "X-API-Key": "TEI-your-key-here" }`}</pre>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <p className="mb-2 text-xs" style={{ color: 'var(--color-text-caption)' }}>Get all stress scores</p>
            <pre className="text-sm font-mono" style={{ color: 'var(--color-accent)' }}>GET /api/public/stress-score/all</pre>
            <pre className="text-xs mt-1" style={{ color: 'var(--color-text-caption)' }}>Headers: {`{ "X-API-Key": "TEI-your-key-here" }`}</pre>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:-mx-0 px-4 md:px-0">
          <table className="data-table" style={{ minWidth: '420px' }}>
            <thead>
              <tr className="text-left text-xs" style={{ color: 'var(--color-text-caption)' }}>
                <th className="pb-2 font-semibold whitespace-nowrap pr-2">Method</th>
                <th className="pb-2 font-semibold whitespace-nowrap pr-2">Endpoint</th>
                <th className="pb-2 font-semibold whitespace-nowrap pr-2">Description</th>
                <th className="pb-2 font-semibold whitespace-nowrap">Auth</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => (
                <tr key={ep.path} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-2.5 pr-2 whitespace-nowrap">
                    <span className={`rounded px-2 py-0.5 text-xs font-mono ${ep.method === 'GET' ? 'text-accent' : 'text-elevated'}`}
                      style={{ background: ep.method === 'GET' ? 'var(--color-accent-8)' : 'var(--color-elevated-15)' }}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 font-mono text-xs max-w-[120px] md:max-w-none" style={{ color: 'var(--color-text-heading)', wordBreak: 'break-word' }}>{ep.path}</td>
                  <td className="py-2.5 pr-2 text-xs min-w-0" style={{ color: 'var(--color-text-muted)' }}>{ep.desc}</td>
                  <td className="py-2.5 text-xs whitespace-nowrap">
                    {ep.auth
                      ? <span className="badge-elevated text-[10px]">Required</span>
                      : <span className="badge-normal text-[10px]">No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center">
          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/docs`} target="_blank"
            className="btn-secondary inline-flex items-center gap-2 text-sm w-full sm:w-auto">
            View Full Swagger Docs &rarr;
          </a>
        </div>
      </div>
    </motion.div>
  );
}
