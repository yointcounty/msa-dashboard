import { supabase } from './supabase';

export type ParentAccount = {
  id: string;
  parentName: string;
  email: string;
  childName: string;
  skaterId: string;
  role: 'family' | 'coach';
};

function friendlyAuthError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();

  if (normalized.includes('already registered') || normalized.includes('user already')) {
    return 'This email already has a portal account. Sign in instead, or use a different email.';
  }
  if (normalized.includes('password') && (normalized.includes('character') || normalized.includes('should be'))) {
    return 'Choose a password with at least 8 characters.';
  }
  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('load failed') ||
    normalized.includes('networkerror') ||
    normalized.includes('network error')
  ) {
    return 'We could not reach the portal. Check your internet connection and try again.';
  }
  if (normalized.includes('rate limit') || normalized.includes('email rate')) {
    return 'Too many sign-up emails were requested. Please wait a few minutes and try again.';
  }
  return fallback;
}

export async function createAccount(account: { parentName: string; email: string; childName: string; password: string }) {
  const parentName = account.parentName.trim();
  const childName = account.childName.trim();
  const email = account.email.trim().toLowerCase();

  if (!parentName || !childName) throw new Error('Enter the parent and skater names.');
  if (!email || !email.includes('@')) throw new Error('Enter a valid parent email.');
  if (account.password.length < 8) throw new Error('Choose a password with at least 8 characters.');

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: account.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/login`,
        data: { parent_name: parentName, child_name: childName },
      },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  } catch (error) {
    throw new Error(friendlyAuthError(error, 'We could not activate the portal. Please check your details and try again.'));
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw error;
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    if (profileError) throw profileError;
    return profile as { role: 'family' | 'coach' };
  } catch (error) {
    throw new Error(friendlyAuthError(error, 'We could not sign you in. Check your email and password and try again.'));
  }
}

export async function getAccount(): Promise<ParentAccount | null> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;
  const [{ data: profile }, { data: skater }] = await Promise.all([
    supabase.from('profiles').select('parent_name, email, role').eq('id', authData.user.id).single(),
    supabase.from('skaters').select('id, name').eq('parent_user_id', authData.user.id).limit(1).maybeSingle(),
  ]);
  if (!profile || profile.role !== 'family' || !skater) return null;
  return {
    id: authData.user.id,
    parentName: profile.parent_name || 'MSA Family',
    email: profile.email,
    childName: skater.name,
    skaterId: skater.id,
    role: profile.role,
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}
