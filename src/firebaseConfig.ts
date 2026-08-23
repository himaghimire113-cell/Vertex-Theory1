import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  increment,
  Firestore 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User, 
  Auth 
} from 'firebase/auth';
import { 
  INITIAL_POSTS, 
  INITIAL_SITE_SETTINGS, 
  INITIAL_SUBSCRIBERS, 
  INITIAL_COMMENTS, 
  INITIAL_MESSAGES 
} from './data/defaultData';
import { Post, SiteSettings, Subscriber, PostComment, ReaderMessage, FirebaseCustomConfig } from './types';

const STORAGE_KEYS = {
  FIREBASE_CONFIG: 'vertex_theory_firebase_config',
  POSTS: 'vertex_theory_posts',
  SETTINGS: 'vertex_theory_settings',
  SUBSCRIBERS: 'vertex_theory_subscribers',
  COMMENTS: 'vertex_theory_comments',
  MESSAGES: 'vertex_theory_messages',
  AUTH_SESSION: 'vertex_theory_auth_session',
  LIKES_GIVEN: 'vertex_theory_likes_given'
};

// Default Production Firebase Config provided for vertextheory1-44870
export const DEFAULT_FIREBASE_CONFIG: FirebaseCustomConfig = {
  apiKey: "AIzaSyBxfrho3UuOnPyFBHIbXiYXc-WekM91hNA",
  authDomain: "vertextheory1-44870.firebaseapp.com",
  projectId: "vertextheory1-44870",
  storageBucket: "vertextheory1-44870.firebasestorage.app",
  messagingSenderId: "658245069030",
  appId: "1:658245069030:web:667b53a4948a3f7ffd3327",
  measurementId: "G-9Z5NGBV1L3"
};

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

// Initialize or load Firebase Custom Config
export function getSavedFirebaseConfig(): FirebaseCustomConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading saved Firebase config:', err);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: FirebaseCustomConfig | null) {
  if (config) {
    localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
  } else {
    localStorage.removeItem(STORAGE_KEYS.FIREBASE_CONFIG);
  }
  // Reset instances so next call re-initializes
  appInstance = null;
  firestoreInstance = null;
  authInstance = null;
}

export function getFirebaseClients() {
  if (appInstance && firestoreInstance && authInstance) {
    return { app: appInstance, db: firestoreInstance, auth: authInstance, isLive: true };
  }

  const activeConfig = getSavedFirebaseConfig() || DEFAULT_FIREBASE_CONFIG;
  if (activeConfig && activeConfig.apiKey && activeConfig.projectId) {
    try {
      if (!getApps().length) {
        appInstance = initializeApp(activeConfig);
      } else {
        appInstance = getApp();
      }

      try {
        firestoreInstance = initializeFirestore(appInstance, {
          experimentalForceLongPolling: true,
        });
      } catch {
        firestoreInstance = getFirestore(appInstance);
      }

      authInstance = getAuth(appInstance);
      return { app: appInstance, db: firestoreInstance, auth: authInstance, isLive: true };
    } catch (e) {
      console.warn('Firebase init error with config:', e);
      // Fallback try with default if custom was corrupted
      try {
        if (!getApps().length) {
          appInstance = initializeApp(DEFAULT_FIREBASE_CONFIG);
        } else {
          appInstance = getApp();
        }
        firestoreInstance = getFirestore(appInstance);
        authInstance = getAuth(appInstance);
        return { app: appInstance, db: firestoreInstance, auth: authInstance, isLive: true };
      } catch (fallbackErr) {
        console.warn('Fallback Firebase init error:', fallbackErr);
      }
    }
  }

  return { app: null, db: null, auth: null, isLive: false };
}

// ----------------------------------------------------
// LOCAL STORAGE CACHE HELPERS (Resilient Offline / Demo Store)
// ----------------------------------------------------

function getLocalPosts(): Post[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(INITIAL_POSTS));
  return INITIAL_POSTS;
}

function saveLocalPosts(posts: Post[]) {
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
}

function getLocalSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SITE_SETTINGS));
  return INITIAL_SITE_SETTINGS;
}

function saveLocalSettings(settings: SiteSettings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

function getLocalSubscribers(): Subscriber[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIBERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(INITIAL_SUBSCRIBERS));
  return INITIAL_SUBSCRIBERS;
}

