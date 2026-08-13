'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

type Mode = 'sign-in' | 'create';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
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

  if (!isSupabaseConfigured) return <>{children}</>;
  if (!checked) return <div className="fixed inset-0 bg-[#15110e]" />;
  if (session) return <>{children}</>;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'create') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.href.split('#')[0].split('?')[0] },
        });
        if (authError) throw authError;
        if (!data.session) setNotice('確認信已寄出。點擊信內連結後，回到這裡登入即可。');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : '登入失敗，請稍後再試。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#15110e] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_18%,rgba(210,167,112,.18),transparent_34%),radial-gradient(circle_at_78%_82%,rgba(117,83,60,.16),transparent_38%),linear-gradient(135deg,#17110d,#241b15_48%,#100d0b)]" />
      <div className="absolute inset-x-[8%] top-[12%] h-px bg-gradient-to-r from-transparent via-amber-100/25 to-transparent" />
      <div className="absolute inset-x-[18%] bottom-[12%] h-px bg-gradient-to-r from-transparent via-amber-100/10 to-transparent" />
      <div className="relative flex min-h-full items-center justify-center px-4 py-8">
        <form onSubmit={handleSubmit} className="w-full max-w-[420px] rounded-[30px] border border-[#e4c99d]/20 bg-[#17120e]/76 p-6 shadow-[0_36px_110px_rgba(0,0,0,.5)] backdrop-blur-2xl sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.36em] text-[#e7c992]/55">DEAR V · PRIVATE CLOUD</p>
          <h1 className="mt-2 font-serif text-2xl text-[#f5eee5]">{mode === 'create' ? '建立你的私人小屋帳戶' : '回到你的私人小屋'}</h1>
          <p className="mt-3 text-xs leading-6 text-white/42">同一組 Email 與密碼可在手機、平板與電腦同步。照片與回憶只對你的帳戶開放。</p>

          <label className="mt-6 block text-[11px] text-white/50">
            Email
            <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-[#dfbf8d]/45" />
          </label>
          <label className="mt-4 block text-[11px] text-white/50">
            密碼
            <input type="password" required minLength={8} autoComplete={mode === 'create' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-[#dfbf8d]/45" />
          </label>

          <button type="submit" disabled={busy} className="mt-5 w-full rounded-2xl bg-[#ead9bd] py-3 text-sm font-medium text-[#34271e] transition hover:bg-[#f4e9d8] disabled:opacity-50">
            {busy ? '請稍候…' : mode === 'create' ? '建立私人帳戶' : '登入並同步'}
          </button>
          <button type="button" onClick={() => { setMode(mode === 'create' ? 'sign-in' : 'create'); setError(null); setNotice(null); }} className="mt-3 w-full py-2 text-xs text-white/45 hover:text-white/75">
            {mode === 'create' ? '已有帳戶？直接登入' : '第一次使用？建立私人帳戶'}
          </button>

          {notice && <p className="mt-4 rounded-2xl border border-emerald-200/15 bg-emerald-100/[0.06] p-3 text-xs leading-5 text-emerald-100/75">{notice}</p>}
          {error && <p className="mt-4 rounded-2xl border border-rose-200/15 bg-rose-100/[0.06] p-3 text-xs leading-5 text-rose-200/80">{error}</p>}
          <p className="mt-5 text-center text-[10px] text-white/25">免費雲端同步 · 離線時仍保留已載入的空間</p>
        </form>
      </div>
    </div>
  );
}
