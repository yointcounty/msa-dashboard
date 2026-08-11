'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Lock, Mail, User, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAuthRedirectUrl, supabase } from '../../lib/supabase-browser';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Use a password with at least 6 characters.');
      return;
    }
    if (!supabase) {
      setError('Supabase is not configured. Add the public Supabase URL and key to your environment.');
      return;
    }

    setLoading(true);
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: { parent_name: name },
      },
    });
    setLoading(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    if (data.session) {
      router.replace('/');
    } else {
      setMessage('Check your email to confirm your account. The button in the email will bring you back to the portal.');
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo"><div className="brand-mark"><Zap size={19} fill="currentColor" /></div><h1>MIAMI SKATE</h1><span>ACADEMY</span></div>
        <p className="eyebrow">PARENT PORTAL</p>
        <h2>Create your account</h2>
        <p className="auth-subtitle">Stay connected to your skater’s progress.</p>
        <form onSubmit={submit}>
          <label>Parent name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required /></label>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" required /></label>
          <label>Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" required /></label>
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}
          <button type="submit" className="primary-button auth-submit" disabled={loading}>{loading ? 'Creating account…' : 'Create account'} <span>→</span></button>
        </form>
        <p className="auth-footer">Already have an account? <Link href="/auth/login">Sign in</Link></p>
        <Link href="/" className="back-link">← Back to portal</Link>
      </div>
    </div>
  );
}

