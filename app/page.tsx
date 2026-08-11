'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Check, ChevronRight, CloudUpload, Image as ImageIcon, LayoutDashboard, LogOut, Menu, MessageCircle, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from './lib/supabase-browser';

type Skater = { id: string; name: string; active: boolean };
type Trick = { trick_id: string; status: string; progress: number; coach_note: string; tricks: { name: string; sort_order: number } | null };
type Note = { id: string; body: string; created_at: string };
type Notice = { id: string; message: string; created_at: string; is_read: boolean };
type MediaCard = { title: string; src: string; date: string };

const mediaCards: MediaCard[] = [
  { title: 'Academy session', src: '/media/3-Photo-3.jpg', date: 'Miami Skate Academy' },
  { title: 'Park crew', src: '/media/1-Photo-1.jpg', date: 'Miami Skate Academy' },
  { title: 'Finding the line', src: '/media/8-Photo-8.jpg', date: 'Miami Skate Academy' },
  { title: 'Skatepark practice', src: '/media/7-Photo-7.jpg', date: 'Miami Skate Academy' },
];

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';
}

function displayDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState('Overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [parentName, setParentName] = useState('Parent');
  const [skater, setSkater] = useState<Skater | null>(null);
  const [tricks, setTricks] = useState<Trick[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth/login'); return; }

      const [{ data: profile }, { data: linkedSkater, error: skaterError }] = await Promise.all([
        supabase.from('profiles').select('parent_name,email').eq('id', user.id).maybeSingle(),
        supabase.from('skaters').select('id,name,active').eq('parent_user_id', user.id).eq('active', true).order('created_at', { ascending: true }).limit(1).maybeSingle(),
      ]);
      if (!mounted) return;
      setParentName(String(profile?.parent_name?.trim() || profile?.email?.split('@')[0] || user.email?.split('@')[0] || 'Parent'));
      if (skaterError) setError(skaterError.message);
      if (!linkedSkater) { setLoading(false); return; }
      setSkater(linkedSkater as Skater);

      const [{ data: trickRows }, { data: noteRows }, { data: noticeRows }] = await Promise.all([
        supabase.from('skater_tricks').select('trick_id,status,progress,coach_note,tricks(name,sort_order)').eq('skater_id', linkedSkater.id),
        supabase.from('skater_notes').select('id,body,created_at').eq('skater_id', linkedSkater.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('notifications').select('id,message,created_at,is_read').eq('skater_id', linkedSkater.id).order('created_at', { ascending: false }).limit(6),
      ]);
      if (!mounted) return;
      setTricks(((trickRows || []) as unknown as Trick[]).sort((a, b) => (a.tricks?.sort_order || 0) - (b.tricks?.sort_order || 0)));
      setNotes((noteRows || []) as Note[]);
      setNotices((noticeRows || []) as Notice[]);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [router]);

  const completed = tricks.filter((item) => item.status === 'mastered' || item.progress >= 100).length;
  const progress = tricks.length ? Math.round(tricks.reduce((sum, item) => sum + item.progress, 0) / tricks.length) : 0;
  const nextTrick = tricks.find((item) => item.status !== 'mastered' && item.progress < 100);
  const latestNote = notes[0];
  const coachNote = latestNote?.body || tricks.find((item) => item.coach_note)?.coach_note || 'Your coach will add an update after the next session.';
  const skillLevel = progress >= 70 ? 'Advanced' : progress >= 35 ? 'Intermediate' : 'Beginner';
  const nav = [['Overview', LayoutDashboard], ['Progress', Trophy], ['Updates', Bell], ['Photos', ImageIcon]] as const;
  const updates = useMemo(() => notices.length ? notices : notes.map((note) => ({ id: note.id, message: note.body, created_at: note.created_at, is_read: true })), [notices, notes]);

  function goTo(section: string) {
    setActive(section);
    const id = section === 'Overview' ? 'overview-section' : section.toLowerCase() + '-section';
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    router.replace('/auth/login');
  }

  if (loading) return <div className="loading-screen"><div className="brand-mark"><Zap size={19} fill="currentColor" /></div><p>Loading your skater’s portal…</p></div>;

  return (
    <main className="app-shell">
      <aside className={'sidebar ' + (menuOpen ? 'open' : '')}>
        <div className="brand"><div className="brand-mark"><Zap size={18} fill="currentColor" /></div><div><strong>MIAMI SKATE</strong><span>ACADEMY</span></div></div>
        <div className="parent-chip"><div className="avatar small">{initials(parentName)}</div><div><span>Parent portal</span><strong>{parentName}</strong></div></div>
        <nav>{nav.map(([label, Icon]) => <button key={label} className={active === label ? 'active' : ''} onClick={() => goTo(label)}><Icon size={18} /><span>{label}</span>{label === 'Updates' && updates.length > 0 && <i>{updates.length}</i>}</button>)}</nav>
        <div className="sidebar-bottom"><a className="sidebar-link" href="mailto:jt@yointcounty.com?subject=MSA%20parent%20portal"><MessageCircle size={18} />Contact coach</a><button onClick={signOut}><LogOut size={18} />Sign out</button></div>
      </aside>

      <section className="content" id="overview-section">
        <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></button><div><p className="eyebrow">PARENT PORTAL · {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</p><h1>Good morning, {parentName} <span>✦</span></h1></div><div className="top-actions"><button className="icon-button" aria-label="View updates" onClick={() => goTo('Updates')}><Bell size={19} />{updates.length > 0 && <b />}</button><div className="avatar">{initials(parentName)}</div></div></header>

        <div className="child-switcher"><div className="child-info"><div className="avatar child">{skater ? initials(skater.name) : '?'}</div><div><span>Current skater</span><strong>{skater ? skater.name : 'No skater linked'}</strong></div></div><span className="child-count">{skater ? 'Active' : 'Needs setup'}</span></div>

        {!skater && <section className="empty-state card"><div className="empty-icon"><Trophy size={22} /></div><h2>No skater profile is linked yet</h2><p>{error || 'Ask the academy to connect your child to this parent email.'}</p><a className="primary-button" href="mailto:jt@yointcounty.com?subject=Link%20my%20skater%20to%20the%20MSA%20portal">Contact the academy <ChevronRight size={15} /></a></section>}

        <div className="hero-grid"><section className="welcome-card card"><div className="hero-copy"><div className="tag"><Sparkles size={13} /> THIS WEEK</div><h2>{skater ? <>Keep rolling,<br /><span>{skater.name}!</span></> : <>Welcome to<br /><span>MSA Portal</span></>}</h2><p>{skater ? 'Your progress, coach notes, and academy memories in one simple place.' : 'Your parent portal is ready for your skater profile.'}</p><button className="primary-button" onClick={() => goTo('Progress')}>View progress <ChevronRight size={15} /></button></div><div className="hero-art"><Image fill sizes="(max-width: 700px) 100vw, 35vw" src="/media/3-Photo-3.jpg" alt="Miami Skate Academy skater" /></div></section><section className="progress-card card"><div className="section-heading"><div><span className="muted-label">OVERALL PROGRESS</span><h3>{skillLevel} level</h3></div><div className="progress-number">{progress}<span>%</span></div></div><div className="progress-track"><div style={{ width: progress + '%' }} /></div><div className="progress-meta"><span><Trophy size={14} /> {completed} mastered</span><span>{tricks.length} total skills</span></div><div className="mini-achievement"><div className="medal"><Target size={17} /></div><div><strong>{nextTrick?.tricks?.name || 'All current skills mastered'}</strong><span>{nextTrick ? 'Current focus' : 'Keep building consistency'}</span></div></div></section></div>

        <SectionTitle label="YOUR SKATER" title="Progress snapshot" action="See progress" onClick={() => goTo('Progress')} /><section className="snapshot-grid" id="progress-section"><section className="card skills-card"><div className="card-title"><div><h3>Skills tracker</h3><span>{completed} of {tricks.length || 0} skills mastered</span></div><div className="circle-progress">{completed}<small>/ {tricks.length || 0}</small></div></div><div className="skills-list">{tricks.length ? tricks.map((item) => <div className="skill-row" key={item.trick_id}><div className={'skill-check ' + (item.status === 'mastered' || item.progress >= 100 ? 'done' : '')}>{(item.status === 'mastered' || item.progress >= 100) && <Check size={12} />}</div><span>{item.tricks?.name || 'Skate skill'}</span><small>{item.progress}%</small></div>) : <p className="empty-copy">Skills will appear after your coach sets up the roadmap.</p>}</div></section><section className="card focus-card" id="updates-section"><div className="card-title"><div><h3>Coach note</h3><span>{latestNote ? 'Updated ' + displayDate(latestNote.created_at) : 'Coach updates'}</span></div><Target className="accent-icon" size={21} /></div><div className="focus-main"><div className="focus-icon"><Zap size={20} /></div><div><h4>{nextTrick?.tricks?.name || 'Keep practicing'}</h4><p>{coachNote}</p></div></div><div className="focus-tags"><span>{nextTrick ? 'Current focus' : 'Coach update'}</span></div></section></section>

        <SectionTitle label="COACH UPDATES" title="Recent updates" action="View updates" onClick={() => goTo('Updates')} /><section className="card sessions-card" id="updates-list-section">{updates.length ? updates.slice(0, 4).map((item) => <div className="session-row" key={item.id}><div className="date-badge"><Bell size={16} /></div><div className="session-info"><h4>{item.message}</h4><span>{displayDate(item.created_at)}</span></div></div>) : <p className="empty-copy session-empty">No updates yet. Your coach will add notes here after sessions.</p>}</section>

        <div className="section-title media-heading" id="photos-section"><div><span className="muted-label">ACADEMY MEMORIES</span><h2>Photos</h2></div><a className="upload-button" href="mailto:jt@yointcounty.com?subject=Add%20photos%20to%20the%20MSA%20portal"><CloudUpload size={15} /> Ask coach to add photos</a></div><div className="media-grid">{mediaCards.map((item) => <div className="media-tile" key={item.title}><div className="media-art"><Image fill sizes="(max-width: 700px) 50vw, 25vw" src={item.src} alt={item.title} /></div><div className="media-caption"><div><strong>{item.title}</strong><span>{item.date}</span></div></div></div>)}</div>
        <footer>Miami Skate Academy <span>·</span> Keep rolling.</footer>
      </section>
    </main>
  );
}

function SectionTitle({ label, title, action, onClick }: { label: string; title: string; action: string; onClick: () => void }) {
  return <div className="section-title"><div><span className="muted-label">{label}</span><h2>{title}</h2></div><button className="text-button" onClick={onClick}>{action} <ChevronRight size={14} /></button></div>;
}
