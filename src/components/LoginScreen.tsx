import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Team, GP } from '@/lib/constants';

interface LoginScreenProps {
  teams: Team[];
  nextGp: GP | undefined | null;
  onLogin: (name: string, password: string) => void;
  onRegister: (name: string, password: string) => void;
}

export function LoginScreen({ teams, nextGp, onLogin, onRegister }: LoginScreenProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pw.trim()) return;
    setLoading(true);
    if (tab === 'login') await onLogin(name.trim(), pw);
    else await onRegister(name.trim(), pw);
    setLoading(false);
  };

  // Fallback se i team non sono ancora caricati da Supabase
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
          {nextGp && (
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em] pt-1">
              Next: {nextGp.name}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setName(''); setPw(''); }}
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
          {/* Dropdown team — visibile su ENTRAMBI i tab */}
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

          <button type="submit" disabled={loading} className="f1-button w-full py-4 mt-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {loading ? 'Loading...' : tab === 'login' ? 'Enter Paddock' : 'Create Team'}
          </button>
        </form>
      </div>
    </div>
  );
}
