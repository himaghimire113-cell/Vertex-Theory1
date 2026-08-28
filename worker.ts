/**
 * Cloudflare Worker for Vertex Theory
 * Handles Dynamic Open Graph / Twitter Cards meta tag rewriting for social media crawlers
 * using Cloudflare HTMLRewriter and Firebase Firestore REST API.
 */

// CONFIGURATION: Replace these values if your project ID or collection differs
const FIREBASE_PROJECT_ID = 'vertextheory1-44870'; // Your Firebase Project ID
const FIRESTORE_DATABASE = '(default)';
const POSTS_COLLECTION = 'posts';

interface Env {
  // Cloudflare Assets binding or custom env variables if applicable
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
  authorName?: string;
  url: string;
}

/**
 * Extract clean string value from Firestore REST format
 */
function parseFirestoreField(field?: FirestoreValue): string {
  if (!field) return '';
  return field.stringValue || '';
}

/**
 * Fetch post metadata from Firebase Firestore REST API
 * Supports both query by 'slug' field and direct document ID lookup
 */
async function fetchPostFromFirestore(slugOrId: string, projectId: string): Promise<PostMetadata | null> {
  const cleanSlug = decodeURIComponent(slugOrId).trim();
  if (!cleanSlug) return null;

  try {
    // Strategy 1: Run structured query to find document matching `slug == cleanSlug`
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
      const results = (await queryResponse.json()) as Array<{ document?: { fields?: Record<string, FirestoreValue> } }>;
      const docData = results?.[0]?.document?.fields;

      if (docData) {
        return {
          title: parseFirestoreField(docData.title) || 'Vertex Theory Article',
          description: parseFirestoreField(docData.excerpt) || parseFirestoreField(docData.content)?.substring(0, 160) || 'Read this post on Vertex Theory.',
          imageUrl: parseFirestoreField(docData.coverImage) || '',
          url: '',
        };
      }
    }

    // Strategy 2: Fallback direct document fetch if ID is used directly
    const directDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${FIRESTORE_DATABASE}/documents/${POSTS_COLLECTION}/${cleanSlug}`;
    const directResponse = await fetch(directDocUrl);

    if (directResponse.ok) {
      const directDoc = (await directResponse.json()) as { fields?: Record<string, FirestoreValue> };
      const fields = directDoc.fields;

      if (fields) {
        return {
          title: parseFirestoreField(fields.title) || 'Vertex Theory Article',
          description: parseFirestoreField(fields.excerpt) || parseFirestoreField(fields.content)?.substring(0, 160) || 'Read this post on Vertex Theory.',
          imageUrl: parseFirestoreField(fields.coverImage) || '',
          url: '',
        };
      }
    }
  } catch (error) {
    console.error('Error fetching post from Firestore:', error);
  }

  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Check if the incoming URL contains a post parameter or slug route
    // Matches ?post=your-post-slug, ?p=slug, or /post/your-post-slug
    let postSlug = url.searchParams.get('post') || url.searchParams.get('p');

    if (!postSlug && url.pathname.startsWith('/post/')) {
      const parts = url.pathname.split('/post/')[1]?.split('/');
      if (parts && parts[0]) {
        postSlug = parts[0];
      }
    }

    // Fetch the origin response (static assets or proxy)
    let response: Response;
    if (env.ASSETS) {
      response = await env.ASSETS.fetch(request);
    } else {
      response = await fetch(request);
    }

    // If no post slug is requested or not HTML response, return origin response directly
    const contentType = response.headers.get('content-type') || '';
    if (!postSlug || !contentType.includes('text/html')) {
      return response;
    }

    // 2. Fetch post metadata from Firebase Firestore REST API
    const postData = await fetchPostFromFirestore(postSlug, FIREBASE_PROJECT_ID);

    if (!postData) {
      return response; // Fallback to standard page if post not found
    }

    postData.url = url.href;
    const siteTitle = `${postData.title} | Vertex Theory`;

    // 3. Use Cloudflare HTMLRewriter to rewrite meta tags and title dynamically
    return new HTMLRewriter()
      // Update <title>
      .on('title', {
        element(el) {
          el.setInnerContent(siteTitle);
        },
      })
      // Update meta description
      .on('meta[name="description"]', {
        element(el) {
          el.setAttribute('content', postData.description);
        },
      })
      // Open Graph Tags
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
          if (postData.imageUrl) {
            el.setAttribute('content', postData.imageUrl);
          }
        },
      })
      .on('meta[property="og:url"]', {
        element(el) {
          el.setAttribute('content', postData.url);
        },
      })
      .on('meta[property="og:type"]', {
        element(el) {
          el.setAttribute('content', 'article');
        },
      })
      // Twitter Card Tags
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
          if (postData.imageUrl) {
            el.setAttribute('content', postData.imageUrl);
          }
        },
      })
      // Fallback: append meta tags if head does not contain them
      .on('head', {
        element(el) {
          if (postData.imageUrl) {
            el.append(`<meta name="twitter:image" content="${postData.imageUrl}">`, { html: true });
          }
          el.append(`<meta property="og:url" content="${postData.url}">`, { html: true });
        },
      })
      .transform(response);
  },
};
