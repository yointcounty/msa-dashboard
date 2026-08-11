'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase-browser';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function finishAuth() {
      if (!supabase) {
        setError('Supabase is not configured for this site.');
        return;
      }

      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) setError('This confirmation link is invalid or has expired. Please request a new one.');
          return;
        }
      } else {
        await supabase.auth.getSession();
      }

      if (!cancelled) router.replace('/');
    }
    finishAuth();
    return () => { cancelled = true; };
  }, [router]);

  return <div className="auth-shell"><div className="auth-card callback-card"><div className="brand-mark"><span>✓</span></div><h2>{error ? 'Confirmation link issue' : 'Confirming your account…'}</h2><p className={error ? 'auth-error' : 'auth-subtitle'}>{error || 'One moment while we securely sign you in.'}</p>{error && <a className="primary-button auth-submit" href="/auth/signup">Start again <span>→</span></a>}</div></div>;
}

