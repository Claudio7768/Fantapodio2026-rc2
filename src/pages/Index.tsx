import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Calendar, MessageCircle, ChevronRight, Settings, Plus, CheckCircle2,
  AlertCircle, TrendingUp, Zap, ShieldAlert, Clock, Search, Loader2,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Leaderboard } from '@/components/Leaderboard';
import { Rules } from '@/components/Rules';
import { SeasonalStats } from '@/components/SeasonalStats';
import { Countdown, ButtonCountdown } from '@/components/Countdown';
import { LoginScreen } from '@/components/LoginScreen';
import {
  Team, GP, Prediction, Result, SeasonStats, DRIVERS,
  formatMilanTime, calcScore,
} from '@/lib/constants';
import {
  getTeams, getGPs, getPredictions, getResults,
  getCurrentUser, setCurrentUser,
  loginTeam, registerTeam, submitPrediction, submitResult,
  getSeasonStats, resetApp,
} from '@/lib/store';
import { fetchRaceResults, DriverResult } from '@/lib/openf1';
import { RaceClassification } from '@/components/RaceClassification';

export default function Index() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [gps, setGps] = useState<GP[]>([]);
  const [selectedGp, setSelectedGp] = useState<GP | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [view, setView] = useState<'dashboard' | 'predict' | 'stats' | 'admin'>('dashboard');
  const [user, setUser] = useState<{ team_id: string; team_name: string } | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<'idle'|'ok'|'error'>('idle');
  const [classification, setClassification] = useState<DriverResult[]>([]);

  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [p3, setP3] = useState('');
  const [resP1, setResP1] = useState('');
  const [resP2, setResP2] = useState('');
  const [resP3, setResP3] = useState('');
  const [dnfs, setDnfs] = useState('');
  const [penalties, setPenalties] = useState('');
  const [rimonte, setRimonte] = useState('');

  const refreshData = async (currentSelectedGp?: GP | null) => {
    const [t, g, preds, res] = await Promise.all([
      getTeams(), getGPs(), getPredictions(), getResults(),
    ]);

    // Calcola score per ogni team
    const enriched = t.map(team => {
      const tp = preds.filter(p => p.team_id === team.id);
      const score = tp.reduce((tot, pred) => {
        const r = res.find(r => r.gp_id === pred.gp_id);
        return r ? tot + calcScore(pred, r) : tot;
      }, 0);
      return { ...team, score };
    });

    setTeams(enriched);
    setGps(g);
    setPredictions(preds);
    setResults(res);
    setSeasonStats(getSeasonStats(enriched, preds, res, g));

    const gpToSelect = currentSelectedGp ?? null;
    if (!gpToSelect) {
      const next = g.find(gp => !gp.completed) || g[g.length - 1];
      if (next) setSelectedGp(next);
    }
  };

  useEffect(() => {
    setUser(getCurrentUser());
    refreshData().finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (user && selectedGp) {
      const myPred = predictions.find(p => p.team_id === user.team_id && p.gp_id === selectedGp.id);
      if (myPred) {
        setP1(myPred.p1);
        setP2(myPred.p2);
        setP3(myPred.p3);
      } else {
        setP1(''); setP2(''); setP3('');
      }
    }
  }, [selectedGp, user, predictions]);

  const handleLogin = async (name: string, password: string) => {
    const result = await loginTeam(name, password);
    if (result.success && result.user) {
      setUser(result.user);
      await refreshData(selectedGp);
    } else {
      alert(`Errore: ${result.error}`);
    }
  };

  const handleRegister = async (name: string, password: string) => {
    const result = await registerTeam(name, password);
    if (result.success) {
      alert('Registrazione completata! Ora puoi effettuare il login.');
    } else {
      alert(`Errore: ${result.error}`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGp || !user || !p1 || !p2 || !p3) return;
    setIsPredicting(true);
    const result = await submitPrediction(selectedGp.id, user.team_id, p1, p2, p3);
    if (result.success) {
      await refreshData(selectedGp);
      alert('Pronostico salvato con successo! 🏎️');
    } else {
      alert(`Errore: ${result.error}`);
    }
    setIsPredicting(false);
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGp || !resP1 || !resP2 || !resP3) return;
    await submitResult(
      selectedGp.id, resP1, resP2, resP3,
      dnfs.split(',').map(s => s.trim()).filter(Boolean),
      penalties.split(',').map(s => s.trim()).filter(Boolean),
      rimonte.split(',').map(s => s.trim()).filter(Boolean),
    );
    await refreshData(selectedGp);
    setView('dashboard');
    alert('Risultati salvati e punteggi aggiornati!');
  };

  const handleResetApp = async () => {
    const password = prompt("Inserisci la password per resettare l'app:");
    if (!password) return;
    if (confirm('Sei sicuro di voler resettare? Tutti i dati verranno eliminati.')) {
      const ok = await resetApp(password);
      if (ok) {
        setUser(null);
        setCurrentUser(null);
        await refreshData();
        alert('App resettata con successo!');
      } else {
        alert('Password errata.');
      }
    }
  };

  const fetchFromOpenF1 = async () => {
    if (!selectedGp) return;
    setIsFetching(true);
    setFetchStatus('idle');
    const data = await fetchRaceResults(selectedGp.id);
    if (data) {
      setResP1(data.p1);
      setResP2(data.p2);
      setResP3(data.p3);
      setDnfs(data.dnf.join(', '));
      setRimonte(data.rimonta.join(', '));
      setClassification(data.classification || []);
      setFetchStatus('ok');
    } else {
      setFetchStatus('error');
    }
    setIsFetching(false);
  };

  const copyToWhatsApp = (pred: Prediction) => {
    const text = `🏁 FANTAPODIO 2026 🏁\nTeam ${pred.team_name} - GP ${selectedGp?.name}\n\n1. ${pred.p1}\n2. ${pred.p2}\n3. ${pred.p3}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isDeadlinePassed = selectedGp ? new Date() > new Date(selectedGp.start_time) : false;
  const nextGp = gps.find(g => !g.completed);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-white/20 text-xs uppercase tracking-widest font-black italic">Loading Race Data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen teams={teams} nextGp={nextGp} onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground pb-20">
      <Header user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-12 space-y-8 sm:space-y-12">
        {/* Tab Navigation */}
        <div className="flex justify-center overflow-x-auto pb-4 sm:pb-0">
          <div className="inline-flex p-1 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl">
            {[
              { id: 'dashboard', icon: <Zap className="w-3 h-3 sm:w-4 sm:h-4" />, label: 'Paddock' },
              { id: 'stats',     icon: <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />, label: 'Standings' },
              { id: 'predict',   icon: <Plus className="w-3 h-3 sm:w-4 sm:h-4" />, label: 'Predict' },
              { id: 'admin',     icon: <Settings className="w-3 h-3 sm:w-4 sm:h-4" />, label: 'Race Control' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-4 sm:px-8 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black italic uppercase transition-all whitespace-nowrap ${
                  view === tab.id ? 'bg-primary text-primary-foreground shadow-xl' : 'text-white/40 hover:text-white'
                }`}
                style={view === tab.id ? { boxShadow: '0 20px 25px -5px hsl(1 96% 44% / 0.2)' } : {}}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── DASHBOARD ── */}
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-12">
                {/* Next GP Card */}
                <section className="f1-card p-6 sm:p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity hidden sm:block">
                    <Calendar className="w-64 h-64" />
                  </div>
                  <div className="relative z-10 space-y-8 sm:space-y-10">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 sm:px-4 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-black italic uppercase tracking-widest rounded-full ${isDeadlinePassed ? 'bg-white/5 text-white/20' : 'bg-primary text-primary-foreground shadow-lg animate-pulse'}`}>
                        {isDeadlinePassed ? 'Event Live / Ended' : 'Next Grand Prix'}
                      </span>
                      <div className="h-[1px] flex-1 bg-white/5" />
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <h2 className="text-3xl sm:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter leading-tight sm:leading-none">{selectedGp?.name}</h2>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/40 font-bold uppercase text-[10px] sm:text-sm tracking-widest">
                          <span>{selectedGp?.location}</span>
                          <span className="hidden sm:block w-1.5 h-1.5 bg-primary rounded-full" />
                          <span>{selectedGp?.date}</span>
                        </div>
                        {selectedGp && !selectedGp.completed && (
                          <div className="bg-black/20 p-2 rounded-2xl border border-white/5">
                            <Countdown targetDate={selectedGp.start_time} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 pt-4 sm:pt-6">
                      <div className="space-y-2 sm:space-y-3">
                        <span className="text-[8px] sm:text-[10px] uppercase font-black text-white/20 tracking-[0.3em] flex items-center gap-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" /> Session Deadline
                        </span>
                        <p className={`font-black italic text-lg sm:text-2xl ${isDeadlinePassed ? 'text-white/20' : 'text-white'}`}>
                          {selectedGp ? formatMilanTime(selectedGp.start_time) : '-'}
                        </p>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <span className="text-[8px] sm:text-[10px] uppercase font-black text-white/20 tracking-[0.3em] flex items-center gap-2">
                          <Search className="w-3 h-3 sm:w-4 sm:h-4 text-primary" /> Select Event
                        </span>
                        <select
                          className="f1-input py-2.5 sm:py-3 text-[10px] sm:text-xs italic uppercase appearance-none"
                          value={selectedGp?.id || ''}
                          onChange={e => setSelectedGp(gps.find(g => g.id === e.target.value) || null)}
                        >
                          {gps.map(gp => (
                            <option key={gp.id} value={gp.id} style={{ backgroundColor: '#1a1a1e' }}>
                              {gp.completed ? '🏁' : '📅'} {gp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Team Predictions */}
                <section className="space-y-8">
                  <div className="flex items-center gap-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/20 whitespace-nowrap">Team Predictions</h3>
                    <div className="h-[1px] w-full bg-white/5" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {['CL', 'ML', 'FL'].map(teamName => {
                      const pred = predictions.find(p => p.team_name === teamName && p.gp_id === selectedGp?.id);
                      return (
                        <div key={teamName} className="f1-card p-6 sm:p-8 space-y-6 sm:space-y-8 relative group border-t-4 border-t-transparent hover:border-t-primary transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-black italic text-lg sm:text-xl tracking-tighter uppercase">Team {teamName}</span>
                            {pred && (
                              <button onClick={() => copyToWhatsApp(pred)} className="p-2 sm:p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all" title="Share to WhatsApp">
                                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            )}
                          </div>
                          {pred ? (
                            <div className="space-y-3 sm:space-y-4">
                              {[1, 2, 3].map(pos => (
                                <div key={pos} className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/5">
                                  <span className={`w-7 h-7 sm:w-8 sm:h-8 ${pos === 1 ? 'bg-yellow-500' : pos === 2 ? 'bg-zinc-400' : 'bg-orange-600'} text-black text-[8px] sm:text-[10px] font-black italic rounded-lg flex items-center justify-center shadow-lg`}>{pos}</span>
                                  <span className="font-black italic uppercase text-xs sm:text-sm tracking-tight">{(pred as any)[`p${pos}`]}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-32 sm:h-40 flex flex-col items-center justify-center text-white/5 space-y-3">
                              <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 opacity-10" />
                              <span className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest italic">No Prediction</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
              <div className="space-y-10">
                <Leaderboard teams={teams} />
                <Rules />
              </div>
            </motion.div>
          )}

          {/* ── STATS ── */}
          {view === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <SeasonalStats stats={seasonStats} />
            </motion.div>
          )}

          {/* ── PREDICT ── */}
          {view === 'predict' && (
            <motion.div key="predict" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-2xl mx-auto">
              {isDeadlinePassed ? (
                <div className="f1-card p-16 text-center space-y-8">
                  <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
                    <AlertCircle className="w-12 h-12" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Pit Lane Closed</h2>
                    <p className="text-white/20 text-sm max-w-xs mx-auto">The prediction window for this event has closed.</p>
                  </div>
                  <button onClick={() => setView('dashboard')} className="f1-button px-12">Return to Paddock</button>
                </div>
              ) : (
                <form onSubmit={handlePredict} className="f1-card p-6 sm:p-12 space-y-8 sm:space-y-12 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary to-transparent" />

                  <div className="text-center space-y-3 sm:space-y-4">
                    <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">Submit Prediction</h2>
                    <p className="text-white/20 text-[8px] sm:text-[10px] uppercase font-bold tracking-[0.3em]">{selectedGp?.name} Podium Classification</p>
                  </div>

                  <div className="space-y-8">
                    {[1, 2, 3].map(pos => (
                      <div key={pos} className="space-y-3">
                        <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${pos === 1 ? 'text-yellow-500' : pos === 2 ? 'text-zinc-400' : 'text-orange-600'} flex items-center gap-2`}>
                          <Trophy className="w-4 h-4" /> Podium Position {pos}
                        </label>
                        <div className="relative">
                          <select
                            required
                            className="f1-input appearance-none pr-12 italic uppercase"
                            value={pos === 1 ? p1 : pos === 2 ? p2 : p3}
                            onChange={e => pos === 1 ? setP1(e.target.value) : pos === 2 ? setP2(e.target.value) : setP3(e.target.value)}
                          >
                            <option value="" style={{ backgroundColor: '#1a1a1e' }}>Seleziona Pilota</option>
                            {DRIVERS.filter(d => {
                              if (pos === 1) return d.name !== p2 && d.name !== p3;
                              if (pos === 2) return d.name !== p1 && d.name !== p3;
                              return d.name !== p1 && d.name !== p2;
                            }).map(d => (
                              <option key={d.number} value={d.name} style={{ backgroundColor: '#1a1a1e' }}>{d.number} - {d.name} ({d.team})</option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const key = `fp_attempts_${selectedGp?.id}_${user?.team_id}`;
                    const attempts = parseInt(localStorage.getItem(key) || '0', 10);
                    const remaining = Math.max(0, 3 - attempts);
                    const disabled = remaining === 0 || isDeadlinePassed || isPredicting;

                    return (
                      <div className="space-y-4">
                        <button type="submit" disabled={disabled} className={`f1-button w-full py-6 text-xl flex-col gap-1 ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
                          <div className="flex items-center gap-2">
                            {isPredicting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                            <span>{isPredicting ? 'Transmitting...' : remaining === 0 ? 'Attempts Exhausted' : 'Confirm Prediction'}</span>
                          </div>
                          {!disabled && !isPredicting && selectedGp && (
                            <div className="text-[10px] font-bold opacity-70 flex items-center gap-2">
                              <span>Remaining: {remaining}/3</span>
                              <span className="w-1 h-1 bg-white/30 rounded-full" />
                              <ButtonCountdown targetDate={selectedGp.start_time} />
                            </div>
                          )}
                        </button>
                        {remaining === 0 && (
                          <p className="text-center text-[10px] text-primary font-black uppercase tracking-widest italic animate-pulse">
                            Maximum of 3 attempts reached for this Grand Prix
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </form>
              )}
            </motion.div>
          )}

          {/* ── ADMIN ── */}
          {view === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                {/* Colonna sinistra: classifica TV */}
                <div className="space-y-4">
                  {/* Selettore GP nella colonna sinistra */}
                  <div className="f1-card p-4 space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Grand Prix</p>
                    <select
                      className="f1-input text-xs py-2 italic uppercase appearance-none"
                      value={selectedGp?.id || ''}
                      onChange={e => {
                        const gp = gps.find(g => g.id === e.target.value);
                        if (gp) { setSelectedGp(gp); setFetchStatus('idle'); setClassification([]); }
                      }}
                    >
                      {gps.map(g => (
                        <option key={g.id} value={g.id} style={{ backgroundColor: '#1a1a1e' }}>
                          {g.completed ? '✓ ' : ''}{g.name.replace(' Grand Prix', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  {classification.length > 0 && selectedGp && (
                    <RaceClassification classification={classification} gpName={selectedGp.name} />
                  )}
                  {classification.length === 0 && (
                    <div className="f1-card p-6 text-center space-y-2 opacity-30">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Nessuna classifica</p>
                      <p className="text-[7px] text-white/20">Usa Fetch Results per caricare</p>
                    </div>
                  )}
                </div>

                {/* Colonna destra: form admin */}
                <div>
              {!adminUnlocked ? (
                /* Password gate */
                <div className="f1-card p-12 sm:p-16 flex flex-col items-center gap-8 text-center">
                  <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center shadow-2xl">
                    <ShieldAlert className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Race Control</h2>
                    <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold">Accesso riservato</p>
                  </div>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      if (adminPw === 'FANTAPODIO2026') {
                        setAdminUnlocked(true);
                        setAdminPw('');
                      } else {
                        alert('Password errata.');
                        setAdminPw('');
                      }
                    }}
                    className="w-full max-w-xs space-y-4"
                  >
                    <input
                      required
                      type="password"
                      value={adminPw}
                      onChange={e => setAdminPw(e.target.value)}
                      placeholder="Password..."
                      className="f1-input text-center tracking-widest"
                      autoFocus
                    />
                    <button type="submit" className="f1-button w-full py-4">
                      <CheckCircle2 className="w-5 h-5" /> Unlock
                    </button>
                  </form>
                </div>
              ) : (
                /* Admin form */
                <form onSubmit={handleSaveResult} className="f1-card p-6 sm:p-12 space-y-8 sm:space-y-12">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3 sm:gap-4">
                        <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-primary" /> Race Control
                      </h2>
                      <p className="text-white/20 text-[8px] sm:text-[10px] uppercase tracking-[0.3em] font-bold">Official Classification: {selectedGp?.name}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => setAdminUnlocked(false)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                      <AlertCircle className="w-4 h-4" /> Lock
                    </button>
                    <button type="button" onClick={handleResetApp} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
                      <AlertCircle className="w-4 h-4" /> Reset App
                    </button>
                  </div>

                  {/* Fetch automatico da OpenF1 */}
                  <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Auto-fetch OpenF1</p>
                      <p className="text-[9px] text-white/15 font-bold mt-0.5">Recupera P1/P2/P3, DNF e rimonte dalla classifica ufficiale</p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchFromOpenF1}
                      disabled={isFetching || !selectedGp}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black italic uppercase tracking-widest transition-all ${
                        isFetching ? 'bg-white/10 text-white/30 cursor-wait' :
                        fetchStatus === 'ok' ? 'bg-green-600/30 text-green-400 border border-green-600/30' :
                        fetchStatus === 'error' ? 'bg-red-600/20 text-red-400 border border-red-600/20' :
                        'bg-primary/20 text-primary border border-primary/20 hover:bg-primary hover:text-white'
                      }`}
                    >
                      {isFetching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : fetchStatus === 'ok' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      {isFetching ? 'Fetching...' : fetchStatus === 'ok' ? 'Loaded!' : fetchStatus === 'error' ? 'Error — retry' : 'Fetch Results'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(pos => (
                      <div key={pos} className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20">P{pos} Result</label>
                        <select
                          required
                          className="f1-input py-3 italic uppercase appearance-none"
                          value={pos === 1 ? resP1 : pos === 2 ? resP2 : resP3}
                          onChange={e => pos === 1 ? setResP1(e.target.value) : pos === 2 ? setResP2(e.target.value) : setResP3(e.target.value)}
                        >
                          <option value="" style={{ backgroundColor: '#1a1a1e' }}>Seleziona Pilota</option>
                          {DRIVERS.filter(d => {
                            if (pos === 1) return d.name !== resP2 && d.name !== resP3;
                            if (pos === 2) return d.name !== resP1 && d.name !== resP3;
                            return d.name !== resP1 && d.name !== resP2;
                          }).map(d => (
                            <option key={d.number} value={d.name} style={{ backgroundColor: '#1a1a1e' }}>{d.number} - {d.name} ({d.team})</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Retirements (DNF)</label>
                      <input value={dnfs} onChange={e => setDnfs(e.target.value)} placeholder="Verstappen, Hamilton..." className="f1-input" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/20">FIA Penalties</label>
                      <input value={penalties} onChange={e => setPenalties(e.target.value)} placeholder="Perez, Alonso..." className="f1-input" />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Rimonte Killer (Started 11th+ → Top 10)</label>
                      <input value={rimonte} onChange={e => setRimonte(e.target.value)} placeholder="Norris, Bearman..." className="f1-input" />
                    </div>
                  </div>

                  <button type="submit" className="f1-button w-full py-6 text-xl">Publish Official Results</button>
                </form>
              )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
