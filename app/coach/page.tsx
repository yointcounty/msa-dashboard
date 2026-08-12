'use client';

import Link from 'next/link';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { BellRing, CheckCircle2, ClipboardCheck, ImagePlus, LogOut, Save, Trash2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './coach.css';

type Skater = { id: string; name: string; parent_user_id: string; profiles: { parent_name: string | null; email: string } | null };
type Progress = { trick_id: string; status: string; progress: number; coach_note: string; tricks: { name: string; sort_order: number } | null };

export default function CoachPortal() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activate, setActivate] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [coachId, setCoachId] = useState('');
  const [skaters, setSkaters] = useState<Skater[]>([]);
  const [selected, setSelected] = useState('');
  const [progress, setProgress] = useState<Progress[]>([]);
  const [overallNote, setOverallNote] = useState('');

  const loadSkaters = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setAuthorized(false); return; }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', auth.user.id).single();
    if (profile?.role !== 'coach') { await supabase.auth.signOut(); setAuthorized(false); setMessage('This account does not have coach access.'); return; }
    setCoachId(auth.user.id);
    setAuthorized(true);
    const { data } = await supabase.from('skaters').select('id,name,parent_user_id,profiles!skaters_parent_user_id_fkey(parent_name,email)').eq('active', true).order('name');
    const list = (data || []) as unknown as Skater[];
    setSkaters(list);
    setSelected((current) => current && list.some((item) => item.id === current) ? current : list[0]?.id || '');
  }, []);

  const loadProgress = useCallback(async () => {
    if (!selected) { setProgress([]); setOverallNote(''); return; }
    const [{ data: trickRows }, { data: noteRows }] = await Promise.all([
      supabase.from('skater_tricks').select('trick_id,status,progress,coach_note,tricks(name,sort_order)').eq('skater_id', selected),
      supabase.from('skater_notes').select('body').eq('skater_id', selected).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    setProgress(((trickRows || []) as unknown as Progress[]).sort((a, b) => (a.tricks?.sort_order || 0) - (b.tricks?.sort_order || 0)));
    setOverallNote(noteRows?.body || '');
  }, [selected]);

  useEffect(() => { const timer = window.setTimeout(() => { void loadSkaters(); }, 0); return () => window.clearTimeout(timer); }, [loadSkaters]);
  useEffect(() => { const timer = window.setTimeout(() => { void loadProgress(); }, 0); return () => window.clearTimeout(timer); }, [loadProgress]);

  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email')).toLowerCase();
    const password = String(form.get('password'));
    if (email !== 'jt@yointcounty.com') { setMessage('Coach access is authorized for jt@yointcounty.com.'); setBusy(false); return; }
    const result = activate
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/coach`, data: { parent_name: 'JT Coach' } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (activate && !result.data.session) setMessage('Check jt@yointcounty.com to confirm the coach account, then sign in.');
    else await loadSkaters();
    setBusy(false);
  }

  function edit(trickId: string, changes: Partial<Progress>) {
    setProgress((items) => items.map((item) => item.trick_id === trickId ? { ...item, ...changes } : item));
  }

  async function save(item: Progress) {
    setMessage('Saving coach update…');
    const { error } = await supabase.from('skater_tricks').update({ status: item.status, progress: item.progress, coach_note: item.coach_note, updated_by: coachId, updated_at: new Date().toISOString() }).eq('skater_id', selected).eq('trick_id', item.trick_id);
    setMessage(error ? error.message : `${item.tricks?.name} updated. The family was notified in their portal.`);
  }

  async function saveOverallNote() {
    if (!selected || !overallNote.trim()) return;
    setBusy(true); setMessage('Saving coach note…');
    const { error } = await supabase.from('skater_notes').insert({ skater_id: selected, author_user_id: coachId, body: overallNote.trim() });
    if (!error && activeSkater) {
      await supabase.from('notifications').insert({ recipient_user_id: activeSkater.parent_user_id, skater_id: selected, message: 'Your coach posted a new update to your skater portal.' });
    }
    setBusy(false);
    setMessage(error ? error.message : 'Coach note saved to the family portal.');
  }

  async function uploadMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selected) return;
    setMediaBusy(true); setMessage('Uploading media…');
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
    const path = `${selected}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('skater-media').upload(path, file, { upsert: false });
    if (uploadError) { setMediaBusy(false); setMessage(uploadError.message); return; }
    const { error: mediaError } = await supabase.from('media').insert({ skater_id: selected, storage_path: path, kind: file.type.startsWith('video/') ? 'video' : 'photo', caption: file.name.replace(/\.[^.]+$/, ''), created_by: coachId });
    setMediaBusy(false);
    setMessage(mediaError ? mediaError.message : 'Media saved to this skater’s permanent gallery.');
  }

  async function deleteFamilyAccount(skater: Skater) {
    if (!window.confirm(`Delete the family account for ${skater.profiles?.parent_name || skater.profiles?.email || skater.name}? This permanently removes their profile, skater progress, notes, notifications, media records, and account access.`)) return;
    setBusy(true); setMessage('Deleting family account…');
    const { error } = await supabase.rpc('delete_family_account', { target_user_id: skater.parent_user_id });
    if (error) setMessage(error.message);
    else { const remaining = skaters.filter((item) => item.parent_user_id !== skater.parent_user_id); setSkaters(remaining); setSelected(remaining[0]?.id || ''); setProgress([]); setOverallNote(''); setMessage('Family account deleted.'); }
    setBusy(false);
  }

  if (authorized === null) return <main className="coach-loading">Opening coach portal…</main>;
  if (!authorized) return <main className="coach-auth"><section><Link href="/" className="brand-lockup"><span className="brand-mark">MSA</span><span><b>MIAMI SKATE</b><small>COACH PORTAL</small></span></Link><p className="eyebrow"><span /> Private staff access</p><h1>COACH<br /><em>CONTROL.</em></h1><p>Update progress, save coach notes, add media, and manage family accounts.</p></section><form onSubmit={authenticate}><h2>{activate ? 'Activate coach account' : 'Coach sign in'}</h2><label>Email<input name="email" type="email" value="jt@yointcounty.com" readOnly /></label><label>Password<input name="password" type="password" minLength={8} required /></label>{activate && <p className="verification-note"><b>Confirmation email</b>The verification link will return you to this coach portal.</p>}{message && <p className="coach-message">{message}</p>}<button className="button" disabled={busy}>{busy ? 'Please wait…' : activate ? 'Activate coach access' : 'Sign in'}</button><button type="button" className="text-button" onClick={() => { setActivate(!activate); setMessage(''); }}>{activate ? 'Already activated? Sign in' : 'First time? Activate coach access'}</button></form></main>;

  const activeSkater = skaters.find((item) => item.id === selected);
  return <main className="coach-shell">
    <nav className="coach-nav"><Link href="/" className="brand-lockup"><span className="brand-mark">MSA</span><span><b>MIAMI SKATE</b><small>COACH PORTAL</small></span></Link><button onClick={async () => { await supabase.auth.signOut(); setAuthorized(false); }}><LogOut size={17} /> Sign out</button></nav>
    <div className="coach-main"><header><div><p className="eyebrow"><span /> Live progress control</p><h1>COACH<br />PORTAL.</h1><p>Every saved change updates the family portal and stays in Supabase across future website updates.</p></div><div className="coach-stat"><Users /><b>{skaters.length}</b><span>Active portal skaters</span></div></header>
      {skaters.length === 0 ? <section className="empty-coach"><Users /><h2>No skater accounts yet.</h2><p>New parent signups with a skater name will appear here automatically.</p></section> : <>
        <section className="skater-picker"><label htmlFor="skater">Editing progress for</label><select id="skater" value={selected} onChange={(event) => setSelected(event.target.value)}>{skaters.map((item) => <option value={item.id} key={item.id}>{item.name} — {item.profiles?.parent_name || item.profiles?.email}</option>)}</select><div><ClipboardCheck /><span><b>{activeSkater?.name}</b><small>{activeSkater?.profiles?.email}</small></span></div></section>
        <section className="account-controls"><div><p className="eyebrow"><span /> Account administration</p><h2>Family account</h2><p>Delete this parent account and all linked skater data when requested.</p></div><button className="danger-button" disabled={busy || !activeSkater} onClick={() => activeSkater && deleteFamilyAccount(activeSkater)}><Trash2 size={16} /> Delete account</button></section>
        <section className="coach-note-panel"><div><p className="eyebrow"><span /> One coach note</p><h2>Family update</h2><p>This is the single note parents see at the top of their portal.</p></div><textarea value={overallNote} onChange={(event) => setOverallNote(event.target.value)} placeholder="What should this family know after the latest session?" maxLength={1200} /><button onClick={saveOverallNote} disabled={busy || !overallNote.trim()}><Save size={16} /> Save coach note</button></section>
        <section className="media-panel"><div><p className="eyebrow"><span /> Permanent media</p><h2>Add a gallery photo or video</h2><p>Uploads are stored in the private Supabase media bucket and remain linked to this skater until the account is deleted.</p></div><label className="media-upload"><ImagePlus size={17} /> {mediaBusy ? 'Uploading…' : 'Choose photo or video'}<input type="file" accept="image/*,video/*" disabled={mediaBusy} onChange={uploadMedia} /></label></section>
        <section className="coach-tricks"><div className="coach-section-title"><div><p className="eyebrow"><span /> Main trick checklist</p><h2>Update the roadmap</h2></div><BellRing /><p>Saving automatically creates an in-app notification.</p></div><div className="coach-trick-list">{progress.map((item) => <article key={item.trick_id}><div className="trick-name"><CheckCircle2 /><b>{item.tricks?.name}</b></div><label>Status<select value={item.status} onChange={(event) => edit(item.trick_id, { status: event.target.value })}><option value="not_started">Not started</option><option value="learning">Learning</option><option value="landed">Landed</option><option value="consistent">Consistent</option><option value="mastered">Mastered</option></select></label><label>Progress <b>{item.progress}%</b><input type="range" min="0" max="100" step="5" value={item.progress} onChange={(event) => edit(item.trick_id, { progress: Number(event.target.value) })} /></label><label>Skill note<textarea value={item.coach_note} onChange={(event) => edit(item.trick_id, { coach_note: event.target.value })} placeholder="Optional skill-specific detail" /></label><button onClick={() => save(item)}><Save size={16} /> Save skill update</button></article>)}</div></section>
      </>}
      {message && <div className="coach-toast" role="status">{message}</div>}
    </div>
  </main>;
}
