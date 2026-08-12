'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronDown, Menu, ShieldCheck, Smartphone, Sparkles, Trophy, Users, X } from 'lucide-react';
import InstallAppButton from './install-app';
import { getAccount, ParentAccount } from './lib/auth';
import './home-app.css';

const faqs = [
  ['Is MSA beginner-friendly?', 'Absolutely. Coaches meet each skater at their current level and focus first on safety, balance, board control, and confidence.'],
  ['Where do lessons happen?', 'Lessons can take place at local skateparks, nearby public parks, or an appropriate home practice area across Miami, Hollywood, and nearby South Florida communities.'],
  ['What can skaters and parents track?', 'The private dashboard brings upcoming sessions, trick checklists, progress milestones, and coach notes into one easy place.'],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [account, setAccount] = useState<ParentAccount | null>(null);

  useEffect(() => { void getAccount().then(setAccount); }, []);

  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <Link href="/" className="brand-lockup" aria-label="Miami Skate Academy home">
          <span className="brand-mark">MSA</span>
          <span><b>MIAMI SKATE</b><small>ACADEMY</small></span>
        </Link>
        <div className="desktop-nav">
          <a href="#programs">Programs</a><a href="#app">Progress</a><a href="#families">For families</a><a href="#faq">FAQ</a>
        </div>
        <div className="nav-actions">
          <InstallAppButton compact/><Link href="/coach" className="coach-nav-link">Coach sign in</Link><Link href={account ? '/dashboard' : '/auth/login'} className="text-link">{account ? `${account.childName}'s profile` : 'Member sign in'}</Link>
          <Link href={account ? '/dashboard' : '/auth/signup'} className="button button-small">{account ? 'Open dashboard' : 'Activate access'} <ArrowRight size={16}/></Link>
        </div>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>{menuOpen ? <X/> : <Menu/>}</button>
      </nav>
      {menuOpen && <div className="mobile-menu"><a href="#programs" onClick={() => setMenuOpen(false)}>Programs</a><a href="#app" onClick={() => setMenuOpen(false)}>Progress</a><a href="#families" onClick={() => setMenuOpen(false)}>For families</a><a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a><Link href="/coach" className="coach-nav-link">Coach sign in</Link><Link href={account ? '/dashboard' : '/auth/login'}>{account ? `${account.childName}'s profile` : 'Member sign in'}</Link><Link href={account ? '/dashboard' : '/auth/signup'} className="button">{account ? 'Open dashboard' : 'Activate access'}</Link></div>}

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span/> Private member portal</p>
          <h1>YOUR SKATE<br/>PROGRESS.<br/><em>ALL HERE.</em></h1>
          <p className="hero-lede">A private home for enrolled MSA skaters and families to follow tricks, coach updates, milestones, and upcoming sessions.</p>
          <div className="hero-actions">
            <Link href={account ? '/dashboard' : '/auth/login'} className="button">{account ? 'Open skater profile' : 'Member sign in'} <ArrowRight size={19}/></Link>
            <InstallAppButton/>
          </div>
          <div className="trust-row"><div className="avatar-stack"><span>JT</span><span>MSA</span><span>YC</span></div><p><b>100+ Enrolled Members</b><small>Growing stronger, one session at a time</small></p></div>
        </div>
        <div className="hero-media">
          <Image src="/images/msa-real-hero.jpg" alt="Real Miami Skate Academy coaching and skater experiences" fill priority sizes="(max-width: 900px) 100vw, 50vw"/>
          <div className="hero-sticker"><Trophy size={24}/><b>SKATE.<br/>GROW.<br/>BELONG.</b></div>
          <div className="session-card"><span className="pulse"/><div><small>NEXT UP</small><b>Weekend Team Session</b><span>Saturday · 10:00 AM</span></div><CalendarDays size={24}/></div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Academy highlights">
        <div><strong>100+</strong><span>ENROLLED MEMBERS</span></div><div><strong>4:1</strong><span>GROUP COACH RATIO</span></div><div><strong>3</strong><span>SOUTH FLORIDA AREAS</span></div><div><strong>ALL</strong><span>SKILL LEVELS WELCOME</span></div>
      </section>

      <section className="programs-section" id="programs"><div className="programs-intro"><p className="eyebrow"><span /> Choose your next step</p><h2>ONE CLEAR<br /><em>PATH FORWARD.</em></h2><p>Start where your skater is today. We build confidence first, then turn small wins into a repeatable progression.</p><a className="button button-dark" href="sms:+17863947314?body=Hi%20JT%2C%20I%27d%20like%20to%20find%20the%20right%20MSA%20program%20for%20my%20skater.">Find the right fit <ArrowRight size={18} /></a></div><div className="program-grid"><article><CalendarDays /><small>START HERE</small><h3>First Ride</h3><p>A relaxed first session to learn safety, board feel, and the right next step.</p></article><article><Trophy /><small>BUILD FOUNDATIONS</small><h3>MSA Foundations</h3><p>A focused multi-week path with weekly goals and a coach update after every session.</p></article><article><Users /><small>KEEP PROGRESSING</small><h3>Progress Membership</h3><p>Consistent coaching, portal access, and a clear roadmap that stays with your family.</p></article><article><Sparkles /><small>MAKE IT MEMORABLE</small><h3>Camps & Clinics</h3><p>School-break sessions, creative skate activities, and skill-focused clinics for growing skaters.</p></article></div></section>

      <section className="app-preview-section" id="app">
        <div className="app-preview-copy"><p className="eyebrow"><span/> The MSA skater app</p><h2>EVERY TRICK.<br/><em>EVERY WIN.</em></h2><p>Install the private portal and see exactly what your skater is learning—from the first drop-in to a clean kickflip. Coaches update progress after sessions; families celebrate the climb.</p><InstallAppButton/></div>
        <div className="phone-preview"><div className="phone-top"><span className="brand-mark">MSA</span><small>ALEX’S ROADMAP</small><Smartphone/></div><h3>MAIN TRICK CHECKLIST</h3><div className="preview-tricks"><div className="preview-trick"><span className="preview-check done"><Check size={17}/></span><span><b>Kickturn</b><small>Strong control both ways</small></span><span className="preview-status green">Mastered</span></div><div className="preview-trick"><span className="preview-check"/><span><b>Ollie</b><small>Rolling ollies are landing</small></span><span className="preview-status green">Consistent</span></div><div className="preview-trick"><span className="preview-check"/><span><b>Drop-in</b><small>Building commitment</small></span><span className="preview-status">Learning</span></div><div className="preview-trick"><span className="preview-check"/><span><b>Kickflip</b><small>Next milestone</small></span><span className="preview-status">Not started</span></div></div></div>
        <div className="app-badge">INSTALL<br/>THE APP</div>
      </section>

      <section className="family-section" id="families">
        <div className="family-photo"><Image src="/images/msa-real-family.jpg" alt="Miami Skate Academy skaters together at the skatepark" fill sizes="(max-width: 900px) 100vw, 48vw"/><div className="photo-caption"><Sparkles/><span><b>Real progress.</b><small>Celebrated together.</small></span></div></div>
        <div className="family-copy"><p className="eyebrow"><span/> Built for busy families</p><h2>YOUR SKATER’S<br/>JOURNEY, <em>IN VIEW.</em></h2><p>The MSA Parent Portal keeps the details close and the progress clear, so you can spend less time chasing updates and more time cheering.</p>
          <ul><li><CalendarDays/><span><b>Session schedule</b><small>See what’s next and stay ready.</small></span></li><li><Trophy/><span><b>Progress milestones</b><small>Follow skills as they click.</small></span></li><li><ShieldCheck/><span><b>Coach updates</b><small>Stay connected after every session.</small></span></li></ul>
          <Link href={account ? '/dashboard' : '/auth/login'} className="button button-dark">{account ? 'Open skater profile' : 'Open parent portal'} <ArrowRight size={18}/></Link>
        </div>
      </section>

      <section className="section faq-section" id="faq"><div><p className="eyebrow"><span/> Good to know</p><h2>PARENT<br/><em>QUESTIONS.</em></h2><p>Everything you need before the first session. Still wondering? Call or text <a href="tel:+17863947314">786-394-7314</a>.</p></div><div className="faq-list">{faqs.map(([q,a], index) => <button key={q} className="faq-item" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}><span><b>{q}</b>{openFaq === index && <p>{a}</p>}</span><ChevronDown className={openFaq === index ? 'rotated' : ''}/></button>)}</div></section>

      <section className="final-cta"><div><Users/><span><small>ALREADY PART OF THE CREW?</small><h2>OPEN YOUR SKATER PORTAL.</h2></span></div><div className="final-links"><Link href="/coach" className="coach-footer-link">Coach sign in</Link><Link href={account ? '/dashboard' : '/auth/login'} className="button button-light">{account ? 'Open skater profile' : 'Member sign in'} <ArrowRight size={19}/></Link></div></section>
      <section className="new-family-strip"><p><b>Not enrolled with MSA yet?</b> Enrollment happens outside this private member portal.</p><div><a href="https://miamiskateacademy.com" target="_blank" rel="noreferrer">Visit MiamiSkateAcademy.com</a><a href="sms:+17863947314">Text 786-394-7314</a></div></section>
      <section className="video-footer-strip" aria-label="Miami Skate Academy session video"><video autoPlay muted loop playsInline preload="metadata" aria-hidden="true"><source src="/videos/msa-skate.mov" type="video/quicktime" /></video><div className="video-footer-overlay" /></section>
      <footer><div className="brand-lockup"><span className="brand-mark">MSA</span><span><b>MIAMI SKATE</b><small>ACADEMY</small></span></div><p>Miami Skate Academy · Part of Yoint County</p><div><a href="tel:+17863947314">786-394-7314</a><a href="mailto:jt@yointcounty.com">jt@yointcounty.com</a></div></footer>
    </main>
  );
}
