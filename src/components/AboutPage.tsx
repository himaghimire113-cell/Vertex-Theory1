import React from 'react';
import { Sparkles, Twitter, Instagram, Github, Linkedin } from 'lucide-react';
import { SiteSettings } from '../types';
import { NewsletterSection } from './NewsletterSection';
import { navigateTo } from '../utils/helpers';

interface AboutPageProps {
  settings: SiteSettings;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-accent)] font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>EDITORIAL MANIFESTO</span>
        </div>
        <h1 className="font-heading font-bold text-3xl sm:text-5xl text-[var(--color-text-primary)] tracking-tight leading-tight">
          Engineering the Aesthetics of Latent Computation
        </h1>
        <p className="font-heading font-medium text-lg sm:text-xl text-[var(--color-text-muted)] leading-relaxed max-w-2xl">
          Vertex Theory is an independent journal investigating the mathematical, typographical, and physical boundaries of digital craft.
        </p>
      </div>

      {/* Hero Visual Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] relative overflow-hidden shadow-md">
        <div className="space-y-6 max-w-2xl relative z-10">
          <h3 className="font-heading font-bold text-2xl text-[var(--color-text-primary)]">
            Our Core Principles
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center font-mono font-bold text-xs">
                01
              </div>
              <h4 className="font-heading font-semibold text-base text-[var(--color-text-primary)]">Tactile Physics</h4>
              <p className="text-xs sm:text-sm font-body text-[var(--color-text-muted)] leading-relaxed">
                Screen glass should respond with harmonic inertia. Every gesture must mirror natural deceleration and kinetic spring tension.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center font-mono font-bold text-xs">
                02
              </div>
              <h4 className="font-heading font-semibold text-base text-[var(--color-text-primary)]">Typographic Gravity</h4>
              <p className="text-xs sm:text-sm font-body text-[var(--color-text-muted)] leading-relaxed">
                Content is not poured into templates. Proportions, step ratios, and optical tracking establish the emotional cadence of every thought.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center font-mono font-bold text-xs">
                03
              </div>
              <h4 className="font-heading font-semibold text-base text-[var(--color-text-primary)]">Architectural Resilience</h4>
              <p className="text-xs sm:text-sm font-body text-[var(--color-text-muted)] leading-relaxed">
                Built to endure. Utilizing query-param URL preservation, defensive long-polling, and lightweight static rendering that thrives anywhere.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center font-mono font-bold text-xs">
                04
              </div>
              <h4 className="font-heading font-semibold text-base text-[var(--color-text-primary)]">Curated Integrity</h4>
              <p className="text-xs sm:text-sm font-body text-[var(--color-text-muted)] leading-relaxed">
                Every hardware recommendation, affiliate reference, and sponsored partnership is rigorously vetted by our editorial desk.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Author Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">
        <img
          src={settings.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'}
          alt={settings.authorName || 'Author'}
          className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-accent)] shadow-md"
        />
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-[10px] font-mono text-[var(--color-accent)] uppercase font-bold tracking-widest">
            FOUNDER & PRINCIPAL THEORIST
          </span>
          <h3 className="font-heading font-bold text-2xl text-[var(--color-text-primary)]">
            {settings.authorName || 'Julian Vance'}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-body leading-relaxed">
            {settings.authorBio || 'Architectural technologist and design theorist examining algorithmic interfaces, typography, and human-computer symbiosis.'}
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-mono text-[var(--color-text-secondary)]">
            <button
              type="button"
              onClick={() => navigateTo({ page: 'about' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-secondary)] hover:bg-[var(--color-accent)] hover:text-white border border-[var(--color-border)] transition-colors cursor-pointer text-xs font-medium"
              title={`View ${settings.authorName || 'Julian Vance'} on Instagram`}
            >
              <Instagram className="w-3.5 h-3.5 text-pink-500" />
              <span>Instagram</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo({ page: 'about' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-secondary)] hover:bg-[var(--color-accent)] hover:text-white border border-[var(--color-border)] transition-colors cursor-pointer text-xs font-medium"
              title={`View ${settings.authorName || 'Julian Vance'} on X / Twitter`}
            >
              <Twitter className="w-3.5 h-3.5 text-sky-500" />
              <span>Twitter / X</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo({ page: 'about' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-secondary)] hover:bg-[var(--color-accent)] hover:text-white border border-[var(--color-border)] transition-colors cursor-pointer text-xs font-medium"
              title={`View ${settings.authorName || 'Julian Vance'} on GitHub`}
            >
              <Github className="w-3.5 h-3.5 text-[var(--color-text-primary)]" />
              <span>GitHub</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo({ page: 'about' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-secondary)] hover:bg-[var(--color-accent)] hover:text-white border border-[var(--color-border)] transition-colors cursor-pointer text-xs font-medium"
              title={`View ${settings.authorName || 'Julian Vance'} on LinkedIn`}
            >
              <Linkedin className="w-3.5 h-3.5 text-blue-600" />
              <span>LinkedIn</span>
            </button>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <NewsletterSection source="about-page" />
    </div>
  );
};
