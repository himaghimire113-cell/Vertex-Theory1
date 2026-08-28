/**
 * Cloudflare Worker for Vertex Theory
 * Handles Dynamic Open Graph / Twitter Cards meta tag rewriting for social media crawlers
 * using Cloudflare HTMLRewriter and Firebase Firestore REST API.
 */

const FIREBASE_PROJECT_ID = 'vertextheory1-44870';
const FIRESTORE_DATABASE = '(default)';
const POSTS_COLLECTION = 'posts';

function cleanTextSnippet(raw, maxLength = 150) {
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
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(queryBody),
    });

    if (queryResponse.ok) {
      const results = await queryResponse.json();
      const doc = results?.[0]?.document;
      const fields = doc?.fields;

      if (fields) {
        const title = extractFieldValue(fields, 'title', 'postTitle', 'name', 'headline');
        const rawDesc = extractFieldValue(fields, 'excerpt', 'description', 'summary', 'subtitle', 'content');
        const imageUrl = extractFieldValue(fields, 'coverImage', 'imageUrl', 'image', 'featuredImage', 'thumbnail');
        const authorName = fields.author?.mapValue?.fields?.name?.stringValue || extractFieldValue(fields, 'authorName', 'author') || 'Vertex Theory';
        const rawTime = doc?.createTime || fields.createdAt?.stringValue || fields.publishedAt?.stringValue || fields.date?.stringValue;

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
      }
    }

    const directDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${FIRESTORE_DATABASE}/documents/${POSTS_COLLECTION}/${encodeURIComponent(cleanSlug)}`;
    const directResponse = await fetch(directDocUrl, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (directResponse.ok) {
      const directDoc = await directResponse.json();
      const fields = directDoc.fields;

      if (fields) {
        const title = extractFieldValue(fields, 'title', 'postTitle', 'name', 'headline');
        const rawDesc = extractFieldValue(fields, 'excerpt', 'description', 'summary', 'subtitle', 'content');
        const imageUrl = extractFieldValue(fields, 'coverImage', 'imageUrl', 'image', 'featuredImage', 'thumbnail');
        const authorName = fields.author?.mapValue?.fields?.name?.stringValue || extractFieldValue(fields, 'authorName', 'author') || 'Vertex Theory';
        const rawTime = directDoc.createTime || fields.createdAt?.stringValue || fields.publishedAt?.stringValue || fields.date?.stringValue;

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
      }
    }
  } catch (error) {
    console.error('Error fetching dynamic post metadata from Firestore:', error);
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

    if (postSlug) {
      postSlug = postSlug.trim();
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
    const formattedTitle = `${postData.title} | Vertex Theory`;

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
          if (!seenOgSecureImage && postData.imageUrl) {
            el.append(`<meta property="og:image:secure_url" content="${postData.imageUrl}" />`, { html: true });
          }
          if (!seenTwitterImage && postData.imageUrl) {
            el.append(`<meta name="twitter:image" content="${postData.imageUrl}" />`, { html: true });
          }
          if (!seenCanonical) {
            el.append(`<link rel="canonical" href="${postData.url}" />`, { html: true });
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
