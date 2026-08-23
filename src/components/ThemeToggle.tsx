import React from 'react';
import { Sun, Moon, BookOpen } from 'lucide-react';
import { Theme } from '../types';

interface ThemeToggleProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  variant?: 'compact' | 'full';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  currentTheme,
  onThemeChange,
  variant = 'compact',
}) => {
  const themes: Array<{
    id: Theme;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }> = [
    {
      id: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Soft off-white & charcoal (Primary)',
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Obsidian dark mode',
    },
    {
      id: 'sepia',
      label: 'Sepia',
      icon: BookOpen,
      description: 'Warm editorial paper',
    },
  ];

  if (variant === 'full') {
    return (
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = currentTheme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
              }`}
              title={t.description}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div 
      className="inline-flex items-center p-1 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] shadow-inner"
      role="radiogroup"
      aria-label="Color theme selection"
    >
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = currentTheme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onThemeChange(t.id)}
            role="radio"
            aria-checked={isActive}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 ${
              isActive
                ? 'bg-[var(--color-surface-card)] text-[var(--color-accent)] shadow-sm font-semibold border border-[var(--color-border)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
            }`}
            title={`${t.label} Theme — ${t.description}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px]">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
