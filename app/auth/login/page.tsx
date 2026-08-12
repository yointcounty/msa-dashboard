'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getAccount, signIn } from '../../lib/auth';
import '../auth.css';

export default function LoginPage() {
  const router = useRouter(); const [show, setShow] = useState(false); const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { void getAccount().then((account) => { if (account) router.replace('/dashboard'); }); }, [router]);
  async function submit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); setStatus(''); const data = new FormData(e.currentTarget); try { const profile = await signIn(String(data.get('email')), String(data.get('password'))); router.push(profile.role === 'coach' ? '/coach' : '/dashboard'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to sign in.'); setBusy(false); } }
  return <main className="auth-shell">
    <section className="auth-visual"><Image src="/images/msa-lessons-v2.png" alt="Miami Skate Academy coach helping a young skater" fill priority sizes="(max-width: 900px) 100vw, 50vw"/><div className="auth-visual-copy"><h2>WELCOME BACK<br/><em>TO THE CREW.</em></h2><p>Schedules, milestones, and coach updates—all in one family-friendly place.</p></div></section>
    <section className="auth-panel"><Link href="/" className="brand-lockup"><span className="brand-mark">MSA</span><span><b>MIAMI SKATE</b><small>ACADEMY</small></span></Link><Link href="/" className="back-link"><ArrowLeft size={15}/> Home</Link>
      <div className="auth-card"><p className="eyebrow"><span/> Parent portal</p><h1>SIGN IN.</h1><p>Pick up right where your skater left off.</p>
        <form onSubmit={submit}><div className="field"><label htmlFor="email">Parent email</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></div><div className="field"><div className="password-row"><label htmlFor="password">Password</label><button type="button" onClick={()=>setShow(!show)}>{show?'Hide':'Show'}</button></div><input id="password" name="password" type={show?'text':'password'} autoComplete="current-password" required minLength={8} placeholder="8+ characters"/></div>{status&&<div className="form-status error" role="alert">{status}</div>}<button className="button" disabled={busy}>{busy?'Signing in…':<>Sign in <ArrowRight size={18}/></>}</button></form>
        <p className="auth-switch">Enrolled but new to the portal? <Link href="/auth/signup">Activate access</Link></p>
        <p className="auth-switch">MSA coach? <Link href="/coach">Open coach portal</Link></p>
        <div className="not-enrolled"><b>Not enrolled yet?</b><a href="https://miamiskateacademy.com" target="_blank" rel="noreferrer">Enroll at MiamiSkateAcademy.com</a><a href="sms:+17863947314">Text 786-394-7314</a></div>
      </div>
    </section>
  </main>;
}
