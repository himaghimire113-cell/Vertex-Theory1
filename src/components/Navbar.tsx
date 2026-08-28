import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Shield, 
  Menu, 
  X, 
  ArrowUpRight, 
  Sparkles, 
  Compass, 
  FolderOpen, 
  Info, 
  Mail, 
  LogOut,
  Sliders
} from 'lucide-react';
import { SiteSettings, Theme, Post } from '../types';
import { navigateTo, RouteParams } from '../utils/helpers';
import { ThemeToggle } from './ThemeToggle';
import { SearchModal } from './SearchModal';
import { Logo } from './Logo';
import { logoutAdmin } from '../firebaseConfig';

interface NavbarProps {
  settings: SiteSettings;
  currentRoute: RouteParams;
  isAdminLoggedIn: boolean;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  posts: Post[];
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  currentRoute,
  isAdminLoggedIn,
  theme,
  onThemeChange,
  posts,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Extract unique categories from posts + defaults
  const defaultCategorySlugs = [
    { id: 'all', label: 'All Dispatches' },
    { id: 'visual-theory', label: 'Visual Theory' },
    { id: 'design-systems', label: 'Design Systems' },
    { id: 'computing', label: 'Computing & AI' },
    { id: 'hardware', label: 'Hardware' },
  ];

  // Merge unique custom categories from posts
  const postCategories: string[] = Array.from(
    new Set(posts.map((p) => p.category?.trim().toLowerCase()).filter((c): c is string => Boolean(c)))
  );

  const mergedCategories: Array<{ id: string; label: string }> = [...defaultCategorySlugs];
  postCategories.forEach((cat: string) => {
    if (cat && !mergedCategories.some((c) => c.id === cat || c.label.toLowerCase() === cat.toLowerCase())) {
      const formattedLabel = cat
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      mergedCategories.push({ id: cat, label: formattedLabel });
    }
  });

