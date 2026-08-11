'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CloudUpload,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  Zap,
  Play,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from './lib/supabase-browser';

type Child = { id: string; name: string; age: number; skill_level: string; progress: number };
type Skill = { id: string; name: string; completed: boolean };
type Session = { id: string; session_date: string; location: string; coach: string; notes?: string | null };
type Goal = { id: string; title: string; description?: string | null; week_start: string };
type MediaItem = { id: string; storage_path: string; kind: string; caption?: string | null; created_at: string };

type MediaCard = { title: string; src: string; type: string; date: string };

const fallbackMedia: MediaCard[] = [
  { title: 'Academy highlight', src: '/media/3-Photo-3.jpg', type: 'photo', date: 'Academy highlight' },
  { title: 'Park session', src: '/media/1-Photo-1.jpg', type: 'photo', date: 'Academy highlight' },
  { title: 'Finding the line', src: '/media/8-Photo-8.jpg', type: 'photo', date: 'Academy highlight' },
];

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';
}

function displayDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function dateParts(date: string) {
  const parsed = new Date(date + 'T12:00:00');
  return {
    day: parsed.getDate().toString().padStart(2, '0'),
    weekday: parsed.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
  };
}

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState('Overview');
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const [parentName, setParentName] = useState('Parent');
  const [child, setChild] = useState<Child | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      if (!supabase) {
        setLoadError('Supabase is not configured.');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const safeParentName = String(user.user_metadata?.parent_name || user.email?.split('@')[0] || 'Parent');
      if (!mounted) return;
      setParentName(safeParentName);

      const { data: linkedChild, error: childError } = await supabase
        .from('children')
        .select('id,name,age,skill_level,progress')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;
      if (childError) setLoadError(childError.message);
      if (!linkedChild) {
        setLoading(false);
        return;
      }

      setChild(linkedChild as Child);
      const [skillsResult, sessionsResult, goalsResult, mediaResult] = await Promise.all([
        supabase.from('skills').select('id,name,completed').eq('child_id', linkedChild.id).order('name'),
        supabase.from('sessions').select('id,session_date,location,coach,notes').eq('child_id', linkedChild.id).order('session_date', { ascending: false }).limit(8),
        supabase.from('goals').select('id,title,description,week_start').eq('child_id', linkedChild.id).order('week_start', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('media').select('id,storage_path,kind,caption,created_at').eq('child_id', linkedChild.id).order('created_at', { ascending: false }).limit(12),
      ]);

      if (!mounted) return;
      setSkills((skillsResult.data || []) as Skill[]);
      setSessions((sessionsResult.data || []) as Session[]);
      setGoal((goalsResult.data || null) as Goal | null);
      setMedia((mediaResult.data || []) as MediaItem[]);
      setLoading(false);
    }

    loadDashboard();
    return () => { mounted = false; };
  }, [router]);

  const completed = skills.filter((skill) => skill.completed).length;
  const totalSkills = skills.length;
  const progress = child?.progress ?? (totalSkills ? Math.round((completed / totalSkills) * 100) : 0);
  const latestSession = sessions[0];
  const coachNote = goal?.description || latestSession?.notes || 'Your coach will add a note after the next session.';
  const focusTitle = goal?.title || 'Your next focus';
  const nav = [['Overview', LayoutDashboard], ['Progress', Trophy], ['Sessions', CalendarDays], ['Media', ImageIcon], ['Goals', Target]] as const;

  const mediaCards = useMemo<MediaCard[]>(() => {
    if (!media.length) return child ? fallbackMedia : [];
    return media.map((item) => ({
      title: item.caption || 'Session memory',
      src: supabase?.storage.from('media').getPublicUrl(item.storage_path).data.publicUrl || '',
      type: item.kind,
      date: displayDate(item.created_at.slice(0, 10)),
    }));
  }, [media, child]);

  const goTo = (section: string) => {
    setActive(section);
    if (section !== 'Overview') {
      document.getElementById(section.toLowerCase() + '-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !child || !supabase) return;
    setUploading(true);
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
    const path = `${child.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { upsert: false });
    if (uploadError) {
      setUploading(false);
      notify('Upload failed. Please try again or ask your coach to add the media.');
      return;
    }
    const { data, error: mediaError } = await supabase.from('media').insert({
      child_id: child.id,
      storage_path: path,
      kind: file.type.startsWith('video/') ? 'video' : 'photo',
      caption: file.name.replace(/\.[^.]+$/, ''),
    }).select('id,storage_path,kind,caption,created_at').single();
    setUploading(false);
    if (mediaError || !data) {
      notify('The file uploaded, but could not be added to the gallery.');
      return;
    }
    setMedia((current) => [data as MediaItem, ...current]);
    notify('Media added to your skater gallery.');
  }

  async function signOut() {
    await supabase?.auth.signOut();
    router.replace('/auth/login');
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="brand-mark"><Zap size={19} fill="currentColor" /></div>
        <p>Loading your skater’s portal…</p>
      </div>
    );
  }

  return (
    <main className="app-shell">
      <aside className={'sidebar ' + (open ? 'open' : '')}>
        <div className="brand"><div className="brand-mark"><Zap size={18} fill="currentColor" /></div><div><strong>MIAMI SKATE</strong><span>ACADEMY</span></div></div>
        <div className="parent-chip"><div className="avatar small">{initials(parentName)}</div><div><span>Parent portal</span><strong>{parentName}</strong></div><ChevronRight size={15} /></div>
        <nav>{nav.map(([label, Icon]) => <button key={label} className={active === label ? 'active' : ''} onClick={() => { goTo(label); setOpen(false); }}><Icon size={18} /><span>{label}</span>{label === 'Media' && mediaCards.length > 0 && <i>{mediaCards.length}</i>}</button>)}</nav>
        <div className="sidebar-bottom"><a className="sidebar-link" href="mailto:jt@yointcounty.com?subject=MSA%20parent%20portal"><MessageCircle size={18} />Contact coach</a><button onClick={signOut}><LogOut size={18} />Sign out</button></div>
      </aside>

      <section className="content" id="overview-section">
        <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setOpen(!open)}><Menu size={20} /></button><div><p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</p><h1>Good morning, {parentName} <span>✦</span></h1></div><div className="top-actions"><button className="icon-button" aria-label="View notifications" onClick={() => notify('No new coach updates right now.')}><Bell size={19} /></button><div className="avatar">{initials(parentName)}</div></div></header>

        <div className="child-switcher"><div className="child-info"><div className="avatar child">{child ? initials(child.name) : '?'}</div><div><span>Tracking progress for</span><strong>{child ? child.name : 'No skater linked'} {child && <em>Age {child.age}</em>}</strong></div></div><span className="child-count">{child ? '1 skater' : 'No skater'}</span></div>

        {!child && <section className="empty-state card"><div className="empty-icon"><UsersIcon /></div><h2>Your skater profile is being connected</h2><p>{loadError || 'No child profile is linked to this parent account yet.'}</p><a className="primary-button" href="mailto:jt@yointcounty.com?subject=Link%20my%20skater%20to%20the%20MSA%20portal">Contact the academy <ChevronRight size={15} /></a></section>}

        <div className="hero-grid"><section className="welcome-card card"><div className="hero-copy"><div className="tag"><Sparkles size={13} /> THIS WEEK</div><h2>{child ? <>Keep rolling,<br /><span>{child.name}!</span></> : <>Welcome to<br /><span>MSA Portal</span></>}</h2><p>{child ? 'Small pushes make big progress. ' + child.name + ' is building confidence every session.' : 'Your parent portal is ready. Your coach will add a skater profile here soon.'}</p><button className="primary-button" onClick={() => goTo('Progress')}>View full progress <ChevronRight size={15} /></button></div><div className="hero-art"><img onError={(event) => { event.currentTarget.style.display = 'none'; }} src={child ? '/media/3-Photo-3.jpg' : '/media/1-Photo-1.jpg'} alt="Skate academy session" /><div className="hero-overlay" /></div></section><section className="progress-card card"><div className="section-heading"><div><span className="muted-label">OVERALL PROGRESS</span><h3>{child ? 'Level · ' + child.skill_level : 'Waiting for profile'}</h3></div><div className="progress-number">{progress}<span>%</span></div></div><div className="progress-track"><div style={{ width: progress + '%' }} /></div><div className="progress-meta"><span><Trophy size={14} /> {completed} skills mastered</span><span>{totalSkills ? Math.max(totalSkills - completed, 0) + ' to next level' : 'No skills added yet'}</span></div><div className="mini-achievement"><div className="medal"><Trophy size={17} /></div><div><strong>{latestSession ? 'Latest session logged' : 'Your first milestone is waiting'}</strong><span>{latestSession ? displayDate(latestSession.session_date) : 'Complete a session to begin'}</span></div></div></section></div>

        <SectionTitle label="YOUR CHILD" title="Progress snapshot" action="See all progress" onClick={() => goTo('Progress')} /><div className="snapshot-grid" id="progress-section"><section className="card skills-card"><div className="card-title"><div><h3>Skills tracker</h3><span>{totalSkills ? completed + ' of ' + totalSkills + ' skills completed' : 'No skills added yet'}</span></div><div className="circle-progress">{completed}<small>/ {totalSkills || 0}</small></div></div><div className="skills-list">{skills.length ? skills.map((skill) => <div className="skill-row" key={skill.id}><div className={'skill-check ' + (skill.completed ? 'done' : '')}>{skill.completed && <Check size={12} />}</div><span className={skill.completed ? '' : 'up-next'}>{skill.name}</span>{!skill.completed && <small>UP NEXT</small>}</div>) : <p className="empty-copy">Your coach will add skills after the first session.</p>}</div></section><section className="card focus-card" id="goals-section"><div className="card-title"><div><h3>Coach note</h3><span>{goal ? 'Updated ' + displayDate(goal.week_start) + ' by your coach' : 'Updated after each session'}</span></div><Target className="accent-icon" size={21} /></div><div className="focus-main"><div className="focus-icon"><Zap size={20} /></div><div><h4>{focusTitle}</h4><p>{coachNote}</p></div></div><div className="focus-tags"><span>{goal ? 'Weekly goal' : 'Coach update pending'}</span></div><button className="outline-button" onClick={() => goTo('Goals')}>View weekly goals <ChevronRight size={15} /></button></section></div>

        <SectionTitle label="RECENT ACTIVITY" title="Session history" action="View all sessions" onClick={() => goTo('Sessions')} /><section className="card sessions-card" id="sessions-section">{sessions.length ? sessions.map((session) => { const date = dateParts(session.session_date); return <div className="session-row" key={session.id}><div className="date-badge"><strong>{date.day}</strong><span>{date.weekday}</span></div><div className="session-info"><h4>{session.location}</h4><span>{session.coach} · {displayDate(session.session_date)}</span></div></div>; }) : <p className="empty-copy session-empty">No sessions have been logged yet.</p>}</section>

        <div className="section-title media-heading"><div><span className="muted-label">MEMORIES</span><h2>Latest media</h2></div><label className={'upload-button ' + (uploading ? 'is-uploading' : '')}><CloudUpload size={15} /> {uploading ? 'Uploading…' : 'Upload media'}<input type="file" accept="image/*,video/*" disabled={uploading || !child} onChange={handleUpload} /></label></div><div className="media-grid" id="media-section">{mediaCards.length ? mediaCards.map((item, index) => <div className="media-tile" key={item.title + '-' + index}><div className="media-art">{item.type === 'video' ? <video src={item.src} controls playsInline preload="metadata" aria-label={item.title} /> : <img onError={(event) => { event.currentTarget.style.display = 'none'; }} src={item.src} alt={item.title} />}{item.type === 'video' && !item.src && <div className="play"><Play size={17} fill="white" /></div>}</div><div className="media-caption"><div><strong>{item.title}</strong><span>{item.date}</span></div></div></div>) : <p className="empty-copy">Media will appear after your first session.</p>}</div>
        <footer>Miami Skate Academy <span>·</span> Helping young skaters find their flow.</footer>
        {toast && <div className="toast" role="status">{toast}</div>}
      </section>
    </main>
  );
}

function SectionTitle({ label, title, action, onClick }: { label: string; title: string; action: string; onClick: () => void }) {
  return <div className="section-title"><div><span className="muted-label">{label}</span><h2>{title}</h2></div><button className="text-button" onClick={onClick}>{action} <ChevronRight size={14} /></button></div>;
}

function UsersIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
