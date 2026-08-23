import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Post } from '../types';
import { navigateTo } from '../utils/helpers';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  posts,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = posts.filter((p) => {
    if (!p.published) return false;
    const q = query.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const handleSelect = (post: Post) => {
    navigateTo({ post: post.slug || post.id });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-3">
          <Search className="w-5 h-5 text-[var(--color-accent)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dispatches, systems, visual theory, hardware..."
            className="flex-1 bg-transparent text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-dim)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs font-mono border border-[var(--color-border)]"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-[var(--color-border-subtle)]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[var(--color-text-muted)]">
              No matching dispatches found for "{query}"
            </div>
          ) : (
            filtered.map((post) => (
              <div
                key={post.id}
                onClick={() => handleSelect(post)}
                className="cursor-pointer p-3 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-accent)]">
                    <span className="uppercase font-semibold">{post.category}</span>
                    <span>•</span>
                    <span className="text-[var(--color-text-muted)]">{post.readTime}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] line-clamp-1 font-body">
                    {post.excerpt}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
