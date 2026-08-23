export type Theme = 'sepia' | 'dark' | 'light';

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  published: boolean;
  featured: boolean;
  readTime: string; // e.g. "4 min read"
  views: number;
  likes: number;
  createdAt: string; // ISO date string
  updatedAt?: string;
  affiliateLinks?: Array<{
    text: string;
    url: string;
    label?: string;
  }>;
}

export interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
  source: string; // 'homepage' | 'post-footer' | 'popup'
  status: 'active' | 'unsubscribed';
}

export interface PostComment {
  id: string;
  postId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  approved: boolean;
}

export interface ReaderMessage {
  id: string;
  postId?: string;
  postTitle?: string;
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied';
  replyNotes?: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  accentColor: string;
  logoUrl?: string;
  authorName: string;
  authorBio: string;
  authorAvatar: string;
  authorTwitter?: string;
  authorInstagram?: string;
  authorGithub?: string;
  authorLinkedin?: string;
  announcementText?: string;
  announcementActive?: boolean;
  sponsorBanner: {
    enabled: boolean;
    label: string; // e.g. "ADVERTISE IN THIS SPACE"
    sponsorName: string;
    tagline: string;
    ctaText: string;
    url: string;
    badgeText?: string;
  };
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}
