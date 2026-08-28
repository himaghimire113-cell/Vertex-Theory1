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

const HARDCODED_POSTS = [
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

function cleanTextSnippet(raw, maxLength = 160) {
  if (!raw) return '';
  const stripped = raw
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*`_~>[\]]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength).trim() + '...';
}

function slugifyText(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractFieldValue(fields, ...possibleKeys) {
  if (!fields) return '';
  for (const key of possibleKeys) {
    const val = fields[key];
    if (val && typeof val.stringValue === 'string' && val.stringValue.trim()) {
      return val.stringValue.trim();
    }
  }
  return '';
}

function formatIsoDate(rawDate) {
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

function parseDocToMetadata(fields, createTime) {
  if (!fields) return null;

  const title = extractFieldValue(fields, 'title', 'postTitle', 'name', 'headline');
  const rawDesc = extractFieldValue(fields, 'excerpt', 'description', 'summary', 'subtitle', 'content');
  const imageUrl = extractFieldValue(fields, 'coverImage', 'imageUrl', 'image', 'featuredImage', 'thumbnail', 'photo', 'banner', 'img', 'url');
  const authorName = fields.author?.mapValue?.fields?.name?.stringValue || extractFieldValue(fields, 'authorName', 'author') || 'Julian Vance';
  const rawTime = createTime || fields.createdAt?.stringValue || fields.publishedAt?.stringValue || fields.date?.stringValue;

  if (title) {
    return {
      title,
      description: cleanTextSnippet(rawDesc) || 'Read the full publication on Vertex Theory.',
      imageUrl: imageUrl || '',
      url: '',
      publishedTime: formatIsoDate(rawTime),
      authorName,
      publisherName: 'Vertex Theory',
    };
  }
  return null;
}

async function fetchPostFromFirestore(slugOrId, projectId) {
  const cleanSlug = decodeURIComponent(slugOrId).trim().toLowerCase();
  if (!cleanSlug) return null;

  const hardcoded = HARDCODED_POSTS.find(
    p => p.slug.toLowerCase() === cleanSlug || p.id.toLowerCase() === cleanSlug || slugifyText(p.title) === cleanSlug
  );
  if (hardcoded) {
    return {
      title: hardcoded.title,
      description: cleanTextSnippet(hardcoded.excerpt),
      imageUrl: hardcoded.coverImage,
      url: '',
      publishedTime: hardcoded.createdAt,
      authorName: hardcoded.authorName,
      publisherName: 'Vertex Theory',
    };
  }

  try {
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

    const queryResponse = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(queryBody),
    });

    if (queryResponse.ok) {
      const results = await queryResponse.json();
      for (const item of results) {
        if (item.document && item.document.fields) {
          const parsed = parseDocToMetadata(item.document.fields, item.document.createTime);
          if (parsed) return parsed;
        }
      }
    }

    const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${FIRESTORE_DATABASE}/documents/${POSTS_COLLECTION}?pageSize=100&key=${FIREBASE_API_KEY}`;
    const listResponse = await fetch(listUrl, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
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
            const parsed = parseDocToMetadata(fields, doc.createTime);
            if (parsed) return parsed;
          }
        }
      }
    }

    const directDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${FIRESTORE_DATABASE}/documents/${POSTS_COLLECTION}/${encodeURIComponent(cleanSlug)}?key=${FIREBASE_API_KEY}`;
    const directResponse = await fetch(directDocUrl, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (directResponse.ok) {
      const directDoc = await directResponse.json();
      const parsed = parseDocToMetadata(directDoc.fields, directDoc.createTime);
      if (parsed) return parsed;
    }
  } catch (error) {
    console.error('Error fetching dynamic post metadata from Firestore:', error);
  }

  return null;
}

function isSocialCrawler(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  return (
    ua.includes('facebookexternalhit') ||
    ua.includes('facebot') ||
    ua.includes('meta-externalagent') ||
    ua.includes('twitterbot') ||
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
    ua.includes('nuxtseo') ||
    ua.includes('opengraph') ||
    ua.includes('crawler') ||
    ua.includes('spider') ||
    ua.includes('bot') ||
    ua.includes('validator') ||
    ua.includes('preview') ||
    ua.includes('lighthouse')
  );
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderCrawlerHtml(post, canonicalUrl) {
  const title = `${post.title} — Vertex Theory`;
  return `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns# article: https://ogp.me/ns/article#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(post.description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <!-- Open Graph / Facebook -->
  <meta property="og:site_name" content="Vertex Theory">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:description" content="${escapeHtml(post.description)}">
  <meta property="og:image" content="${escapeHtml(post.imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(post.imageUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(post.title)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_US">

  <!-- Article Specific -->
  <meta property="article:published_time" content="${escapeHtml(post.publishedTime)}">
  <meta property="article:author" content="${escapeHtml(post.authorName)}">
  <meta property="article:publisher" content="https://vertex-theory1.kaflea991.workers.dev">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@vertextheory">
  <meta name="twitter:title" content="${escapeHtml(post.title)}">
  <meta name="twitter:description" content="${escapeHtml(post.description)}">
  <meta name="twitter:image" content="${escapeHtml(post.imageUrl)}">
  <meta name="twitter:image:alt" content="${escapeHtml(post.title)}">
