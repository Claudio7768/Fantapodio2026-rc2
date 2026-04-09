import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Calendar, MessageCircle, ChevronRight, Settings, Plus, CheckCircle2,
  AlertCircle, TrendingUp, Zap, ShieldAlert, Clock, Search, Loader2, Radio,
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
import { supabase } from '@/integrations/supabase/client';
import { fetchRaceResults, type DriverResult } from '@/lib/openf1';
import { RaceClassification } from '@/components/RaceClassification';
import { PredictionHistory } from '@/components/PredictionHistory';
import { ScorePreview } from '@/components/ScorePreview';
import { TeamRadio } from '@/components/TeamRadio';
import { ClassificationEditor } from '@/components/ClassificationEditor';
import { JolpicaSync } from '@/components/JolpicaSync';

// Controlla se sono trascorse almeno 24 ore dalla start_time del GP
function isResultsAvailable(gp: { start_time: string } | null): boolean {
  if (!gp) return false;
  const gpEnd = new Date(gp.start_time).getTime();
  return Date.now() > gpEnd + 24 * 60 * 60 * 1000;
}

export default function Index() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [gps, setGps] = useState<GP[]>([]);
  const [selectedGp, setSelectedGp] = useState<GP | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [view, setView] = useState<'dashboard' | 'predict' | 'stats' | 'admin' | 'radio'>('dashboard');
  const TAB_ORDER: Array<'dashboard' | 'stats' | 'predict' | 'radio' | 'admin'> = ['dashboard', 'stats', 'predict', 'radio', 'admin'];
  const viewIndex = TAB_ORDER.indexOf(view as any);
  useEffect(() => { viewRef.current = view; }, [view]);
  const [slideDir, setSlideDir] = useState<1 | -1>(1); // 1=sinistra, -1=destra
  const [user, setUser] = useState<{ team_id: string; team_name: string } | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const isFetchingRef = useRef(false); // ref per evitare stale closure nel useEffect
  const touchStartX = useRef<number | null>(null);
  const viewRef = useRef<string>('dashboard'); // tiene traccia della view corrente senza stale closure
  const [fetchStatus, setFetchStatus] = useState<'idle'|'ok'|'error'>('idle');
  const [fetchError, setFetchError] = useState<string>('');
  const [classification, setClassification] = useState<DriverResult[]>([]);
  const [unreadRadio, setUnreadRadio] = useState(0);
  const [classificationDraft, setClassificationDraft] = useState<DriverResult[]>([]);
  const [showScorePreview, setShowScorePreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState<{msg: string; type: 'ok'|'err'} | null>(null);

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 3500);
  };

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

  // Invia messaggio Direzione Gara al primo login dopo la release
  useEffect(() => {
    if (!user) return;
    const key = 'fp_release_2026_msg_sent';
    if (localStorage.getItem(key)) return;
    // Invia una sola volta per dispositivo
    const send = async () => {
      const { data: existing } = await supabase
        .from('messages')
        .select('id')
        .eq('team_id', 'RC')
        .ilike('text', '%Release 2026%')
        .limit(1);
      if (existing && existing.length > 0) {
        localStorage.setItem(key, '1');
        return; // già inviato da un altro dispositivo
      }
      await supabase.from('messages').insert({
        team_id: 'RC',
        team_name: 'RC',
        text: '🏁 Benvenuti alla Release 2026! L'app è stata completamente rinnovata con swipe navigation, storico pronostici, Team Radio con reactions, classifiche live da Jolpica e molto altro. Buona stagione! 🏎️',
      });
      localStorage.setItem(key, '1');
    };
    send();
  }, [user]);

  // Auto-fetch quando si apre Race Control con un GP completato E sono passate 24h
  // Usa isFetchingRef (non state) per evitare stale closure
  useEffect(() => {
    if (
      view === 'admin' &&
      selectedGp?.completed &&
      isResultsAvailable(selectedGp) &&
      classification.length === 0 &&
      !isFetchingRef.current
    ) {
      fetchFromOpenF1(selectedGp.id);
    }
  }, [view, selectedGp]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (name: string, password: string) => {
    const result = await loginTeam(name, password);
    if (result.success && result.user) {
      setUser(result.user);
      await refreshData(selectedGp);
    } else {
      showToast(result.error || 'Errore', 'err');
    }
  };

  const handleRegister = async (name: string, password: string) => {
    const result = await registerTeam(name, password);
    if (result.success) {
      showToast('Registrazione completata! Ora effettua il login.');
    } else {
      showToast(result.error || 'Errore', 'err');
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
      showToast('Pronostico salvato! 🏎️');
    } else {
      showToast(result.error || 'Errore', 'err');
    }
    setIsPredicting(false);
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGp || !resP1 || !resP2 || !resP3) return;
    // Mostra preview punteggi prima di pubblicare
    setShowScorePreview(true);
  };

  const handleConfirmPublish = async () => {
    if (!selectedGp) return;
    setIsPublishing(true);
    await submitResult(
      selectedGp.id, resP1, resP2, resP3,
      dnfs.split(',').map(s => s.trim()).filter(Boolean),
      penalties.split(',').map(s => s.trim()).filter(Boolean),
      rimonte.split(',').map(s => s.trim()).filter(Boolean),
      classificationDraft,
    );
    setClassification(classificationDraft);
    await refreshData(selectedGp);
    setShowScorePreview(false);
    setIsPublishing(false);
    setView('dashboard');
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
        showToast('App resettata con successo!');
      } else {
        showToast('Password errata.', 'err');
      }
    }
  };

  const fetchFromOpenF1 = async (gpId?: string) => {
    const gp = gpId ? gps.find(g => g.id === gpId) : selectedGp;
    if (!gp) return;
    setIsFetching(true);
    isFetchingRef.current = true;
    setFetchStatus('idle');
    setFetchError('');
    setClassification([]);
    try {
      // Legge da Supabase (popolato al salvataggio risultati)
      const data = await fetchRaceResults(gp.id);
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
    } catch (err) {
      console.error('Fetch error:', err);
      setFetchError(err instanceof Error ? err.message : String(err));
      setFetchStatus('error');
    } finally {
      setIsFetching(false);
      isFetchingRef.current = false;
    }
  };

  // Badge non letti — usa viewRef per evitare stale closure
  useEffect(() => {
    const ch = supabase.channel('index-radio-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, p => {
        const msg = p.new as { team_id: string; created_at: string };
        // Incrementa solo se: messaggio di un altro team E non siamo sul tab Radio
        if (msg.team_id !== user?.team_id && viewRef.current !== 'radio') {
          setUnreadRadio(prev => prev + 1);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const copyToWhatsApp = (pred: Prediction) => {
    const text = `🏁 FANTAPODIO 2026 🏁\nTeam ${pred.team_name} - GP ${selectedGp?.name}\n\n1. ${pred.p1}\n2. ${pred.p2}\n3. ${pred.p3}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isDeadlinePassed = selectedGp ? (selectedGp.cancelled || new Date() > new Date(selectedGp.start_time)) : false;
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

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-12 space-y-4 sm:space-y-8">
        {/* Tab Navigation */}
        <div className="flex justify-start sm:justify-center overflow-x-auto pb-3 sm:pb-0 no-scrollbar">
          <div className="inline-flex p-1 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl">
            {[
              { id: 'dashboard', icon: <Zap className="w-3 h-3 sm:w-4 sm:h-4" />, label: 'Paddock' },
              { id: 'stats',     icon: <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />, label: 'Standings' },
              { id: 'predict',   icon: <Plus className="w-3 h-3 sm:w-4 sm:h-4" />, label: 'Predict' },
              { id: 'radio',     icon: <Radio className="w-3 h-3 sm:w-4 sm:h-4" />, label: 'Team Radio', badge: unreadRadio },
              { id: 'admin',     icon: <Settings className="w-3 h-3 sm:w-4 sm:h-4" />, label: 'Race Control' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                    const newIdx = TAB_ORDER.indexOf(tab.id as any);
                    setSlideDir(newIdx >= viewIndex ? 1 : -1);
                    setView(tab.id as any);
                    if (tab.id === 'radio') setUnreadRadio(0);
                    if (tab.id === 'admin') {
                      const lastCompleted = [...gps].reverse().find(g => g.completed && !g.cancelled);
                      if (lastCompleted && (!selectedGp?.completed)) {
                        setSelectedGp(lastCompleted);
                        setClassification([]);
                      }
                    }
                  }}
                className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-4 sm:px-8 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black italic uppercase transition-all whitespace-nowrap ${
                  view === tab.id ? 'bg-primary text-primary-foreground shadow-xl' : 'text-white/40 hover:text-white'
                }`}
                style={view === tab.id ? { boxShadow: '0 20px 25px -5px hsl(1 96% 44% / 0.2)' } : {}}
              >
                {tab.icon}
                {tab.label}
                {(tab as any).badge > 0 && (
                  <span className="w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {(tab as any).badge > 9 ? '9+' : (tab as any).badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Swipe area */}
        <div
          className="relative overflow-hidden"
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return;
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) >= 50) {
              const idx = TAB_ORDER.indexOf(view as any);
              if (diff > 0 && idx < TAB_ORDER.length - 1) {
                const next = TAB_ORDER[idx + 1];
                setSlideDir(1);
                setView(next);
                if (next === 'radio') setUnreadRadio(0);
                if (next === 'admin') {
                  const lastCompleted = [...gps].reverse().find(g => g.completed && !g.cancelled);
                  if (lastCompleted && (!selectedGp?.completed)) { setSelectedGp(lastCompleted); setClassification([]); }
                }
              } else if (diff < 0 && idx > 0) {
                setSlideDir(-1);
                setView(TAB_ORDER[idx - 1]);
              }
            }
            touchStartX.current = null;
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {view === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ x: slideDir * 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: slideDir * -60, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-10"
              >
              <div className="lg:col-span-2 space-y-12">
                {/* Next GP Card */}
                <section className="f1-card p-6 sm:p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity hidden sm:block">
                    <Calendar className="w-64 h-64" />
                  </div>
                  <div className="relative z-10 space-y-8 sm:space-y-10">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 sm:px-4 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-black italic uppercase tracking-widest rounded-full ${
                        selectedGp?.cancelled ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                        isDeadlinePassed ? 'bg-white/5 text-white/20' :
                        'bg-primary text-primary-foreground shadow-lg animate-pulse'
                      }`}>
                        {selectedGp?.cancelled ? '🚫 Gara Cancellata' : isDeadlinePassed ? 'Event Live / Ended' : 'Next Grand Prix'}
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
                              {gp.cancelled ? '🚫' : gp.completed ? '🏁' : '📅'} {gp.name}{gp.cancelled ? ' — CANCELLATO' : ''}
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
                  {/* Mobile: compact horizontal row | Desktop: 3 col grid */}
                  <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-8">
                    {['CL', 'ML', 'FL'].map(teamName => {
                      const pred = predictions.find(p => p.team_name === teamName && p.gp_id === selectedGp?.id);
                      return (
                        <div key={teamName} className="f1-card p-3 sm:p-8 space-y-2 sm:space-y-8 relative group border-t-4 border-t-transparent hover:border-t-primary transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-black italic text-sm sm:text-xl tracking-tighter uppercase">Team {teamName}</span>
                            {pred && (
                              <button onClick={() => copyToWhatsApp(pred)} className="hidden sm:flex p-2 sm:p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all" title="Share to WhatsApp">
                                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            )}
                          </div>
                          {pred ? (
                            <div className="space-y-1.5 sm:space-y-4">
                              {[1, 2, 3].map(pos => (
                                <div key={pos} className="flex items-center gap-1.5 sm:gap-4 p-1.5 sm:p-3 bg-white/[0.02] rounded-lg sm:rounded-2xl border border-white/5">
                                  <span className={`w-5 h-5 sm:w-8 sm:h-8 flex-shrink-0 ${pos === 1 ? 'bg-yellow-500' : pos === 2 ? 'bg-zinc-400' : 'bg-orange-600'} text-black text-[7px] sm:text-[10px] font-black italic rounded-md sm:rounded-lg flex items-center justify-center`}>{pos}</span>
                                  <span className="font-black italic uppercase text-[9px] sm:text-sm tracking-tight truncate">{(pred as any)[`p${pos}`]}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-20 sm:h-40 flex flex-col items-center justify-center text-white/5 space-y-1 sm:space-y-3">
                              <ShieldAlert className="w-5 h-5 sm:w-10 sm:h-10 opacity-10" />
                              <span className="text-[7px] sm:text-[10px] uppercase font-black tracking-widest italic text-center">No Prediction</span>
                            </div>
                          )}
                          {pred && (
                            <button onClick={() => copyToWhatsApp(pred)} className="sm:hidden w-full flex items-center justify-center gap-1 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-[8px] font-black uppercase tracking-widest">
                              <MessageCircle className="w-3 h-3" /> Invia
                            </button>
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
            {view === 'stats' && (
              <motion.div
                key="stats"
                initial={{ x: slideDir * 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: slideDir * -60, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}

              >

              <div className="space-y-8">
                <SeasonalStats stats={seasonStats} />
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/20 whitespace-nowrap">Storico Pronostici</h3>
                    <div className="h-[1px] w-full bg-white/5" />
                  </div>
                  <PredictionHistory
                    gps={gps}
                    predictions={predictions}
                    results={results}
                    currentTeamId={user?.team_id || ''}
                  />
                </div>
              </div>
              </motion.div>
            )}
            {view === 'predict' && (
              <motion.div
                key="predict"
                initial={{ x: slideDir * 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: slideDir * -60, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="max-w-2xl mx-auto"
              >

              {isDeadlinePassed ? (
                <div className="f1-card p-16 text-center space-y-8">
                  <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
                    <AlertCircle className="w-12 h-12" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">
                      {selectedGp?.cancelled ? 'Gara Cancellata' : 'Pit Lane Closed'}
                    </h2>
                    <p className="text-white/20 text-sm max-w-xs mx-auto">
                      {selectedGp?.cancelled
                        ? 'Questo Gran Premio è stato cancellato dal calendario 2026.'
                        : 'The prediction window for this event has closed.'}
                    </p>
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
            {view === 'radio' && (
              <motion.div
                key="radio"
                initial={{ x: slideDir * 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: slideDir * -60, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}

              >

              <TeamRadio user={user} />
            
            
              </motion.div>
            )}
            {view === 'admin' && (
              <motion.div
                key="admin"
                initial={{ x: slideDir * 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: slideDir * -60, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="max-w-3xl mx-auto"
              >

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
                        if (gp) {
                          setSelectedGp(gp);
                          setFetchStatus('idle');
                          setClassification([]);
                          setResP1(''); setResP2(''); setResP3('');
                          setDnfs(''); setRimonte('');
                          if (gp.completed) setTimeout(() => fetchFromOpenF1(gp.id), 0);
                        }
                      }}
                    >
                      {gps.filter(g => !g.cancelled).map(g => (
                        <option key={g.id} value={g.id} style={{ backgroundColor: '#1a1a1e' }}>
                          {g.completed ? '✓ ' : ''}{g.name.replace(' Grand Prix', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <RaceClassification
                    classification={classification}
                    gpName={selectedGp?.name || ''}
                    loading={isFetching}
                  />
                </div>

                {/* Colonna destra: form admin */}
                <div>
              {/* Messaggi Direzione Gara */}
              {adminUnlocked && (
                <div className="f1-card p-4 space-y-3 border border-yellow-500/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400">
                    🏁 Messaggio Direzione Gara
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="rc-msg-input"
                      placeholder="Scrivi un messaggio ufficiale..."
                      maxLength={300}
                      className="f1-input flex-1 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const input = document.getElementById('rc-msg-input') as HTMLInputElement;
                        const text = input?.value?.trim();
                        if (!text) return;
                        await supabase.from('messages').insert({
                          team_id: 'RC', team_name: 'RC', text,
                        });
                        input.value = '';
                        showToast('Messaggio inviato dalla Direzione Gara 🏁');
                      }}
                      className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/30 transition-all flex-shrink-0"
                    >
                      Invia
                    </button>
                  </div>
                </div>
              )}

              {/* Sync automatico — appare solo se ci sono GP da sincronizzare */}
              <JolpicaSync gps={gps} onSynced={() => refreshData(selectedGp)} />

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
                        showToast('Password errata.', 'err');
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
                      <p className="text-white/20 text-[8px] sm:text-[10px] uppercase tracking-[0.3em] font-bold">Official Classification: {selectedGp?.name}{selectedGp?.cancelled ? " — 🚫 CANCELLATO" : ""}</p>
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
                  {fetchStatus === 'error' && fetchError && (
                    <div className="px-4 py-2 bg-red-900/20 border border-red-500/20 rounded-xl">
                      <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Errore fetch</p>
                      <p className="text-[9px] text-red-300/70 mt-0.5 font-mono break-all">{fetchError}</p>
                    </div>
                  )}

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

                  {/* Editor classifica completa */}
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Classifica completa</p>
                    <ClassificationEditor
                      gpId={selectedGp?.id || ''}
                      value={classificationDraft}
                      onChange={(rows) => {
                        setClassificationDraft(rows);
                        // Auto-popola p1/p2/p3 dai primi classificati non-DNF
                        const finishers = rows.filter(r => !r.dnf).sort((a, b) => a.pos - b.pos);
                        if (finishers[0]) setResP1(finishers[0].name);
                        if (finishers[1]) setResP2(finishers[1].name);
                        if (finishers[2]) setResP3(finishers[2].name);
                        // Auto-popola DNF
                        const dnfList = rows.filter(r => r.dnf).map(r => r.name);
                        if (dnfList.length > 0) setDnfs(dnfList.join(', '));
                        // Auto-popola rimonte (partito 11°+ arrivato top10)
                        const rimontaList = rows.filter(r => !r.dnf && r.pos <= 10 && r.startPos >= 11).map(r => r.name);
                        if (rimontaList.length > 0) setRimonte(rimontaList.join(', '));
                      }}
                    />
                  </div>

                  <button type="submit" disabled={selectedGp?.cancelled} className="f1-button w-full py-6 text-xl disabled:opacity-30 disabled:cursor-not-allowed">Publish Official Results</button>
                </form>
              )}
                </div>
              </div>
            
            
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      {/* Score Preview Modal */}
      {showScorePreview && selectedGp && (
        <ScorePreview
          predictions={predictions}
          gpId={selectedGp.id}
          result={{
            p1: resP1, p2: resP2, p3: resP3,
            dnf: dnfs.split(',').map(s => s.trim()).filter(Boolean),
            penalties: penalties.split(',').map(s => s.trim()).filter(Boolean),
            rimonta: rimonte,
          }}
          onConfirm={handleConfirmPublish}
          onCancel={() => setShowScorePreview(false)}
          isSubmitting={isPublishing}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-black italic uppercase tracking-widest shadow-2xl transition-all ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      </main>
    </div>
  );
}
