import React, { useMemo, useEffect, useId, useRef } from 'react';

interface AdsterraSlotProps {
  code?: string;
  format?: 'banner' | 'native';
  className?: string;
  label?: string;
}

export const AdsterraSlot: React.FC<AdsterraSlotProps> = ({
  code,
  format = 'banner',
  className = '',
  label = 'SPONSORED'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const slotId = useMemo(() => `adslot_${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !code || !code.trim()) return;

    // Clear previous children on mount/update
    container.innerHTML = '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = code.trim();

    // 1. Move all non-script elements (like <div id="container-...">) directly into the page DOM
    const nonScripts = Array.from(tempDiv.childNodes).filter(
      (node) => node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() !== 'script'
    );

    nonScripts.forEach((el) => {
      container.appendChild(el.cloneNode(true));
    });

    // 2. Extract and create executable script tags so they run in the actual window (vertextheory.online)
    const scripts = Array.from(tempDiv.querySelectorAll('script'));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      newScript.type = oldScript.type || 'text/javascript';

      // Copy attributes (async, data-cfasync, crossorigin, etc.)
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }

      container.appendChild(newScript);
    });

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [code]);

  if (!code || !code.trim()) return null;

  return (
    <div className={`w-full my-6 flex flex-col items-center justify-center ${className}`}>
      {/* Editorial Sponsor Tag */}
      <div className="w-full flex items-center justify-center pb-2 px-1 max-w-xl">
        <span className="text-[10px] font-mono tracking-widest text-[var(--color-text-dim)] uppercase">
          {label}
        </span>
      </div>

      {/* Direct DOM Ad Container without hollow white boxes or placeholder borders */}
      <div
        ref={containerRef}
        id={slotId}
        className="w-full flex justify-center items-center overflow-visible min-h-[50px] transition-all bg-transparent"
        style={{
          minHeight: format === 'banner' ? '50px' : '60px'
        }}
      />
    </div>
  );
};
