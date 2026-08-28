/**
 * Cloudflare Worker for Vertex Theory
 * Handles Dynamic Open Graph / Twitter Cards meta tag rewriting for social media crawlers
 * using Cloudflare HTMLRewriter and Firebase Firestore REST API.
 */

// ============================================================================
// CONFIGURATION & DATABASE SCHEMA
// ============================================================================
const FIREBASE_PROJECT_ID = 'vertextheory1-44870';
const FIRESTORE_DATABASE = '(default)';
const POSTS_COLLECTION = 'posts';

interface Env {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  [key: string]: unknown;
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
  authorName: string;
  publisherName: string;
}

/**
 * Clean markdown or HTML formatting from content string for preview descriptions
 * Truncates to roughly 120-155 characters to avoid card truncation issues
 */
function cleanTextSnippet(raw: string, maxLength = 150): string {
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
    // ignore
  }
  return new Date().toISOString();
}

/**
 * Fetch post metadata from Firebase Firestore REST API
 */
async function fetchPostFromFirestore(slugOrId: string, projectId: string): Promise<PostMetadata | null> {
  const cleanSlug = decodeURIComponent(slugOrId).trim();
  if (!cleanSlug) return null;

  try {
    // Strategy 1: Run structured query on the `slug` field
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${FIRESTORE_DATABASE}/documents:runQuery`;
    
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryBody),
    });

    if (queryResponse.ok) {
      const results = (await queryResponse.json()) as Array<{ document?: { fields?: Record<string, FirestoreValue>; createTime?: string } }>;
      const doc = results?.[0]?.document;
      const fields = doc?.fields;

      if (fields) {
        const title = extractFieldValue(fields, 'title', 'postTitle', 'name', 'headline') || 'Vertex Theory Article';
        const rawDesc = extractFieldValue(fields, 'excerpt', 'description', 'summary', 'subtitle', 'content');
        const imageUrl = extractFieldValue(fields, 'coverImage', 'imageUrl', 'image', 'featuredImage', 'thumbnail');
        const authorName = fields.author?.mapValue?.fields?.name?.stringValue || extractFieldValue(fields, 'authorName', 'author') || 'Vertex Theory';
        const rawTime = doc?.createTime || fields.createdAt?.stringValue || fields.publishedAt?.stringValue || fields.date?.stringValue;

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
    }

    // Strategy 2: Fallback direct document fetch if ID is used directly in Firestore
    const directDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${FIRESTORE_DATABASE}/documents/${POSTS_COLLECTION}/${encodeURIComponent(cleanSlug)}`;
    const directResponse = await fetch(directDocUrl);

    if (directResponse.ok) {
      const directDoc = (await directResponse.json()) as { fields?: Record<string, FirestoreValue>; createTime?: string };
      const fields = directDoc.fields;

      if (fields) {
        const title = extractFieldValue(fields, 'title', 'postTitle', 'name', 'headline') || 'Vertex Theory Article';
        const rawDesc = extractFieldValue(fields, 'excerpt', 'description', 'summary', 'subtitle', 'content');
        const imageUrl = extractFieldValue(fields, 'coverImage', 'imageUrl', 'image', 'featuredImage', 'thumbnail');
        const authorName = fields.author?.mapValue?.fields?.name?.stringValue || extractFieldValue(fields, 'authorName', 'author') || 'Vertex Theory';
        const rawTime = directDoc.createTime || fields.createdAt?.stringValue || fields.publishedAt?.stringValue || fields.date?.stringValue;

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
    }
  } catch (error) {
    console.error('Error fetching post metadata from Firestore REST API:', error);
  }

  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Check if the incoming URL contains a post parameter or route
    // Matches ?post=your-post-slug, ?p=slug, ?article=slug, or /post/your-post-slug
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

    // 2. Fetch the origin response (static assets or proxied origin)
    let response: Response;
    if (env.ASSETS) {
      response = await env.ASSETS.fetch(request);
    } else {
      response = await fetch(request);
    }

    // If no post parameter or not an HTML response, return response as-is
    const contentType = response.headers.get('content-type') || '';
    if (!postSlug || !contentType.includes('text/html')) {
      return response;
    }

    // 3. Fetch metadata from Firebase Firestore
    const postData = await fetchPostFromFirestore(postSlug, FIREBASE_PROJECT_ID);
    if (!postData) {
      return response; // Fallback to standard page if post record is not found
    }

    postData.url = url.href;
    const formattedTitle = `${postData.title} | Vertex Theory`;

    let seenAuthor = false;
    let seenArticleAuthor = false;
    let seenPublishedTime = false;
    let seenPublisher = false;
    let seenOgImage = false;
    let seenOgUrl = false;
    let seenTwitterImage = false;

    // 4. Use Cloudflare HTMLRewriter to rewrite dynamic meta tags on the fly
    return new HTMLRewriter()
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
      // Head injector: append any missing tags
      .on('head', {
        element(el) {
          if (!seenAuthor) {
            el.append(`<meta name="author" content="${postData.authorName}" />`, { html: true });
          }
          if (!seenArticleAuthor) {
            el.append(`<meta property="article:author" content="${postData.authorName}" />`, { html: true });
          }
          if (!seenPublishedTime) {
            el.append(`<meta property="article:published_time" content="${postData.publishedTime}" />`, { html: true });
          }
          if (!seenPublisher) {
            el.append(`<meta property="article:publisher" content="${postData.publisherName}" />`, { html: true });
          }
          if (!seenOgUrl) {
            el.append(`<meta property="og:url" content="${postData.url}" />`, { html: true });
          }
          if (!seenOgImage && postData.imageUrl) {
            el.append(`<meta property="og:image" content="${postData.imageUrl}" />`, { html: true });
          }
          if (!seenTwitterImage && postData.imageUrl) {
            el.append(`<meta name="twitter:image" content="${postData.imageUrl}" />`, { html: true });
          }
        },
      })
      .transform(response);
  },
};
