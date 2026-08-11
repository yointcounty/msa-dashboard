'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Lock, Mail, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) setError(signInError.message);
    else router.replace('/');
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo"><div className="brand-mark"><Zap size={19} fill="currentColor" /></div><h1>MIAMI SKATE</h1><span>ACADEMY</span></div>
        <p className="eyebrow">PARENT PORTAL</p>
        <h2>Welcome back</h2>
        <p className="auth-subtitle">Sign in to see your skater’s latest progress.</p>
        <form onSubmit={submit}>
          <label><Mail size={14} /> Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
          <label><Lock size={14} /> Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required /></label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="primary-button auth-submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} <span>→</span></button>
        </form>
        <p className="auth-footer">New to the academy? <Link href="/auth/signup">Create an account</Link></p>
        <Link href="/" className="back-link">← Back to portal</Link>
      </div>
    </div>
  );
}
