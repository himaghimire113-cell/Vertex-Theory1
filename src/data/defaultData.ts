import { Post, SiteSettings, Subscriber, PostComment, ReaderMessage } from '../types';

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteName: 'VERTEX THEORY',
  tagline: 'Reflections on Visual Engineering, Design Philosophy & Digital Systems',
  description: 'An independent publication dedicated to high-craft digital interfaces, spatial typography, computing architectures, and the physics of modern aesthetic systems.',
  accentColor: '#ff5533',
  authorName: 'Julian Vance',
  authorBio: 'Architectural technologist and design theorist examining algorithmic interfaces, typography, and human-computer symbiosis.',
  authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  authorTwitter: 'https://twitter.com/vertextheory',
  authorInstagram: 'https://instagram.com/vertextheory',
  authorGithub: 'https://github.com/vertextheory',
  authorLinkedin: 'https://linkedin.com/in/vertextheory',
  announcementText: '',
  announcementActive: false,
  sponsorBanner: {
    enabled: false,
    label: 'PRESENTED BY',
    sponsorName: '',
    tagline: '',
    ctaText: 'Explore Platform →',
    url: '',
    badgeText: 'SPONSORED'
  }
};

export const INITIAL_CATEGORIES = [
  { id: 'all', name: 'All Dispatches' },
  { id: 'design-systems', name: 'Design Systems' },
  { id: 'visual-theory', name: 'Visual Theory' },
  { id: 'computing', name: 'Computing & AI' },
  { id: 'hardware', name: 'Hardware & Spaces' },
  { id: 'philosophy', name: 'Digital Philosophy' },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    slug: 'the-physics-of-spatial-interfaces',
    title: 'The Physics of Spatial Interfaces: Why Tactility Transcends Flat Pixels',
    excerpt: 'Examining the mathematical constraints and optical tensions that transform cold screen glass into organic, responsive tactile canvases.',
    category: 'visual-theory',
    tags: ['Spatial UI', 'Micro-interactions', 'Design Physics', 'Typography'],
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    author: {
      name: 'Julian Vance',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      role: 'Principal Author'
    },
    published: true,
    featured: true,
    readTime: '6 min read',
    views: 1420,
    likes: 184,
    createdAt: '2026-08-18T10:00:00.000Z',
    affiliateLinks: [
      {
        text: 'Studio Display 5K with Nano-Texture Glass',
        url: 'https://apple.com/studio-display',
        label: 'Recommended Hardware'
      },
      {
        text: 'The Elements of Typographic Style by Robert Bringhurst',
        url: 'https://amazon.com',
        label: 'Essential Reading'
      }
    ],
    content: `## The Optical Illusion of Inert Matter

When we interact with glass displays, our sensory nervous system is perpetually running a subconscious comparison between physical inertia and synthetic luminescence. For the past decade, flat UI trends attempted to eradicate all simulated depth. Yet, as screen refresh rates leaped to 120Hz and OLED contrast ratios reached pure zero-nits black, a subtle transformation occurred: the screen stopped being a sheet of digital paper and became a portal of physical simulation.

> "A great interface is not one that screams for attention, but one whose physics align so harmoniously with human expectation that the screen dissolves entirely."

### 1. The Elasticity of Kinetic Feedback

Every gesture on modern mobile hardware produces a velocity vector. When a user flings a list or dismisses a modal card, the deceleration curve dictates whether the UI feels like oiled titanium or cheap plastic. 

\`\`\`css
/* High-tension spring damping curve */
transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 220ms ease-out;
\`\`\`

When this curve matches the micro-vibrations of haptic engines, cognitive load drops precipitously.

### 2. Optical Weight and the Balance of Dark Voids

In deep-charcoal palette engineering (such as our \`#0c0d10\` base tone), pure white text produces halation artifacts in high-contrast OLED panels. The solution is strictly damping body text to warm platinum (\`#e2e4ea\`) while preserving high-chroma accents (\`#ff5533\`) exclusively for stateful actions and editorial anchors.

[AFFILIATE: Studio Display 5K with Nano-Texture Glass | url="https://apple.com/studio-display" | badge="Hardware Pick"]

### The Future: Latent Adaptive Layouts

As machine learning models take charge of responsive layout reflows, viewport breakpoints will evolve into continuous fluid topologies. The designer's duty is no longer drawing static artboards, but defining the gravitational rules of the system.`
  },
  {
    id: 'post-2',
    slug: 'monolithic-simplicity-in-an-age-of-framework-churn',
    title: 'Monolithic Simplicity: Building for Longevity in an Age of Tooling Churn',
    excerpt: 'Why flat hierarchies, native Web standards, and zero-overhead architecture deliver superior developer sanity and ultra-fast mobile loading.',
    category: 'computing',
    tags: ['Architecture', 'Web Standards', 'Vercel', 'Performance'],
    coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
    author: {
      name: 'Julian Vance',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      role: 'Principal Author'
    },
    published: true,
    featured: false,
    readTime: '5 min read',
    views: 980,
    likes: 122,
    createdAt: '2026-08-14T14:30:00.000Z',
    affiliateLinks: [
      {
        text: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard',
        url: 'https://keychron.com',
        label: 'Engineering Setup'
      }
    ],
    content: `## The Modern Dependency Trap

Modern web engineering frequently falls prey to architectural hypertrophy. A simple blog or editorial magazine shouldn't require twenty nested abstraction layers or desktop-only build scripts that buckle when pushed from a mobile terminal.

### The Beauty of Query-Param Resilient Routing

Query parameter routing (\`/?post=slug-name\`) provides unrivaled robustness:
1. It survives aggressive in-app browsers like Facebook, Instagram, and TikTok without hash-stripping anomalies.
2. It natively supports OpenGraph scrapers when paired with lightweight edge workers or SSR layers.
3. It makes URL parsing defensive against unexpected query parameters like \`fbclid\` and \`utm_campaign\`.

\`\`\`javascript
// Defensive URL query extraction
const params = new URLSearchParams(window.location.search);
const postSlug = params.get('post');
\`\`\`

### Firestore Long-Polling on Restricted Networks

When initializing Firestore inside mobile WebViews, standard WebSockets can be terminated silently by aggressive iOS background task suspensions. Forcing long-polling guarantees bulletproof delivery:

\`\`\`javascript
initializeFirestore(app, {
  experimentalForceLongPolling: true
});
\`\`\`

By honoring native browser capabilities, our applications remain accessible anywhere, from a high-spec desktop workstation to an iPhone over spotty cellular connections.`
  },
  {
    id: 'post-3',
    slug: 'spatial-typography-and-geometric-brutalism',
    title: 'Spatial Typography & Geometric Brutalism in Modern Editorial Design',
    excerpt: 'A deep dive into how high-contrast sans serifs paired with classical serifs create memorable, unmistakable brand character.',
    category: 'design-systems',
    tags: ['Typography', 'Editorial', 'Syne', 'Brutalism'],
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    author: {
      name: 'Julian Vance',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      role: 'Principal Author'
    },
    published: true,
    featured: false,
    readTime: '4 min read',
    views: 820,
    likes: 95,
    createdAt: '2026-08-09T08:15:00.000Z',
    content: `## Beyond Generic Cleanliness

When every digital publication defaults to identical sans-serif typefaces and cookie-cutter grid templates, the soul of publishing is lost. Vertex Theory was conceptualized around an intentional typographic tension: **Syne's uncompromising geometric angles** set against **Instrument Serif's delicate, literary warmth**.

### Typographic Contrast Ratios

True visual craft emerges when proportions reflect deliberate mathematical steps:

- **H1 Display Titles**: Scaled at 1.45 step ratios with tight negative letter-spacing (\`-0.03em\`)
- **Blockquote Insets**: Italicized serif with vertical ember-orange rhythm markers
- **Metadata & Tags**: Monospaced tabular figures with generous tracking (\`+0.05em\`)

When typography leads the page layout, graphics become complementary rather than compensatory.`
  },
  {
    id: 'post-4',
    slug: 'the-autonomous-workspace-hardware-for-thinkers',
    title: 'The Autonomous Workspace: Curated Hardware & Tools for Focused Thought',
    excerpt: 'An intentional breakdown of the physical ergonomics, ambient lighting, and analog notebooks powering high-output creative minds.',
    category: 'hardware',
    tags: ['Hardware', 'Productivity', 'Minimalism', 'Studio'],
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
    author: {
      name: 'Julian Vance',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      role: 'Principal Author'
    },
    published: true,
    featured: false,
    readTime: '7 min read',
    views: 1150,
    likes: 140,
    createdAt: '2026-08-02T16:45:00.000Z',
    affiliateLinks: [
      {
        text: 'BenQ ScreenBar Pro Monitor Light',
        url: 'https://benq.com',
        label: 'Ambient Lighting'
      },
      {
        text: 'Ugmonk Gather Modular Desk Organizer',
        url: 'https://ugmonk.com',
        label: 'Desk Architecture'
      }
    ],
    content: `## The Physical Environment as Cognitive Accelerator

Our immediate physical surroundings exert a profound, continuous influence on cognitive bandwidth. When our desks are cluttered with extraneous cables and inconsistent light sources, mental fatigue accelerates.

### Lighting Architecture

Ambient light must balance screen luminance without casting harsh glares. Asymmetrical light bars mounted directly above curved displays eliminate specular reflections on matte surfaces.

[AFFILIATE: BenQ ScreenBar Pro Monitor Light | url="https://benq.com" | badge="Staff Pick"]

### The Analog Scratchpad

Before writing code or architecting system databases, drafting state flows on heavyweight fountain-pen paper forces structural clarity that digital canvas applications rarely inspire.`
  }
];

