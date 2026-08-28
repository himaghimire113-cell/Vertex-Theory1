import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Settings, 
  Users, 
  MessageSquare, 
  Mail, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Eye, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  LogOut, 
  Lock, 
  Key, 
  Globe, 
  Cloud, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  HelpCircle,
  Database,
  User
} from 'lucide-react';
import JSZip from 'jszip';
import { 
  Post, 
  SiteSettings, 
  Subscriber, 
  PostComment, 
  ReaderMessage, 
  FirebaseCustomConfig 
} from '../types';
import { 
  resolveDirectImageUrl, 
  calculateReadTime, 
  slugify, 
  exportSubscribersToCSV, 
  exportMessagesToCSV, 
  formatEditorialDate,
  navigateTo 
} from '../utils/helpers';
import { Logo } from './Logo';
import { 
  saveOrUpdatePost, 
  removePost, 
  saveSiteSettings, 
  fetchAllSubscribers, 
  removeSubscriber, 
  fetchAllMessages, 
  updateMessageStatus, 
  fetchAllComments, 
  deleteCommentById,
  loginAdmin, 
  logoutAdmin, 
  getCurrentAdminUser, 
  getSavedFirebaseConfig, 
  saveFirebaseConfig,
  getFirebaseClients 
} from '../firebaseConfig';

