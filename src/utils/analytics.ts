/**
 * Google Analytics 4 (GA4) integration for Vertex Theory
 * Measurement ID: G-9Z5NGBV1L3
 */

export const GA_MEASUREMENT_ID = 'G-9Z5NGBV1L3';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Initializes Google Analytics gtag.js script if not present
 */
export function initGoogleAnalytics(measurementId = GA_MEASUREMENT_ID) {
  if (typeof window === 'undefined') return;

  // Setup dataLayer
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  // Avoid injecting script twice
  if (document.getElementById('ga-gtag-script')) return;

  const script = document.createElement('script');
  script.id = 'ga-gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We trigger page views manually on SPA navigation
  });
}

/**
 * Tracks a page view for single-page application navigation
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    page_location: window.location.href,
    send_to: GA_MEASUREMENT_ID,
  });
}

/**
 * Tracks custom interaction events
 */
export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, {
    ...params,
    send_to: GA_MEASUREMENT_ID,
  });
}

export function trackPostView(post: { id: string; title: string; category?: string; slug: string }) {
  trackEvent('view_item', {
    item_id: post.id,
    item_name: post.title,
    item_category: post.category || 'General',
    slug: post.slug,
  });
}

export function trackPostLike(postId: string, postTitle: string, newLikesCount: number) {
  trackEvent('post_like', {
    post_id: postId,
    post_title: postTitle,
    likes_count: newLikesCount,
  });
}

export function trackNewsletterSubscribe(email: string, source = 'homepage_footer') {
  trackEvent('generate_lead', {
    event_category: 'engagement',
    event_label: 'newsletter_signup',
    source: source,
  });
}

export function trackSearch(searchTerm: string, resultsCount: number) {
  if (!searchTerm.trim()) return;
  trackEvent('search', {
    search_term: searchTerm.trim(),
    results_count: resultsCount,
  });
}
