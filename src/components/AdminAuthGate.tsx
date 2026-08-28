import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  Database, 
  Save, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { 
  loginAdmin, 
  getSavedFirebaseConfig, 
  saveFirebaseConfig, 
  getFirebaseClients,
  DEFAULT_FIREBASE_CONFIG
} from '../firebaseConfig';
import { navigateTo } from '../utils/helpers';
import { Logo } from './Logo';

export const AdminAuthGate: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [configJson, setConfigJson] = useState(() => {
    const saved = getSavedFirebaseConfig();
    return saved ? JSON.stringify(saved, null, 2) : JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2);
  });
  const [configSuccess, setConfigSuccess] = useState(false);

  const { isLive } = getFirebaseClients();
  const activeConfig = getSavedFirebaseConfig();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginAdmin(email, password);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please verify your Firebase credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during Firebase authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    try {
      const parsed = JSON.parse(configJson);
      if (!parsed.apiKey || !parsed.projectId) {
        setError('Config must include at least apiKey and projectId.');
        return;
      }
      saveFirebaseConfig(parsed);
      setConfigSuccess(true);
      setError('');
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch {
      setError('Invalid JSON format for Firebase configuration.');
    }
  };

  const handleResetToDefault = () => {
    saveFirebaseConfig(DEFAULT_FIREBASE_CONFIG);
    setConfigJson(JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2));
    setConfigSuccess(true);
    setError('');
    setTimeout(() => setConfigSuccess(false), 3000);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size={48} useImage={true} showText={false} />
          </div>
          <h1 className="font-heading font-bold text-2xl text-[var(--color-text-primary)]">
            Restricted Admin Console
          </h1>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Target: {activeConfig?.projectId || 'vertextheory1-44870'}</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] font-mono leading-relaxed max-w-xs mx-auto">
            Sign in with your Firebase Auth administrator account to manage articles, settings, and subscriber records.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
            {error.includes('No Firebase user found') && (
              <div className="text-[11px] text-[var(--color-text-muted)] pl-6 leading-relaxed border-t border-rose-500/20 pt-1.5">
                💡 Go to <strong>Firebase Console</strong> → <strong>Authentication</strong> → <strong>Users</strong> → <strong>Add user</strong> to create your admin login.
              </div>
            )}
            {error.includes('Email/Password sign-in is not enabled') && (
              <div className="text-[11px] text-[var(--color-text-muted)] pl-6 leading-relaxed border-t border-rose-500/20 pt-1.5">
                💡 Go to <strong>Firebase Console</strong> → <strong>Authentication</strong> → <strong>Sign-in method</strong> → enable <strong>Email/Password</strong>.
              </div>
            )}
          </div>
        )}

        {configSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Firebase configuration synced with {activeConfig?.projectId}!</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--color-text-secondary)] font-semibold block">
              Firebase Auth Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@domain.com"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--color-text-secondary)] font-semibold block">
              Firebase Auth Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold transition-all shadow-md shadow-[var(--color-accent)]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Authenticate with Firebase Auth</span>
          </button>
        </form>

        {/* Firebase Config Drawer */}
        <div className="pt-3 border-t border-[var(--color-border)] space-y-3">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="w-full text-center text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-accent)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{showConfig ? 'Hide Firebase Config' : `Connected: ${activeConfig?.projectId || 'vertextheory1-44870'}`}</span>
          </button>

          {showConfig && (
            <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] space-y-3">
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                Active Firebase configuration for <strong>{activeConfig?.projectId}</strong>:
              </p>
              <textarea
                rows={6}
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] font-mono text-[11px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] text-xs font-semibold border border-[var(--color-border)] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Save Config</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3 py-2.5 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs font-semibold border border-[var(--color-border)] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  title="Reset to default vertextheory1-44870 project"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => navigateTo({ page: 'home' })}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Publication</span>
          </button>
        </div>
      </div>
    </div>
  );
};
