import React from 'react';
import { Clock, ArrowUpRight, Sparkles } from 'lucide-react';
import { Post } from '../types';
import { resolveDirectImageUrl, formatEditorialDate, navigateTo } from '../utils/helpers';

interface HeroFeaturedProps {
  post: Post;
  onLike?: (postId: string) => void;
}

export const HeroFeatured: React.FC<HeroFeaturedProps> = ({ post }) => {
  const imageUrl = resolveDirectImageUrl(post.coverImage);

  const handleClick = () => {
    navigateTo({ post: post.slug || post.id });
  };

  return (
    <div className="relative my-6 sm:my-8 group w-full max-w-full min-w-0">
      <div 
        onClick={handleClick}
        className="cursor-pointer block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-all duration-300 shadow-md hover:shadow-xl w-full max-w-full min-w-0"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 w-full max-w-full min-w-0">
          {/* Image Canvas */}
          <div className="lg:col-span-7 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto min-h-[260px] sm:min-h-[360px] overflow-hidden bg-[var(--color-surface-secondary)] w-full max-w-full min-w-0">
            <img
              src={imageUrl}
              alt={post.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[var(--color-surface)] opacity-75"></div>

            {/* Featured Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-accent)] text-xs font-mono font-bold tracking-wider uppercase shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Lead Dispatch</span>
            </div>
          </div>

          {/* Editorial Content */}
          <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 w-full max-w-full min-w-0">
            <div className="space-y-4 w-full max-w-full min-w-0">
              {/* Category & Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--color-text-muted)]">
                <span className="px-2.5 py-0.5 rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-accent)] font-semibold uppercase tracking-wider border border-[var(--color-border)]">
                  {post.category}
                </span>
                <span>•</span>
                <span>{formatEditorialDate(post.createdAt)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  {post.readTime}
                </span>
              </div>

              {/* Title: Plus Jakarta Sans Bold */}
              <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-3xl xl:text-4xl text-[var(--color-text-primary)] tracking-tight leading-[1.15] group-hover:text-[var(--color-accent)] transition-colors duration-200 break-words">
                {post.title}
              </h2>

              {/* Excerpt: Plus Jakarta Sans Medium */}
              <p className="font-heading font-medium text-[var(--color-text-muted)] text-sm sm:text-base leading-relaxed line-clamp-3 break-words">
                {post.excerpt}
              </p>
            </div>

            {/* Author Footer & CTA */}
            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                  alt={post.author?.name || 'Author'}
                  className="w-9 h-9 rounded-full object-cover border border-[var(--color-border)]"
                />
                <div>
                  <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {post.author?.name || 'Julian Vance'}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] font-mono">
                    {post.author?.role || 'Author & Theorist'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] group-hover:translate-x-1 transition-transform">
                  <span>Read Dispatch</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
