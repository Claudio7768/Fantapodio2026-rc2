import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Team, GP, formatMilanTime } from '@/lib/constants';

interface LoginScreenProps {
  teams: Team[];
  nextGp: GP | undefined | null;
  onLogin: (name: string, password: string) => void;
  onRegister: (name: string, password: string) => void;
}

function useCountdown(targetDate: string | undefined) {
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setLeft(null); return; }
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  return left;
}

export function LoginScreen({ teams, nextGp, onLogin, onRegister }: LoginScreenProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const countdown = useCountdown(nextGp?.start_time);

  // Al mount: carica credenziali salvate se presenti
  useEffect(() => {
    const saved = localStorage.getItem('fp_remember');
    if (saved) {
      try {
        const { team, password } = JSON.parse(saved);
        setName(team);
        setPw(password);
        setRememberMe(true);
      } catch {}
    }
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pw.trim()) return;
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('fp_remember', JSON.stringify({ team: name.trim(), password: pw }));
    } else {
      localStorage.removeItem('fp_remember');
    }

    if (tab === 'login') await onLogin(name.trim(), pw);
    else await onRegister(name.trim(), pw);
    setLoading(false);
  };

  const teamOptions = teams.length > 0 ? teams : [
    { id: 'CL', name: 'Team CL' },
    { id: 'ML', name: 'Team ML' },
    { id: 'FL', name: 'Team FL' },
  ];

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="f1-card w-full max-w-md p-8 sm:p-12 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-primary font-black italic text-4xl">F1</span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter italic uppercase leading-none">
              Fantapodio <span className="text-primary">2026</span>
            </h1>
          </div>
          <p className="text-white/40 text-xs uppercase tracking-widest font-black">Race Control</p>
        </div>

        {/* Countdown prossimo GP */}
        {nextGp && (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
              <Clock className="w-3 h-3 text-primary" />
              Next Grand Prix
            </div>
            <p className="font-black italic uppercase text-sm tracking-tight text-white">
              {nextGp.name}
            </p>
            <p className="text-[10px] text-white/30 font-bold">
              {formatMilanTime(nextGp.start_time)}
            </p>
            {countdown ? (
              <div className="flex items-center gap-4 pt-1">
                {[
                  { v: countdown.d, l: 'giorni' },
                  { v: countdown.h, l: 'ore' },
                  { v: countdown.m, l: 'min' },
                  { v: countdown.s, l: 'sec' },
                ].map(({ v, l }) => (
                  <div key={l} className="flex flex-col items-center">
                    <span className="text-2xl font-black italic tabular-nums text-white leading-none">
                      {String(v).padStart(2, '0')}
                    </span>
                    <span className="text-[7px] font-black uppercase text-white/20 tracking-widest">{l}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-primary font-black uppercase tracking-widest italic animate-pulse">
                Race started!
              </span>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); }}
              className={`flex-1 py-3 text-[10px] font-black italic uppercase tracking-widest rounded-xl transition-all ${
                tab === t ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-white/30 hover:text-white'
              }`}
            >
              {t === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handle} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Team</label>
            <select
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="f1-input italic uppercase appearance-none"
            >
              <option value="" style={{ backgroundColor: '#1a1a1e' }}>Seleziona il tuo team</option>
              {teamOptions.map(t => (
                <option key={t.id} value={t.id} style={{ backgroundColor: '#1a1a1e' }}>Team {t.id}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Password</label>
            <input
              required
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="••••••••"
              className="f1-input"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {/* Ricordami */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setRememberMe(!rememberMe)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                rememberMe
                  ? 'bg-primary border-primary'
                  : 'border-white/20 bg-white/5 group-hover:border-white/40'
              }`}
            >
              {rememberMe && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors">
              Ricordami
            </span>
          </label>

          <button type="submit" disabled={loading} className="f1-button w-full py-4 mt-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {loading ? 'Loading...' : tab === 'login' ? 'Enter Paddock' : 'Create Team'}
          </button>
        </form>
      </div>
    </div>
  );
}
