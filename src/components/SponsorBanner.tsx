import React from 'react';
import { Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { SiteSettings } from '../types';

interface SponsorBannerProps {
  sponsor: SiteSettings['sponsorBanner'];
}

export const SponsorBanner: React.FC<SponsorBannerProps> = ({ sponsor }) => {
  if (!sponsor || !sponsor.enabled || !sponsor.sponsorName?.trim() || !sponsor.url?.trim()) {
    return null;
  }

  return (
    <div className="w-full my-8">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-md group hover:border-[var(--color-accent)] transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[var(--color-accent)] uppercase font-bold px-2 py-0.5 rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {sponsor.label || 'PRESENTED BY'}
              </span>
              {sponsor.badgeText && (
                <span className="text-[10px] font-mono tracking-widest text-[var(--color-text-muted)] uppercase">
                  {sponsor.badgeText}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <h4 className="font-heading font-bold text-[var(--color-text-primary)] text-base sm:text-lg tracking-tight">
                {sponsor.sponsorName || 'Advertise in this space'}
              </h4>
              <span className="hidden sm:inline text-[var(--color-text-dim)]">—</span>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-body">
                {sponsor.tagline || 'Reserve sponsor placement across Vertex Theory dispatches and digital journals.'}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <a
              href={sponsor.url || '#'}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm"
            >
              <span>{sponsor.ctaText || 'Learn More'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
