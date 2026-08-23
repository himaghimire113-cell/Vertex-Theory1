import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { addSubscriber } from '../firebaseConfig';
import { trackNewsletterSubscribe } from '../utils/analytics';

interface NewsletterSectionProps {
  source?: string;
  variant?: 'card' | 'inline' | 'footer';
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  source = 'homepage',
  variant = 'card',
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await addSubscriber(email, source);
      if (res.success) {
        trackNewsletterSubscribe(email, source);
        setStatus('success');
        setMessage(res.message);
        setEmail('');

        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.8 },
            colors: ['#b84825', '#ff5533', '#ffffff', '#fb923c']
          });
        } catch {
          // ignore
        }
      } else {
        setStatus('error');
        setMessage(res.message);
      }
    } catch {
      setStatus('error');
      setMessage('Unable to subscribe at this moment. Please try again.');
    }
  };

  if (variant === 'inline') {
    return (
      <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl p-6 my-8 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider mb-2 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vertex Theory Dispatch</span>
        </div>
        <h4 className="font-heading font-bold text-[var(--color-text-primary)] text-lg mb-1">
          Receive future essays directly in your inbox
        </h4>
        <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-4 font-body max-w-[65ch]">
          No spam, no promotional noise. Only deep dives on visual computing and architectural design.
        </p>

        {status === 'success' ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              required
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-5 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm shrink-0"
            >
              {status === 'loading' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="text-[11px] text-rose-500 mt-2">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-10 my-12 shadow-md">
      <div className="relative max-w-2xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-accent)] font-semibold">
          <Mail className="w-3.5 h-3.5" />
          <span>JOIN 1,400+ READERS</span>
        </div>

        <h3 className="font-heading font-bold text-2xl sm:text-3xl text-[var(--color-text-primary)] tracking-tight leading-tight">
          Deliberate reflections on design systems, computing, and visual theory.
        </h3>

        <p className="text-sm sm:text-base text-[var(--color-text-muted)] font-body leading-relaxed max-w-lg mx-auto">
          Delivered fortnightly. Curated essays, architectural teardowns, and hardware recommendations for discerning builders.
        </p>

        <div className="pt-2 max-w-md mx-auto">
          {status === 'success' ? (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-600 dark:text-emerald-300 text-sm flex items-center justify-center gap-2.5 animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)] transition-all"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Join Dispatch</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              {status === 'error' && (
                <p className="text-xs text-rose-500 text-left px-1">{message}</p>
              )}
            </form>
          )}
          <p className="text-[11px] text-[var(--color-text-dim)] mt-3 font-mono">
            Zero noise. Unsubscribe at any time with a single click.
          </p>
        </div>
      </div>
    </div>
  );
};
