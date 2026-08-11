'use client';
import { Download, Share2, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
export default function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  useEffect(() => { const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); }; window.addEventListener('beforeinstallprompt', capture); return () => window.removeEventListener('beforeinstallprompt', capture); }, []);
  async function install() { if (!prompt) { setShowHelp(true); return; } await prompt.prompt(); await prompt.userChoice; setPrompt(null); }
  return <><button className={compact ? 'home-install-compact' : 'button home-install-button'} onClick={install}><Download size={compact ? 15 : 19}/> {compact ? 'Install app' : 'Install MSA app'}</button>{showHelp && <div className="modal-backdrop" role="presentation" onClick={() => setShowHelp(false)}><section className="install-modal" role="dialog" aria-modal="true" aria-labelledby="home-install-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close install instructions" onClick={() => setShowHelp(false)}><X/></button><div className="install-app-icon"><Smartphone/></div><p className="eyebrow"><span/> Install MSA</p><h2 id="home-install-title">ADD IT TO YOUR HOME SCREEN.</h2>{isIos ? <ol><li>Tap the <b>Share</b> button <Share2 size={17}/>.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol> : <ol><li>Open your browser menu.</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li><li>Confirm <b>Install</b>.</li></ol>}</section></div>}</>;
}
