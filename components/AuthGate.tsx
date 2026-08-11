'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setChecked(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    // Demo/local mode: no cloud sync configured, skip auth entirely.
    return <>{children}</>;
  }

  if (!checked) return null;

  if (session) return <>{children}</>;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabase) return;
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });
    if (signInError) setError(signInError.message);
    else setSent(true);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white/10 p-8 backdrop-blur-md text-white shadow-xl">
        <h1 className="mb-2 text-xl font-semibold">3D 回憶小屋</h1>
        <p className="mb-6 text-sm text-white/70">輸入 Email 取得登入連結，跨裝置同步你的房間。</p>
        {sent ? (
          <p className="text-sm text-emerald-300">連結已寄出，請至信箱點擊登入。</p>
        ) : (
          <>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-4 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/40"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-white/90 py-2 text-sm font-medium text-slate-900 transition hover:bg-white"
            >
              寄送登入連結
            </button>
          </>
        )}
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </form>
    </div>
  );
}