export const INITIAL_SUBSCRIBERS: Subscriber[] = [
  {
    id: 'sub-1',
    email: 'elena.rostova@designlab.org',
    createdAt: '2026-08-19T09:12:00.000Z',
    source: 'homepage',
    status: 'active'
  },
  {
    id: 'sub-2',
    email: 'marcus.chen@vertexsys.io',
    createdAt: '2026-08-17T15:40:00.000Z',
    source: 'post-footer',
    status: 'active'
  },
  {
    id: 'sub-3',
    email: 'sarah.k@monolith.tech',
    createdAt: '2026-08-15T11:22:00.000Z',
    source: 'popup',
    status: 'active'
  }
];

export const INITIAL_COMMENTS: PostComment[] = [
  {
    id: 'comm-1',
    postId: 'post-1',
    authorName: 'Alex Mercer',
    authorEmail: 'alex@mercer.design',
    content: 'The point regarding haptic deceleration curves is spot on. We recently rebuilt our iOS interaction engine with custom spring dampening and the perceived responsiveness increased dramatically.',
    createdAt: '2026-08-19T14:30:00.000Z',
    approved: true
  },
  {
    id: 'comm-2',
    postId: 'post-1',
    authorName: 'Dr. Clara Lindqvist',
    authorEmail: 'clara@neurocomputing.se',
    content: 'Fascinating perspective on dark tone halation. Have you tested this against variable micro-LED arrays?',
    createdAt: '2026-08-20T08:15:00.000Z',
    approved: true
  }
];

export const INITIAL_MESSAGES: ReaderMessage[] = [
  {
    id: 'msg-1',
    postId: 'post-1',
    postTitle: 'The Physics of Spatial Interfaces',
    senderName: 'David K.',
    senderEmail: 'david@atelier-spatial.com',
    message: 'Loved the essay on spatial physics! Would you be open to giving a guest lecture at our design symposium this autumn?',
    createdAt: '2026-08-19T18:40:00.000Z',
    status: 'unread'
  },
  {
    id: 'msg-2',
    postId: 'post-2',
    postTitle: 'Monolithic Simplicity in an Age of Tooling Churn',
    senderName: 'Tara Lin',
    senderEmail: 'tara@indiebuilder.co',
    message: 'The query param routing tips saved me on a recent mobile campaign. Thanks for writing this!',
    createdAt: '2026-08-16T12:10:00.000Z',
    status: 'replied',
    replyNotes: 'Replied with appreciation and sent link to GitHub repo.'
  }
];
