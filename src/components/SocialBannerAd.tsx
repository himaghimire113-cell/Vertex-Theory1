import React, { useEffect, useRef } from 'react';

interface SocialBannerAdProps {
  className?: string;
  showLabel?: boolean;
}

export const SocialBannerAd: React.FC<SocialBannerAdProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only load in browser environment
    if (typeof window === 'undefined') return;

    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // Check if script is already present inside container
    const existingScript = currentContainer.querySelector('script[src*="5e88f00b532d9ce289162fa4d4e64cf8"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl31020947.profitableratecpmnetwork.com/5e88f00b532d9ce289162fa4d4e64cf8/invoke.js';
      currentContainer.appendChild(script);
    }
  }, []);

  return (
    <div className={`w-full my-6 flex flex-col items-center justify-center ${className}`}>
      {showLabel && (
        <div className="w-full flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[var(--color-border)] text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-dim)]">
          <span>SPONSORED PARTNER</span>
          <span>ADVERTISEMENT</span>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="w-full flex items-center justify-center min-h-[90px] overflow-hidden rounded-xl bg-[var(--color-surface)]/50 border border-[var(--color-border)] p-2 transition-all"
      >
        <div id="container-5e88f00b532d9ce289162fa4d4e64cf8" className="w-full flex justify-center items-center"></div>
      </div>
    </div>
  );
};
