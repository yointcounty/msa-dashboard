'use client';

import Link from 'next/link';
import { Users, Lock, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">Miami Skate Academy</h1>
          <p className="text-xl text-slate-600 mb-8">Track progress, manage operations, build community</p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/login" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Sign in</Link>
            <Link href="/auth/signup" className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold">Sign up</Link>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {[
            { icon: Users, title: 'Parent Portal', desc: 'Track your child\'s skateboarding progress' },
            { icon: Lock, title: 'Admin Dashboard', desc: 'Manage students, attendance, and leads' },
            { icon: TrendingUp, title: 'Analytics', desc: 'Real-time business metrics and insights' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl p-8 border border-slate-200">
              <Icon className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
