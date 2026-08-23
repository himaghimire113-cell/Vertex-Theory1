import React from 'react';
import { Shield } from 'lucide-react';
import { SiteSettings } from '../types';
import { navigateTo } from '../utils/helpers';

interface FooterProps {
  settings: SiteSettings;
  isAdminLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ settings, isAdminLoggedIn = false }) => {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] pt-14 pb-12 mt-20 transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 w-full min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white font-heading font-black text-base shadow-sm">
                V
              </div>
              <span className="font-heading font-bold text-xl text-[var(--color-text-primary)] tracking-tight">
                {settings.siteName || 'VERTEX THEORY'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-body leading-relaxed max-w-sm">
              {settings.tagline || 'Reflections on Visual Engineering, Design Philosophy & Digital Systems.'}
            </p>

            <div className="text-[11px] font-mono text-[var(--color-text-dim)] flex items-center gap-2 pt-2">
              <span>EST. 2026</span>
              <span>•</span>
              <span>INDEPENDENT MONOGRAPH</span>
            </div>
          </div>

          {/* Nav Col 1 */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="text-xs font-mono font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Navigation
            </h5>
            <ul className="space-y-2 text-xs font-body">
              <li>
                <button
                  onClick={() => navigateTo({ page: 'home', category: undefined, post: undefined })}
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  All Dispatches
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo({ page: 'home', category: 'visual-theory', post: undefined })}
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  Visual Theory
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo({ page: 'home', category: 'design-systems', post: undefined })}
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  Design Systems
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo({ page: 'home', category: 'computing', post: undefined })}
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  Computing & AI
                </button>
              </li>
            </ul>
          </div>

          {/* Nav Col 2 */}
          <div className="md:col-span-4 space-y-3">
            <h5 className="text-xs font-mono font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Publication
            </h5>
            <ul className="space-y-2 text-xs font-body">
              <li>
                <button
                  onClick={() => navigateTo({ page: 'about' })}
                  className="hover:text-[var(--color-accent)] transition-colors cursor-pointer"
                >
                  About the Journal
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo({ page: 'contact' })}
                  className="hover:text-[var(--color-accent)] transition-colors cursor-pointer"
                >
                  Send Direct Inquiry / Message
                </button>
              </li>
              {isAdminLoggedIn && (
                <li>
                  <button
                    onClick={() => navigateTo({ page: 'admin' })}
                    className="hover:text-[var(--color-accent)] transition-colors cursor-pointer flex items-center gap-1.5 text-[var(--color-text-secondary)] font-medium"
                  >
                    <Shield className="w-3 h-3 text-[var(--color-accent)]" />
                    <span>Admin & Editor Console</span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--color-text-dim)]">
          <div>
            © {new Date().getFullYear()} Vertex Theory. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            <span>Engineered with React 19 & Tailwind</span>
            <span>•</span>
            <span className="text-[var(--color-text-muted)]">3-Theme System</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
