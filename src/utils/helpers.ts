import { Subscriber, ReaderMessage } from '../types';

/**
 * Auto-converts Imgur share-page links, album links, and standard URLs to direct image URLs.
 * e.g. https://imgur.com/gallery/a8c9b -> https://i.imgur.com/a8c9b.jpg
 * e.g. https://imgur.com/a/a8c9b -> https://i.imgur.com/a8c9b.jpg
 * e.g. https://imgur.com/a8c9b -> https://i.imgur.com/a8c9b.jpg
 */
export function resolveDirectImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If it's already a direct file image extension, return it
  if (/\.(jpeg|jpg|png|gif|webp|svg|avif)(\?.*)?$/i.test(trimmed)) {
    return trimmed;
  }

  try {
    // Check if it's an Imgur link
    if (trimmed.includes('imgur.com')) {
      // Remove protocol and parse
      const cleanUrl = trimmed.replace(/^https?:\/\//i, '');
      const parts = cleanUrl.split('/');
      
      // Look for the ID
      let imageId = '';
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1].split('?')[0].split('#')[0];
        if (lastPart && lastPart !== 'gallery' && lastPart !== 'a') {
          imageId = lastPart;
        } else if (parts.length >= 3) {
          imageId = parts[parts.length - 1].split('?')[0].split('#')[0];
        }
      }
      
      if (imageId) {
        return `https://i.imgur.com/${imageId}.jpg`;
      }
    }
  } catch (err) {
    console.warn('Error resolving image URL:', err);
  }

  return trimmed;
}

/**
 * Calculates estimated read time from body text (avg 200 words per minute)
 */
export function calculateReadTime(text: string): string {
  if (!text) return '1 min read';
  const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/[#*`_\[\]()]/g, '');
  const wordCount = cleanText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

/**
 * Generates URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

/**
 * Defensive query parameter routing parser.
 * Handles Facebook fbclid, UTM params, and in-app browser quirks.
 */
export interface RouteParams {
  post?: string;        // slug or id
  category?: string;    // e.g. "design", "tech"
  tag?: string;         // e.g. "architecture"
  page?: 'home' | 'post' | 'admin' | 'about' | 'contact' | 'subscribers';
  search?: string;
  adminTab?: string;
}

export function parseQueryParams(): RouteParams {
  if (typeof window === 'undefined') return { page: 'home' };
  
  const searchParams = new URLSearchParams(window.location.search);
  
  const post = searchParams.get('post') || undefined;
  const category = searchParams.get('category') || undefined;
  const tag = searchParams.get('tag') || undefined;
  const rawPage = searchParams.get('page');
  const search = searchParams.get('q') || searchParams.get('search') || undefined;
  const adminTab = searchParams.get('tab') || undefined;

  let page: RouteParams['page'] = 'home';
  if (post) {
    page = 'post';
  } else if (rawPage === 'admin') {
    page = 'admin';
  } else if (rawPage === 'about') {
    page = 'about';
  } else if (rawPage === 'contact') {
    page = 'contact';
  } else if (rawPage === 'subscribers') {
    page = 'subscribers';
  }

  return {
    post,
    category,
    tag,
    page,
    search,
    adminTab,
  };
}

/**
 * Safely updates URL query parameters without reloading or using hash fragments
 */
export function navigateTo(params: Partial<RouteParams>, replace = false) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams();

  if (params.post) {
    searchParams.set('post', params.post);
  } else if (params.page && params.page !== 'home') {
    searchParams.set('page', params.page);
  }

  if (params.category) {
    searchParams.set('category', params.category);
  }

  if (params.tag) {
    searchParams.set('tag', params.tag);
  }

  if (params.search) {
    searchParams.set('q', params.search);
  }

  if (params.adminTab) {
    searchParams.set('tab', params.adminTab);
  }

  const queryStr = searchParams.toString();
  const newUrl = queryStr ? `${url.pathname}?${queryStr}` : url.pathname;

  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }

  // Dispatch custom popstate/navigation event for components to re-render
  window.dispatchEvent(new Event('vertex_navigation'));
}

/**
 * Exports subscribers to RFC 4180 CSV
 */
export function exportSubscribersToCSV(subscribers: Subscriber[]): void {
  const headers = ['ID', 'Email Address', 'Date Subscribed', 'Acquisition Source', 'Status'];
  const rows = subscribers.map(sub => [
    `"${sub.id}"`,
    `"${sub.email.replace(/"/g, '""')}"`,
    `"${sub.createdAt}"`,
    `"${sub.source}"`,
    `"${sub.status}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `vertex-theory-subscribers-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports reader messages to CSV
 */
export function exportMessagesToCSV(messages: ReaderMessage[]): void {
  const headers = ['ID', 'Date', 'Sender Name', 'Sender Email', 'Associated Post', 'Status', 'Message'];
  const rows = messages.map(msg => [
    `"${msg.id}"`,
    `"${msg.createdAt}"`,
    `"${(msg.senderName || '').replace(/"/g, '""')}"`,
    `"${msg.senderEmail.replace(/"/g, '""')}"`,
    `"${(msg.postTitle || 'General / None').replace(/"/g, '""')}"`,
    `"${msg.status}"`,
    `"${msg.message.replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `vertex-theory-messages-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Canonical production website URL for Vertex Theory
 */
export const PRODUCTION_SITE_URL = 'https://vertex-theory1.kaflea991.workers.dev';

/**
 * Returns a robust, public canonical URL for sharing posts on social media.
 * If running inside AI Studio, a container, or localhost, it maps cleanly to the public domain
 * so social media crawlers (Facebook, X/Twitter, WhatsApp, LinkedIn) can fetch open graph metadata.
 */
export function getPostShareUrl(post: { slug?: string; id?: string }): string {
  const postParam = post.slug || post.id || '';
  if (typeof window === 'undefined') {
    return `${PRODUCTION_SITE_URL}/?post=${encodeURIComponent(postParam)}`;
  }

  const origin = window.location.origin;
  // If running in development, AI Studio sandbox, or local container, use the public production URL
  if (
    origin.includes('run.app') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('googleusercontent.com')
  ) {
    return `${PRODUCTION_SITE_URL}/?post=${encodeURIComponent(postParam)}`;
  }

  // If running on production domain (workers.dev or custom domain), use current origin
  return `${origin}/?post=${encodeURIComponent(postParam)}`;
}

/**
 * Formats date for editorial aesthetic: e.g. "OCTOBER 14, 2026"
 */
export function formatEditorialDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase();
  } catch {
    return isoString;
  }
}
