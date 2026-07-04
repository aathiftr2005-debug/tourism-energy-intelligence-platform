'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sendChatMessage } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  'What is the current energy stress in Spain?',
  'Show me the forecast for Germany',
  'Which countries need immediate attention?',
  'Explain the stress score calculation',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m the TEI Intelligence assistant. Ask me about energy forecasts, stress scores, or tourism patterns across Europe.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    const res = await sendChatMessage(msg);
    setMessages((prev) => [...prev, { role: 'assistant', content: res?.reply || 'No response available.' }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="page-header">
        <h1 className="page-title">TEI Intelligence</h1>
        <p className="page-subtitle">AI-powered assistant for energy insights</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 rounded-2xl border border-[rgba(255,255,255,0.08)] p-4" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex gap-3 max-w-[80%]">
              {m.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-[0_0_10px_rgba(0,212,255,0.2)]" style={{ background: 'linear-gradient(135deg, #00d4ff22, #7c3aed22)' }}>
                  ⚡
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-tr-sm'
                    : 'rounded-tl-sm'
                }`}
                style={{
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))'
                    : 'rgba(255,255,255,0.05)',
                  border: m.role === 'assistant' ? '1px solid rgba(0,212,255,0.1)' : 'none',
                  color: '#f0f0ff',
                }}
              >
                {m.content}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 px-4">
            <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-bounce" style={{ animationDelay: '0ms', boxShadow: '0 0 6px #00d4ff' }} />
            <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-bounce" style={{ animationDelay: '150ms', boxShadow: '0 0 6px #00d4ff' }} />
            <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-bounce" style={{ animationDelay: '300ms', boxShadow: '0 0 6px #00d4ff' }} />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSend(s)}
            className="px-3 py-1.5 rounded-full text-xs border transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.color = '#00d4ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about energy forecasts, stress scores..."
          className="glass-input flex-1 min-w-0"
        />
        <button onClick={() => handleSend()} disabled={loading} className="btn-primary flex-shrink-0">
          Send
        </button>
      </div>
    </div>
  );
}
