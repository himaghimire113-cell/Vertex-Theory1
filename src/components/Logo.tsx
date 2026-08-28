import React from 'react';
import logoImage from '../assets/images/vertex_theory_logo_1787896304762.jpg';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
  useImage?: boolean;
  customLogoUrl?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textClassName = '',
  subtitle,
  useImage = false,
  customLogoUrl,
}) => {
  // Dimension mapping
  const getDimension = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs': return 24;
      case 'sm': return 32;
      case 'md': return 40;
      case 'lg': return 52;
      case 'xl': return 72;
      default: return 40;
    }
  };

  const dim = getDimension();
  const activeLogoSrc = customLogoUrl || logoImage;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Emblem Icon Container */}
      <div 
        style={{ width: `${dim}px`, height: `${dim}px` }} 
        className="relative shrink-0 rounded-xl overflow-hidden bg-emerald-950/10 dark:bg-emerald-900/20 border border-[var(--color-border)] shadow-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
      >
        {useImage ? (
          <img 
            src={activeLogoSrc} 
            alt="Vertex Theory Logo" 
            className="w-full h-full object-cover rounded-xl"
            referrerPolicy="no-referrer"
          />
        ) : (
          <svg 
            viewBox="0 0 120 120" 
            className="w-full h-full p-1 drop-shadow-xs"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Circle / Soft Base */}
            <circle cx="60" cy="60" r="54" className="fill-emerald-900/10 dark:fill-emerald-950/40" />
            
            {/* Head Silhouette + Face Profile (Emerald Green) */}
            <path
              d="M74 36C68 28 58 26 50 29C42 32 36 39 36 49C36 60 41 71 49 79C56 86 63 92 63 97C63 97 73 97 78 88C83 79 81 72 80 67C84 65 87 60 85 55C83 50 81 50 82 46C83 42 81 39 74 36Z"
              className="fill-[#1b4332] dark:fill-[#2d6a4f]"
            />

            {/* Organic Botanical Leaf Silhouette (Left Upper) */}
            <path
              d="M38 48C38 32 50 24 64 24C64 36 54 48 38 48Z"
              className="fill-[#2d6a4f] dark:fill-[#40916c]"
            />
            {/* Leaf Vein (Warm Ochre / Gold) */}
            <path
              d="M40 46C46 41 54 33 62 26M49 39L53 43M44 43L47 46"
              stroke="#d4a373"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Neural / Molecular Network Nodes (Golden Ochre Nodes & Connectors) */}
            {/* Edge Lines */}
            <line x1="53" y1="58" x2="63" y2="53" stroke="#d4a373" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="63" y1="53" x2="69" y2="44" stroke="#d4a373" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="69" y1="44" x2="74" y2="50" stroke="#d4a373" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="63" y1="53" x2="55" y2="62" stroke="#d4a373" strokeWidth="2" strokeLinecap="round" />

            {/* Nodes (Circles) */}
            <circle cx="53" cy="58" r="4.5" className="fill-[#1b4332] dark:fill-[#2d6a4f]" stroke="#d4a373" strokeWidth="2" />
            <circle cx="63" cy="53" r="5" className="fill-[#1b4332] dark:fill-[#2d6a4f]" stroke="#d4a373" strokeWidth="2" />
            <circle cx="69" cy="44" r="3.5" fill="#d4a373" />
            <circle cx="74" cy="50" r="4.5" fill="#c59b48" />
            <circle cx="55" cy="62" r="3.5" fill="#c59b48" />
          </svg>
        )}
      </div>

      {/* Brand Text Typography */}
      {showText && (
        <div className="min-w-0">
          <span className={`font-heading font-bold tracking-tight text-[var(--color-text-primary)] block leading-none ${textClassName || (dim >= 48 ? 'text-2xl' : dim >= 36 ? 'text-lg sm:text-xl' : 'text-base')}`}>
            Vertex Theory
          </span>
          {subtitle && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-dim)] block mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
