import { supabase } from './supabase';

export type ParentAccount = {
  id: string;
  parentName: string;
  email: string;
  childName: string;
  skaterId: string;
  role: 'family' | 'coach';
};

export async function createAccount(account: { parentName: string; email: string; childName: string; password: string }) {
  const { data, error } = await supabase.auth.signUp({
    email: account.email.toLowerCase(),
    password: account.password,
    options: { emailRedirectTo: `${window.location.origin}/auth/login`, data: { parent_name: account.parentName, child_name: account.childName } },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
  if (error) throw error;
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
  if (profileError) throw profileError;
  return profile as { role: 'family' | 'coach' };
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
