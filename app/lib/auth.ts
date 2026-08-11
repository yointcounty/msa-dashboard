export type ParentAccount = { parentName: string; email: string; childName: string; program: string; passwordHash: string };

const ACCOUNT_KEY = 'msa-parent-account';
const SESSION_KEY = 'msa-parent-session';

async function hashPassword(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createAccount(account: Omit<ParentAccount, 'passwordHash'> & { password: string }) {
  const passwordHash = await hashPassword(account.password);
  const saved: ParentAccount = { parentName: account.parentName, email: account.email.toLowerCase(), childName: account.childName, program: account.program, passwordHash };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(saved));
  localStorage.setItem(SESSION_KEY, saved.email);
  return saved;
}

export async function signIn(email: string, password: string) {
  const raw = localStorage.getItem(ACCOUNT_KEY);
  if (!raw) throw new Error('No parent account found on this device. Please enroll first.');
  const account = JSON.parse(raw) as ParentAccount;
  if (account.email !== email.toLowerCase() || account.passwordHash !== await hashPassword(password)) throw new Error('That email or password does not match your account.');
  localStorage.setItem(SESSION_KEY, account.email);
  return account;
}

export function getAccount() {
  const raw = localStorage.getItem(ACCOUNT_KEY);
  const session = localStorage.getItem(SESSION_KEY);
  if (!raw || !session) return null;
  const account = JSON.parse(raw) as ParentAccount;
  return account.email === session ? account : null;
}

export function signOut() { localStorage.removeItem(SESSION_KEY); }