interface AdminPanelProps {
  posts: Post[];
  settings: SiteSettings;
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  posts,
  settings,
  onRefreshData,
}) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState(getCurrentAdminUser());
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showConfigSetup, setShowConfigSetup] = useState(false);
  const [loginConfigJson, setLoginConfigJson] = useState(() => {
    const saved = getSavedFirebaseConfig();
    return saved ? JSON.stringify(saved, null, 2) : '';
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'posts' | 'editor' | 'appearance' | 'subscribers' | 'messages' | 'comments' | 'deploy'
  >('posts');

  // Editor Form State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postSlug, setPostSlug] = useState('');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCoverImage, setPostCoverImage] = useState('');
  const [postCategory, setPostCategory] = useState('visual-theory');
  const [postTags, setPostTags] = useState('Design, Systems');
  const [postReadTime, setPostReadTime] = useState('');
  const [postPublished, setPostPublished] = useState(true);
  const [postFeatured, setPostFeatured] = useState(false);
  const [postAuthorName, setPostAuthorName] = useState('');
  const [postAuthorRole, setPostAuthorRole] = useState('Principal Author');
  const [postAuthorAvatar, setPostAuthorAvatar] = useState('');
  const [affiliateItems, setAffiliateItems] = useState<Array<{ text: string; url: string; label: string }>>([]);
  const [savingPost, setSavingPost] = useState(false);
  const [postSaveSuccess, setPostSaveSuccess] = useState(false);

  // Appearance State
  const [appearanceData, setAppearanceData] = useState<SiteSettings>(settings);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [appearanceSaved, setAppearanceSaved] = useState(false);

  // Subscribers State
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  // Messages State
  const [messages, setMessages] = useState<ReaderMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ReaderMessage | null>(null);
  const [replyText, setReplyText] = useState('');

  // Comments State
  const [allComments, setAllComments] = useState<PostComment[]>([]);

  // Firebase Config & Deploy State
  const [customFirebaseJson, setCustomFirebaseJson] = useState('');
  const [copiedRules, setCopiedRules] = useState(false);
  const [zipGenerating, setZipGenerating] = useState(false);

  // Synchronize initial settings
  useEffect(() => {
    setAppearanceData(settings);
  }, [settings]);

  // Load Admin Data on login
  useEffect(() => {
    if (currentUser) {
      loadAdminData();
    }
  }, [currentUser]);

  const loadAdminData = async () => {
    setLoadingSubscribers(true);
    try {
      const [subs, msgs, comms] = await Promise.all([
        fetchAllSubscribers(),
        fetchAllMessages(),
        fetchAllComments()
      ]);
      setSubscribers(subs);
      setMessages(msgs);
      setAllComments(comms);

      const savedFb = getSavedFirebaseConfig();
      if (savedFb) {
        setCustomFirebaseJson(JSON.stringify(savedFb, null, 2));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const res = await loginAdmin(emailInput, passInput);
    setAuthLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
    } else {
      setAuthError(res.error || 'Authentication failed. Check your password.');
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setCurrentUser(null);
  };

  const handleSaveLoginFirebaseConfig = () => {
    try {
      if (!loginConfigJson.trim()) {
        saveFirebaseConfig(null);
        alert('Firebase custom configuration cleared.');
        return;
      }
      const parsed = JSON.parse(loginConfigJson);
      saveFirebaseConfig(parsed);
      alert('Firebase credentials saved successfully! Reloading...');
      window.location.reload();
    } catch (err: any) {
      alert(`Invalid JSON format: ${err.message}`);
    }
  };

  // POST EDITOR ACTIONS
  const startNewPost = () => {
    setEditingPostId(null);
    setPostTitle('');
    setPostSlug('');
    setPostExcerpt('');
    setPostContent(`## Overview

Write your essay or dispatch here. You can use standard markdown:

- High-contrast visual hierarchies
- Bulleted reflections
- Code snippets

> "Design is the intentional arrangement of constraints."

[AFFILIATE: Recommended Book or Hardware | url="https://example.com" | badge="Staff Pick"]`);
    setPostCoverImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop');
    setPostCategory('visual-theory');
    setPostTags('Design, Systems, Architecture');
    setPostReadTime('4 min read');
    setPostPublished(true);
    setPostFeatured(false);
    setPostAuthorName(settings.authorName || 'Julian Vance');
    setPostAuthorRole('Principal Author');
    setPostAuthorAvatar(settings.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop');
    setAffiliateItems([]);
    setActiveTab('editor');
  };

  const startEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostSlug(post.slug);
    setPostExcerpt(post.excerpt);
    setPostContent(post.content);
    setPostCoverImage(post.coverImage);
    setPostCategory(post.category);
    setPostTags((post.tags || []).join(', '));
    setPostReadTime(post.readTime);
    setPostPublished(post.published);
    setPostFeatured(post.featured || false);
    setPostAuthorName(post.author?.name || settings.authorName || 'Julian Vance');
    setPostAuthorRole(post.author?.role || 'Principal Author');
    setPostAuthorAvatar(post.author?.avatar || settings.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop');
    setAffiliateItems(
      (post.affiliateLinks || []).map((l) => ({
        text: l.text,
        url: l.url,
        label: l.label || 'Curated Partner'
      }))
    );
    setActiveTab('editor');
  };

  const handleTitleChange = (val: string) => {
    setPostTitle(val);
    if (!editingPostId || !postSlug) {
      setPostSlug(slugify(val));
    }
  };

  const handleContentChange = (val: string) => {
    setPostContent(val);
    if (!postReadTime || postReadTime === '1 min read' || postReadTime.includes('min read')) {
      setPostReadTime(calculateReadTime(val));
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) return;

    setSavingPost(true);
    const existing = editingPostId ? posts.find((p) => p.id === editingPostId) : null;

    const postPayload: Post = {
      id: editingPostId || `post-${Date.now()}`,
      slug: postSlug.trim() || slugify(postTitle),
      title: postTitle.trim(),
      excerpt: postExcerpt.trim() || postTitle.slice(0, 140),
      content: postContent,
      coverImage: resolveDirectImageUrl(postCoverImage) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
      category: postCategory,
      tags: postTags.split(',').map((t) => t.trim()).filter(Boolean),
      author: {
        name: postAuthorName.trim() || settings.authorName || 'Julian Vance',
        avatar: resolveDirectImageUrl(postAuthorAvatar) || settings.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
        role: postAuthorRole.trim() || 'Principal Author'
      },
      published: postPublished,
      featured: postFeatured,
      readTime: postReadTime || calculateReadTime(postContent),
      views: existing?.views || 120,
      likes: existing?.likes || 0,
      createdAt: existing?.createdAt || new Date().toISOString(),
      affiliateLinks: affiliateItems.filter((a) => a.text && a.url)
    };

    await saveOrUpdatePost(postPayload);
    setSavingPost(false);
    setPostSaveSuccess(true);
    onRefreshData();

    setTimeout(() => {
      setPostSaveSuccess(false);
      setActiveTab('posts');
    }, 1500);
  };

  const handleDeletePost = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      await removePost(id);
      onRefreshData();
    }
  };

  const handleSaveAppearance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAppearance(true);
    await saveSiteSettings(appearanceData);
    setSavingAppearance(false);
    setAppearanceSaved(true);
    onRefreshData();
    setTimeout(() => setAppearanceSaved(false), 2500);
  };

  const handleReplyMessage = async (msg: ReaderMessage) => {
    if (!replyText.trim()) return;
    await updateMessageStatus(msg.id, 'replied', replyText);
    const updated = await fetchAllMessages();
    setMessages(updated);
    setSelectedMessage(null);
    setReplyText('');
    alert(`Reply recorded! You can now send an email to ${msg.senderEmail}`);
  };

  const handleDeleteComment = async (id: string) => {
    await deleteCommentById(id);
    setAllComments(allComments.filter((c) => c.id !== id));
  };

  const handleSaveCustomFirebase = () => {
    try {
      if (!customFirebaseJson.trim()) {
        saveFirebaseConfig(null);
        alert('Custom Firebase config cleared. Switched to local persistent engine.');
        return;
      }
      const parsed = JSON.parse(customFirebaseJson);
      saveFirebaseConfig(parsed);
      alert('Custom Firebase configuration saved successfully! Reloading clients...');
      window.location.reload();
    } catch (err: any) {
      alert(`Invalid JSON format: ${err.message}`);
    }
  };

  // Generate & Download ZIP for mobile GitHub push
  const handleDownloadZip = async () => {
    setZipGenerating(true);
    try {
      const zip = new JSZip();

      // Add readme and config files
      zip.file(
        'README.md',
        `# Vertex Theory — Editorial Blog & Publishing Platform

A multi-file static blog platform engineered with query-param routing, Firebase Firestore/Auth integration, affiliate link embeds, reader messaging, newsletter engine, and an admin publishing dashboard.

## Deployment to Vercel
1. Push this repository to GitHub.
2. Link the GitHub repository in Vercel.
3. Add any custom Firebase environment keys if needed.
4. Deploy!
`
      );

      zip.file(
        'firestore.rules',
        `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public Reads for Blog Posts and Settings
    match /posts/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /settings/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // Newsletter Subscribers: Public creation, Admin read/delete
    match /subscribers/{document=**} {
      allow create: if true;
      allow read, write: if request.auth != null;
    }
    // Comments: Public read & create, Admin delete
    match /comments/{document=**} {
      allow read, create: if true;
      allow update, delete: if request.auth != null;
    }
    // Reader Messages: Public send, Admin read/reply
    match /messages/{document=**} {
      allow create: if true;
      allow read, write: if request.auth != null;
    }
  }
}`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vertex-theory-project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setZipGenerating(false);
    }
  };

  // FIREBASE SECURITY RULES SNIPPET
  const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Blog Posts: Public reads, Admin-only writes
    match /posts/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 2. Site Branding & Settings: Public reads, Admin writes
    match /settings/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 3. Newsletter Subscribers: Public signup (create), Admin read/delete
    match /subscribers/{document=**} {
      allow create: if true;
      allow read, delete, update: if request.auth != null;
    }
    
    // 4. Comments: Public read & submit, Admin moderation
    match /comments/{document=**} {
      allow read, create: if true;
      allow update, delete: if request.auth != null;
    }
    
    // 5. Reader Inquiries: Public send (create), Admin read & reply
    match /messages/{document=**} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}`;

  const copySecurityRules = () => {
    navigator.clipboard.writeText(firestoreRulesText);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  // ----------------------------------------------------
  // UNAUTHENTICATED VIEW: FIREBASE AUTH LOGIN SCREEN
  // ----------------------------------------------------
  if (!currentUser) {
    const isLiveConnected = getFirebaseClients().isLive;

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#12141c] border border-[#232733] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Logo size={48} useImage={true} showText={false} />
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-white">
              Vertex Theory Admin
            </h2>
            <p className="text-xs text-[#8a91a5]">
              Publishing console & newsletter management system
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className="text-[11px] font-mono text-[#8a91a5]">
                {isLiveConnected ? 'Firebase Auth Connected' : 'Firebase Configuration Needed'}
              </span>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#9ca3af] block">
                Firebase Admin Email
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="your-admin@domain.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs placeholder-[#505566] focus:outline-none focus:border-[#ff5533]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#9ca3af] block">
                Firebase Password
              </label>
              <input
                type="password"
                required
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs placeholder-[#505566] focus:outline-none focus:border-[#ff5533]"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-lg bg-[#ff5533] hover:bg-[#ff6644] text-white text-xs font-bold transition-all shadow-md shadow-[#ff5533]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Sign In with Firebase Credentials</span>
            </button>
          </form>

          {/* Firebase Project Credentials Setup Collapsible */}
          <div className="pt-3 border-t border-[#1f232e] space-y-3">
            <button
              type="button"
              onClick={() => setShowConfigSetup(!showConfigSetup)}
              className="w-full text-center text-xs font-mono text-[#8a91a5] hover:text-[#ff7755] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{showConfigSetup ? 'Hide Firebase Project Settings' : 'Configure Firebase Project Credentials'}</span>
            </button>

            {showConfigSetup && (
              <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#232733] space-y-3 animate-in fade-in duration-200">
                <p className="text-[11px] text-[#8a91a5] leading-relaxed">
                  Paste your Firebase web app configuration JSON below to connect your Firebase Auth & Firestore project:
                </p>
                <textarea
                  rows={6}
                  value={loginConfigJson}
                  onChange={(e) => setLoginConfigJson(e.target.value)}
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-project-id",\n  "storageBucket": "your-app.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                  className="w-full p-2.5 rounded-lg bg-[#12141c] border border-[#2b303e] text-emerald-400 font-mono text-[11px] focus:outline-none focus:border-[#ff5533]"
                />
                <button
                  type="button"
                  onClick={handleSaveLoginFirebaseConfig}
                  className="w-full py-2 rounded-lg bg-[#1c202b] hover:bg-[#252b3b] text-white text-xs font-semibold border border-[#32394d] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-[#ff5533]" />
                  <span>Save Firebase Project Config</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // AUTHENTICATED ADMIN DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#12141c] border border-[#232733]">
        <div className="flex items-center gap-3">
          <Logo size={42} useImage={true} showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-lg text-white">
                Vertex Theory Console
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                LIVE
              </span>
            </div>
            <p className="text-xs text-[#717688] font-mono">
              Signed in as: <span className="text-[#a0a6b8]">{currentUser.email}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigateTo({ page: 'home' })}
            className="px-3 py-1.5 rounded-lg bg-[#181a24] hover:bg-[#202432] text-[#c8ccd6] text-xs font-medium border border-[#262b3b] flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Live Site</span>
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={zipGenerating}
            className="px-3 py-1.5 rounded-lg bg-[#181a24] hover:bg-[#202432] text-[#ff7755] text-xs font-medium border border-[#ff5533]/30 flex items-center gap-1.5 transition-colors"
            title="Download Clean Flat Zip for Mobile GitHub deploy"
          >
            {zipGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export Zip</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-medium border border-rose-800/60 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-[#1f232e]">
        {[
          { id: 'posts', label: 'Dispatches', count: posts.length, icon: FileText },
          { id: 'editor', label: editingPostId ? 'Edit Dispatch' : 'New Dispatch', icon: Plus },
          { id: 'appearance', label: 'Appearance & Brand', icon: Settings },
          { id: 'subscribers', label: 'Subscribers', count: subscribers.length, icon: Users },
          { id: 'messages', label: 'Reader Inquiries', count: messages.filter(m => m.status === 'unread').length, icon: MessageSquare },
          { id: 'comments', label: 'Comments', count: allComments.length, icon: Mail },
          { id: 'deploy', label: 'Firebase & Deploy Hub', icon: Cloud },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#ff5533] text-white shadow-md shadow-[#ff5533]/20'
                  : 'text-[#8a91a5] hover:text-white hover:bg-[#14161f]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-black/30 text-white' : 'bg-[#1f232e] text-[#a0a6b8]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------- */}
      {/* TAB 1: POSTS LIST */}
      {/* -------------------------------------------------- */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-white">
              Published & Draft Dispatches ({posts.length})
            </h3>
            <button
              onClick={startNewPost}
              className="px-4 py-2 rounded-xl bg-[#ff5533] hover:bg-[#ff6644] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-[#ff5533]/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Dispatch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#12141c] border border-[#202430] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#2d3345] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={resolveDirectImageUrl(post.coverImage)}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-14 rounded-lg object-cover bg-[#1a1c26] shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181a24] text-[#ff7755] uppercase font-semibold">
                        {post.category}
                      </span>
                      {post.featured && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                          FEATURED
                        </span>
                      )}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        post.published ? 'bg-emerald-950/60 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {post.published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>
                    <h4 className="font-heading font-bold text-sm sm:text-base text-white line-clamp-1">
                      {post.title}
                    </h4>
                    <p className="text-xs text-[#717688] font-mono">
                      Slug: /{post.slug} • {post.readTime} • {formatEditorialDate(post.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => navigateTo({ post: post.slug || post.id })}
                    className="p-2 rounded-lg bg-[#181a24] hover:bg-[#222635] text-[#9ca3af] hover:text-white transition-colors"
                    title="View live post"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEditPost(post)}
                    className="p-2 rounded-lg bg-[#181a24] hover:bg-[#222635] text-[#ff7755] transition-colors"
                    title="Edit dispatch"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id, post.title)}
                    className="p-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 transition-colors"
                    title="Delete dispatch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* TAB 2: POST EDITOR */}
      {/* -------------------------------------------------- */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSavePost} className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f232e]">
            <h3 className="font-heading font-bold text-lg text-white">
              {editingPostId ? 'Editing Dispatch' : 'Compose New Dispatch'}
            </h3>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className="px-3 py-2 rounded-lg bg-[#181a24] text-[#8a91a5] hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPost}
                className="px-5 py-2 rounded-xl bg-[#ff5533] hover:bg-[#ff6644] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#ff5533]/25 cursor-pointer disabled:opacity-50"
              >
                {savingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save & Publish</span>
              </button>
            </div>
          </div>

          {postSaveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Dispatch saved successfully to Firestore database!</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form Fields */}
            <div className="lg:col-span-2 space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">Title *</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. The Physics of Spatial Interfaces"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#12141c] border border-[#232733] text-white text-sm focus:outline-none focus:border-[#ff5533]"
                />
              </div>

              {/* Slug & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#9ca3af]">URL Slug (Query parameter: ?post=slug)</label>
                  <input
                    type="text"
                    value={postSlug}
                    onChange={(e) => setPostSlug(e.target.value)}
                    placeholder="the-physics-of-spatial-interfaces"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#12141c] border border-[#232733] text-white text-xs font-mono focus:outline-none focus:border-[#ff5533]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#9ca3af]">Read Time (e.g. 5 min read)</label>
                  <input
                    type="text"
                    value={postReadTime}
                    onChange={(e) => setPostReadTime(e.target.value)}
                    placeholder="5 min read"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#12141c] border border-[#232733] text-white text-xs focus:outline-none focus:border-[#ff5533]"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">Excerpt (Short summary for cards & meta tags)</label>
                <textarea
                  rows={2}
                  value={postExcerpt}
                  onChange={(e) => setPostExcerpt(e.target.value)}
                  placeholder="Examining the mathematical constraints and optical tensions..."
                  className="w-full px-3.5 py-2 rounded-lg bg-[#12141c] border border-[#232733] text-white text-xs focus:outline-none focus:border-[#ff5533]"
                />
              </div>

              {/* Main Content Markdown */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#9ca3af]">Post Content (Markdown supported)</label>
                  <span className="text-[11px] font-mono text-[#717688]">Use ## for H2, &gt; for quotes, \`\`\` for code</span>
                </div>
                <textarea
                  rows={14}
                  required
                  value={postContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Write your article markdown..."
                  className="w-full p-4 rounded-xl bg-[#0e1015] border border-[#232733] text-white font-mono text-xs leading-relaxed focus:outline-none focus:border-[#ff5533]"
                />
              </div>

              {/* Affiliate Links Builder */}
              <div className="p-4 rounded-xl bg-[#12141c] border border-[#232733] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#ff7755] uppercase font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Embedded Affiliate Links
                  </span>
                  <button
                    type="button"
                    onClick={() => setAffiliateItems([...affiliateItems, { text: '', url: '', label: 'Recommended Tool' }])}
                    className="text-xs text-[#ff5533] hover:underline font-semibold"
                  >
                    + Add Affiliate Item
                  </button>
                </div>

                {affiliateItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center p-2 rounded-lg bg-[#0c0d10] border border-[#202430]">
                    <input
                      type="text"
                      placeholder="Product/Item Name"
                      value={item.text}
                      onChange={(e) => {
                        const next = [...affiliateItems];
                        next[idx].text = e.target.value;
                        setAffiliateItems(next);
                      }}
                      className="px-2.5 py-1.5 rounded bg-[#161822] text-xs text-white border border-[#2b303e]"
                    />
                    <input
                      type="url"
                      placeholder="Affiliate URL (https://...)"
                      value={item.url}
                      onChange={(e) => {
                        const next = [...affiliateItems];
                        next[idx].url = e.target.value;
                        setAffiliateItems(next);
                      }}
                      className="px-2.5 py-1.5 rounded bg-[#161822] text-xs text-white border border-[#2b303e]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Badge Label (e.g. Hardware)"
                        value={item.label}
                        onChange={(e) => {
                          const next = [...affiliateItems];
                          next[idx].label = e.target.value;
                          setAffiliateItems(next);
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded bg-[#161822] text-xs text-white border border-[#2b303e]"
                      />
                      <button
                        type="button"
                        onClick={() => setAffiliateItems(affiliateItems.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Meta Controls */}
            <div className="space-y-4">
              {/* Cover Image */}
              <div className="p-4 rounded-xl bg-[#12141c] border border-[#232733] space-y-3">
                <label className="text-xs font-mono text-[#9ca3af] block">
                  Cover Image URL (Direct link or Imgur share URL)
                </label>
                <input
                  type="text"
                  value={postCoverImage}
                  onChange={(e) => setPostCoverImage(e.target.value)}
                  placeholder="https://imgur.com/xyz or unsplash..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
                />
                {postCoverImage && (
                  <div className="aspect-[4/5] max-w-xs mx-auto rounded-lg overflow-hidden border border-[#202430] bg-[#0c0d10]">
                    <img
                      src={resolveDirectImageUrl(postCoverImage)}
                      alt="Cover Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-[10px] text-[#717688] font-mono">
                  * Imgur album or share links auto-convert to direct \`i.imgur.com/xyz.jpg\` URLs.
                </p>
              </div>

              {/* Custom Category Input & Suggestions */}
              <div className="p-4 rounded-xl bg-[#12141c] border border-[#232733] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#9ca3af] block">Category (Type any custom category)</label>
                  <span className="text-[10px] font-mono text-[#717688]">Custom text supported</span>
                </div>
                <input
                  type="text"
                  required
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  placeholder="e.g. Visual Theory, Web3, Architecture, Artificial Intelligence..."
                  className="w-full px-3.5 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs placeholder-[#505566] focus:outline-none focus:border-[#ff5533]"
                />
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-mono text-[#717688] block">Quick suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Visual Theory',
                      'Design Systems',
                      'Computing & AI',
                      'Hardware & Spaces',
                      'Digital Philosophy',
                      'Typography',
                      'Spatial Interfaces',
                      'Architecture'
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPostCategory(preset)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                          postCategory.toLowerCase() === preset.toLowerCase()
                            ? 'bg-[#ff5533]/20 text-[#ff7755] border-[#ff5533]/50'
                            : 'bg-[#181a24] text-[#8a91a5] border-[#2b303e] hover:text-white hover:border-[#424a60]'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="p-4 rounded-xl bg-[#12141c] border border-[#232733] space-y-2">
                <label className="text-xs font-mono text-[#9ca3af] block">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder="Design, Micro-interactions, Typography"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
                />
              </div>

              {/* Custom Author for This Post */}
              <div className="p-4 rounded-xl bg-[#12141c] border border-[#232733] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#9ca3af] block font-semibold">Post Author Attribution</label>
                  <span className="text-[10px] font-mono text-[#ff7755]">Customizable</span>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8a91a5]">Author Name</label>
                  <input
                    type="text"
                    value={postAuthorName}
                    onChange={(e) => setPostAuthorName(e.target.value)}
                    placeholder={settings.authorName || 'Julian Vance'}
                    className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
                  />
                  <p className="text-[10px] text-[#6b7280]">
                    Leave as default or enter a custom guest author / co-writer name for this dispatch.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8a91a5]">Author Role / Title</label>
                  <input
                    type="text"
                    value={postAuthorRole}
                    onChange={(e) => setPostAuthorRole(e.target.value)}
                    placeholder="Principal Author"
                    className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8a91a5]">Author Avatar URL (Optional)</label>
                  <input
                    type="text"
                    value={postAuthorAvatar}
                    onChange={(e) => setPostAuthorAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="p-4 rounded-xl bg-[#12141c] border border-[#232733] space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postPublished}
                    onChange={(e) => setPostPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-[#ff5533] focus:ring-0 bg-[#0c0d10] border-[#2b303e]"
                  />
                  <span className="text-xs font-semibold text-white">Publish Immediately</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postFeatured}
                    onChange={(e) => setPostFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#ff5533] focus:ring-0 bg-[#0c0d10] border-[#2b303e]"
                  />
                  <span className="text-xs font-semibold text-white">Set as Lead Featured Dispatch</span>
                </label>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* -------------------------------------------------- */}
      {/* TAB 3: APPEARANCE & BRAND SETTINGS */}
      {/* -------------------------------------------------- */}
      {activeTab === 'appearance' && (
        <form onSubmit={handleSaveAppearance} className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f232e]">
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                Site Branding & Appearance
              </h3>
              <p className="text-xs text-[#717688]">
                Changes save live to Firestore without requiring a site redeployment.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingAppearance}
              className="px-5 py-2 rounded-xl bg-[#ff5533] hover:bg-[#ff6644] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#ff5533]/25 cursor-pointer disabled:opacity-50"
            >
              {savingAppearance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Appearance</span>
            </button>
          </div>

          {appearanceSaved && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Branding and appearance settings saved successfully!</span>
            </div>
          )}

          {/* Site Basics */}
          <div className="p-5 rounded-2xl bg-[#12141c] border border-[#232733] space-y-4">
            <h4 className="font-heading font-bold text-sm text-white">
              Publication Identity & Logo
            </h4>

            {/* Logo Preview & Custom URL */}
            <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#262a37] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Logo size={48} useImage={true} customLogoUrl={appearanceData.logoUrl} showText={false} />
                <div>
                  <span className="text-xs font-semibold text-white block">Official Vertex Theory Logo Mark</span>
                  <span className="text-[11px] text-[#717688]">
                    {appearanceData.logoUrl ? 'Using custom image URL override' : 'Using official vector emblem & brand asset'}
                  </span>
                </div>
              </div>

              {appearanceData.logoUrl && (
                <button
                  type="button"
                  onClick={() => setAppearanceData({ ...appearanceData, logoUrl: '' })}
                  className="text-xs text-[#ff5533] hover:underline font-mono"
                >
                  Reset to Default Logo
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#9ca3af]">Custom Logo URL Override (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank to use the official Vertex Theory logo asset"
                value={appearanceData.logoUrl || ''}
                onChange={(e) => setAppearanceData({ ...appearanceData, logoUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">Site Name</label>
                <input
                  type="text"
                  value={appearanceData.siteName}
                  onChange={(e) => setAppearanceData({ ...appearanceData, siteName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearanceData.accentColor}
                    onChange={(e) => setAppearanceData({ ...appearanceData, accentColor: e.target.value })}
                    className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={appearanceData.accentColor}
                    onChange={(e) => setAppearanceData({ ...appearanceData, accentColor: e.target.value })}
                    className="w-28 px-2 py-1.5 rounded bg-[#0c0d10] border border-[#262a37] text-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#9ca3af]">Tagline</label>
              <input
                type="text"
                value={appearanceData.tagline}
                onChange={(e) => setAppearanceData({ ...appearanceData, tagline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#9ca3af]">Description</label>
              <textarea
                rows={2}
                value={appearanceData.description}
                onChange={(e) => setAppearanceData({ ...appearanceData, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
              />
            </div>
          </div>

          {/* Author / Founder Profile Settings */}
          <div className="p-5 rounded-2xl bg-[#12141c] border border-[#232733] space-y-4">
            <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#ff5533]" />
              <span>Principal Author Profile & Social Links</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">Principal Author Name</label>
                <input
                  type="text"
                  value={appearanceData.authorName || ''}
                  onChange={(e) => setAppearanceData({ ...appearanceData, authorName: e.target.value })}
                  placeholder="Julian Vance"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">Author Avatar Image URL</label>
                <input
                  type="text"
                  value={appearanceData.authorAvatar || ''}
                  onChange={(e) => setAppearanceData({ ...appearanceData, authorAvatar: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#9ca3af]">Author Bio / Philosophy</label>
              <textarea
                rows={2}
                value={appearanceData.authorBio || ''}
                onChange={(e) => setAppearanceData({ ...appearanceData, authorBio: e.target.value })}
                placeholder="Architectural technologist and design theorist..."
                className="w-full px-3.5 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs focus:outline-none focus:border-[#ff5533]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">Instagram Profile URL / Handle</label>
                <input
                  type="text"
                  value={appearanceData.authorInstagram || ''}
                  onChange={(e) => setAppearanceData({ ...appearanceData, authorInstagram: e.target.value })}
                  placeholder="https://instagram.com/vertextheory"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">Twitter / X URL</label>
                <input
                  type="text"
                  value={appearanceData.authorTwitter || ''}
                  onChange={(e) => setAppearanceData({ ...appearanceData, authorTwitter: e.target.value })}
                  placeholder="https://twitter.com/vertextheory"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">GitHub URL</label>
                <input
                  type="text"
                  value={appearanceData.authorGithub || ''}
                  onChange={(e) => setAppearanceData({ ...appearanceData, authorGithub: e.target.value })}
                  placeholder="https://github.com/vertextheory"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">LinkedIn URL</label>
                <input
                  type="text"
                  value={appearanceData.authorLinkedin || ''}
                  onChange={(e) => setAppearanceData({ ...appearanceData, authorLinkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/vertextheory"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* SPONSOR BANNER SETTINGS ("Advertise in this space") */}
          <div className="p-5 rounded-2xl bg-[#12141c] border border-[#232733] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff5533]" />
                <span>Sponsor & "Advertise in this Space" Banner</span>
              </h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appearanceData.sponsorBanner?.enabled ?? true}
                  onChange={(e) =>
                    setAppearanceData({
                      ...appearanceData,
                      sponsorBanner: {
                        ...appearanceData.sponsorBanner,
                        enabled: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 rounded text-[#ff5533] bg-[#0c0d10] border-[#2b303e]"
                />
                <span className="text-xs text-white">Enable Banner</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">Sponsor Section Label (e.g. PRESENTED BY)</label>
                <input
                  type="text"
                  value={appearanceData.sponsorBanner?.label || ''}
                  onChange={(e) =>
                    setAppearanceData({
                      ...appearanceData,
                      sponsorBanner: { ...appearanceData.sponsorBanner, label: e.target.value }
                    })
                  }
                  placeholder="PRESENTED BY"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">Sponsor Name / Any Name You Want</label>
                <input
                  type="text"
                  value={appearanceData.sponsorBanner?.sponsorName || ''}
                  onChange={(e) =>
                    setAppearanceData({
                      ...appearanceData,
                      sponsorBanner: { ...appearanceData.sponsorBanner, sponsorName: e.target.value }
                    })
                  }
                  placeholder="Advertise in this space / Brand Name"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#9ca3af]">Tagline / Pitch</label>
              <input
                type="text"
                value={appearanceData.sponsorBanner?.tagline || ''}
                onChange={(e) =>
                  setAppearanceData({
                    ...appearanceData,
                    sponsorBanner: { ...appearanceData.sponsorBanner, tagline: e.target.value }
                  })
                }
                placeholder="High-velocity tools engineered for modern product architects."
                className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">Sponsor Link URL</label>
                <input
                  type="url"
                  value={appearanceData.sponsorBanner?.url || ''}
                  onChange={(e) =>
                    setAppearanceData({
                      ...appearanceData,
                      sponsorBanner: { ...appearanceData.sponsorBanner, url: e.target.value }
                    })
                  }
                  placeholder="https://sponsor.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9ca3af]">CTA Button Text</label>
                <input
                  type="text"
                  value={appearanceData.sponsorBanner?.ctaText || ''}
                  onChange={(e) =>
                    setAppearanceData({
                      ...appearanceData,
                      sponsorBanner: { ...appearanceData.sponsorBanner, ctaText: e.target.value }
                    })
                  }
                  placeholder="Explore Platform →"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Announcement Bar */}
          <div className="p-5 rounded-2xl bg-[#12141c] border border-[#232733] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-sm text-white">
                Announcement Banner
              </h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appearanceData.announcementActive ?? true}
                  onChange={(e) =>
                    setAppearanceData({ ...appearanceData, announcementActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#ff5533] bg-[#0c0d10] border-[#2b303e]"
                />
                <span className="text-xs text-white">Show Announcement</span>
              </label>
            </div>

            <input
              type="text"
              value={appearanceData.announcementText || ''}
              onChange={(e) => setAppearanceData({ ...appearanceData, announcementText: e.target.value })}
              placeholder="Issue #14: The Architecture of Latent Canvases is now published."
              className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
            />
          </div>
        </form>
      )}

      {/* -------------------------------------------------- */}
      {/* TAB 4: SUBSCRIBERS (WITH CSV EXPORT) */}
      {/* -------------------------------------------------- */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                Newsletter Subscribers ({subscribers.length})
              </h3>
              <p className="text-xs text-[#717688]">
                Reader emails collected from public forms and stored in Firestore database.
              </p>
            </div>

            <button
              onClick={() => exportSubscribersToCSV(subscribers)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-900/40 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV (All Subscribers)</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#12141c] border border-[#232733] space-y-4">
            <input
              type="text"
              placeholder="Filter by email address..."
              value={subscriberSearch}
              onChange={(e) => setSubscriberSearch(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#202430] text-[#717688]">
                    <th className="py-2.5 px-3">Subscriber Email</th>
                    <th className="py-2.5 px-3">Date Joined</th>
                    <th className="py-2.5 px-3">Acquisition Source</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181a24]">
                  {subscribers
                    .filter((s) => s.email.toLowerCase().includes(subscriberSearch.toLowerCase()))
                    .map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#161822]">
                        <td className="py-3 px-3 text-white font-medium">{sub.email}</td>
                        <td className="py-3 px-3 text-[#9ca3af]">{formatEditorialDate(sub.createdAt)}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-[#181a24] text-[#ff7755] text-[10px]">
                            {sub.source}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={async () => {
                              await removeSubscriber(sub.id);
                              setSubscribers(subscribers.filter((s) => s.id !== sub.id));
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1"
                            title="Remove subscriber"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* TAB 5: READER MESSAGES & INQUIRIES */}
      {/* -------------------------------------------------- */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                Reader Messages & Inquiries ({messages.length})
              </h3>
              <p className="text-xs text-[#717688]">
                Private feedback submitted by readers from individual blog posts.
              </p>
            </div>

            <button
              onClick={() => exportMessagesToCSV(messages)}
              className="px-4 py-2 rounded-xl bg-[#181a24] hover:bg-[#202432] text-white text-xs font-semibold flex items-center gap-2 border border-[#2b303f]"
            >
              <Download className="w-4 h-4" />
              <span>Export Messages CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {messages.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#12141c] border border-[#232733] text-xs text-[#717688] font-mono">
                No reader inquiries yet. Reader messages submitted on blog posts will appear here.
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-5 rounded-2xl bg-[#12141c] border transition-colors space-y-3 ${
                    msg.status === 'unread' ? 'border-[#ff5533]/50' : 'border-[#202430]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-white text-sm">
                        {msg.senderName}
                      </span>
                      <span className="text-xs text-[#717688] font-mono">({msg.senderEmail})</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        msg.status === 'unread' ? 'bg-[#ff5533]/20 text-[#ff5533]' : 'bg-emerald-950 text-emerald-400'
                      }`}>
                        {msg.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-[#717688] font-mono">
                      {formatEditorialDate(msg.createdAt)}
                    </span>
                  </div>

                  {msg.postTitle && (
                    <div className="text-xs text-[#ff7755] font-mono">
                      Regarding dispatch: <span className="text-white font-semibold">"{msg.postTitle}"</span>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-[#d4d8e3] bg-[#0c0d10] p-3.5 rounded-xl border border-[#1f232e]">
                    {msg.message}
                  </p>

                  {msg.replyNotes && (
                    <div className="text-xs text-[#a0a6b8] bg-[#1a1d26] p-2.5 rounded-lg font-mono">
                      Reply note: {msg.replyNotes}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href={`mailto:${msg.senderEmail}?subject=Re: Vertex Theory dispatch inquiry`}
                      className="px-3 py-1.5 rounded-lg bg-[#202432] hover:bg-[#ff5533] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Reader Directly</span>
                    </a>

                    <button
                      onClick={() => setSelectedMessage(selectedMessage?.id === msg.id ? null : msg)}
                      className="px-3 py-1.5 rounded-lg bg-[#181a24] text-[#9ca3af] hover:text-white text-xs transition-colors"
                    >
                      {selectedMessage?.id === msg.id ? 'Close' : 'Add Reply Note'}
                    </button>
                  </div>

                  {selectedMessage?.id === msg.id && (
                    <div className="pt-3 border-t border-[#1f232e] space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Internal reply log note (e.g. Sent link to repository)..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#262a37] text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleReplyMessage(msg)}
                        className="px-4 py-1.5 rounded-lg bg-[#ff5533] text-white text-xs font-bold"
                      >
                        Save Note & Mark Replied
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* TAB 6: COMMENTS MODERATION */}
      {/* -------------------------------------------------- */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-lg text-white">
            Comments Moderation ({allComments.length})
          </h3>

          <div className="space-y-3">
            {allComments.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#12141c] border border-[#232733] text-xs text-[#717688] font-mono">
                No comments submitted yet.
              </div>
            ) : (
              allComments.map((comm) => (
                <div
                  key={comm.id}
                  className="p-4 rounded-xl bg-[#12141c] border border-[#202430] flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-semibold text-white">{comm.authorName}</span>
                      <span className="text-[#717688]">({comm.authorEmail})</span>
                      <span className="text-[#717688]">• {formatEditorialDate(comm.createdAt)}</span>
                    </div>
                    <p className="text-xs text-[#c8ccd6]">{comm.content}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteComment(comm.id)}
                    className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg bg-rose-950/30 shrink-0"
                    title="Delete comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* TAB 7: FIREBASE & DEPLOYMENT HUB */}
      {/* -------------------------------------------------- */}
      {activeTab === 'deploy' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h3 className="font-heading font-bold text-xl text-white">
              Firebase & Mobile GitHub/Vercel Deployment Hub
            </h3>
            <p className="text-xs text-[#8a91a5]">
              Everything you need to link your own live Firebase project and push from mobile.
            </p>
          </div>

          {/* 1. Custom Firebase Configuration */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-[#232733] space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#ff5533] uppercase font-bold">
              <Database className="w-4 h-4" />
              <span>Step 1: Firebase Project Configuration</span>
            </div>
            <p className="text-xs text-[#9ca3af]">
              Paste your Firebase Web App configuration JSON below to connect this client directly to your Firestore database and Firebase Authentication:
            </p>

            <textarea
              rows={8}
              value={customFirebaseJson}
              onChange={(e) => setCustomFirebaseJson(e.target.value)}
              placeholder={`{
  "apiKey": "AIzaSyBxfrho3UuOnPyFBHIbXiYXc-WekM91hNA",
  "authDomain": "vertextheory1-44870.firebaseapp.com",
  "projectId": "vertextheory1-44870",
  "storageBucket": "vertextheory1-44870.firebasestorage.app",
  "messagingSenderId": "658245069030",
  "appId": "1:658245069030:web:667b53a4948a3f7ffd3327",
  "measurementId": "G-9Z5NGBV1L3"
}`}
              className="w-full p-3 rounded-xl bg-[#090a0d] border border-[#262b3a] font-mono text-xs text-[#ff7755] focus:outline-none focus:border-[#ff5533]"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveCustomFirebase}
                className="px-4 py-2 rounded-xl bg-[#ff5533] text-white text-xs font-bold shadow-md shadow-[#ff5533]/20"
              >
                Save Firebase Config
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomFirebaseJson('');
                  saveFirebaseConfig(null);
                  alert('Reset to built-in persistent storage engine.');
                }}
                className="px-3 py-2 rounded-xl bg-[#1a1d27] text-[#9ca3af] hover:text-white text-xs"
              >
                Clear / Use Local Persistent Cache
              </button>
            </div>
          </div>

          {/* 2. Firestore Security Rules */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-[#232733] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase font-bold">
                <Shield className="w-4 h-4" />
                <span>Step 2: Firestore Security Rules (Copy & Paste to Console)</span>
              </div>
              <button
                onClick={copySecurityRules}
                className="px-3 py-1.5 rounded-lg bg-[#202432] text-white text-xs flex items-center gap-1.5 hover:bg-[#ff5533] transition-colors"
              >
                {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRules ? 'Copied Rules' : 'Copy Rules'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#090a0d] border border-[#262b3a] font-mono text-[11px] text-[#a0a6b8] overflow-x-auto">
              <code>{firestoreRulesText}</code>
            </pre>
          </div>

          {/* 3. Mobile GitHub & Vercel Guide */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-[#232733] space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#38bdf8] uppercase font-bold">
              <Globe className="w-4 h-4" />
              <span>Step 3: Mobile Git Client + Vercel Deployment</span>
            </div>

            <div className="space-y-3 text-xs text-[#a0a6b8] leading-relaxed">
              <div className="p-3 rounded-xl bg-[#090a0d] border border-[#202430] space-y-1">
                <span className="font-bold text-white block">1. Download Repository Zip:</span>
                <p>Click the "Export Zip" button at the top of this panel or below. On iPhone, save it to Files.</p>
              </div>

              <div className="p-3 rounded-xl bg-[#090a0d] border border-[#202430] space-y-1">
                <span className="font-bold text-white block">2. Push to GitHub from Mobile:</span>
                <p>Use a mobile Git client like <strong>Working Copy</strong> (iOS) or create a new repo on GitHub mobile web and upload the files.</p>
              </div>

              <div className="p-3 rounded-xl bg-[#090a0d] border border-[#202430] space-y-1">
                <span className="font-bold text-white block">3. Import to Vercel Mobile Dashboard:</span>
                <p>Open <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-[#ff7755] underline">vercel.com/new</a> on Safari/Chrome on your phone, select your GitHub repo, and hit Deploy. Zero desktop tooling required!</p>
              </div>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={zipGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff5533] to-[#e64422] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ff5533]/25 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{zipGenerating ? 'Packaging Project...' : 'Download Full Vertex Theory ZIP'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
