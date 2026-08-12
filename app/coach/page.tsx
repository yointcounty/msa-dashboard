'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BellRing, CheckCircle2, ClipboardCheck, LogOut, Save, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './coach.css';

type Skater = { id: string; name: string; parent_user_id: string; profiles: { parent_name: string | null; email: string } | null };
type Progress = { trick_id: string; status: string; progress: number; coach_note: string; tricks: { name: string; sort_order: number } | null };

export default function CoachPortal() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activate, setActivate] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [coachId, setCoachId] = useState('');
  const [skaters, setSkaters] = useState<Skater[]>([]);
  const [selected, setSelected] = useState('');
  const [progress, setProgress] = useState<Progress[]>([]);
  const [checklistNote, setChecklistNote] = useState('');

  const loadSkaters = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setAuthorized(false); return; }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', auth.user.id).single();
    if (profile?.role !== 'coach') { await supabase.auth.signOut(); setAuthorized(false); setMessage('This account does not have coach access.'); return; }
    setCoachId(auth.user.id);
    setAuthorized(true);
    const { data } = await supabase.from('skaters').select('id, name, parent_user_id, profiles!skaters_parent_user_id_fkey(parent_name, email)').eq('active', true).order('name');
    const list = (data || []) as unknown as Skater[];
    setSkaters(list);
    setSelected((current) => current || list[0]?.id || '');
  }, []);

  const loadProgress = useCallback(async () => {
    if (!selected) { setProgress([]); return; }
    const { data } = await supabase.from('skater_tricks').select('trick_id, status, progress, coach_note, tricks(name, sort_order)').eq('skater_id', selected);
    const sorted = ((data || []) as unknown as Progress[]).sort((a,b)=>(a.tricks?.sort_order || 0)-(b.tricks?.sort_order || 0));
    setProgress(sorted);
    setChecklistNote(sorted.find((item)=>item.coach_note.trim())?.coach_note || '');
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
    setProgress((items)=>items.map((item)=>item.trick_id===trickId ? {...item,...changes} : item));
  }

  async function save(item: Progress) {
    setMessage('Saving coach update…');
    const { error } = await supabase.from('skater_tricks').update({
      status: item.status, progress: item.progress,
      updated_by: coachId, updated_at: new Date().toISOString(),
    }).eq('skater_id', selected).eq('trick_id', item.trick_id);
    setMessage(error ? error.message : `${item.tricks?.name} updated. The family was notified in their portal.`);
  }

  async function saveChecklistNote() {
    const noteRow = progress[0];
    if (!noteRow) return;
    setMessage('Saving checklist note…');
    const { error } = await supabase.from('skater_tricks').update({
      coach_note: checklistNote, updated_by: coachId, updated_at: new Date().toISOString(),
    }).eq('skater_id', selected).eq('trick_id', noteRow.trick_id);
    setProgress((items)=>items.map((item,index)=>index===0 ? {...item,coach_note:checklistNote} : item));
    setMessage(error ? error.message : `Coach note saved for ${activeSkater?.name || 'this skater'}’s checklist.`);
  }

  if (authorized === null) return <main className="coach-loading">Opening coach portal…</main>;
  if (!authorized) return <main className="coach-auth"><section><Link href="/" className="brand-lockup"><span className="brand-mark">MSA</span><span><b>MIAMI SKATE</b><small>COACH PORTAL</small></span></Link><p className="eyebrow"><span/> Private staff access</p><h1>COACH<br/><em>CONTROL.</em></h1><p>Update tricks, leave session notes, and notify each skater&apos;s family.</p></section><form onSubmit={authenticate}><h2>{activate ? 'Activate coach account' : 'Coach sign in'}</h2><label>Email<input name="email" type="email" value="jt@yointcounty.com" readOnly/></label><label>Password<input name="password" type="password" minLength={8} required/></label>{activate && <p className="verification-note"><b>About the confirmation email</b>The verification link is issued by our secure database provider and should begin with <code>https://epanlocaznmaydpnzomr.supabase.co</code>. Do not open it if the domain is different.</p>}{message && <p className="coach-message">{message}</p>}<button className="button" disabled={busy}>{busy ? 'Please wait…' : activate ? 'Activate coach access' : 'Sign in'}</button><button type="button" className="text-button" onClick={()=>{setActivate(!activate);setMessage('')}}>{activate ? 'Already activated? Sign in' : 'First time? Activate coach access'}</button></form></main>;

  const activeSkater = skaters.find((item)=>item.id===selected);
  return <main className="coach-shell">
    <nav className="coach-nav"><Link href="/" className="brand-lockup"><span className="brand-mark">MSA</span><span><b>MIAMI SKATE</b><small>COACH PORTAL</small></span></Link><button onClick={async()=>{await supabase.auth.signOut();setAuthorized(false)}}><LogOut size={17}/> Sign out</button></nav>
    <div className="coach-main"><header><div><p className="eyebrow"><span/> Live progress control</p><h1>COACH<br/>PORTAL.</h1><p>Every saved change updates the skater dashboard and creates a family notification.</p></div><div className="coach-stat"><Users/><b>{skaters.length}</b><span>Active portal skaters</span></div></header>
      {skaters.length === 0 ? <section className="empty-coach"><Users/><h2>No skater accounts yet.</h2><p>Enrolled families will appear here after activating their portal access.</p></section> : <>
        <section className="skater-picker"><label htmlFor="skater">Editing progress for</label><select id="skater" value={selected} onChange={(e)=>setSelected(e.target.value)}>{skaters.map((skater)=><option value={skater.id} key={skater.id}>{skater.name} — {skater.profiles?.parent_name || skater.profiles?.email}</option>)}</select><div><ClipboardCheck/><span><b>{activeSkater?.name}</b><small>{activeSkater?.profiles?.email}</small></span></div></section>
        <section className="coach-tricks"><div className="coach-section-title"><div><p className="eyebrow"><span/> Main trick checklist</p><h2>Update the roadmap</h2></div><BellRing/><p>Saving automatically creates an in-app notification.</p></div>
          <div className="coach-trick-list">{progress.map((item)=><article key={item.trick_id}><div className="trick-name"><CheckCircle2/><b>{item.tricks?.name}</b></div><label>Status<select value={item.status} onChange={(e)=>edit(item.trick_id,{status:e.target.value})}><option value="not_started">Not started</option><option value="learning">Learning</option><option value="landed">Landed</option><option value="consistent">Consistent</option><option value="mastered">Mastered</option></select></label><label>Progress <b>{item.progress}%</b><input type="range" min="0" max="100" step="5" value={item.progress} onChange={(e)=>edit(item.trick_id,{progress:Number(e.target.value)})}/></label><button onClick={()=>save(item)}><Save size={16}/> Save trick</button></article>)}</div>
          <div className="coach-checklist-note"><div><p className="eyebrow"><span/> One note for this skater</p><h3>Checklist coach note</h3></div><label>Note<textarea value={checklistNote} onChange={(e)=>setChecklistNote(e.target.value)} placeholder="What improved? What should they work on next?"/></label><button onClick={saveChecklistNote}><Save size={16}/> Save coach note</button></div>
        </section></>}
      {message && <div className="coach-toast" role="status">{message}</div>}
    </div>
  </main>;
}
