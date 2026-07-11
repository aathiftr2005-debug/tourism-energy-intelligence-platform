'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sendChatMessage } from '@/lib/api';
import { GlassCard, PremiumInput, PremiumButton } from '@/components/design-system';

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
    <div className="flex flex-col h-full min-h-0 space-y-4">
      <div className="page-header">
        <h1 className="page-title">TEI Intelligence</h1>
        <p className="page-subtitle">AI-powered assistant for energy insights</p>
      </div>

      <GlassCard className="flex-1 overflow-y-auto space-y-4 p-4" hover={false}>
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'var(--color-accent-8)', boxShadow: '0 0 10px var(--color-accent-5)' }}>
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
                    ? 'var(--color-accent-8)'
                    : 'var(--color-card-hover)',
                  border: m.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                  color: 'var(--color-text-body)',
                }}
              >
                {m.content}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 px-4">
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-accent)', boxShadow: '0 0 6px var(--color-accent)', animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-accent)', boxShadow: '0 0 6px var(--color-accent)', animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--color-accent)', boxShadow: '0 0 6px var(--color-accent)', animationDelay: '300ms' }} />
          </div>
        )}
        <div ref={endRef} />
      </GlassCard>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <PremiumButton
            key={i}
            variant="accent"
            size="sm"
            onClick={() => handleSend(s)}
          >
            {s}
          </PremiumButton>
        ))}
      </div>

      <div className="flex gap-3">
        <PremiumInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about energy forecasts, stress scores..."
          className="flex-1 min-w-0"
        />
        <PremiumButton variant="primary" onClick={() => handleSend()} disabled={loading} className="flex-shrink-0">
          Send
        </PremiumButton>
      </div>
    </div>
  );
}