function saveLocalSubscribers(subs: Subscriber[]) {
  localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(subs));
}

function getLocalComments(): PostComment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
  return INITIAL_COMMENTS;
}

function saveLocalComments(comments: PostComment[]) {
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
}

function getLocalMessages(): ReaderMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
  return INITIAL_MESSAGES;
}

function saveLocalMessages(msgs: ReaderMessage[]) {
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgs));
}

// ----------------------------------------------------
// DATABASE API (FIRESTORE WITH INSTANT LOCAL FALLBACK)
// ----------------------------------------------------

export async function fetchAllPosts(): Promise<Post[]> {
  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const postsCol = collection(db, 'posts');
      const q = query(postsCol, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const posts: Post[] = [];
        snapshot.forEach((d) => {
          posts.push({ id: d.id, ...d.data() } as Post);
        });
        saveLocalPosts(posts);
        return posts;
      }
    } catch (err) {
      console.warn('Firestore fetch posts error, using cached store:', err);
    }
  }
  return getLocalPosts();
}

export async function getPostBySlugOrId(slugOrId: string): Promise<Post | null> {
  const posts = await fetchAllPosts();
  const found = posts.find((p) => p.slug === slugOrId || p.id === slugOrId);
  return found || null;
}

export async function saveOrUpdatePost(post: Post): Promise<Post> {
  const { db, isLive } = getFirebaseClients();
  const updatedPost: Post = {
    ...post,
    id: post.id || `post-${Date.now()}`,
    updatedAt: new Date().toISOString()
  };

  if (isLive && db) {
    try {
      const postRef = doc(db, 'posts', updatedPost.id);
      await setDoc(postRef, updatedPost, { merge: true });
    } catch (err) {
      console.warn('Firestore write error, saving to local store:', err);
    }
  }

  // Update local cache
  const current = getLocalPosts();
  const index = current.findIndex((p) => p.id === updatedPost.id);
  if (index >= 0) {
    current[index] = updatedPost;
  } else {
    current.unshift(updatedPost);
  }
  saveLocalPosts(current);

  return updatedPost;
}

export async function removePost(postId: string): Promise<boolean> {
  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (err) {
      console.warn('Firestore delete error:', err);
    }
  }
  const current = getLocalPosts().filter((p) => p.id !== postId);
  saveLocalPosts(current);
  return true;
}

export async function incrementPostLikes(postId: string): Promise<number> {
  const posts = getLocalPosts();
  const post = posts.find((p) => p.id === postId);
  const newCount = (post?.likes || 0) + 1;

  if (post) {
    post.likes = newCount;
    saveLocalPosts(posts);
  }

  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (err) {
      console.warn('Firestore like update error:', err);
    }
  }

  return newCount;
}

// ----------------------------------------------------
// SITE SETTINGS
// ----------------------------------------------------

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const settingsRef = doc(db, 'settings', 'general');
      const snapshot = await getDoc(settingsRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as SiteSettings;
        saveLocalSettings(data);
        return data;
      }
    } catch (err) {
      console.warn('Firestore fetch settings error:', err);
    }
  }
  return getLocalSettings();
}

export async function saveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const settingsRef = doc(db, 'settings', 'general');
      await setDoc(settingsRef, settings, { merge: true });
    } catch (err) {
      console.warn('Firestore write settings error:', err);
    }
  }
  saveLocalSettings(settings);
  return settings;
}

// ----------------------------------------------------
// NEWSLETTER SUBSCRIBERS
// ----------------------------------------------------

export async function addSubscriber(email: string, source = 'homepage'): Promise<{ success: boolean; message: string; subscriber?: Subscriber }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const current = getLocalSubscribers();
  const existing = current.find((s) => s.email === cleanEmail);
  if (existing) {
    return { success: true, message: 'You are already subscribed to Vertex Theory dispatches.' };
  }

  const newSub: Subscriber = {
    id: `sub-${Date.now()}`,
    email: cleanEmail,
    createdAt: new Date().toISOString(),
    source,
    status: 'active'
  };

  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const subRef = doc(db, 'subscribers', newSub.id);
      await setDoc(subRef, newSub);
    } catch (err) {
      console.warn('Firestore write subscriber error, stored locally:', err);
    }
  }

  current.unshift(newSub);
  saveLocalSubscribers(current);

  return { success: true, message: 'Welcome to Vertex Theory. Dispatches will arrive directly in your inbox.', subscriber: newSub };
}

