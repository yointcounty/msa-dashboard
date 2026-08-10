'use client';
import Link from 'next/link';
import { Users, Zap, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center mb-16">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-black mb-4 neon-green">
              MIAMI SKATE ACADEMY
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold neon-cyan mb-4">
              Part of Yoint County
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Learn to skate. Track progress. Build confidence. For kids and families.
            </p>
          </div>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              href="/auth/login" 
              className="px-8 py-4 bg-[#00ff41] text-black rounded-lg hover:shadow-[0_0_20px_#00ff41] font-bold text-lg uppercase tracking-wider transition-all duration-300 transform hover:translate-y-[-2px]"
            >
              Parent Portal
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-8 py-4 border-2 border-[#00d4ff] text-[#00d4ff] rounded-lg hover:bg-[#00d4ff] hover:text-black hover:shadow-[0_0_20px_#00d4ff] font-bold text-lg uppercase tracking-wider transition-all duration-300 transform hover:translate-y-[-2px]"
            >
              Enroll Now
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {[
            { 
              icon: Users, 
              title: 'Track Progress', 
              desc: "Monitor your child's skateboarding journey from beginner to advanced.",
              accent: '#00ff41'
            },
            { 
              icon: Zap, 
              title: 'Live Updates', 
              desc: 'Real-time session notes, skill achievements, and coach feedback.',
              accent: '#00d4ff'
            },
            { 
              icon: TrendingUp, 
              title: 'Growth Metrics', 
              desc: 'Visual progress tracking and milestone celebrations.',
              accent: '#ff0080'
            },
          ].map(({ icon: Icon, title, desc, accent }) => (
            <div 
              key={title} 
              className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-gray-600 hover:border-[#00ff41] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,65,0.2)]"
            >
              <div 
                className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                style={{ 
                  background: `${accent}22`,
                  color: accent
                }}
              >
                <Icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:neon-green transition-all">
                {title}
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300">
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-8 mt-32 pt-20 border-t border-gray-700">
          {[
            { label: 'Active Students', value: '16+' },
            { label: 'Skill Levels', value: '10+' },
            { label: 'Locations', value: '3' },
            { label: 'Sessions/Week', value: '20+' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-5xl font-black neon-green mb-2">{value}</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center py-16 border-t border-gray-700">
          <p className="text-gray-400 mb-4 text-sm">Powered by Yoint County Skateboarding</p>
          <Link 
            href="/auth/signup"
            className="inline-block px-12 py-5 bg-gradient-to-r from-[#00ff41] to-[#00d4ff] text-black rounded-lg font-black text-xl uppercase tracking-widest hover:shadow-[0_0_40px_#00ff41] transition-all duration-300 transform hover:scale-105"
          >
            Start Learning ??
          </Link>
        </div>
      </section>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#00ff41] opacity-5 blur-3xl rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#00d4ff] opacity-5 blur-3xl rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}
