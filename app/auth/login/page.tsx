'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Mail, Lock, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) : null;

export default function LoginPage() {
  const router=useRouter(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState('');
  async function submit(e:React.FormEvent){e.preventDefault();setError(''); if(!supabase){router.push('/');return;} const {error}=await supabase.auth.signInWithPassword({email,password}); if(error)setError(error.message); else router.push('/');}
  return <div className="auth-shell"><div className="auth-card"><div className="auth-logo"><div className="brand-mark"><Zap size={19} fill="currentColor"/></div><h1>MIAMI SKATE</h1><span>ACADEMY</span></div><p className="eyebrow">PARENT PORTAL</p><h2>Welcome back</h2><p className="auth-subtitle">Sign in to see your skater’s latest progress.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></label>{error&&<p className="auth-error">{error}</p>}<button className="primary-button auth-submit">Sign in <span>→</span></button></form><p className="auth-footer">New to the academy? <Link href="/auth/signup">Create an account</Link></p><Link href="/" className="back-link">← Back to portal</Link></div></div>;
}
