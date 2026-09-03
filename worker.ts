/**
 * Cloudflare Worker for Vertex Theory
 * Handles Dynamic Open Graph / Twitter Cards meta tag rewriting for social media crawlers
 * using Cloudflare HTMLRewriter and Firebase Firestore REST API.
 */

// ============================================================================
// CONFIGURATION & DATABASE SCHEMA
// ============================================================================
const FIREBASE_PROJECT_ID = 'vertextheory1-44870';
const FIREBASE_API_KEY = 'AIzaSyBxfrho3UuOnPyFBHIbXiYXc-WekM91hNA';
const FIRESTORE_DATABASE = '(default)';
const POSTS_COLLECTION = 'posts';

interface Env {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  [key: string]: unknown;
}

interface ExecutionContext {
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException?: () => void;
}

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  mapValue?: {
    fields?: Record<string, FirestoreValue>;
  };
  arrayValue?: {
    values?: FirestoreValue[];
  };
}

interface PostMetadata {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  publishedTime: string;
  modifiedTime: string;
  authorName: string;
  publisherName: string;
}

// Hardcoded fallback default posts for instant lookup if Firestore is offline
const HARDCODED_POSTS: Array<{ slug: string; id: string; title: string; excerpt: string; coverImage: string; authorName: string; createdAt: string }> = [
  {
    id: 'post-1',
    slug: 'the-physics-of-spatial-interfaces',
    title: 'The Physics of Spatial Interfaces: Why Tactility Transcends Flat Pixels',
    excerpt: 'Examining the mathematical constraints and optical tensions that transform cold screen glass into organic, responsive tactile canvases.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    authorName: 'Julian Vance',
    createdAt: '2026-08-18T10:00:00.000Z'
  },
  {
    id: 'post-2',
    slug: 'monolithic-simplicity-in-an-age-of-framework-churn',
    title: 'Monolithic Simplicity: Building for Longevity in an Age of Tooling Churn',
    excerpt: 'Why flat hierarchies, native Web standards, and zero-overhead architecture deliver superior developer sanity and ultra-fast mobile loading.',
    coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
    authorName: 'Julian Vance',
    createdAt: '2026-08-14T14:30:00.000Z'
  },
  {
    id: 'post-3',
    slug: 'spatial-typography-and-geometric-brutalism',
    title: 'Spatial Typography & Geometric Brutalism in Modern Editorial Design',
    excerpt: 'A deep dive into how high-contrast sans serifs paired with classical serifs create memorable, unmistakable brand character.',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    authorName: 'Julian Vance',
    createdAt: '2026-08-09T08:15:00.000Z'
  },
  {
    id: 'post-4',
    slug: 'the-autonomous-workspace-hardware-for-thinkers',
    title: 'The Autonomous Workspace: Curated Hardware & Tools for Focused Thought',
    excerpt: 'An intentional breakdown of the physical ergonomics, ambient lighting, and analog notebooks powering high-output creative minds.',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
    authorName: 'Julian Vance',
    createdAt: '2026-08-02T16:45:00.000Z'
  }
];

/**
 * Clean markdown or HTML formatting from content string for preview descriptions
 * Truncates to roughly 150-160 characters to fit OpenGraph card constraints
 */