export async function fetchAllSubscribers(): Promise<Subscriber[]> {
  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const subsCol = collection(db, 'subscribers');
      const snapshot = await getDocs(subsCol);
      if (!snapshot.empty) {
        const subs: Subscriber[] = [];
        snapshot.forEach((d) => {
          subs.push({ id: d.id, ...d.data() } as Subscriber);
        });
        saveLocalSubscribers(subs);
        return subs;
      }
    } catch (err) {
      console.warn('Firestore fetch subscribers error:', err);
    }
  }
  return getLocalSubscribers();
}

export async function removeSubscriber(id: string): Promise<boolean> {
  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      await deleteDoc(doc(db, 'subscribers', id));
    } catch (err) {
      console.warn('Firestore remove subscriber error:', err);
    }
  }
  const current = getLocalSubscribers().filter((s) => s.id !== id);
  saveLocalSubscribers(current);
  return true;
}

// ----------------------------------------------------
// COMMENTS
// ----------------------------------------------------

export async function addPostComment(data: {
  postId: string;
  authorName: string;
  authorEmail: string;
  content: string;
}): Promise<PostComment> {
  const newComment: PostComment = {
    id: `comm-${Date.now()}`,
    postId: data.postId,
    authorName: data.authorName.trim() || 'Anonymous Reader',
    authorEmail: data.authorEmail.trim(),
    content: data.content.trim(),
    createdAt: new Date().toISOString(),
    approved: true
  };

  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const commRef = doc(db, 'comments', newComment.id);
      await setDoc(commRef, newComment);
    } catch (err) {
      console.warn('Firestore write comment error:', err);
    }
  }

  const current = getLocalComments();
  current.unshift(newComment);
  saveLocalComments(current);

  return newComment;
}

export async function fetchCommentsForPost(postId: string): Promise<PostComment[]> {
  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        where('approved', '==', true)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const comments: PostComment[] = [];
        snapshot.forEach((d) => comments.push({ id: d.id, ...d.data() } as PostComment));
        return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (err) {
      console.warn('Firestore fetch comments error:', err);
    }
  }
  return getLocalComments().filter((c) => c.postId === postId && c.approved);
}

export async function fetchAllComments(): Promise<PostComment[]> {
  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const snapshot = await getDocs(collection(db, 'comments'));
      if (!snapshot.empty) {
        const comments: PostComment[] = [];
        snapshot.forEach((d) => comments.push({ id: d.id, ...d.data() } as PostComment));
        saveLocalComments(comments);
        return comments;
      }
    } catch (err) {
      console.warn('Firestore fetch all comments error:', err);
    }
  }
  return getLocalComments();
}

export async function deleteCommentById(id: string): Promise<boolean> {
  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      await deleteDoc(doc(db, 'comments', id));
    } catch (err) {
      console.warn('Firestore delete comment error:', err);
    }
  }
  const current = getLocalComments().filter((c) => c.id !== id);
  saveLocalComments(current);
  return true;
}

// ----------------------------------------------------
// READER MESSAGES & INQUIRIES
// ----------------------------------------------------

export async function sendReaderMessage(data: {
  postId?: string;
  postTitle?: string;
  senderName: string;
  senderEmail: string;
  message: string;
}): Promise<ReaderMessage> {
  const newMsg: ReaderMessage = {
    id: `msg-${Date.now()}`,
    postId: data.postId,
    postTitle: data.postTitle,
    senderName: data.senderName.trim() || 'Reader',
    senderEmail: data.senderEmail.trim(),
    message: data.message.trim(),
    createdAt: new Date().toISOString(),
    status: 'unread'
  };

  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const msgRef = doc(db, 'messages', newMsg.id);
      await setDoc(msgRef, newMsg);
    } catch (err) {
      console.warn('Firestore write message error:', err);
    }
  }

  const current = getLocalMessages();
  current.unshift(newMsg);
  saveLocalMessages(current);

  return newMsg;
}