  // Handle drawer body scroll lock
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // Handle keyboard shortcuts (Escape to close drawer, Cmd+K / Ctrl+K to open SearchModal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawerOpen) setDrawerOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const handleCategoryClick = (catId: string) => {
    if (catId === 'all') {
      navigateTo({ page: 'home', category: undefined, post: undefined });
    } else {
      navigateTo({ page: 'home', category: catId, post: undefined });
    }
    setDrawerOpen(false);
  };

  const handleNav = (page: RouteParams['page']) => {
    navigateTo({ page, post: undefined, category: undefined });
    setDrawerOpen(false);
  };

  const handleAdminLogout = async () => {
    await logoutAdmin();
    setDrawerOpen(false);
    navigateTo({ page: 'home' });
    window.location.reload();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--color-nav-bg)] backdrop-blur-md border-b border-[var(--color-border)] transition-colors duration-200 w-full max-w-full">
        {/* Top Announcement Bar if enabled */}
        {settings.announcementActive && settings.announcementText && (
          <div className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)] px-4 py-1.5 text-center text-xs tracking-wide text-[var(--color-text-secondary)] flex items-center justify-center gap-2 w-full max-w-full">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
            <span className="truncate">{settings.announcementText}</span>
            <span className="hidden sm:inline text-[var(--color-text-dim)]">|</span>
            <button 
              onClick={() => handleNav('home')} 
              className="hidden sm:inline text-[var(--color-accent)] hover:underline font-medium text-xs cursor-pointer"
            >
              Read latest
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 gap-3">
            {/* Top-Left: Hamburger Icon (☰) & Brand Logo */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                id="header-hamburger-trigger"
                onClick={() => setDrawerOpen(true)}
                className="p-2 sm:p-2.5 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-all duration-200 flex items-center justify-center shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                title="Open menu drawer"
                aria-label="Open menu drawer"
              >
                <Menu className="w-5 h-5 sm:w-5 sm:h-5 text-[var(--color-text-primary)]" />
              </button>

              {/* Brand Logo & Title */}
              <button
                onClick={() => handleNav('home')}
                className="flex items-center group text-left focus:outline-none min-w-0 cursor-pointer"
                aria-label="Vertex Theory Homepage"
              >
                <Logo 
                  customLogoUrl={settings.logoUrl} 
                  subtitle="Editorial & Systems" 
                  size="sm" 
                  useImage={true}
                />
              </button>
            </div>

            {/* Top-Right: Fixed Size Search Trigger & Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Search Trigger Button (Constant fixed size, opens Search modal) */}
              <button
                id="header-search-trigger"
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="p-2 sm:p-2.5 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                title="Search dispatches (Cmd+K)"
                aria-label="Search dispatches"
              >
                <Search className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                <span className="hidden md:inline text-xs font-mono text-[var(--color-text-dim)]">Search dispatches...</span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--color-surface-secondary)] text-[var(--color-text-dim)] border border-[var(--color-border)]">
                  ⌘K
                </kbd>
              </button>

              {/* Theme Toggle (Sepia / Dark / Light) */}
              <ThemeToggle currentTheme={theme} onThemeChange={onThemeChange} />

              {/* Discreet Authenticated Admin Badge (Only visible when signed in) */}
              {isAdminLoggedIn && (
                <button
                  onClick={() => handleNav('admin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 border cursor-pointer ${
                    currentRoute.page === 'admin'
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm'
                      : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/80 hover:bg-emerald-900/60'
                  }`}
                  title="Admin Console"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin Active</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Off-Canvas Slide-In Side Drawer & Backdrop Overlay */}
      {/* 1. Semi-Transparent Backdrop Overlay */}
      <div
        id="side-drawer-overlay"
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 bg-black/60 z-50 transition-all duration-300 ease-in-out ${
          drawerOpen ? 'opacity-100 pointer-events-auto backdrop-blur-xs visible' : 'opacity-0 pointer-events-none invisible'
        }`}
        aria-hidden={!drawerOpen}
      />

      {/* 2. Slide-In Side Drawer */}
      <aside
        id="side-drawer-panel"
        aria-label="Navigation drawer"
        className={`fixed top-0 bottom-0 left-0 w-80 sm:w-96 max-w-[85vw] bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-2xl z-50 flex flex-col justify-between overflow-y-auto transform transition-all duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-secondary)]/50 shrink-0">
          <Logo 
            customLogoUrl={settings.logoUrl} 
            subtitle="Journal & Systems" 
            size="sm" 
            useImage={true}
          />

          <button
            id="side-drawer-close"
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            title="Close drawer"
            aria-label="Close menu drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Theme Selector Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--color-text-dim)] uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Theme System</span>
            </div>
            <div className="bg-[var(--color-surface-secondary)] p-2 rounded-2xl border border-[var(--color-border)]">
              <ThemeToggle currentTheme={theme} onThemeChange={onThemeChange} variant="full" />
            </div>
          </div>

          {/* Editorial Categories Navigation */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--color-text-dim)] uppercase tracking-wider">
              <FolderOpen className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Editorial Categories</span>
            </div>
            <div className="space-y-1">
              {mergedCategories.map((cat) => {
                const isActive = (!currentRoute.category && cat.id === 'all') || currentRoute.category === cat.id;
                const postCount = cat.id === 'all' 
                  ? posts.filter(p => p.published).length 
                  : posts.filter(p => p.published && p.category?.toLowerCase() === cat.id.toLowerCase()).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      isActive && currentRoute.page === 'home'
                        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]/20 shadow-xs'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    <span className="truncate">{cat.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-[var(--color-text-dim)] px-2 py-0.5 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                        {postCount}
                      </span>
                      {isActive && currentRoute.page === 'home' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Publication Links */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--color-text-dim)] uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Publication Links</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleNav('about')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                  currentRoute.page === 'about'
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <Info className="w-4 h-4 text-[var(--color-accent)]" />
                <span>About Vertex Theory</span>
              </button>

              <button
                onClick={() => handleNav('contact')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                  currentRoute.page === 'contact'
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <Mail className="w-4 h-4 text-[var(--color-accent)]" />
                <span>Message Author & Inquiries</span>
              </button>

              {/* Admin Portal Gateway: only shown if already authenticated via Firebase Auth */}
              {isAdminLoggedIn && (
                <div className="pt-2 border-t border-[var(--color-border)] space-y-1">
                  <button
                    onClick={() => handleNav('admin')}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm flex items-center justify-between font-semibold border cursor-pointer transition-colors bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent)]/30"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[var(--color-accent)]" />
                      <span>Admin Management Console</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 opacity-70" />
                  </button>

                  <button
                    onClick={handleAdminLogout}
                    className="w-full text-left px-3.5 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 font-mono transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out Admin</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/40 text-[11px] font-mono text-[var(--color-text-dim)] shrink-0 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Vertex Theory</span>
          <span>EST. 2026</span>
        </div>
      </aside>

      {/* Standard Search Modal (Fixed size, real-time matching against dispatches, Cmd+K support) */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        posts={posts}
      />
    </>
  );
};
