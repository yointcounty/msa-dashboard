'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarPlus, Check, CheckCircle2, Download, LockKeyhole, MessageCircle, Share2, ShoppingBag, Smartphone, Trophy, X } from 'lucide-react';
import { getAccount, ParentAccount, signOut } from '../lib/auth';
import './dashboard.css';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

const trickProgress = [
  { trick: 'Drop-in', level: 'Learning', note: 'Working on commitment and front-foot pressure.', complete: 55 },
  { trick: 'Ollie', level: 'Consistent', note: 'Rolling ollies are landing more consistently.', complete: 82 },
  { trick: 'Kickflip', level: 'Not started', note: 'Unlocked after a consistent rolling ollie.', complete: 0 },
  { trick: 'Kickturn', level: 'Mastered', note: 'Strong control in both directions.', complete: 100 },
];

export default function Dashboard() {
  const router = useRouter();
  const [account, setAccount] = useState<ParentAccount | null>(null);
  const [toast, setToast] = useState('');
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const current = getAccount();
    if (!current) router.replace('/auth/login');
    else window.setTimeout(() => setAccount(current), 0);
    const capturePrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', capturePrompt);
    return () => window.removeEventListener('beforeinstallprompt', capturePrompt);
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
    <nav className="dash-nav"><Link href="/" className="brand-lockup"><span className="brand-mark">MSA</span><span><b>MIAMI SKATE</b><small>PARENT PORTAL</small></span></Link><div className="dash-user"><button className="install-nav-button" onClick={installApp}><Download size={16}/> Install app</button><span>{account.parentName}</span><button onClick={() => { signOut(); router.push('/'); }}>Sign out</button></div></nav>
    <div className="dash-main">
      <header className="dash-greeting"><div><p className="eyebrow"><span/> Family dashboard</p><h1>HEY, {account.parentName.split(' ')[0]}!</h1><p>Here&apos;s what&apos;s happening with {account.childName} at MSA.</p></div><button className="button button-small" onClick={() => notify('Your session request is ready for coach confirmation.')}>Book a session</button></header>
      <section className="install-app-card"><div className="install-app-icon"><Smartphone/></div><div><small>NEW</small><b>Take the MSA portal with you</b><span>Install it on your home screen for quick access to every update.</span></div><button className="button button-small" onClick={installApp}><Download size={17}/> Install</button></section>
      <section className="dashboard-grid">
        <div className="dash-card next-session"><h2>Next session</h2><div className="session-info"><div><div className="session-date">SAT 15</div><p>10:00 AM · Kendall Skatepark</p><b>{account.program}</b></div><CheckCircle2 size={48}/></div></div>
        <div className="dash-card"><h2>Enrollment</h2><p><b>{account.childName}</b></p><p>{account.program}</p><p className="muted">Active member · All set</p></div>
        <div className="dash-card trick-card"><div className="card-heading-row"><div><small>SKATER ROADMAP</small><h2>Main trick checklist</h2></div><Trophy/></div><div className="trick-list">{trickProgress.map((item) => <div className="trick-row" key={item.trick}><span className={`trick-check ${item.level === 'Mastered' ? 'done' : ''}`}>{item.level === 'Mastered' && <Check size={17}/>}</span><div className="trick-details"><div><b>{item.trick}</b><span className={`status-pill status-${item.level.toLowerCase().replace(' ', '-')}`}>{item.level}</span></div><p>{item.note}</p><div className="progress-bar"><span style={{ width: `${item.complete}%` }}/></div></div></div>)}</div><p className="coach-lock"><LockKeyhole size={15}/> Progress is updated by your MSA coach after sessions.</p></div>
        <div className="dash-card"><h2>Quick actions</h2><div className="quick-actions"><button onClick={() => notify('Coach message request noted.')}><MessageCircle size={20}/> Message coach</button><button onClick={() => notify('Calendar reminder added.')}><CalendarPlus size={20}/> Add reminder</button><button onClick={() => notify('All recent milestones are up to date.')}><CheckCircle2 size={20}/> View milestones</button><button onClick={() => window.open('https://www.yointcounty.com/collections/skate-lessons', '_blank')}><ShoppingBag size={20}/> MSA gear</button></div></div>
      </section>
    </div>
    {showInstallHelp && <div className="modal-backdrop" role="presentation" onClick={() => setShowInstallHelp(false)}><section className="install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close install instructions" onClick={() => setShowInstallHelp(false)}><X/></button><div className="install-app-icon"><Smartphone/></div><p className="eyebrow"><span/> Install MSA</p><h2 id="install-title">ADD IT TO YOUR HOME SCREEN.</h2>{isIos ? <ol><li>Tap the <b>Share</b> button <Share2 size={17}/>.</li><li>Scroll and choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol> : <ol><li>Open your browser menu.</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li><li>Confirm <b>Install</b>.</li></ol>}<p className="muted">The MSA icon will appear with your other apps and open directly to the portal.</p></section></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
