import React, { useEffect, useRef } from 'react';
import { Sparkles, ExternalLink, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface AdBannerProps {
  slot?: string;
  format?: 'horizontal' | 'rectangle' | 'preview-showcase';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slot = '1234567890',
  format = 'horizontal',
  className = ''
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && !pushedRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      }
    } catch (e) {
      // AdSense push may throw if already initialized or blocked
    }
  }, []);

  if (format === 'preview-showcase') {
    return (
      <div className={`w-full my-6 space-y-4 ${className}`}>
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-dim)] uppercase tracking-wider px-1">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--color-accent)]" />
            SPONSORED HIGHLIGHTS & ADVERTISER NETWORK
          </span>
          <span className="text-[10px]">Verified Placements</span>
        </div>

        {/* AdSense Unit */}
        <div className="w-full min-h-[90px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 overflow-hidden text-center flex flex-col items-center justify-center relative shadow-sm">
          <span className="text-[9px] font-mono text-[var(--color-text-dim)] uppercase tracking-widest mb-1.5 block">
            ADVERTISEMENT • GOOGLE ADSENSE & PARTNER NETWORK
          </span>
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', minHeight: '90px', width: '100%' }}
            data-ad-client="ca-pub-5897761060403747"
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

        {/* High-craft editorial banner cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://vertex-theory1.kaflea991.workers.dev/?ref=banner_hardware"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:border-[var(--color-accent)] transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[var(--color-accent)] uppercase tracking-wider">
                  FEATURED HARDWARE
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
              </div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                Ultra-Precision 5K Studio Displays
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Experience zero-distortion color calibration and nano-texture anti-glare glass for modern creative workstations.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-accent)]">
              <span>View Specifications & Offers</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </a>

          <a
            href="https://vertex-theory1.kaflea991.workers.dev/?ref=banner_tools"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:border-[var(--color-accent)] transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider">
                  DESIGN ARCHITECTURE
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-emerald-500 transition-colors" />
              </div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors">
                System Font Foundry & Kinetic Toolkits
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Next-generation variable typography engines and physics-based spring damping curves for digital products.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
              <span>Explore The Suite</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full my-8 ${className}`}>
      <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 shadow-sm text-center relative overflow-hidden group hover:border-[var(--color-border-hover,var(--color-accent))] transition-colors">
        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-dim)] uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1 text-[var(--color-accent)] font-semibold">
            <ShieldCheck className="w-3 h-3" />
            ADVERTISEMENT
          </span>
          <span>SPONSORED NETWORK</span>
        </div>

        {/* AdSense Unit */}
        <div className="w-full min-h-[90px] flex items-center justify-center overflow-hidden">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', minHeight: '90px', width: '100%' }}
            data-ad-client="ca-pub-5897761060403747"
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

        <div className="mt-2 text-[10px] font-mono text-[var(--color-text-dim)] flex items-center justify-center gap-2">
          <span>Targeted relevant sponsor content</span>
          <span>•</span>
          <a
            href="https://vertex-theory1.kaflea991.workers.dev/?ref=advertise"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-accent)] transition-colors underline underline-offset-2"
          >
            Advertise with us
          </a>
        </div>
      </div>
    </div>
  );
};
