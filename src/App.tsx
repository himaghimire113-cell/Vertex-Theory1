import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Grid, 
  List, 
  ArrowRight,
  Search,
  X
} from 'lucide-react';
import { Post, SiteSettings, Theme } from './types';
import { 
  parseQueryParams, 
  navigateTo, 
  RouteParams 
} from './utils/helpers';
import { 
  fetchAllPosts, 
  fetchSiteSettings, 
  getCurrentAdminUser,
  subscribeToAuthState,
  AuthSessionUser 
} from './firebaseConfig';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroFeatured } from './components/HeroFeatured';
import { PostCard } from './components/PostCard';
import { PostDetail } from './components/PostDetail';
import { AdminPanel } from './components/AdminPanel';
import { AdminAuthGate } from './components/AdminAuthGate';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { SponsorBanner } from './components/SponsorBanner';
import { SocialBannerAd } from './components/SocialBannerAd';
import { NewsletterSection } from './components/NewsletterSection';
import { INITIAL_SITE_SETTINGS } from './data/defaultData';
import { trackPageView, trackPostView, trackSearch } from './utils/analytics';

export default function App() {
  const [route, setRoute] = useState<RouteParams>({ page: 'home' });
  const [posts, setPosts] = useState<Post[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'horizontal'>('grid');

  // 3-Theme State: 'light' (Primary/Default: Soft Off-White & Dark Charcoal), 'dark', 'sepia'
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('vertex_theme') as Theme;
    if (saved === 'sepia' || saved === 'dark' || saved === 'light') {
      return saved;
    }
    return 'light';
  });

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = `theme-${theme} scroll-smooth`;
    localStorage.setItem('vertex_theme', theme);
  }, [theme]);

  // Sync route on popstate or navigation event
  useEffect(() => {
    const handleLocationChange = () => {
      const current = parseQueryParams();
      setRoute(current);
      // Scroll to top on navigation
      window.scrollTo(0, 0);
    };

    handleLocationChange();

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('vertex_navigation', handleLocationChange);

    // Initial load of posts and settings from Firestore/Cache
    loadData();

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('vertex_navigation', handleLocationChange);
    };
  }, []);

  const loadData = async () => {
    try {
      const [fetchedPosts, fetchedSettings] = await Promise.all([
        fetchAllPosts(),
        fetchSiteSettings()
      ]);
      setPosts(fetchedPosts);
      setSettings(fetchedSettings);
    } catch (e) {
      console.error('Error loading app data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeUpdated = (postId: string, newCount: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: newCount } : p))
    );
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // If user starts typing a search query while on a post, about, or contact page, seamlessly navigate to home to show results
    if (query.trim() && route.page !== 'home' && route.page !== 'admin') {
      navigateTo({ page: 'home', category: undefined, post: undefined });
    }
  };

  const [adminUser, setAdminUser] = useState<AuthSessionUser | null>(getCurrentAdminUser());

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setAdminUser(user);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Selected single post for PostDetail view
  const currentPost = route.post
    ? posts.find((p) => p.slug === route.post || p.id === route.post)
    : null;

  // Track Google Analytics 4 page views on route changes
  useEffect(() => {
    const pageTitle = route.post 
      ? (currentPost ? `${currentPost.title} — Vertex Theory` : 'Dispatch — Vertex Theory')
      : route.page === 'about'
      ? 'About — Vertex Theory'
      : route.page === 'contact'
      ? 'Contact — Vertex Theory'
      : route.page === 'admin'
      ? 'Admin Console — Vertex Theory'
      : 'Vertex Theory — Thoughts on Design, Technology & Culture';

    trackPageView(window.location.pathname + window.location.search, pageTitle);

    if (currentPost) {
      trackPostView(currentPost);
    }
  }, [route.page, route.post, route.category, route.tag, currentPost?.id]);

  // Real-time query matching (case-insensitive against title, tags, and category)
  const effectiveQuery = searchQuery.trim().toLowerCase() || (route.search ? route.search.trim().toLowerCase() : '');

  // Helper to normalize category strings for accurate matching
  const normalizeCat = (cat?: string) => (cat || '').toLowerCase().replace(/[\s&_\-]+/g, '');

  // Filtered posts for HomePage
  const filteredPosts = posts.filter((p) => {
    if (!p.published && (!adminUser || route.page !== 'admin')) return false;
    if (route.category && route.category !== 'all' && normalizeCat(p.category) !== normalizeCat(route.category)) {
      return false;
    }
    if (selectedTag && (!p.tags || !p.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase()))) {
      return false;
    }
    if (effectiveQuery) {
      const matchTitle = p.title.toLowerCase().includes(effectiveQuery);
      const matchExcerpt = p.excerpt.toLowerCase().includes(effectiveQuery);
      const matchCategory = p.category?.toLowerCase().includes(effectiveQuery);
      const matchTags = p.tags && p.tags.some((t) => t.toLowerCase().includes(effectiveQuery));
      return matchTitle || matchExcerpt || matchCategory || matchTags;
    }
    return true;
  });

  // Featured post (only displayed when no active search query and on default all categories)
  const isSearching = Boolean(effectiveQuery);
  const isFiltered = Boolean(route.category && route.category !== 'all') || Boolean(selectedTag) || isSearching;

  const featuredPost = !isFiltered 
    ? (filteredPosts.find((p) => p.featured && p.published) || filteredPosts.find((p) => p.published))
    : null;

  // When filtered or when there are <= 1 total posts, display all filtered posts in the grid so nothing is hidden
  const regularPosts = (featuredPost && filteredPosts.length > 1)
    ? filteredPosts.filter((p) => p.id !== featuredPost.id)
    : filteredPosts;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col font-body transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      {/* Navigation Header with Hamburger Drawer Toggle & Expandable Search Input */}
      <Navbar
        settings={settings}
        currentRoute={route}
        isAdminLoggedIn={!!adminUser}
        theme={theme}
        onThemeChange={setTheme}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        posts={posts}
      />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden min-w-0">
        <AnimatePresence mode="wait">
          {/* 1. INDIVIDUAL POST VIEW (Query Param: ?post=slug) */}
          {route.page === 'post' && currentPost && (
            <motion.div
              key={currentPost.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-full min-w-0 overflow-x-hidden"
            >
              <PostDetail
                post={currentPost}
                settings={settings}
                allPosts={posts}
              />
            </motion.div>
          )}

          {/* 2. ADMIN PORTAL (Query Param: ?page=admin) */}
          {route.page === 'admin' && (
            adminUser ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-full min-w-0 overflow-x-hidden"
              >
                <AdminPanel
                  posts={posts}
                  settings={settings}
                  onRefreshData={loadData}
                />
              </motion.div>
            ) : (
              <motion.div
                key="admin-gate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-full min-w-0 overflow-x-hidden"
              >
                <AdminAuthGate />
              </motion.div>
            )
          )}

          {/* 3. ABOUT PAGE (Query Param: ?page=about) */}
          {route.page === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-full min-w-0 overflow-x-hidden"
            >
              <AboutPage settings={settings} />
            </motion.div>
          )}

          {/* 4. CONTACT PAGE (Query Param: ?page=contact) */}
          {route.page === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-full min-w-0 overflow-x-hidden"
            >
              <ContactPage settings={settings} />
            </motion.div>
          )}

          {/* 5. HOMEPAGE & DISPATCHES LIST */}
          {route.page === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-12 min-w-0 overflow-x-hidden"
            >
              {/* Publication Header Hero (Only when not actively filtering by category or query) */}
              {!route.category && !selectedTag && !isSearching && (
                <div className="pt-4 pb-2 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>THEORY & APPLIED DESIGN SYSTEMS</span>
                  </div>
                  <h1 className="font-heading font-bold text-3xl sm:text-5xl lg:text-6xl text-[var(--color-text-primary)] tracking-tight leading-[1.08] max-w-4xl">
                    Reflections on visual physics, computing architectures, and digital craft.
                  </h1>
                  <p className="font-heading font-medium text-sm sm:text-base text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
                    {settings.description || 'An independent publication dedicated to high-craft digital interfaces, spatial typography, and computing architectures.'}
                  </p>
                </div>
              )}

              {/* Active Search Results Header */}
              {isSearching && (
                <div className="pt-2 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[var(--color-text-dim)] uppercase tracking-wider block">
                        Search Results
                      </span>
                      <h1 className="font-heading font-bold text-xl sm:text-2xl text-[var(--color-text-primary)]">
                        "{effectiveQuery}"
                      </h1>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSearchChange('')}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-accent)] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Search</span>
                  </button>
                </div>
              )}

              {/* Category Active Header */}
              {route.category && !isSearching && (
                <div className="pt-4 pb-2 flex items-center justify-between border-b border-[var(--color-border)] pb-6">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--color-text-dim)] uppercase tracking-wider block">
                      CATEGORY FILTER
                    </span>
                    <h1 className="font-heading font-bold text-2xl sm:text-4xl text-[var(--color-text-primary)] capitalize">
                      {route.category.replace('-', ' ')}
                    </h1>
                  </div>
                  <button
                    onClick={() => navigateTo({ page: 'home', category: undefined })}
                    className="text-xs font-mono text-[var(--color-accent)] hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* Lead Featured Post (Homepage only, when not searching) */}
              {!isSearching && !route.category && !selectedTag && featuredPost && (
                <HeroFeatured
                  post={featuredPost}
                  onLike={() => handleLikeUpdated(featuredPost.id, (featuredPost.likes || 0) + 1)}
                />
              )}

              {/* Sponsor Banner Slot */}
              {!isSearching && <SponsorBanner sponsor={settings.sponsorBanner} />}

              {/* Dispatches Grid Section */}
              <section className="space-y-6 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <h2 className="font-heading font-bold text-xl sm:text-2xl text-[var(--color-text-primary)]">
                      {isSearching
                        ? 'Matching Dispatches'
                        : route.category
                        ? 'Category Dispatches'
                        : 'Recent Dispatches'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                      {regularPosts.length}
                    </span>
                  </div>

                  {/* View Layout Toggle */}
                  <div className="flex items-center gap-1.5 bg-[var(--color-surface-secondary)] p-1 rounded-xl border border-[var(--color-border)] self-end sm:self-auto shadow-inner">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-[var(--color-accent)] text-white shadow-sm'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                      title="Grid view"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('horizontal')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        viewMode === 'horizontal'
                          ? 'bg-[var(--color-accent)] text-white shadow-sm'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                      title="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Category Filter Pills Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <button
                    onClick={() => {
                      setSelectedTag(null);
                      navigateTo({ page: 'home', category: undefined });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer ${
                      !route.category && !selectedTag
                        ? 'bg-[var(--color-accent)] text-white shadow-sm'
                        : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                    }`}
                  >
                    All Dispatches ({posts.filter(p => p.published).length})
                  </button>
                  {(Array.from(new Set(posts.map(p => p.category).filter((c): c is string => Boolean(c))))).map((cat: string) => {
                    const isActive = route.category ? normalizeCat(route.category) === normalizeCat(cat) : false;
                    const count = posts.filter(p => p.published && normalizeCat(p.category) === normalizeCat(cat)).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedTag(null);
                          navigateTo({ page: 'home', category: cat });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[var(--color-accent)] text-white shadow-sm'
                            : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                  {selectedTag && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                      <span>Tag: #{selectedTag}</span>
                      <button 
                        onClick={() => setSelectedTag(null)}
                        className="hover:text-red-500 cursor-pointer ml-1"
                        title="Remove tag filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Posts Cards Grid with Smooth Transition */}
                {regularPosts.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="py-16 text-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4 px-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                      <Search className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-heading font-bold text-lg text-[var(--color-text-primary)]">
                        No dispatches found
                      </h3>
                      <p className="font-mono text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
                        {isSearching 
                          ? `No articles match the title, category, or tags for "${effectiveQuery}".`
                          : 'No dispatches found matching this filter criteria.'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        handleSearchChange('');
                        setSelectedTag(null);
                        navigateTo({ page: 'home', category: undefined });
                      }}
                      className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
                    >
                      {isSearching ? 'Restore All Dispatches' : 'Reset Filters'}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    layout
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'grid grid-cols-1 gap-4'
                    }
                  >
                    <AnimatePresence mode="popLayout">
                      {regularPosts.map((post) => (
                        <motion.div
                          key={post.id}
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.25 }}
                          className="w-full max-w-full min-w-0"
                        >
                          <PostCard
                            post={post}
                            variant={viewMode === 'grid' ? 'grid' : 'horizontal'}
                            onLikeUpdated={handleLikeUpdated}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </section>

              {/* Social Banner Ad Monetization Widget */}
              <SocialBannerAd />

              {/* Newsletter Capture Banner */}
              {!isSearching && <NewsletterSection source="homepage-footer" />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer settings={settings} isAdminLoggedIn={Boolean(adminUser)} />
    </div>
  );
}