function cleanTextSnippet(raw: string, maxLength = 160): string {
  if (!raw) return '';
  const stripped = raw
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove markdown images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links -> text
    .replace(/[#*`_~>[\]]/g, '') // markdown formatting characters
    .replace(/<[^>]*>/g, '') // html tags
    .replace(/\s+/g, ' ') // collapse whitespaces
    .trim();

  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength).trim() + '...';
}

/**
 * Slugify helper to match titles to slugs
 */
function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract clean string value from Firestore REST value representation
 */
function extractFieldValue(fields: Record<string, FirestoreValue> | undefined, ...possibleKeys: string[]): string {
  if (!fields) return '';
  for (const key of possibleKeys) {
    const val = fields[key];
    if (val && typeof val.stringValue === 'string' && val.stringValue.trim()) {
      return val.stringValue.trim();
    }
  }
  return '';
}

/**
 * Format date string into valid ISO 8601 string
 */
function formatIsoDate(rawDate?: string): string {
  if (!rawDate) return new Date().toISOString();
  try {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch {
    // fallback
  }
  return new Date().toISOString();
}

/**
 * Parse a Firestore document structure into PostMetadata
 */
function parseDocToMetadata(fields: Record<string, FirestoreValue> | undefined, createTime?: string, updateTime?: string): PostMetadata | null {
  if (!fields) return null;

  const title = extractFieldValue(fields, 'title', 'postTitle', 'name', 'headline');
  const rawDesc = extractFieldValue(fields, 'excerpt', 'description', 'summary', 'subtitle', 'content');
  const imageUrl = extractFieldValue(fields, 'coverImage', 'imageUrl', 'image', 'featuredImage', 'thumbnail', 'photo', 'banner', 'img', 'url');
  
  // Extract clean author name (never expose internal worker host names)
  const rawAuthor = fields.author?.mapValue?.fields?.name?.stringValue || extractFieldValue(fields, 'authorName', 'author');
  const authorName = (rawAuthor && !rawAuthor.includes('workers.dev') && !rawAuthor.includes('kaflea')) ? rawAuthor : 'Vertex Theory';
  
  const rawCreateTime = createTime || fields.createdAt?.stringValue || fields.publishedAt?.stringValue || fields.date?.stringValue;
  const rawUpdateTime = updateTime || fields.updatedAt?.stringValue || rawCreateTime;

  if (title) {
    return {
      title,
      description: cleanTextSnippet(rawDesc) || 'Read the full publication on Vertex Theory.',
      imageUrl: imageUrl || '',
      url: '',
      publishedTime: formatIsoDate(rawCreateTime),
      modifiedTime: formatIsoDate(rawUpdateTime),
      authorName,
      publisherName: 'Vertex Theory',
    };
  }
  return null;
}

/**
 * Fetch post metadata from Firebase Firestore REST API dynamically with fallback strategies
 */
async function fetchPostFromFirestore(slugOrId: string, projectId: string): Promise<PostMetadata | null> {
  const cleanSlug = decodeURIComponent(slugOrId).trim().toLowerCase();
  console.log('[Worker Debug] fetchPostFromFirestore called with raw:', slugOrId, '-> cleanSlug:', cleanSlug, 'projectId:', projectId);
  if (!cleanSlug) return null;

  // 1. Check in-memory hardcoded fallback posts first
  const hardcoded = HARDCODED_POSTS.find(
    p => p.slug.toLowerCase() === cleanSlug || p.id.toLowerCase() === cleanSlug || slugifyText(p.title) === cleanSlug
  );
  if (hardcoded) {
    console.log('[Worker Debug] Match found in HARDCODED_POSTS for slug:', cleanSlug, 'title:', hardcoded.title);
    return {
      title: hardcoded.title,
      description: cleanTextSnippet(hardcoded.excerpt),
      imageUrl: hardcoded.coverImage,
      url: '',
      publishedTime: hardcoded.createdAt,
      modifiedTime: hardcoded.createdAt,
      authorName: hardcoded.authorName,
      publisherName: 'Vertex Theory',
    };
  }
  console.log('[Worker Debug] No hardcoded match for slug:', cleanSlug, '- querying Firestore REST API...');

  // 2. Fetch from Firestore REST API with API key
  try {
    // Strategy 1: Run structured query on the `slug` field with API Key
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${FIRESTORE_DATABASE}/documents:runQuery?key=${FIREBASE_API_KEY}`;
    
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: POSTS_COLLECTION }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'slug' },
            op: 'EQUAL',
            value: { stringValue: cleanSlug },
          },
        },
        limit: 1,
      },
    };

    console.log('[Worker Debug] Strategy 1 (structuredQuery) executing...');
    const queryResponse = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(queryBody),
    });

    console.log('[Worker Debug] Strategy 1 response HTTP status:', queryResponse.status, queryResponse.statusText);

    if (queryResponse.ok) {
      const results = (await queryResponse.json()) as Array<{ document?: { fields?: Record<string, FirestoreValue>; createTime?: string; updateTime?: string } }>;
      console.log('[Worker Debug] Strategy 1 returned results count:', Array.isArray(results) ? results.length : 0);
      if (Array.isArray(results)) {
        for (const item of results) {
          if (item.document && item.document.fields) {
            const parsed = parseDocToMetadata(item.document.fields, item.document.createTime, item.document.updateTime);
            if (parsed) {
              console.log('[Worker Debug] Strategy 1 SUCCESS -> Matched post:', parsed.title);
              return parsed;
            }
          }
        }
      }
      console.log('[Worker Debug] Strategy 1 did not find a matching document.');
    } else {
      const errText = await queryResponse.text().catch(() => '');
      console.log('[Worker Debug] Strategy 1 query error body:', errText);
    }

    // Strategy 2: List collection documents directly with pageSize=100 and fuzzy-match
    const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${FIRESTORE_DATABASE}/documents/${POSTS_COLLECTION}?pageSize=100&key=${FIREBASE_API_KEY}`;
    console.log('[Worker Debug] Strategy 2 (list documents) executing...');
    const listResponse = await fetch(listUrl, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    console.log('[Worker Debug] Strategy 2 response HTTP status:', listResponse.status, listResponse.statusText);

    if (listResponse.ok) {
      const listData = (await listResponse.json()) as { documents?: Array<{ name?: string; fields?: Record<string, FirestoreValue>; createTime?: string; updateTime?: string }> };
      const docCount = listData.documents && Array.isArray(listData.documents) ? listData.documents.length : 0;
      console.log('[Worker Debug] Strategy 2 returned documents count:', docCount);
      if (listData.documents && Array.isArray(listData.documents)) {
        for (const doc of listData.documents) {
          const fields = doc.fields;
          if (!fields) continue;

          const docSlug = (extractFieldValue(fields, 'slug') || '').toLowerCase().trim();
          const docId = (extractFieldValue(fields, 'id') || '').toLowerCase().trim();
          const docTitle = extractFieldValue(fields, 'title', 'postTitle', 'name');
          const docTitleSlug = slugifyText(docTitle);
          const docPathName = doc.name ? doc.name.split('/').pop()?.toLowerCase() : '';

          if (
            docSlug === cleanSlug ||
            docId === cleanSlug ||
            docTitleSlug === cleanSlug ||
            docPathName === cleanSlug ||
            (docSlug && cleanSlug.includes(docSlug)) ||
            (cleanSlug && docSlug.includes(cleanSlug))
          ) {
            const parsed = parseDocToMetadata(fields, doc.createTime, doc.updateTime);
            if (parsed) {
              console.log('[Worker Debug] Strategy 2 SUCCESS -> Matched post:', parsed.title, 'via docSlug:', docSlug, 'docId:', docId);
              return parsed;
            }
          }
        }
      }
      console.log('[Worker Debug] Strategy 2 did not match slug:', cleanSlug);
    } else {
      const errText = await listResponse.text().catch(() => '');
      console.log('[Worker Debug] Strategy 2 list error body:', errText);
    }

    // Strategy 3: Direct document lookup by Document ID
    const directDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${FIRESTORE_DATABASE}/documents/${POSTS_COLLECTION}/${encodeURIComponent(cleanSlug)}?key=${FIREBASE_API_KEY}`;
    console.log('[Worker Debug] Strategy 3 (direct doc get) executing...');
    const directResponse = await fetch(directDocUrl, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    console.log('[Worker Debug] Strategy 3 response HTTP status:', directResponse.status, directResponse.statusText);

    if (directResponse.ok) {
      const directDoc = (await directResponse.json()) as { fields?: Record<string, FirestoreValue>; createTime?: string; updateTime?: string };
      const parsed = parseDocToMetadata(directDoc.fields, directDoc.createTime, directDoc.updateTime);
      if (parsed) {
        console.log('[Worker Debug] Strategy 3 SUCCESS -> Matched post:', parsed.title);
        return parsed;
      }
    }
  } catch (error) {
    console.error('[Worker Debug] Error fetching dynamic post metadata from Firestore:', error, error instanceof Error ? error.stack : '');
  }

  console.log('[Worker Debug] All strategies exhausted. Returning null for slug:', cleanSlug);
  return null;
}

/**
 * Detect whether the User-Agent belongs to a social media link crawler, search bot, or validator.
 * Specifically targets Facebook, X (Twitter), LinkedIn, Discord, Telegram, WhatsApp, Slack, etc.
 */
function isSocialCrawler(userAgent: string): boolean {
  const ua = (userAgent || '').toLowerCase();
  return (
    ua.includes('facebookexternalhit') ||
    ua.includes('facebot') ||
    ua.includes('meta-externalagent') ||
    ua.includes('twitterbot') ||
    ua.includes('twitter') ||
    ua.includes('linkedinbot') ||
    ua.includes('whatsapp') ||
    ua.includes('telegrambot') ||
    ua.includes('discordbot') ||
    ua.includes('slackbot') ||
    ua.includes('pinterest') ||
    ua.includes('skypeuripreview') ||
    ua.includes('google-inspectiontool') ||
    ua.includes('applebot') ||
    ua.includes('vkshare') ||
    ua.includes('redditbot') ||
    ua.includes('opengraph') ||
    ua.includes('crawler') ||
    ua.includes('spider') ||
    ua.includes('bot') ||
    ua.includes('validator') ||
    ua.includes('preview') ||
    ua.includes('lighthouse')
  );
}

/**
 * Check if the requested path corresponds to a static asset (images, css, js, fonts, etc.)
 */
function isStaticAsset(pathname: string): boolean {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot|wasm|map|json|txt|xml)$/i.test(pathname);
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';

    // ========================================================================
    // 1. FAST PASS-THROUGH
    // Check if incoming request is a human/browser or static asset.
    // If NOT a social crawler, return env.ASSETS.fetch(request) immediately
    // without running HTMLRewriter or calling Firestore.
    // ========================================================================
    const isBot = isSocialCrawler(userAgent);
    const isStatic = isStaticAsset(url.pathname);

    if (!isBot || isStatic || (request.method !== 'GET' && request.method !== 'HEAD')) {
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return fetch(request);
    }

    console.log('[Worker Debug] Social crawler detected:', userAgent, '-> URL:', url.href);

    // ========================================================================
    // 2. EDGE CACHING (caches.default)
    // For social crawlers, use Cloudflare's cache API to serve cached transformed
    // HTML responses directly from the edge for 1 hour, saving Firestore reads.
    // ========================================================================
    const cache = (caches as unknown as { default: Cache }).default;
    const cacheKey = new Request(url.toString(), {
      method: 'GET',
    });

    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      console.log('[Worker Debug] Edge cache HIT for social crawler:', url.href);
      return cachedResponse;
    }
    console.log('[Worker Debug] Edge cache MISS for social crawler:', url.href);

    // Extract dynamic post slug parameter strictly from incoming URL
    let postSlug = url.searchParams.get('post') || url.searchParams.get('p') || url.searchParams.get('article');

    if (!postSlug && url.pathname.startsWith('/post/')) {
      const parts = url.pathname.split('/post/')[1]?.split('/');
      if (parts && parts[0]) {
        postSlug = parts[0];
      }
    } else if (!postSlug && url.pathname.startsWith('/article/')) {
      const parts = url.pathname.split('/article/')[1]?.split('/');
      if (parts && parts[0]) {
        postSlug = parts[0];
      }
    }

    if (postSlug) {
      postSlug = postSlug.trim();
    }

    // Fetch the origin response (static assets or SPA HTML index)
    let originResponse: Response;
    if (env.ASSETS) {
      originResponse = await env.ASSETS.fetch(request);
      // Fallback to root index.html for client-side routing if asset router returns 404
      if (originResponse.status === 404) {
        originResponse = await env.ASSETS.fetch(new Request(new URL('/', request.url).toString(), request));
      }
    } else {
      originResponse = await fetch(request);
    }

    const contentType = originResponse.headers.get('content-type') || '';
    
    // If not an HTML response, return asset as-is
    if (!contentType.includes('text/html')) {
      return originResponse;
    }

    // If no post parameter is present in URL, cache and serve standard default index.html
    if (!postSlug) {
      const headers = new Headers(originResponse.headers);
      headers.set('Content-Type', 'text/html; charset=utf-8');
      headers.set('Cache-Control', 'public, max-age=3600');
      headers.delete('Pragma');
      headers.delete('Expires');

      const defaultResponse = new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers,
      });

      try {
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(cache.put(cacheKey, defaultResponse.clone()));
        } else {
          await cache.put(cacheKey, defaultResponse.clone());
        }
      } catch (cacheErr) {
        console.warn('[Worker Debug] Cache put error:', cacheErr);
      }

      return defaultResponse;
    }

    // Fetch exact matching metadata dynamically from Firebase Firestore
    const postData = await fetchPostFromFirestore(postSlug, FIREBASE_PROJECT_ID);
    
    // If the requested slug is NOT found in Firestore, fallback to standard site index.html
    if (!postData) {
      const fallbackHeaders = new Headers(originResponse.headers);
      fallbackHeaders.set('Content-Type', 'text/html; charset=utf-8');
      fallbackHeaders.set('Cache-Control', 'public, max-age=3600');
      fallbackHeaders.delete('Pragma');
      fallbackHeaders.delete('Expires');

      const notFoundResponse = new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers: fallbackHeaders,
      });

      try {
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(cache.put(cacheKey, notFoundResponse.clone()));
        } else {
          await cache.put(cacheKey, notFoundResponse.clone());
        }
      } catch (cacheErr) {
        console.warn('[Worker Debug] Cache put error:', cacheErr);
      }

      return notFoundResponse;
    }

    postData.url = url.href;
    const formattedTitle = `${postData.title} — Vertex Theory`;

    const schemaJson = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: postData.title,
      description: postData.description,
      image: postData.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
      datePublished: postData.publishedTime,
      dateModified: postData.modifiedTime || postData.publishedTime,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': postData.url,
      },
      author: {
        '@type': 'Person',
        name: postData.authorName,
        url: 'https://vertex-theory1.kaflea991.workers.dev/',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Vertex Theory',
        logo: {
          '@type': 'ImageObject',
          url: 'https://vertex-theory1.kaflea991.workers.dev/icon-512.png',
          width: 512,
          height: 512,
        },
      },
    }, null, 2);

    let seenAuthor = false;
    let seenArticleAuthor = false;
    let seenPublishedTime = false;
    let seenModifiedTime = false;
    let seenPublisher = false;
    let seenOgImage = false;
    let seenOgSecureImage = false;
    let seenOgUrl = false;
    let seenTwitterImage = false;
    let seenCanonical = false;
    let seenLdJson = false;

    // Use Cloudflare HTMLRewriter to rewrite dynamic meta tags on the fly
    const rewriter = new HTMLRewriter()
      // Overwrite <title>
      .on('title', {
        element(el) {
          el.setInnerContent(formattedTitle);
        },
      })
      // Overwrite standard meta description
      .on('meta[name="description"]', {
        element(el) {
          el.setAttribute('content', postData.description);
        },
      })
      // Overwrite author meta tag
      .on('meta[name="author"]', {
        element(el) {
          seenAuthor = true;
          el.setAttribute('content', postData.authorName);
        },
      })
      // Overwrite article:author
      .on('meta[property="article:author"]', {
        element(el) {
          seenArticleAuthor = true;
          el.setAttribute('content', postData.authorName);
        },
      })
      // Overwrite article:published_time
      .on('meta[property="article:published_time"]', {
        element(el) {
          seenPublishedTime = true;
          el.setAttribute('content', postData.publishedTime);
        },
      })
      // Overwrite article:modified_time
      .on('meta[property="article:modified_time"]', {
        element(el) {
          seenModifiedTime = true;
          el.setAttribute('content', postData.modifiedTime || postData.publishedTime);
        },
      })
      // Overwrite article:publisher
      .on('meta[property="article:publisher"]', {
        element(el) {
          seenPublisher = true;
          el.setAttribute('content', postData.publisherName);
        },
      })
      // Overwrite Open Graph tags
      .on('meta[property="og:title"]', {
        element(el) {
          el.setAttribute('content', postData.title);
        },
      })
      .on('meta[property="og:description"]', {
        element(el) {
          el.setAttribute('content', postData.description);
        },
      })
      .on('meta[property="og:image"]', {
        element(el) {
          seenOgImage = true;
          if (postData.imageUrl) {
            el.setAttribute('content', postData.imageUrl);
          }
        },
      })
      .on('meta[property="og:image:secure_url"]', {
        element(el) {
          seenOgSecureImage = true;
          if (postData.imageUrl) {
            el.setAttribute('content', postData.imageUrl);
          }
        },
      })
      .on('meta[property="og:image:alt"]', {
        element(el) {
          el.setAttribute('content', postData.title);
        },
      })
      .on('meta[property="og:url"]', {
        element(el) {
          seenOgUrl = true;
          el.setAttribute('content', postData.url);
        },
      })
      .on('meta[property="og:type"]', {
        element(el) {
          el.setAttribute('content', 'article');
        },
      })
      .on('meta[property="og:locale"]', {
        element(el) {
          el.setAttribute('content', 'en_US');
        },
      })
      // Overwrite Twitter Card tags
      .on('meta[name="twitter:card"]', {
        element(el) {
          el.setAttribute('content', 'summary_large_image');
        },
      })
      .on('meta[name="twitter:title"]', {
        element(el) {
          el.setAttribute('content', postData.title);
        },
      })
      .on('meta[name="twitter:description"]', {
        element(el) {
          el.setAttribute('content', postData.description);
        },
      })
      .on('meta[name="twitter:image"]', {
        element(el) {
          seenTwitterImage = true;
          if (postData.imageUrl) {
            el.setAttribute('content', postData.imageUrl);
          }
        },
      })
      .on('meta[name="twitter:image:alt"]', {
        element(el) {
          el.setAttribute('content', postData.title);
        },
      })
      // Overwrite canonical link
      .on('link[rel="canonical"]', {
        element(el) {
          seenCanonical = true;
          el.setAttribute('href', postData.url);
        },
      })
      // Overwrite structured data script
      .on('script[type="application/ld+json"]', {
        element(el) {
          seenLdJson = true;
          el.setInnerContent(schemaJson, { html: false });
        },
      })
      // Head injector: append any missing tags
      .on('head', {
        element(el) {
          if (!seenAuthor) {
            el.append(`<meta name="author" content="${escapeHtml(postData.authorName)}" />`, { html: true });
          }
          if (!seenArticleAuthor) {
            el.append(`<meta property="article:author" content="${escapeHtml(postData.authorName)}" />`, { html: true });
          }
          if (!seenPublishedTime) {
            el.append(`<meta property="article:published_time" content="${escapeHtml(postData.publishedTime)}" />`, { html: true });
          }
          if (!seenModifiedTime) {
            el.append(`<meta property="article:modified_time" content="${escapeHtml(postData.modifiedTime || postData.publishedTime)}" />`, { html: true });
          }
          if (!seenPublisher) {
            el.append(`<meta property="article:publisher" content="${escapeHtml(postData.publisherName)}" />`, { html: true });
          }
          if (!seenOgUrl) {
            el.append(`<meta property="og:url" content="${escapeHtml(postData.url)}" />`, { html: true });
          }
          if (!seenOgImage && postData.imageUrl) {
            el.append(`<meta property="og:image" content="${escapeHtml(postData.imageUrl)}" />`, { html: true });
          }
          if (!seenOgSecureImage && postData.imageUrl) {
            el.append(`<meta property="og:image:secure_url" content="${escapeHtml(postData.imageUrl)}" />`, { html: true });
          }
          if (!seenTwitterImage && postData.imageUrl) {
            el.append(`<meta name="twitter:image" content="${escapeHtml(postData.imageUrl)}" />`, { html: true });
          }
          if (!seenCanonical) {
            el.append(`<link rel="canonical" href="${escapeHtml(postData.url)}" />`, { html: true });
          }
          if (!seenLdJson) {
            el.append(`<script type="application/ld+json">\n${schemaJson}\n</script>`, { html: true });
          }
        },
      });

    const transformedResponse = rewriter.transform(originResponse);
    const transformedBody = await transformedResponse.text();

    // Cache-Control: public, max-age=3600 (1 hour cache for social crawlers)
    const dynamicHeaders = new Headers(transformedResponse.headers);
    dynamicHeaders.set('Content-Type', 'text/html; charset=utf-8');
    dynamicHeaders.set('Cache-Control', 'public, max-age=3600');
    dynamicHeaders.delete('Pragma');
    dynamicHeaders.delete('Expires');

    const finalResponse = new Response(transformedBody, {
      status: transformedResponse.status,
      statusText: transformedResponse.statusText,
      headers: dynamicHeaders,
    });

    // Store in Cloudflare Edge Cache for 1 hour to prevent redundant Firestore queries
    try {
      if (finalResponse.status === 200) {
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
        } else {
          await cache.put(cacheKey, finalResponse.clone());
        }
      }
    } catch (cacheErr) {
      console.warn('[Worker Debug] Cache put error:', cacheErr);
    }

    return finalResponse;
  },
};
