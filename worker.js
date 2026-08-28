/**
 * Cloudflare Worker for Vertex Theory
 * Handles Dynamic Open Graph / Twitter Cards meta tag rewriting for social media crawlers
 * using Cloudflare HTMLRewriter and Firebase Firestore REST API.
 */

const FIREBASE_PROJECT_ID = 'vertextheory1-44870';
const FIRESTORE_DATABASE = '(default)';
const POSTS_COLLECTION = 'posts';

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

async function fetchPostFromFirestore(slugOrId, projectId) {
  const cleanSlug = decodeURIComponent(slugOrId).trim();
  if (!cleanSlug) return null;

  try {
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
      const results = await queryResponse.json();
      const doc = results?.[0]?.document;
      const fields = doc?.fields;

      if (fields) {
        const title = extractFieldValue(fields, 'title', 'postTitle', 'name', 'headline') || 'Vertex Theory Article';
        const rawDesc = extractFieldValue(fields, 'excerpt', 'description', 'summary', 'subtitle', 'content');
        const imageUrl = extractFieldValue(fields, 'coverImage', 'imageUrl', 'image', 'featuredImage', 'thumbnail');
        const authorName = fields.author?.mapValue?.fields?.name?.stringValue || extractFieldValue(fields, 'authorName', 'author');

        return {
          title,
          description: cleanTextSnippet(rawDesc) || 'Read the full publication on Vertex Theory.',
          imageUrl: imageUrl || '',
          url: '',
          publishedTime: doc?.createTime || fields.createdAt?.stringValue,
          authorName,
        };
      }
    }

    const directDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${FIRESTORE_DATABASE}/documents/${POSTS_COLLECTION}/${encodeURIComponent(cleanSlug)}`;
    const directResponse = await fetch(directDocUrl);

    if (directResponse.ok) {
      const directDoc = await directResponse.json();
      const fields = directDoc.fields;

      if (fields) {
        const title = extractFieldValue(fields, 'title', 'postTitle', 'name', 'headline') || 'Vertex Theory Article';
        const rawDesc = extractFieldValue(fields, 'excerpt', 'description', 'summary', 'subtitle', 'content');
        const imageUrl = extractFieldValue(fields, 'coverImage', 'imageUrl', 'image', 'featuredImage', 'thumbnail');
        const authorName = fields.author?.mapValue?.fields?.name?.stringValue || extractFieldValue(fields, 'authorName', 'author');

        return {
          title,
          description: cleanTextSnippet(rawDesc) || 'Read the full publication on Vertex Theory.',
          imageUrl: imageUrl || '',
          url: '',
          publishedTime: directDoc.createTime || fields.createdAt?.stringValue,
          authorName,
        };
      }
    }
  } catch (error) {
    console.error('Error fetching post metadata from Firestore REST API:', error);
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

    let response;
    if (env.ASSETS) {
      response = await env.ASSETS.fetch(request);
    } else {
      response = await fetch(request);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!postSlug || !contentType.includes('text/html')) {
      return response;
    }

    const postData = await fetchPostFromFirestore(postSlug, FIREBASE_PROJECT_ID);
    if (!postData) {
      return response;
    }

    postData.url = url.href;
    const formattedTitle = `${postData.title} | Vertex Theory`;

    let seenOgImage = false;
    let seenOgUrl = false;
    let seenTwitterImage = false;

    return new HTMLRewriter()
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
      .on('head', {
        element(el) {
          if (!seenOgUrl) {
            el.append(`<meta property="og:url" content="${postData.url}" />`, { html: true });
          }
          if (!seenOgImage && postData.imageUrl) {
            el.append(`<meta property="og:image" content="${postData.imageUrl}" />`, { html: true });
          }
          if (!seenTwitterImage && postData.imageUrl) {
            el.append(`<meta name="twitter:image" content="${postData.imageUrl}" />`, { html: true });
          }
          if (postData.authorName) {
            el.append(`<meta name="author" content="${postData.authorName}" />`, { html: true });
          }
        },
      })
      .transform(response);
  },
};
