'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Mail, Lock, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black neon-green mb-2">MSA</h1>
          <p className="text-gray-400 text-sm">Miami Skate Academy</p>
          <p className="text-gray-500 text-xs">by Yoint County</p>
        </div>

        <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-8 backdrop-filter backdrop-blur-lg">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="text-[#00ff41]" size={24} />
            Parent Portal
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#00ff41] text-black font-bold rounded-lg uppercase tracking-wider hover:shadow-[0_0_20px_#00ff41] transition-all duration-300 transform hover:translate-y-[-2px] mt-6"
            >
              Sign In
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          <p className="text-center text-gray-400">
            No account? <Link href="/auth/signup" className="text-[#00d4ff] font-bold hover:text-[#00ff41] transition">Enroll Here</Link>
          </p>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <Link href="/" className="hover:text-[#00ff41] transition">? Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
