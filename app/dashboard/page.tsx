'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, CalendarPlus, Check, CheckCircle2, Download, LockKeyhole, MessageCircle, Share2, ShoppingBag, Smartphone, Trophy, X } from 'lucide-react';
import { getAccount, ParentAccount, signOut } from '../lib/auth';
import { supabase } from '../lib/supabase';
import './dashboard.css';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

type ProgressItem = { trick_id: string; status: string; progress: number; coach_note: string; tricks: { name: string; sort_order: number } | null };
type Notice = { id: string; message: string; created_at: string; is_read: boolean };
const labelStatus = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Dashboard() {
  const router = useRouter();
  const [account, setAccount] = useState<ParentAccount | null>(null);
  const [trickProgress, setTrickProgress] = useState<ProgressItem[]>([]);
  const [notifications, setNotifications] = useState<Notice[]>([]);
  const [toast, setToast] = useState('');
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    let active = true;
    async function load() {
      const current = await getAccount();
      if (!current) { router.replace('/auth/login'); return; }
      if (!active) return;
      setAccount(current);
      const [{ data: progress }, { data: notices }] = await Promise.all([
        supabase.from('skater_tricks').select('trick_id, status, progress, coach_note, tricks(name, sort_order)').eq('skater_id', current.skaterId),
        supabase.from('notifications').select('id, message, created_at, is_read').order('created_at', { ascending: false }).limit(6),
      ]);
      if (active) {
        setTrickProgress(((progress || []) as unknown as ProgressItem[]).sort((a,b)=>(a.tricks?.sort_order || 0)-(b.tricks?.sort_order || 0)));
        setNotifications((notices || []) as Notice[]);
      }
    }
    load();
    const channel = supabase.channel('family-dashboard').on('postgres_changes', { event: '*', schema: 'public', table: 'skater_tricks' }, load).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, load).subscribe();
    const capturePrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', capturePrompt);
    return () => { active = false; window.removeEventListener('beforeinstallprompt', capturePrompt); supabase.removeChannel(channel); };
  }, [router]);

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2600); }
  async function installApp() {
    if (!installPrompt) { setShowInstallHelp(true); return; }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') notify('MSA Skater Portal was added to your device.');
    setInstallPrompt(null);
  }
  if (!account) return null;

  return <main className="dashboard">
    <nav className="dash-nav"><Link href="/" className="brand-lockup"><span className="brand-mark">MSA</span><span><b>MIAMI SKATE</b><small>SKATER PORTAL</small></span></Link><div className="dash-user"><button className="install-nav-button" onClick={installApp}><Download size={16}/> Install app</button><span>{account.parentName}</span><button onClick={async () => { await signOut(); router.push('/'); }}>Sign out</button></div></nav>
    <div className="dash-main">
      <header className="dash-greeting"><div><p className="eyebrow"><span/> Family dashboard</p><h1>HEY, {account.parentName.split(' ')[0]}!</h1><p>Here&apos;s what&apos;s happening with {account.childName} at MSA.</p></div><button className="button button-small" onClick={() => notify('Your session request is ready for coach confirmation.')}>Book a session</button></header>
      <section className="install-app-card"><div className="install-app-icon"><Smartphone/></div><div><small>NEW</small><b>Take the MSA portal with you</b><span>Install it on your home screen for quick access to every update.</span></div><button className="button button-small" onClick={installApp}><Download size={17}/> Install</button></section>
      <section className="dashboard-grid">
        <div className="dash-card next-session"><h2>Next session</h2><div className="session-info"><div><div className="session-date">SAT 15</div><p>10:00 AM · Kendall Skatepark</p><b>MSA Member Session</b></div><CheckCircle2 size={48}/></div></div>
        <div className="dash-card"><h2>Skater profile</h2><p><b>{account.childName}</b></p><p className="muted">Active MSA member · All set</p></div>
        <div className="dash-card trick-card"><div className="card-heading-row"><div><small>LIVE SKATER ROADMAP</small><h2>Main trick checklist</h2></div><Trophy/></div><div className="trick-list">{trickProgress.map((item) => { const level=labelStatus(item.status); return <div className="trick-row" key={item.trick_id}><span className={`trick-check ${item.status === 'mastered' ? 'done' : ''}`}>{item.status === 'mastered' && <Check size={17}/>}</span><div className="trick-details"><div><b>{item.tricks?.name}</b><span className={`status-pill status-${item.status.replace('_', '-')}`}>{level}</span></div><p>{item.coach_note || 'Your coach will add an update after your next session.'}</p><div className="progress-bar"><span style={{ width: `${item.progress}%` }}/></div></div></div>})}</div><p className="coach-lock"><LockKeyhole size={15}/> Progress is updated live by your MSA coach after sessions.</p></div>
        <div className="dash-card notification-card"><div className="card-heading-row"><div><small>COACH UPDATES</small><h2>Notifications</h2></div><Bell/></div>{notifications.length ? <div className="notification-list">{notifications.map((notice)=><div className={`notification-row ${notice.is_read ? '' : 'unread'}`} key={notice.id}><span/><div><b>{notice.message}</b><small>{new Date(notice.created_at).toLocaleDateString()}</small></div></div>)}</div> : <p className="muted">New coach updates will appear here automatically.</p>}</div>
        <div className="dash-card"><h2>Quick actions</h2><div className="quick-actions"><button onClick={() => notify('Coach message request noted.')}><MessageCircle size={20}/> Message coach</button><button onClick={() => notify('Calendar reminder added.')}><CalendarPlus size={20}/> Add reminder</button><button onClick={() => notify('All recent milestones are up to date.')}><CheckCircle2 size={20}/> View milestones</button><button onClick={() => window.open('https://www.yointcounty.com/collections/skate-lessons', '_blank')}><ShoppingBag size={20}/> MSA gear</button></div></div>
      </section>
    </div>
    {showInstallHelp && <div className="modal-backdrop" role="presentation" onClick={() => setShowInstallHelp(false)}><section className="install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close install instructions" onClick={() => setShowInstallHelp(false)}><X/></button><div className="install-app-icon"><Smartphone/></div><p className="eyebrow"><span/> Install MSA</p><h2 id="install-title">ADD IT TO YOUR HOME SCREEN.</h2>{isIos ? <ol><li>Tap the <b>Share</b> button <Share2 size={17}/>.</li><li>Scroll and choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol> : <ol><li>Open your browser menu.</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li><li>Confirm <b>Install</b>.</li></ol>}<p className="muted">The MSA icon will appear with your other apps and open directly to the portal.</p></section></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
