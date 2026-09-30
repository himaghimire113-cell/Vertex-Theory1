import React, { useEffect, useRef } from 'react';

interface AdsterraScriptProps {
  adsterra?: {
    enabled: boolean;
    code: string;
  };
}

export const AdsterraScript: React.FC<AdsterraScriptProps> = ({ adsterra }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up any previously injected Adsterra elements
    const cleanupInjected = () => {
      document.querySelectorAll('[data-adsterra-injected]').forEach((el) => el.remove());
    };

    cleanupInjected();

    if (!adsterra?.enabled || !adsterra?.code?.trim()) {
      return;
    }

    const rawCode = adsterra.code.trim();

    try {
      // If the code contains HTML <script> tags, extract and execute them
      if (rawCode.includes('<script')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawCode, 'text/html');
        const scriptTags = Array.from(doc.querySelectorAll('script'));

        scriptTags.forEach((oldScript) => {
          const newScript = document.createElement('script');
          newScript.setAttribute('data-adsterra-injected', 'true');

          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          if (oldScript.innerHTML) {
            newScript.textContent = oldScript.innerHTML;
          }

          document.head.appendChild(newScript);
        });

        // Also append any non-script HTML elements (e.g. ad containers)
        if (containerRef.current) {
          const nonScriptNodes = Array.from(doc.body.childNodes).filter(
            (node) => node.nodeName.toLowerCase() !== 'script'
          );
          containerRef.current.innerHTML = '';
          nonScriptNodes.forEach((node) => {
            containerRef.current?.appendChild(node.cloneNode(true));
          });
        }
      } else {
        // Direct javascript or URL
        const script = document.createElement('script');
        script.setAttribute('data-adsterra-injected', 'true');
        script.type = 'text/javascript';

        if (rawCode.startsWith('http://') || rawCode.startsWith('https://') || rawCode.startsWith('//')) {
          script.src = rawCode;
        } else {
          script.textContent = rawCode;
        }

        document.head.appendChild(script);
      }
    } catch (err) {
      console.error('Failed to inject Adsterra ad network code:', err);
    }

    return () => {
      cleanupInjected();
    };
  }, [adsterra?.enabled, adsterra?.code]);

  return <div ref={containerRef} className="adsterra-container w-full empty:hidden" />;
};
