import React, { useEffect } from 'react';
import { SiteSettings } from '../types';

interface AdsterraScriptProps {
  adsterra?: SiteSettings['adsterra'];
}

export const AdsterraScript: React.FC<AdsterraScriptProps> = ({ adsterra }) => {
  useEffect(() => {
    // Helper to safely clean up previously injected script elements
    const cleanupInjected = () => {
      document.querySelectorAll('[data-adsterra-global]').forEach((el) => el.remove());
    };

    cleanupInjected();

    if (!adsterra?.enabled) {
      return;
    }

    // Collect all global snippets (Popunder, Social Bar, Universal code)
    const snippetsToInject: string[] = [];

    if (adsterra.popunderCode?.trim()) {
      snippetsToInject.push(adsterra.popunderCode.trim());
    }
    if (adsterra.socialBarCode?.trim()) {
      snippetsToInject.push(adsterra.socialBarCode.trim());
    }
    if (adsterra.code?.trim()) {
      snippetsToInject.push(adsterra.code.trim());
    }

    if (snippetsToInject.length === 0) {
      return;
    }

    snippetsToInject.forEach((rawSnippet) => {
      try {
        if (rawSnippet.includes('<script')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(rawSnippet, 'text/html');
          const scriptTags = Array.from(doc.querySelectorAll('script'));

          scriptTags.forEach((oldScript) => {
            const newScript = document.createElement('script');
            newScript.setAttribute('data-adsterra-global', 'true');

            Array.from(oldScript.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value);
            });

            if (oldScript.innerHTML) {
              newScript.textContent = oldScript.innerHTML;
            }

            document.head.appendChild(newScript);
          });
        } else {
          // Direct URL or JS
          const script = document.createElement('script');
          script.setAttribute('data-adsterra-global', 'true');
          script.type = 'text/javascript';

          if (
            rawSnippet.startsWith('http://') ||
            rawSnippet.startsWith('https://') ||
            rawSnippet.startsWith('//')
          ) {
            script.src = rawSnippet;
          } else {
            script.textContent = rawSnippet;
          }

          document.head.appendChild(script);
        }
      } catch (err) {
        console.error('Failed to inject global Adsterra script:', err);
      }
    });

    return () => {
      cleanupInjected();
    };
  }, [
    adsterra?.enabled,
    adsterra?.popunderCode,
    adsterra?.socialBarCode,
    adsterra?.code
  ]);

  return null;
};