</head>
<body>
  <h1>${escapeHtml(post.title)}</h1>
  <p>${escapeHtml(post.description)}</p>
  ${post.imageUrl ? `<img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" />` : ''}
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';

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

    if (postSlug && isSocialCrawler(userAgent)) {
      const postData = await fetchPostFromFirestore(postSlug, FIREBASE_PROJECT_ID);
      if (postData) {
        postData.url = url.href;
        const crawlerHtml = renderCrawlerHtml(postData, url.href);
        return new Response(crawlerHtml, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Vary': 'User-Agent',
          },
        });
      }
    }

    let originResponse;
    if (env.ASSETS) {
      originResponse = await env.ASSETS.fetch(request);
    } else {
      originResponse = await fetch(request);
    }

    const contentType = originResponse.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return originResponse;
    }

    if (!postSlug) {
      const headers = new Headers(originResponse.headers);
      headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      headers.set('Vary', 'Accept-Encoding, User-Agent');
      return new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers,
      });
    }

    const postData = await fetchPostFromFirestore(postSlug, FIREBASE_PROJECT_ID);
    
    if (!postData) {
      const fallbackHeaders = new Headers(originResponse.headers);
      fallbackHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0');
      fallbackHeaders.set('Pragma', 'no-cache');
      fallbackHeaders.set('Expires', '0');
      fallbackHeaders.set('Vary', 'Accept-Encoding, User-Agent');
      return new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers: fallbackHeaders,
      });
    }

    postData.url = url.href;
    const formattedTitle = `${postData.title} — Vertex Theory`;

    let seenAuthor = false;
    let seenArticleAuthor = false;
    let seenPublishedTime = false;
    let seenPublisher = false;
    let seenOgImage = false;
    let seenOgSecureImage = false;
    let seenOgUrl = false;
    let seenTwitterImage = false;
    let seenCanonical = false;

    const rewriter = new HTMLRewriter()
      .on('title', {
        element(el) {
          el.setInnerContent(formattedTitle);
        },
      })
      .on('meta[name="description"]', {
        element(el) {
          el.setAttribute('content', postData.description);
        },
      })
      .on('meta[name="author"]', {
        element(el) {
          seenAuthor = true;
          el.setAttribute('content', postData.authorName);
        },
      })
      .on('meta[property="article:author"]', {
        element(el) {
          seenArticleAuthor = true;
          el.setAttribute('content', postData.authorName);
        },
      })
      .on('meta[property="article:published_time"]', {
        element(el) {
          seenPublishedTime = true;
          el.setAttribute('content', postData.publishedTime);
        },
      })
      .on('meta[property="article:publisher"]', {
        element(el) {
          seenPublisher = true;
          el.setAttribute('content', postData.publisherName);
        },
      })
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
      .on('link[rel="canonical"]', {
        element(el) {
          seenCanonical = true;
          el.setAttribute('href', postData.url);
        },
      })
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
        },
      });

    const transformedResponse = rewriter.transform(originResponse);
    
    const dynamicHeaders = new Headers(transformedResponse.headers);
    dynamicHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0');
    dynamicHeaders.set('Pragma', 'no-cache');
    dynamicHeaders.set('Expires', '0');
    dynamicHeaders.set('Vary', 'Accept-Encoding, User-Agent');

    return new Response(transformedResponse.body, {
      status: transformedResponse.status,
      statusText: transformedResponse.statusText,
      headers: dynamicHeaders,
    });
  },
};

