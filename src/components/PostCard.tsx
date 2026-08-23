import React, { useState } from 'react';
import { Clock, Heart, ArrowUpRight, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Post } from '../types';
import { resolveDirectImageUrl, formatEditorialDate, navigateTo } from '../utils/helpers';
import { incrementPostLikes } from '../firebaseConfig';

interface PostCardProps {
  post: Post;
  variant?: 'grid' | 'compact' | 'horizontal';
  onLikeUpdated?: (postId: string, newCount: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  variant = 'grid',
  onLikeUpdated,
}) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const imageUrl = resolveDirectImageUrl(post.coverImage);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button[data-interactive="true"]')) {
      return;
    }
    navigateTo({ post: post.slug || post.id });
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) return;
    setHasLiked(true);
    const updated = await incrementPostLikes(post.id);
    setLikes(updated);
    if (onLikeUpdated) onLikeUpdated(post.id, updated);

    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight
        },
        colors: ['#b84825', '#ff5533', '#ffffff']
      });
    } catch {
      // fallback
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?post=${post.slug || post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert('Post link copied to clipboard!');
    }
  };

  if (variant === 'horizontal') {
    return (
      <article
        onClick={handleClick}
        className="cursor-pointer group flex flex-col sm:flex-row gap-5 p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all duration-200 shadow-sm w-full max-w-full min-w-0"
      >
        <div className="sm:w-48 h-36 rounded-xl overflow-hidden shrink-0 relative bg-[var(--color-surface-secondary)] w-full sm:max-w-[192px] border border-[var(--color-border)]">
          <img
            src={imageUrl}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[var(--color-surface)] text-[10px] font-mono text-[var(--color-accent)] uppercase font-bold border border-[var(--color-border)] shadow-xs">
            {post.category}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0 w-full max-w-full">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] mb-1.5 font-medium">
              <span className="text-[var(--color-text-secondary)]">{formatEditorialDate(post.createdAt)}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                <Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                {post.readTime}
              </span>
            </div>
            <h3 className="font-heading font-bold text-lg sm:text-xl text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-snug line-clamp-2 break-words">
              {post.title}
            </h3>
            <p className="font-heading font-normal text-xs sm:text-sm text-[var(--color-text-secondary)] line-clamp-2 mt-1.5 leading-relaxed break-words">
              {post.excerpt}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-border)] text-xs">
            <span className="text-[var(--color-text-primary)] font-semibold truncate max-w-[140px]">{post.author?.name || 'Julian Vance'}</span>
            <div className="flex items-center gap-3 shrink-0">
              <button
                data-interactive="true"
                onClick={handleLike}
                className={`flex items-center gap-1 transition-colors ${
                  hasLiked ? 'text-rose-500' : 'text-[var(--color-text-secondary)] hover:text-rose-500'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                <span className="font-mono font-medium">{likes}</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={handleClick}
      className="cursor-pointer group flex flex-col rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md w-full max-w-full min-w-0"
    >
      {/* Cover Canvas */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-secondary)] w-full max-w-full border-b border-[var(--color-border)]">
        <img
          src={imageUrl}
          alt={post.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Category Pill */}
        <div className="absolute top-3.5 left-3.5">
          <span className="px-2.5 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-accent)] text-[11px] font-mono font-bold uppercase tracking-wider shadow-sm">
            {post.category}
          </span>
        </div>
      </div>

      {/* Body Area */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4 w-full max-w-full min-w-0 bg-[var(--color-surface)]">
        <div className="space-y-2.5 w-full max-w-full min-w-0">
          {/* Date & Read Time */}
          <div className="flex items-center justify-between text-xs font-mono font-medium text-[var(--color-text-secondary)]">
            <span>{formatEditorialDate(post.createdAt)}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              {post.readTime}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-heading font-bold text-xl sm:text-2xl text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-snug break-words">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="font-heading font-normal text-xs sm:text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed break-words">
            {post.excerpt}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="pt-3.5 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <img
              src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
              alt={post.author?.name || 'Author'}
              className="w-6 h-6 rounded-full object-cover border border-[var(--color-border)]"
            />
            <span className="text-xs text-[var(--color-text-primary)] font-semibold truncate max-w-[120px]">
              {post.author?.name || 'Julian Vance'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              data-interactive="true"
              onClick={handleLike}
              className={`p-1.5 rounded-md hover:bg-[var(--color-surface-secondary)] flex items-center gap-1 transition-colors ${
                hasLiked ? 'text-rose-500' : 'text-[var(--color-text-secondary)] hover:text-rose-500'
              }`}
              title="Like this dispatch"
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
              <span className="text-[11px] font-mono font-medium">{likes}</span>
            </button>

            <button
              data-interactive="true"
              onClick={handleShare}
              className="p-1.5 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              title="Share link"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <div className="text-[var(--color-accent)] p-1 group-hover:translate-x-0.5 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