export async function fetchAllMessages(): Promise<ReaderMessage[]> {
  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const snapshot = await getDocs(collection(db, 'messages'));
      if (!snapshot.empty) {
        const msgs: ReaderMessage[] = [];
        snapshot.forEach((d) => msgs.push({ id: d.id, ...d.data() } as ReaderMessage));
        saveLocalMessages(msgs);
        return msgs;
      }
    } catch (err) {
      console.warn('Firestore fetch messages error:', err);
    }
  }
  return getLocalMessages();
}

export async function updateMessageStatus(
  id: string, 
  status: ReaderMessage['status'], 
  replyNotes?: string
): Promise<boolean> {
  const { db, isLive } = getFirebaseClients();
  if (isLive && db) {
    try {
      const msgRef = doc(db, 'messages', id);
      await updateDoc(msgRef, {
        status,
        ...(replyNotes !== undefined ? { replyNotes } : {})
      });
    } catch (err) {
      console.warn('Firestore update message status error:', err);
    }
  }

  const current = getLocalMessages();
  const target = current.find((m) => m.id === id);
  if (target) {
    target.status = status;
    if (replyNotes !== undefined) {
      target.replyNotes = replyNotes;
    }
    saveLocalMessages(current);
  }
  return true;
}

// ----------------------------------------------------
// AUTHENTICATION (FIREBASE AUTH ONLY)
// ----------------------------------------------------

export interface AuthSessionUser {
  email: string;
  isAdmin: boolean;
  isLiveFirebase: boolean;
  uid?: string;
}

export async function loginAdmin(email: string, pass: string): Promise<{ success: boolean; error?: string; user?: AuthSessionUser }> {
  const cleanEmail = email.trim();
  const cleanPass = pass.trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, error: 'Please enter both your Firebase Auth email and password.' };
  }

  const { auth, isLive } = getFirebaseClients();

  // If live Firebase auth is present, authenticate directly with Firebase Auth
  if (isLive && auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const sessionUser: AuthSessionUser = {
        email: cred.user.email || cleanEmail,
        isAdmin: true,
        isLiveFirebase: true,
        uid: cred.user.uid
      };
      sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sessionUser));
      window.dispatchEvent(new CustomEvent('vertex_auth_change'));
      return { success: true, user: sessionUser };
    } catch (err: any) {
      console.warn('Firebase Auth sign-in failed:', err);
      let message = 'Firebase authentication failed. Please verify your credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid Firebase Auth email or password.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No Firebase user found with this email address. Please create the user under Firebase Console -> Authentication -> Users.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is not enabled in Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method and enable Email/Password.';
      } else if (err.code === 'auth/unauthorized-domain') {
        message = 'This domain is not authorized for Firebase Auth. Add it under Firebase Console -> Authentication -> Settings -> Authorized domains.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Access temporarily disabled due to many failed login attempts. Try again later.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email format.';
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, error: message };
    }
  }

  // If Firebase is not configured yet
  return { 
    success: false, 
    error: 'Firebase project is not connected yet. Please configure your Firebase credentials below to enable secure authentication.' 
  };
}

export async function logoutAdmin(): Promise<void> {
  const { auth, isLive } = getFirebaseClients();
  if (isLive && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout:', e);
    }
  }
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  window.dispatchEvent(new CustomEvent('vertex_auth_change'));
}

export function getCurrentAdminUser(): AuthSessionUser | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function subscribeToAuthState(callback: (user: AuthSessionUser | null) => void): () => void {
  const handleAuthChange = () => {
    callback(getCurrentAdminUser());
  };

  window.addEventListener('vertex_auth_change', handleAuthChange);

  const { auth, isLive } = getFirebaseClients();
  let unsubscribeFirebase: (() => void) | null = null;
  if (isLive && auth) {
    unsubscribeFirebase = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const sessionUser: AuthSessionUser = {
          email: firebaseUser.email || '',
          isAdmin: true,
          isLiveFirebase: true,
          uid: firebaseUser.uid
        };
        sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sessionUser));
        callback(sessionUser);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
        callback(null);
      }
    });
  }

  // Initial invoke
  callback(getCurrentAdminUser());

  return () => {
    window.removeEventListener('vertex_auth_change', handleAuthChange);
    if (unsubscribeFirebase) {
      unsubscribeFirebase();
    }
  };
}
