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
  id?: string;
  slug?: string;
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
 * Auto-converts Imgur share-page links, album links, and standard URLs to direct image URLs.
 */
function resolveDirectImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  if (/\.(jpeg|jpg|png|gif|webp|svg|avif)(\?.*)?$/i.test(trimmed)) {
    return trimmed;
  }

  try {
    if (trimmed.includes('imgur.com')) {
      const cleanUrl = trimmed.replace(/^https?:\/\//i, '');
      const parts = cleanUrl.split('/');
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
  } catch {
    // fallback
  }

  return trimmed;
}

/**
 * Parse a Firestore document structure into PostMetadata
 */
function parseDocToMetadata(fields: Record<string, FirestoreValue> | undefined, createTime?: string, updateTime?: string, fallbackSlugOrId?: string): PostMetadata | null {
  if (!fields) return null;

  const title = extractFieldValue(fields, 'title', 'postTitle', 'name', 'headline');
  const rawDesc = extractFieldValue(fields, 'excerpt', 'description', 'summary', 'subtitle', 'content');
  const rawImageUrl = extractFieldValue(fields, 'coverImage', 'imageUrl', 'image', 'featuredImage', 'thumbnail', 'photo', 'banner', 'img', 'url');
  const slug = extractFieldValue(fields, 'slug', 'postSlug', 'urlSlug') || fallbackSlugOrId;
  const id = extractFieldValue(fields, 'id', 'documentId') || fallbackSlugOrId;
  
  let imageUrl = resolveDirectImageUrl(rawImageUrl);
  if (!imageUrl) {
    imageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop';
  } else if (imageUrl.startsWith('/')) {
    imageUrl = `https://vertex-theory1.kaflea991.workers.dev${imageUrl}`;
  }
  
  // Extract clean author name (never expose internal worker host names)
  const rawAuthor = fields.author?.mapValue?.fields?.name?.stringValue || extractFieldValue(fields, 'authorName', 'author');
  const authorName = (rawAuthor && !rawAuthor.includes('workers.dev') && !rawAuthor.includes('kaflea')) ? rawAuthor : 'Vertex Theory';
  
  const rawCreateTime = createTime || fields.createdAt?.stringValue || fields.publishedAt?.stringValue || fields.date?.stringValue;
  const rawUpdateTime = updateTime || fields.updatedAt?.stringValue || rawCreateTime;

  if (title) {
    return {
      id,
      slug,
      title,
      description: cleanTextSnippet(rawDesc) || 'Read the full publication on Vertex Theory.',
      imageUrl,
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
    let coverImg = resolveDirectImageUrl(hardcoded.coverImage);
    if (!coverImg) {
      coverImg = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop';
    } else if (coverImg.startsWith('/')) {
      coverImg = `https://vertex-theory1.kaflea991.workers.dev${coverImg}`;
    }

    return {
      id: hardcoded.id,
      slug: hardcoded.slug,
      title: hardcoded.title,
      description: cleanTextSnippet(hardcoded.excerpt),
      imageUrl: coverImg,
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
    ua.includes('facebookcatalog') ||
    ua.includes('facebot') ||
    ua.includes('meta-externalagent') ||
    ua.includes('meta-externalfetcher') ||
    ua.includes('twitterbot') ||
    ua.includes('twitter') ||
    ua.includes('linkedinbot') ||
    ua.includes('whatsapp') ||
    ua.includes('telegrambot') ||
    ua.includes('discordbot') ||
    ua.includes('slackbot') ||
    ua.includes('slack') ||
    ua.includes('pinterest') ||
    ua.includes('skypeuripreview') ||
    ua.includes('google-inspectiontool') ||
    ua.includes('google-pagerenderer') ||
    ua.includes('googlebot') ||
    ua.includes('applebot') ||
    ua.includes('vkshare') ||
    ua.includes('redditbot') ||
    ua.includes('quora') ||
    ua.includes('embedly') ||
    ua.includes('flipboard') ||
    ua.includes('tumblr') ||
    ua.includes('bitlybot') ||
    ua.includes('viber') ||
    ua.includes('linespider') ||
    ua.includes('snapchat') ||
    ua.includes('cardyb') ||
    ua.includes('bluesky') ||
    ua.includes('mastodon') ||
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

/**
 * Extract target post slug or identifier from query parameters or standard path routes
 */
function extractPostSlug(url: URL): string | null {
  const param =
    url.searchParams.get('post') ||
    url.searchParams.get('slug') ||
    url.searchParams.get('id') ||
    url.searchParams.get('p') ||
    url.searchParams.get('article');

  if (param) {
    return param.replace(/\/+$/, '').replace(/\.html$/i, '').trim();
  }

  const path = url.pathname.toLowerCase();
  const prefixes = ['/post/', '/posts/', '/article/', '/articles/', '/story/', '/stories/', '/p/'];
  for (const prefix of prefixes) {
    if (path.startsWith(prefix)) {
      const remaining = url.pathname.slice(prefix.length);
      const slug = remaining.split('/')[0]?.replace(/\.html$/i, '').trim();
      if (slug) return slug;
    }
  }

  return null;
}

/**
 * Renders complete, 100% compliant HTML with pristine Open Graph and Twitter Card tags
 * for social media crawlers (Facebook, X/Twitter, WhatsApp, LinkedIn, Discord, Telegram).
 */
function renderCrawlerHtml(post: PostMetadata, canonicalUrl: string): string {
  const formattedTitle = `${post.title} — Vertex Theory`;
  const schemaJson = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: post.imageUrl,
      datePublished: post.publishedTime,
      dateModified: post.modifiedTime || post.publishedTime,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      author: {
        '@type': 'Person',
        name: post.authorName,
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
    },
    null,
    2
  );

  return `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns# article: https://ogp.me/ns/article#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(formattedTitle)}</title>
  <meta name="description" content="${escapeHtml(post.description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <!-- Favicon & Icons -->
  <link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">
  <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png">

  <!-- Author & Editorial Metadata -->
  <meta name="author" content="${escapeHtml(post.authorName)}">
  <meta property="article:author" content="${escapeHtml(post.authorName)}">
  <meta property="article:publisher" content="https://vertex-theory1.kaflea991.workers.dev/">
  <meta property="article:published_time" content="${escapeHtml(post.publishedTime)}">
  <meta property="article:modified_time" content="${escapeHtml(post.modifiedTime || post.publishedTime)}">

  <!-- Open Graph / Facebook / WhatsApp / LinkedIn / Discord / Telegram -->
  <meta property="og:site_name" content="Vertex Theory">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:description" content="${escapeHtml(post.description)}">
  <meta property="og:image" content="${escapeHtml(post.imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(post.imageUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(post.title)}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter / X Card Metadata -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@vertextheory">
  <meta name="twitter:creator" content="@vertextheory">
  <meta name="twitter:title" content="${escapeHtml(post.title)}">
  <meta name="twitter:description" content="${escapeHtml(post.description)}">
  <meta name="twitter:image" content="${escapeHtml(post.imageUrl)}">
  <meta name="twitter:image:alt" content="${escapeHtml(post.title)}">

  <!-- Structured Data (Schema.org JSON-LD BlogPosting) -->
  <script type="application/ld+json">
${schemaJson}
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.6;">
  <article>
    <header>
      <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 12px;">${escapeHtml(post.title)}</h1>
      <p style="color: #666; font-size: 0.95rem; margin-bottom: 20px;">By ${escapeHtml(post.authorName)} · Published ${escapeHtml(post.publishedTime.split('T')[0])}</p>
    </header>
    <div style="margin: 20px 0;">
      <img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" style="max-width: 100%; height: auto; border-radius: 8px;" />
    </div>
    <p style="font-size: 1.15rem; color: #333; margin: 20px 0;">${escapeHtml(post.description)}</p>
    <p style="margin-top: 30px;">
      <a href="${escapeHtml(canonicalUrl)}" style="color: #b84825; font-weight: 600; text-decoration: underline;">Read the full article on Vertex Theory →</a>
    </p>
  </article>
</body>
</html>`;
}

/**
 * Renders default website metadata HTML for crawlers requesting the home page
 */
function renderDefaultCrawlerHtml(canonicalUrl: string): string {
  const schemaJson = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Vertex Theory',
      url: 'https://vertex-theory1.kaflea991.workers.dev/',
      description: 'An independent publication exploring visual design, computing architectures, philosophy, and digital culture.',
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
    },
    null,
    2
  );

  return `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns# article: https://ogp.me/ns/article#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vertex Theory — Thoughts on Design, Technology &amp; Culture</title>
  <meta name="description" content="An independent publication exploring visual design, computing architectures, philosophy, and digital culture.">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <!-- Favicon & Icons -->
  <link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">
  <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png">

  <!-- Open Graph / Facebook / WhatsApp / LinkedIn -->
  <meta property="og:site_name" content="Vertex Theory">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="Vertex Theory — Thoughts on Design, Technology &amp; Culture">
  <meta property="og:description" content="An independent publication exploring visual design, computing architectures, philosophy, and digital culture.">
  <meta property="og:image" content="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop">
  <meta property="og:image:secure_url" content="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop">
  <meta property="og:image:alt" content="Vertex Theory Publication">
  <meta property="og:locale" content="en_US">

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@vertextheory">
  <meta name="twitter:creator" content="@vertextheory">
  <meta name="twitter:title" content="Vertex Theory — Thoughts on Design, Technology &amp; Culture">
  <meta name="twitter:description" content="An independent publication exploring visual design, computing architectures, philosophy, and digital culture.">
  <meta name="twitter:image" content="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop">
  <meta name="twitter:image:alt" content="Vertex Theory Publication">

  <script type="application/ld+json">
${schemaJson}
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.6;">
  <header>
    <h1>Vertex Theory</h1>
    <p>An independent publication exploring visual design, computing architectures, philosophy, and digital culture.</p>
  </header>
  <p><a href="${escapeHtml(canonicalUrl)}">Explore Vertex Theory →</a></p>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';

    // ========================================================================
    // 1. FAST PASS-THROUGH
    // For regular human browsers or static assets:
    // Serve static assets or root SPA index directly with zero overhead.
    // ========================================================================
    const isBot = isSocialCrawler(userAgent);
    const isStatic = isStaticAsset(url.pathname);

    if (!isBot || isStatic || (request.method !== 'GET' && request.method !== 'HEAD')) {
      if (env.ASSETS) {
        const assetRes = await env.ASSETS.fetch(request);
        // Fallback to root index.html for client-side routing if asset router returns 404
        if (assetRes.status === 404 && !isStatic) {
          return env.ASSETS.fetch(new Request(new URL('/', request.url).toString(), request));
        }
        return assetRes;
      }
      return fetch(request);
    }

    console.log('[Worker Debug] Social crawler detected:', userAgent, '-> URL:', url.href);

    // ========================================================================
    // 2. EDGE CACHING (caches.default)
    // Cache transformed crawler responses for 1 hour to prevent redundant
    // Firestore lookups while serving social bots at edge speed (<50ms).
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

    // ========================================================================
    // 3. EXTRACT POST SLUG & FETCH METADATA
    // ========================================================================
    const postSlug = extractPostSlug(url);
    let crawlerHtml = '';

    if (postSlug) {
      const postData = await fetchPostFromFirestore(postSlug, FIREBASE_PROJECT_ID);

      if (postData) {
        const canonicalUrl = `https://vertex-theory1.kaflea991.workers.dev/?post=${encodeURIComponent(
          postData.slug || postData.id || postSlug
        )}`;
        postData.url = canonicalUrl;
        crawlerHtml = renderCrawlerHtml(postData, canonicalUrl);
      }
    }

    // If not a specific post or post not found, render high-quality default site preview
    if (!crawlerHtml) {
      const canonicalUrl = 'https://vertex-theory1.kaflea991.workers.dev/';
      crawlerHtml = renderDefaultCrawlerHtml(canonicalUrl);
    }

    // ========================================================================
    // 4. RETURN RESPONSE & POPULATE EDGE CACHE
    // ========================================================================
    const headers = new Headers();
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    headers.set('Vary', 'User-Agent');

    const crawlerResponse = new Response(crawlerHtml, {
      status: 200,
      headers,
    });

    try {
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(cache.put(cacheKey, crawlerResponse.clone()));
      } else {
        await cache.put(cacheKey, crawlerResponse.clone());
      }
    } catch (cacheErr) {
      console.warn('[Worker Debug] Cache put error:', cacheErr);
    }

    return crawlerResponse;
  },
};
