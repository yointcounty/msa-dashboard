'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, Check, Footprints, LogOut, MessageCircle, Send, Trophy } from 'lucide-react';
import { supabase } from './lib/supabase-browser';
import './checklist.css';

type Skater = { id: string; name: string };
type Skill = { trick_id: string; status: string; progress: number; coach_note: string; tricks: { name: string; sort_order: number; category?: 'super_beginner' | 'core' } | null };
type Note = { id: string; author_user_id: string; body: string; created_at: string };
type Notice = { id: string; message: string; created_at: string; is_read: boolean };
type Stance = 'not_set' | 'regular' | 'goofy';

const statusLabel = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export default function SkaterPortal() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [parentName, setParentName] = useState('Parent');
  const [skater, setSkater] = useState<Skater | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stance, setStance] = useState<Stance>('not_set');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase) { setMessage('The portal is not configured.'); setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth/login'); return; }
      const [{ data: profile }, { data: linkedSkater }] = await Promise.all([
        supabase.from('profiles').select('parent_name,email').eq('id', user.id).maybeSingle(),
        supabase.from('skaters').select('id,name').eq('parent_user_id', user.id).eq('active', true).order('created_at').limit(1).maybeSingle(),
      ]);
      if (!mounted) return;
      setUserId(user.id);
      setParentName(profile?.parent_name?.trim() || profile?.email?.split('@')[0] || 'Parent');
      setSkater(linkedSkater as Skater | null);
      if (!linkedSkater) { setLoading(false); return; }
      const [{ data: skillRows }, { data: noteRows }, { data: noticeRows }, { data: settings }] = await Promise.all([
        supabase.from('skater_tricks').select('trick_id,status,progress,coach_note,tricks(name,sort_order,category)').eq('skater_id', linkedSkater.id),
        supabase.from('skater_notes').select('id,author_user_id,body,created_at').eq('skater_id', linkedSkater.id).order('created_at', { ascending: true }).limit(50),
        supabase.from('notifications').select('id,message,created_at,is_read').eq('skater_id', linkedSkater.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('skater_settings').select('stance').eq('skater_id', linkedSkater.id).maybeSingle(),
      ]);
      if (!mounted) return;
      setSkills(((skillRows || []) as unknown as Skill[]).sort((a, b) => (a.tricks?.sort_order || 0) - (b.tricks?.sort_order || 0)));
      setNotes((noteRows || []) as Note[]);
      setNotices((noticeRows || []) as Notice[]);
      setStance((settings?.stance || 'not_set') as Stance);
      setLoading(false);
    }
    void load();
    return () => { mounted = false; };
  }, [router]);

  async function saveStance(value: Exclude<Stance, 'not_set'>) {
    if (!supabase || !skater) return;
    setStance(value);
    const { error } = await supabase.from('skater_settings').upsert({ skater_id: skater.id, stance: value, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'skater_id' });
    setMessage(error ? error.message : `Stance saved as ${value}.`);
  }

  async function sendNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !skater || !draft.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from('skater_notes').insert({ skater_id: skater.id, author_user_id: userId, body: draft.trim() }).select('id,author_user_id,body,created_at').single();
    if (error) setMessage(error.message); else { setNotes(items => [...items, data as Note]); setDraft(''); setMessage('Note sent to the coach.'); }
    setBusy(false);
  }

  async function signOut() { await supabase?.auth.signOut(); router.replace('/auth/login'); }
  if (loading) return <main className="check-loading">Opening skills checklist...</main>;

  const foundations = skills.filter(item => item.tricks?.category === 'super_beginner');
  const mainSkills = skills.filter(item => item.tricks?.category !== 'super_beginner');
  const renderSkills = (items: Skill[]) => items.map(item => <article className="check-skill" key={item.trick_id}>
    <span className={`check-circle ${item.status === 'mastered' || item.progress >= 100 ? 'complete' : ''}`}>{(item.status === 'mastered' || item.progress >= 100) && <Check size={17}/>}</span>
    <div><header><b>{item.tricks?.name || 'Skate skill'}</b><em>{statusLabel(item.status)}</em></header><p>{item.coach_note || 'Coach update coming after the next session.'}</p><div className="check-progress"><span style={{ width: `${item.progress}%` }}/></div></div>
  </article>);

  return <main className="check-portal">
    <nav className="check-nav"><div className="check-brand"><span>MSA</span><div><b>MIAMI SKATE</b><small>SKATER PORTAL</small></div></div><div><span>{parentName}</span><button onClick={signOut}><LogOut size={16}/> Sign out</button></div></nav>
    <section className="check-main">
      <header className="check-hero"><p>{skater?.name || 'Your skater'}&apos;s live roadmap</p><h1>SKILLS CHECKLIST.</h1><span>See what&apos;s learned, what&apos;s in progress, and what comes next.</span></header>
      {!skater ? <section className="check-card check-empty"><Trophy/><h2>No skater is linked yet.</h2><a href="mailto:jt@yointcounty.com?subject=Link%20my%20MSA%20skater">Contact the academy</a></section> : <div className="check-grid">
        <section className="check-card check-roadmap"><div className="check-title"><div><small>LIVE SKATER ROADMAP</small><h2>Skills checklist</h2></div><Trophy/></div>
          <div className="check-group"><div className="check-group-title"><span>01</span><div><b>Super beginner foundations</b><small>Foot position, kick-push, tic-tac, laps, turns and stopping.</small></div></div><div className="check-list">{renderSkills(foundations)}</div></div>
          <div className="check-group main"><div className="check-group-title"><span>02</span><div><b>Main trick checklist</b><small>The original MSA trick progression.</small></div></div><div className="check-list">{renderSkills(mainSkills)}</div></div>
        </section>
        <section className="check-card check-stance"><div className="check-title"><div><small>SKATER SETUP</small><h2>Stance</h2></div><Footprints/></div><p>Which foot feels natural at the front?</p><div><button className={stance === 'regular' ? 'selected' : ''} onClick={() => saveStance('regular')}><b>Regular</b><span>Left foot forward</span></button><button className={stance === 'goofy' ? 'selected' : ''} onClick={() => saveStance('goofy')}><b>Goofy</b><span>Right foot forward</span></button></div></section>
        <section className="check-card check-notes"><div className="check-title"><div><small>FAMILY + COACH</small><h2>Skater notes</h2></div><MessageCircle/></div><div className="check-thread">{notes.length ? notes.map(note => <article className={note.author_user_id === userId ? 'family' : ''} key={note.id}><header><b>{note.author_user_id === userId ? 'Your family' : 'MSA Coach'}</b><time>{new Date(note.created_at).toLocaleDateString()}</time></header><p>{note.body}</p></article>) : <p>No notes yet. Start the conversation with the coach.</p>}</div><form onSubmit={sendNote}><label htmlFor="note">Message the coach</label><textarea id="note" value={draft} onChange={event => setDraft(event.target.value)} maxLength={1200} required/><button disabled={busy || !draft.trim()}><Send size={16}/> {busy ? 'Sending...' : 'Send note'}</button></form></section>
        <section className="check-card check-updates"><div className="check-title"><div><small>COACH UPDATES</small><h2>Notifications</h2></div><Bell/></div>{notices.length ? notices.map(notice => <article key={notice.id}><span/><div><b>{notice.message}</b><small>{new Date(notice.created_at).toLocaleDateString()}</small></div></article>) : <p>No updates yet.</p>}</section>
      </div>}
    </section>
    {message && <div className="check-toast" role="status">{message}</div>}
  </main>;
}
