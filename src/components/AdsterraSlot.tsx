import React, { useMemo, useState, useEffect, useId } from 'react';

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
  if (!code || !code.trim()) {
    return null;
  }

  const trimmedCode = code.trim();
  const rawId = useId();
  const slotId = useMemo(() => `slot_${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId]);
  const [dynamicHeight, setDynamicHeight] = useState<number | undefined>(undefined);

  // Detect fixed dimensions from standard atOptions if present
  const { detectedWidth, detectedHeight } = useMemo(() => {
    const wMatch = trimmedCode.match(/['"]?width['"]?\s*:\s*(\d+)/i);
    const hMatch = trimmedCode.match(/['"]?height['"]?\s*:\s*(\d+)/i);

    return {
      detectedWidth: wMatch ? parseInt(wMatch[1], 10) : undefined,
      detectedHeight: hMatch ? parseInt(hMatch[1], 10) : undefined
    };
  }, [trimmedCode]);

  // Listen to height announcements from child iframe for responsive native banners
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.type === 'adsterra-slot-resize' &&
        event.data.slotId === slotId &&
        typeof event.data.height === 'number' &&
        event.data.height > 40
      ) {
        setDynamicHeight(Math.ceil(event.data.height) + 12);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [slotId]);

  // Construct isolated srcdoc so Adsterra scripts don't conflict or overwrite window variables
  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: transparent;
      ${format === 'banner' ? 'display: flex; justify-content: center; align-items: center; overflow: hidden;' : 'overflow-x: hidden;'}
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    div[id^="container-"] {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
    }
  </style>
</head>
<body>
  ${trimmedCode}
  <script>
    (function() {
      function notify() {
        try {
          var h = Math.max(
            document.body.scrollHeight || 0,
            document.documentElement.scrollHeight || 0,
            document.body.offsetHeight || 0
          );
          if (h > 40) {
            window.parent.postMessage({ type: 'adsterra-slot-resize', slotId: '${slotId}', height: h }, '*');
          }
        } catch(e) {}
      }
      window.addEventListener('load', notify);
      window.addEventListener('resize', notify);
      var c = 0;
      var interval = setInterval(function() {
        notify();
        c++;
        if (c > 20) clearInterval(interval);
      }, 400);
    })();
  </script>
</body>
</html>`;
  }, [trimmedCode, slotId]);

  const targetHeight = detectedHeight
    ? `${detectedHeight}px`
    : dynamicHeight
    ? `${dynamicHeight}px`
    : format === 'native'
    ? '260px'
    : '120px';

  return (
    <div className={`w-full my-8 flex flex-col items-center justify-center ${className}`}>
      {/* Editorial Sponsor Tag */}
      <div className="w-full flex items-center justify-between pb-2 px-1 max-w-4xl">
        <span className="text-[10px] font-mono tracking-widest text-[var(--color-text-dim)] uppercase">
          {label} • ADSTERRA NETWORK
        </span>
      </div>

      <div
        className="w-full flex justify-center items-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs transition-colors"
        style={{
          minHeight: detectedHeight ? `${detectedHeight}px` : format === 'native' ? '180px' : '100px'
        }}
      >
        <iframe
          title={`Adsterra ${format} unit`}
          srcDoc={srcDoc}
          style={{
            width: detectedWidth ? `${Math.min(detectedWidth, 1000)}px` : '100%',
            height: targetHeight,
            maxWidth: '100%',
            border: 'none',
            overflow: 'hidden',
            transition: 'height 0.25s ease'
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          loading="lazy"
        />
      </div>
    </div>
  );
};
