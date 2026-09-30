import React, { useMemo } from 'react';

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

  // Try to detect width and height if atOptions is provided in standard Adsterra code
  const { detectedWidth, detectedHeight } = useMemo(() => {
    const wMatch = trimmedCode.match(/['"]?width['"]?\s*:\s*(\d+)/i);
    const hMatch = trimmedCode.match(/['"]?height['"]?\s*:\s*(\d+)/i);

    return {
      detectedWidth: wMatch ? parseInt(wMatch[1], 10) : undefined,
      detectedHeight: hMatch ? parseInt(hMatch[1], 10) : undefined
    };
  }, [trimmedCode]);

  // Construct isolated srcdoc for the iframe so Adsterra scripts don't conflict or overwrite window variables
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
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  </style>
</head>
<body>
  ${trimmedCode}
</body>
</html>`;
  }, [trimmedCode]);

  // Determine frame styling based on detected dimensions or format
  const isLeaderboard = detectedWidth && detectedWidth >= 700;
  const isBox = detectedWidth && detectedWidth >= 250 && detectedWidth <= 350;

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
            height: detectedHeight ? `${detectedHeight}px` : format === 'native' ? '220px' : '120px',
            maxWidth: '100%',
            border: 'none',
            overflow: 'hidden'
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          loading="lazy"
        />
      </div>
    </div>
  );
};
