'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronDown, Menu, ShieldCheck, Smartphone, Sparkles, Trophy, Users, X } from 'lucide-react';
import InstallAppButton from './install-app';
import './home-app.css';

const programs = [
  { title: 'Private Lessons', copy: 'One-on-one coaching built around your skater’s pace, goals, and confidence.', tag: 'Most focused', image: '/images/msa-session.jpg' },
  { title: 'Small Groups', copy: 'Learn with friends in coach-led groups capped at four skaters per coach.', tag: 'Build together', image: '/images/msa-lessons.jpg' },
  { title: 'Travel Team & Camps', copy: 'More time on the board through weekend sessions and seasonal programs.', tag: 'Level up', image: '/images/msa-coaching.jpg' },
];

const faqs = [
  ['Is MSA beginner-friendly?', 'Absolutely. Coaches meet each skater at their current level and focus first on safety, balance, board control, and confidence.'],
  ['Where do lessons happen?', 'Lessons can take place at local skateparks, nearby public parks, or an appropriate home practice area across Miami, Hollywood, and nearby South Florida communities.'],
  ['What can parents track?', 'The parent dashboard brings upcoming sessions, progress milestones, coach notes, and enrollment details into one easy place.'],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <Link href="/" className="brand-lockup" aria-label="Miami Skate Academy home">
          <span className="brand-mark">MSA</span>
          <span><b>MIAMI SKATE</b><small>ACADEMY</small></span>
        </Link>
        <div className="desktop-nav">
          <a href="#programs">Programs</a><a href="#families">For families</a><a href="#faq">FAQ</a>
        </div>
        <div className="nav-actions">
          <InstallAppButton compact/><Link href="/auth/login" className="text-link">Sign in</Link>
          <Link href="/auth/signup" className="button button-small">Enroll now <ArrowRight size={16}/></Link>
        </div>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>{menuOpen ? <X/> : <Menu/>}</button>
      </nav>
      {menuOpen && <div className="mobile-menu"><a href="#programs" onClick={() => setMenuOpen(false)}>Programs</a><a href="#families" onClick={() => setMenuOpen(false)}>For families</a><a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a><Link href="/auth/login">Sign in</Link><Link href="/auth/signup" className="button">Enroll now</Link></div>}

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span/> Miami’s skateboarding home</p>
          <h1>CONFIDENCE<br/>STARTS ON<br/><em>THE BOARD.</em></h1>
          <p className="hero-lede">Safe, high-energy skateboarding instruction for kids—plus one simple app for parents to follow every win.</p>
          <div className="hero-actions">
            <Link href="/auth/signup" className="button">Enroll your skater <ArrowRight size={19}/></Link>
            <InstallAppButton/>
          </div>
          <div className="trust-row"><div className="avatar-stack"><span>JT</span><span>MSA</span><span>YC</span></div><p><b>100+ Enrolled Members</b><small>Growing stronger, one session at a time</small></p></div>
        </div>
        <div className="hero-media">
          <Image src="/images/msa-coaching.jpg" alt="Miami Skate Academy coaches and young skaters at the skatepark" fill priority sizes="(max-width: 900px) 100vw, 50vw"/>
          <div className="hero-sticker"><Trophy size={24}/><b>SKATE.<br/>GROW.<br/>BELONG.</b></div>
          <div className="session-card"><span className="pulse"/><div><small>NEXT UP</small><b>Weekend Team Session</b><span>Saturday · 10:00 AM</span></div><CalendarDays size={24}/></div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Academy highlights">
        <div><strong>100+</strong><span>ENROLLED MEMBERS</span></div><div><strong>4:1</strong><span>GROUP COACH RATIO</span></div><div><strong>3</strong><span>SOUTH FLORIDA AREAS</span></div><div><strong>ALL</strong><span>SKILL LEVELS WELCOME</span></div>
      </section>

      <section className="app-preview-section" id="app">
        <div className="app-preview-copy"><p className="eyebrow"><span/> The MSA skater app</p><h2>EVERY TRICK.<br/><em>EVERY WIN.</em></h2><p>Install the private portal and see exactly what your skater is learning—from the first drop-in to a clean kickflip. Coaches update progress after sessions; families celebrate the climb.</p><InstallAppButton/></div>
        <div className="phone-preview"><div className="phone-top"><span className="brand-mark">MSA</span><small>ALEX’S ROADMAP</small><Smartphone/></div><h3>MAIN TRICK CHECKLIST</h3><div className="preview-tricks"><div className="preview-trick"><span className="preview-check done"><Check size={17}/></span><span><b>Kickturn</b><small>Strong control both ways</small></span><span className="preview-status green">Mastered</span></div><div className="preview-trick"><span className="preview-check"/><span><b>Ollie</b><small>Rolling ollies are landing</small></span><span className="preview-status green">Consistent</span></div><div className="preview-trick"><span className="preview-check"/><span><b>Drop-in</b><small>Building commitment</small></span><span className="preview-status">Learning</span></div><div className="preview-trick"><span className="preview-check"/><span><b>Kickflip</b><small>Next milestone</small></span><span className="preview-status">Not started</span></div></div></div>
        <div className="app-badge">INSTALL<br/>THE APP</div>
      </section>

      <section className="section" id="programs">
        <div className="section-heading"><div><p className="eyebrow"><span/> Find your fit</p><h2>A PROGRAM FOR<br/><em>EVERY SKATER.</em></h2></div><p>From the first push to the next big milestone, MSA creates the right mix of coaching, community, and challenge.</p></div>
        <div className="program-grid">{programs.map((program, index) => <article className="program-card" key={program.title}>
          <div className="program-image"><Image src={program.image} alt="" fill sizes="(max-width: 800px) 100vw, 33vw"/><span>0{index + 1}</span></div>
          <div className="program-content"><small>{program.tag}</small><h3>{program.title}</h3><p>{program.copy}</p><Link href="/auth/signup">Choose this program <ArrowRight size={17}/></Link></div>
        </article>)}</div>
      </section>

      <section className="family-section" id="families">
        <div className="family-photo"><Image src="/images/msa-session.jpg" alt="An MSA coach celebrating with a young skater" fill sizes="(max-width: 900px) 100vw, 48vw"/><div className="photo-caption"><Sparkles/><span><b>Real progress.</b><small>Celebrated together.</small></span></div></div>
        <div className="family-copy"><p className="eyebrow"><span/> Built for busy families</p><h2>YOUR SKATER’S<br/>JOURNEY, <em>IN VIEW.</em></h2><p>The MSA Parent Portal keeps the details close and the progress clear, so you can spend less time chasing updates and more time cheering.</p>
          <ul><li><CalendarDays/><span><b>Session schedule</b><small>See what’s next and stay ready.</small></span></li><li><Trophy/><span><b>Progress milestones</b><small>Follow skills as they click.</small></span></li><li><ShieldCheck/><span><b>Coach updates</b><small>Stay connected after every session.</small></span></li></ul>
          <Link href="/auth/login" className="button button-dark">Open parent portal <ArrowRight size={18}/></Link>
        </div>
      </section>

      <section className="section faq-section" id="faq"><div><p className="eyebrow"><span/> Good to know</p><h2>PARENT<br/><em>QUESTIONS.</em></h2><p>Everything you need before the first session. Still wondering? Call or text <a href="tel:+17863947314">786-394-7314</a>.</p></div><div className="faq-list">{faqs.map(([q,a], index) => <button key={q} className="faq-item" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}><span><b>{q}</b>{openFaq === index && <p>{a}</p>}</span><ChevronDown className={openFaq === index ? 'rotated' : ''}/></button>)}</div></section>

      <section className="final-cta"><div><Users/><span><small>READY WHEN THEY ARE</small><h2>LET’S GET THEM ROLLING.</h2></span></div><Link href="/auth/signup" className="button button-light">Start enrollment <ArrowRight size={19}/></Link></section>
      <footer><div className="brand-lockup"><span className="brand-mark">MSA</span><span><b>MIAMI SKATE</b><small>ACADEMY</small></span></div><p>Miami Skate Academy · Part of Yoint County</p><div><a href="tel:+17863947314">786-394-7314</a><a href="mailto:jt@yointcounty.com">jt@yointcounty.com</a></div></footer>
    </main>
  );
}
