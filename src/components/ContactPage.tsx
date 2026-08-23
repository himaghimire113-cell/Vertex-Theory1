import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';
import { SiteSettings } from '../types';
import { sendReaderMessage } from '../firebaseConfig';

interface ContactPageProps {
  settings: SiteSettings;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setLoading(true);
    try {
      await sendReaderMessage({
        senderName: name || 'Reader',
        senderEmail: email,
        postTitle: subject ? `Contact Form: ${subject}` : 'General Editorial Inquiry',
        message: message
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-accent)] font-semibold">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>DIRECT DISPATCHES</span>
        </div>
        <h1 className="font-heading font-bold text-3xl sm:text-5xl text-[var(--color-text-primary)] tracking-tight">
          Connect with the Editorial Desk
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-text-muted)] font-body leading-relaxed max-w-[65ch]">
          For writing proposals, sponsor placement inquiries ("Advertise in this space"), research collaborations, or reader feedback.
        </p>
      </div>

      <div className="p-6 sm:p-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md">
        {success ? (
          <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-600 dark:text-emerald-300 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="font-heading font-bold text-lg text-[var(--color-text-primary)]">Message Transmitted</h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-200">
              Your inquiry has been stored securely in our editorial inbox. We reply to all relevant correspondence promptly.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-4 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold"
            >
              Send Another Note
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[var(--color-text-muted)]">Your Name</label>
                <input
                  type="text"
                  placeholder="Elena Rostova"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[var(--color-text-muted)]">Your Email *</label>
                <input
                  type="email"
                  required
                  placeholder="elena@studio.design"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[var(--color-text-muted)]">Inquiry Topic</label>
              <input
                type="text"
                placeholder="e.g. Sponsor Placement / Essay Response / Speaking"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[var(--color-text-muted)]">Message *</label>
              <textarea
                rows={5}
                required
                placeholder="Your detailed message or inquiry..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Transmit Dispatch to Editor</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
