import React, { useEffect, useRef } from 'react';

interface NativeBannerAdProps {
  className?: string;
  showLabel?: boolean;
}

export const NativeBannerAd: React.FC<NativeBannerAdProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only execute in browser environment
    if (typeof window === 'undefined') return;

    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // Check if script is already injected in this container
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
    <div className={`w-full my-8 flex flex-col items-center justify-center not-prose ${className}`}>
      {showLabel && (
        <div className="w-full max-w-[65ch] flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-[var(--color-border)] text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-dim)]">
          <span>SPONSORED DISPATCH</span>
          <span>ADVERTISEMENT</span>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="w-full max-w-[65ch] flex items-center justify-center min-h-[90px] overflow-hidden rounded-xl bg-[var(--color-surface)]/60 border border-[var(--color-border)] p-2.5 transition-all shadow-sm"
      >
        <div id="container-5e88f00b532d9ce289162fa4d4e64cf8" className="w-full flex justify-center items-center"></div>
      </div>
    </div>
  );
};
