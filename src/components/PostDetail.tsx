import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Heart, 
  Share2, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Twitter, 
  Linkedin, 
  Instagram,
  Facebook,
  MessageCircle,
  Loader2,
  Tag,
  Lock,
  Unlock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Post, PostComment, SiteSettings } from '../types';
import { 
  resolveDirectImageUrl, 
  formatEditorialDate, 
  navigateTo, 
  getPostShareUrl,
  extractContentPreview 
} from '../utils/helpers';
import { 
  fetchCommentsForPost, 
  addPostComment, 
  sendReaderMessage, 
  incrementPostLikes 
} from '../firebaseConfig';
import { SponsorBanner } from './SponsorBanner';
import { NewsletterSection } from './NewsletterSection';
import { ArticleRenderer } from './ArticleRenderer';

interface PostDetailProps {
  post: Post;
  settings: SiteSettings;
  allPosts: Post[];
}

export const PostDetail: React.FC<PostDetailProps> = ({
  post,
  settings,
  allPosts,
}) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Message author state
  const [msgName, setMsgName] = useState('');
  const [msgEmail, setMsgEmail] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);

  // Reading progress
  const [readingProgress, setReadingProgress] = useState(0);

  // Content lock / Preview gate state
  const isLockEnabled = settings.contentLock ? settings.contentLock.enabled : true;
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (!isLockEnabled) return true;
    try {
      const sessionKey = `unlocked_post_${post.id}`;
      const slugKey = `unlocked_post_${post.slug}`;
      return (
        sessionStorage.getItem(sessionKey) === 'true' ||
        localStorage.getItem(sessionKey) === 'true' ||
        sessionStorage.getItem(slugKey) === 'true' ||
        localStorage.getItem(slugKey) === 'true'
      );
    } catch {
      return false;
    }
  });

  const [isUnlocking, setIsUnlocking] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Re-sync unlock status when post changes
  useEffect(() => {
    setIsUnlocking(false);
    setCountdown(3);
    if (!isLockEnabled) {
      setIsUnlocked(true);
      return;
    }
    try {
      const sessionKey = `unlocked_post_${post.id}`;
      const slugKey = `unlocked_post_${post.slug}`;
      const unlocked =
        sessionStorage.getItem(sessionKey) === 'true' ||
        localStorage.getItem(sessionKey) === 'true' ||
        sessionStorage.getItem(slugKey) === 'true' ||
        localStorage.getItem(slugKey) === 'true';
      setIsUnlocked(unlocked);
    } catch {
      setIsUnlocked(false);
    }
  }, [post.id, post.slug, isLockEnabled]);

  // When the user switches back/focuses this window (the "come back" moment), verify unlock
  useEffect(() => {
    const handleComebackCheck = () => {
      try {
        const sessionKey = `unlocked_post_${post.id}`;
        const slugKey = `unlocked_post_${post.slug}`;
        if (
          sessionStorage.getItem(sessionKey) === 'true' ||
          localStorage.getItem(sessionKey) === 'true' ||
          sessionStorage.getItem(slugKey) === 'true' ||
          localStorage.getItem(slugKey) === 'true'
        ) {
          setIsUnlocked(true);
        }
      } catch {}
    };

    window.addEventListener('focus', handleComebackCheck);
    document.addEventListener('visibilitychange', handleComebackCheck);
    return () => {
      window.removeEventListener('focus', handleComebackCheck);
      document.removeEventListener('visibilitychange', handleComebackCheck);
    };
  }, [post.id, post.slug]);

  // Click unlock trigger: runs 3s countdown, then button is gone and full post appears!
  // Never redirects to the website homepage.
  const handleUnlockClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isUnlocking || isUnlocked) return;

    // Check if an external ad URL is configured.
    // NEVER redirect to or open the homepage, same origin, or relative paths!
    const configuredAdUrl = settings.contentLock?.adUrl?.trim() || '';
    const isHomePageOrEmpty =
      !configuredAdUrl ||
      configuredAdUrl === '/' ||
      configuredAdUrl === '#' ||
      configuredAdUrl.includes('vertextheory.online') ||
      (typeof window !== 'undefined' && (
        configuredAdUrl === window.location.origin ||
        configuredAdUrl === window.location.origin + '/' ||
        configuredAdUrl.includes(window.location.hostname)
      ));

    // If an external ad network link (Monetag, CPA, Adsterra, etc.) is configured, trigger it in a new window/tab:
    if (!isHomePageOrEmpty && (configuredAdUrl.startsWith('http://') || configuredAdUrl.startsWith('https://'))) {
      try {
        const popWin = window.open(configuredAdUrl, '_blank');
        if (popWin) {
          try {
            popWin.blur();
            window.focus();
          } catch {}
        }
      } catch (err) {
        console.warn('Popunder trigger error:', err);
      }
    }

    // Start 3-second countdown
    setIsUnlocking(true);
    setCountdown(3);

    let secondsLeft = 3;
    const timer = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setCountdown(secondsLeft);
      } else {
        clearInterval(timer);
        setCountdown(0);
        setIsUnlocking(false);
        setIsUnlocked(true);

        // Permanently record unlock for this post
        try {
          const sessionKey = `unlocked_post_${post.id}`;
          const slugKey = `unlocked_post_${post.slug}`;
          sessionStorage.setItem(sessionKey, 'true');
          localStorage.setItem(sessionKey, 'true');
          sessionStorage.setItem(slugKey, 'true');
          localStorage.setItem(slugKey, 'true');
        } catch (err) {
          console.warn('Storage save error:', err);
        }

        // Celebrate with confetti as full post appears
        try {
          confetti({
            particleCount: 50,
            spread: 75,
            origin: { y: 0.6 }
          });
        } catch {}
      }
    }, 1000);
  };

  const imageUrl = resolveDirectImageUrl(post.coverImage);

  // Update Dynamic Document Meta & Open Graph Tags
  useEffect(() => {
    document.title = `${post.title} — Vertex Theory`;

    // Dynamic Meta updates
    const setMetaTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag('og:title', post.title);
    setMetaTag('og:description', post.excerpt || post.title);
    setMetaTag('og:image', imageUrl);
    setMetaTag('og:type', 'article');
    setMetaTag('og:url', window.location.href);

    // Scroll progress handler
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Load comments
    fetchCommentsForPost(post.id).then((res) => setComments(res));

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [post.id, post.title, post.excerpt, imageUrl]);

  const handleLike = async (e: React.MouseEvent) => {
    if (hasLiked) return;
    setHasLiked(true);
    const updated = await incrementPostLikes(post.id);
    setLikes(updated);

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
        colors: ['#b84825', '#ff5533', '#ffffff', '#fb923c']
      });
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = getPostShareUrl(post);
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareNative = async () => {
    const shareUrl = getPostShareUrl(post);
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleShareSocial = (platform: 'twitter' | 'linkedin' | 'facebook' | 'whatsapp') => {
    const shareUrl = getPostShareUrl(post);
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(post.title);
    let targetUrl = '';

    if (platform === 'twitter') {
      targetUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
    } else if (platform === 'linkedin') {
      targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    } else if (platform === 'facebook') {
      targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === 'whatsapp') {
      targetUrl = `https://api.whatsapp.com/send?text=${title}%20${url}`;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer,width=600,height=450');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !commentEmail.trim()) return;

    setSubmittingComment(true);
    try {
      const created = await addPostComment({
        postId: post.id,
        authorName: commentName || 'Anonymous Reader',
        authorEmail: commentEmail,
        content: commentText
      });
      setComments([created, ...comments]);
      setCommentText('');
      setCommentName('');
      setCommentEmail('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgBody.trim() || !msgEmail.trim()) return;

    setSendingMsg(true);
    try {
      await sendReaderMessage({
        postId: post.id,
        postTitle: post.title,
        senderName: msgName || 'Reader',
        senderEmail: msgEmail,
        message: msgBody
      });
      setMsgBody('');
      setMsgName('');
      setMsgEmail('');
      setMsgSuccess(true);
      setTimeout(() => setMsgSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && p.published)
    .slice(0, 2);

  return (
    <div className="min-h-screen pb-20 w-full max-w-full overflow-x-hidden">
      {/* Dynamic Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-[var(--color-accent)] z-50 transition-all duration-100 ease-out max-w-full"
        style={{ width: `${Math.min(readingProgress, 100)}%` }}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 w-full min-w-0 overflow-x-hidden">
        {/* Back Link */}
        <button
          onClick={() => navigateTo({ page: 'home', post: undefined })}
          className="inline-flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>BACK TO ALL DISPATCHES</span>
        </button>

        {/* Article Header */}
        <header className="space-y-5 pb-8 border-b border-[var(--color-border)] w-full min-w-0">
          {/* Category & Read Time */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--color-text-muted)]">
            <span className="px-3 py-1 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-accent)] font-semibold uppercase tracking-wider border border-[var(--color-border)]">
              {post.category}
            </span>
            <span>•</span>
            <span>{formatEditorialDate(post.createdAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
              <Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              {post.readTime}
            </span>
          </div>

          {/* Rule 1: Blog Title (H1) - Plus Jakarta Sans, 700 Bold, Desktop 36-42px | Mobile 28-32px, LH 1.2, Tracking -0.02em */}
          <h1 className="blog-title font-heading font-bold text-[28px] sm:text-[32px] md:text-[40px] leading-[1.2] tracking-[-0.02em] text-[var(--color-text-primary)] break-words">
            {post.title}
          </h1>

          {/* Rule 2: Excerpt / Summary - Plus Jakarta Sans, 500 Medium, Desktop 18-20px | Mobile 16px, LH 1.5, 80% opacity / muted */}
          <p className="blog-excerpt font-heading font-medium text-[16px] md:text-[19px] leading-[1.5] text-[var(--color-text-muted)] opacity-90 max-w-[65ch] break-words">
            {post.excerpt}
          </p>

          {/* Author & Interactions Bar */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigateTo({ page: 'about' })}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
              title="Learn more about the author"
            >
              <img
                src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                alt={post.author?.name || 'Author'}
                className="w-11 h-11 rounded-full object-cover border-2 border-[var(--color-border)] group-hover:border-[var(--color-accent)] transition-colors"
              />
              <div>
                <div className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                  {post.author?.name || 'Julian Vance'}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] font-mono">
                  {post.author?.role || 'Principal Author & Theorist'}
                </div>
              </div>
            </button>

            {/* Social Share & Likes */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                  hasLiked
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-rose-500/50 hover:text-rose-500'
                }`}
                title="Like article"
              >
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
                <span>{likes}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Copy canonical link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleShareNative}
                className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/40 transition-colors sm:hidden"
                title="Share via device sheet"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleShareSocial('whatsapp')}
                className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[#25D366] hover:border-[#25D366]/40 transition-colors"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleShareSocial('facebook')}
                className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[#1877f2] hover:border-[#1877f2]/40 transition-colors"
                title="Share on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleShareSocial('twitter')}
                className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[#1da1f2] hover:border-[#1da1f2]/40 transition-colors"
                title="Share on X / Twitter"
              >
                <Twitter className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleShareSocial('linkedin')}
                className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[#0a66c2] hover:border-[#0a66c2]/40 transition-colors"
                title="Share on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Cover Canvas */}
        <div className="my-8 rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-secondary)] aspect-[4/5] max-w-xl mx-auto shadow-md relative">
          <img
            src={imageUrl}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Sponsor Banner if active */}
        <SponsorBanner sponsor={settings.sponsorBanner} />

        {/* Article Body: Preview with Popunder Unlock Trigger vs Full Unlocked Content */}
        {isUnlocked ? (
          <div className="pt-4 pb-12 transition-all duration-300">
            {isLockEnabled && (
              <div className="mb-6 p-3.5 sm:p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold">Full Article Unlocked • You have unrestricted access to this dispatch</span>
                </div>
                <span className="text-[10px] font-mono uppercase text-emerald-500/80 hidden sm:inline">Active Access</span>
              </div>
            )}
            <ArticleRenderer content={post.content} />
          </div>
        ) : (
          <div className="pt-4 pb-8 space-y-6">
            {/* Story Preview with Frosted Bottom Fade */}
            <div className="relative overflow-hidden max-h-[380px] rounded-b-2xl">
              <ArticleRenderer
                content={extractContentPreview(post.content, settings.contentLock?.previewParagraphs || 2)}
              />
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/90 to-transparent pointer-events-none" />
            </div>

            {/* HIGH-IMPACT UNLOCK CALLOUT CARD */}
            <div className="relative z-10 p-6 sm:p-8 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-accent)]/40 shadow-2xl text-center space-y-4 max-w-xl mx-auto backdrop-blur-md">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-xs font-mono text-[var(--color-accent)] font-semibold tracking-wider uppercase">
                <Lock className="w-3.5 h-3.5" />
                <span>Story Preview Mode</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xl sm:text-2xl text-[var(--color-text-primary)]">
                  Continue Reading Full Dispatch
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-[48ch] mx-auto leading-relaxed">
                  {settings.contentLock?.promptText ||
                    'You are viewing an introductory preview. Click below to support our independent publication and immediately unlock the complete essay, diagrams, and reference sources.'}
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={handleUnlockClick}
                  disabled={isUnlocking}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-heading font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg transition-all mx-auto active:scale-95 ${
                    isUnlocking
                      ? 'bg-emerald-600 shadow-emerald-600/30 cursor-wait'
                      : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] shadow-[var(--color-accent)]/30 hover:shadow-[var(--color-accent)]/50 transform hover:-translate-y-0.5 cursor-pointer group'
                  }`}
                >
                  {isUnlocking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Unlocking in {countdown}s...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      <span>{settings.contentLock?.buttonText || 'Click here and comeback'}</span>
                      <ExternalLink className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                {/* Visual countdown progress */}
                {isUnlocking ? (
                  <div className="max-w-xs mx-auto space-y-1 pt-1">
                    <div className="w-full bg-[var(--color-border)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${Math.max(15, ((3 - countdown + 0.5) / 3) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-mono text-emerald-500 font-medium">
                      Revealing full story in {countdown}s...
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] font-mono text-[var(--color-text-dim)]">
                    Click to unlock • Full dispatch appears after 3 seconds
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Embedded Affiliate Links Section if defined */}
        {post.affiliateLinks && post.affiliateLinks.length > 0 && (
          <div className="my-8 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] uppercase font-bold tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Affiliate & Curated References</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Dispatches on Vertex Theory may contain affiliate links. If you purchase through these links, we may earn an editorial commission at zero additional cost to you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {post.affiliateLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="p-3.5 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center justify-between group transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-[var(--color-text-dim)] uppercase block">
                      {link.label || 'Recommended'}
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                      {link.text}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-6 pb-10 border-t border-[var(--color-border)]">
            <span className="text-xs font-mono text-[var(--color-text-muted)] flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3 text-[var(--color-accent)]" />
              TOPICS:
            </span>
            {post.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-mono px-3 py-1 rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author Bio Box */}
        <div className="my-10 p-6 sm:p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">
          <img
            src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop'}
            alt={post.author?.name || 'Author'}
            className="w-20 h-20 rounded-full object-cover border-2 border-[var(--color-accent)] shrink-0 shadow-sm"
          />
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
              <span className="text-[10px] font-mono text-[var(--color-accent)] uppercase tracking-widest font-bold">
                {post.author?.role || 'PRINCIPAL AUTHOR & THEORIST'}
              </span>
              
              {/* Profile Social Icon Pills - visible and backtrack to site */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigateTo({ page: 'about' })}
                  className="p-1.5 rounded-lg bg-[var(--color-surface-secondary)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-text-secondary)] border border-[var(--color-border)] transition-colors cursor-pointer"
                  title={`View ${post.author?.name || 'Julian Vance'} on Instagram`}
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-500 hover:text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo({ page: 'about' })}
                  className="p-1.5 rounded-lg bg-[var(--color-surface-secondary)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-text-secondary)] border border-[var(--color-border)] transition-colors cursor-pointer"
                  title={`View ${post.author?.name || 'Julian Vance'} on X / Twitter`}
                >
                  <Twitter className="w-3.5 h-3.5 text-sky-500 hover:text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo({ page: 'about' })}
                  className="p-1.5 rounded-lg bg-[var(--color-surface-secondary)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-text-secondary)] border border-[var(--color-border)] transition-colors cursor-pointer"
                  title={`View ${post.author?.name || 'Julian Vance'} on LinkedIn`}
                >
                  <Linkedin className="w-3.5 h-3.5 text-blue-600 hover:text-white" />
                </button>
              </div>
            </div>

            <h4 className="font-heading font-bold text-xl text-[var(--color-text-primary)]">
              {post.author?.name || 'Julian Vance'}
            </h4>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
              {settings.authorBio || 'Architectural technologist and design theorist examining algorithmic interfaces, typography, and human-computer symbiosis.'}
            </p>
          </div>
        </div>

        {/* Newsletter Box */}
        <NewsletterSection source={`post-${post.slug}`} variant="inline" />

        {/* SECTION: MESSAGE THE AUTHOR DIRECTLY ON THIS POST */}
        <div className="my-12 p-6 sm:p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] uppercase font-bold tracking-wider">
            <Send className="w-3.5 h-3.5" />
            <span>DIRECT INQUIRY & FEEDBACK</span>
          </div>
          <h3 className="font-heading font-bold text-xl text-[var(--color-text-primary)]">
            Message the author about this dispatch
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            Have a question, collaboration inquiry, or rebuttal? Send a private dispatch directly to the desk. We review all correspondence.
          </p>

          {msgSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-600 dark:text-emerald-300 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Your message has been delivered to the author. Thank you for your note!</span>
            </div>
          ) : (
            <form onSubmit={handleMessageSubmit} className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={msgName}
                  onChange={(e) => setMsgName(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                />
                <input
                  type="email"
                  placeholder="Your Email (for response) *"
                  required
                  value={msgEmail}
                  onChange={(e) => setMsgEmail(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <textarea
                rows={3}
                placeholder="Your private note, question, or feedback..."
                required
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <button
                type="submit"
                disabled={sendingMsg}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-text-primary)] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 border border-[var(--color-border)]"
              >
                {sendingMsg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Private Message</span>
              </button>
            </form>
          )}
        </div>

        {/* SECTION: READER COMMENTS */}
        <section className="my-12 pt-8 border-t border-[var(--color-border)] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-xl text-[var(--color-text-primary)] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--color-accent)]" />
              <span>Discussion ({comments.length})</span>
            </h3>
          </div>

          {/* New Comment Form */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3 shadow-sm">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Join the conversation</h4>
            {commentSuccess ? (
              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Thank you! Your comment has been posted.</span>
              </div>
            ) : (
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                  <input
                    type="email"
                    placeholder="Email (not published) *"
                    required
                    value={commentEmail}
                    onChange={(e) => setCommentEmail(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
                <textarea
                  rows={3}
                  placeholder="Write a thoughtful comment..."
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  <span>Post Comment</span>
                </button>
              </form>
            )}
          </div>

          {/* Comments List */}
          <div className="space-y-4 pt-2">
            {comments.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] font-mono py-4 text-center">
                No comments yet. Be the first to start the discussion.
              </p>
            ) : (
              comments.map((comm) => (
                <div
                  key={comm.id}
                  className="p-4 sm:p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-[var(--color-text-primary)]">{comm.authorName}</span>
                    <span className="text-[var(--color-text-dim)]">{formatEditorialDate(comm.createdAt)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-body leading-relaxed max-w-[65ch]">
                    {comm.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="my-16 pt-10 border-t border-[var(--color-border)] space-y-6">
            <h3 className="font-heading font-bold text-2xl text-[var(--color-text-primary)]">
              Further Reading & Dispatches
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relatedPosts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => navigateTo({ post: rel.slug || rel.id })}
                  className="cursor-pointer group p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all space-y-3 shadow-sm"
                >
                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-[var(--color-surface-secondary)]">
                    <img
                      src={resolveDirectImageUrl(rel.coverImage)}
                      alt={rel.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-[var(--color-accent)] uppercase font-semibold">
                    {rel.category}
                  </div>
                  <h4 className="font-heading font-bold text-base text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-snug line-clamp-2">
                    {rel.title}
                  </h4>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
};
