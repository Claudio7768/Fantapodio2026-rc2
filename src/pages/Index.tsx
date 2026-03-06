import { useState, useEffect } from "react";
import {
  getTeams, getGPs, getNextGP, getPredictions, getResults,
  getCurrentUser, loginUser, logoutUser, registerUser,
  savePrediction, saveResult, adminReset,
  DEFAULT_TEAMS, DEFAULT_GPS,
} from "@/lib/storage";
import type { Team, GP, Prediction, User, Result } from "@/types";

// ─── Scoring ────────────────────────────────────────────────────────────────

function calcScore(pred: Prediction, res: Result): number {
  let score = 0;
  const rp = [res.p1, res.p2, res.p3];
  const pp = [pred.p1, pred.p2, pred.p3];
  pp.forEach((driver, i) => {
    if (driver === rp[i]) score += 25;
    else if (rp.includes(driver)) score += 10;
  });
  return score;
}

function buildLeaderboard(teams: Team[], predictions: Prediction[], results: Result[]) {
  return teams
    .map((team) => {
      const tp = predictions.filter((p) => p.team_id === team.id);
      const score = tp.reduce((tot, pred) => {
        const res = results.find((r) => r.gp_id === pred.gp_id);
        return res ? tot + calcScore(pred, res) : tot;
      }, 0);
      return { team, score, count: tp.length };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── Login / Register Form ────────────────────────────────────────────────────

function AuthForm({
  onLogin,
  onRegister,
}: {
  onLogin: (name: string, pw: string) => void;
  onRegister: (name: string, pw: string) => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pw.trim()) return;
    setLoading(true);
    if (tab === "login") await onLogin(name.trim(), pw);
    else await onRegister(name.trim(), pw);
    setLoading(false);
  };

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
          <p className="text-white/40 text-xs uppercase tracking-widest font-black">
            Race Control
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
                tab === t
                  ? "bg-primary text-white"
                  : "bg-white/5 text-white/40 hover:bg-white/10"
              }`}
            >
              {t === "login" ? "Accedi" : "Registrati"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handle} className="space-y-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/20">
              Nome Team
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Team CL"
              className="f1-input"
              required
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/20">
              Password
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              className="f1-input"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="f1-button w-full py-4 text-base disabled:opacity-50"
          >
            {loading ? "Caricamento..." : tab === "login" ? "Accedi" : "Registrati"}
          </button>
        </form>

        <p className="text-center text-white/20 text-[10px] uppercase tracking-widest">
          Teams: CL · ML · FL
        </p>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function Index() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [gps, setGPs] = useState<GP[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [currentGP, setCurrentGP] = useState<GP | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Prediction form state
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");

  // Admin result form state
  const [rp1, setRp1] = useState("");
  const [rp2, setRp2] = useState("");
  const [rp3, setRp3] = useState("");
  const [dnf, setDnf] = useState("");
  const [penalties, setPenalties] = useState("");
  const [rimonta, setRimonta] = useState("");

  // ── Load data ──────────────────────────────────────────────────────────────

  const refresh = async () => {
    const [t, g, p, r, nextGP] = await Promise.all([
      getTeams(),
      getGPs(),
      getPredictions(),
      getResults(),
      getNextGP(),
    ]);
    setTeams(t);
    setGPs(g);
    setPredictions(p);
    setResults(r);
    setCurrentGP(nextGP);
  };

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    refresh().finally(() => setLoading(false));
  }, []);

  // Pre-fill prediction form when GP or user changes
  useEffect(() => {
    if (user && currentGP) {
      const existing = predictions.find(
        (p) => p.team_id === user.team_id && p.gp_id === currentGP.id
      );
      if (existing) {
        setP1(existing.p1);
        setP2(existing.p2);
        setP3(existing.p3);
      } else {
        setP1(""); setP2(""); setP3("");
      }
    }
  }, [currentGP, user, predictions]);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const handleLogin = async (name: string, pw: string) => {
    const res = await loginUser(name, pw);
    if (res.success && res.user) {
      setUser(res.user);
      await refresh();
    } else {
      alert(`Errore: ${res.error}`);
    }
  };

  const handleRegister = async (name: string, pw: string) => {
    const res = await registerUser(name, pw);
    if (res.success) {
      alert("Registrazione completata! Ora puoi effettuare il login.");
    } else {
      alert(`Errore: ${res.error}`);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  // ── Save prediction ───────────────────────────────────────────────────────

  const handleSavePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGP || !user || !p1 || !p2 || !p3) return;
    setSaving(true);
    const res = await savePrediction(currentGP.id, user.team_id, p1, p2, p3);
    if (res.success) {
      await refresh();
      alert("Pronostico salvato con successo! 🏎️");
    } else {
      alert(`Errore: ${res.error}`);
    }
    setSaving(false);
  };

  // ── Save result (admin) ───────────────────────────────────────────────────

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGP || !rp1 || !rp2 || !rp3) return;
    setSaving(true);
    const res = await saveResult(
      currentGP.id, rp1, rp2, rp3,
      dnf.split(",").map((s) => s.trim()).filter(Boolean),
      penalties.split(",").map((s) => s.trim()).filter(Boolean),
      rimonta
    );
    if (res.success) {
      await refresh();
      setActiveTab("dashboard");
      alert("Risultati salvati e punteggi aggiornati!");
    } else {
      alert(`Errore: ${res.error}`);
    }
    setSaving(false);
  };

  // ── Admin reset ───────────────────────────────────────────────────────────

  const handleAdminReset = async () => {
    const pw = prompt("Inserisci la password per il reset:");
    if (!pw) return;
    const ok = await adminReset(pw);
    if (ok) {
      logoutUser();
      setUser(null);
      await refresh();
      alert("Reset completato.");
    } else {
      alert("Password errata.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-primary font-black italic text-4xl animate-pulse">F1</div>
          <p className="text-white/40 text-xs uppercase tracking-widest">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const leaderboard = buildLeaderboard(teams, predictions, results);
  const tabs = ["dashboard", "pronostico", "risultati", "admin"];

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-primary font-black italic text-xl sm:text-2xl">F1</span>
            <h1 className="text-lg sm:text-xl font-black tracking-tighter italic uppercase leading-none">
              Fantapodio <span className="text-primary">2026</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xs font-black uppercase hidden sm:block">
              {user.team_name}
            </span>
            <button
              onClick={handleLogout}
              className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Esci
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex gap-1 pb-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10">

        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-10">
            {/* Next GP banner */}
            {currentGP && (
              <div className="f1-card p-6 sm:p-8 border-t-4 border-t-primary">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">
                  Prossimo GP
                </p>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tighter italic uppercase">
                  {currentGP.name}
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  {currentGP.circuit} · {currentGP.date}
                </p>
              </div>
            )}

            {/* Leaderboard */}
            <div className="f1-card p-6 sm:p-8 space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-white/20">
                Classifica
              </h2>
              {leaderboard.map(({ team, score, count }, idx) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-2xl font-black italic ${
                        idx === 0 ? "text-primary" : "text-white/20"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-black uppercase tracking-wide text-sm">{team.name}</p>
                      <p className="text-white/20 text-[10px]">{count} pronostici</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-primary">{score}</span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-white/20 text-sm text-center py-4">
                  Nessun pronostico ancora. Sii il primo! 🏎️
                </p>
              )}
            </div>

            {/* GP Calendar */}
            <div className="f1-card p-6 sm:p-8 space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-white/20">
                Calendario 2026
              </h2>
              <div className="space-y-2">
                {gps.map((gp) => {
                  const res = results.find((r) => r.gp_id === gp.id);
                  const myPred = predictions.find(
                    (p) => p.gp_id === gp.id && p.team_id === user.team_id
                  );
                  return (
                    <div
                      key={gp.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        gp.completed
                          ? "border-white/5 bg-white/[0.02] opacity-60"
                          : currentGP?.id === gp.id
                          ? "border-primary/20 bg-primary/5"
                          : "border-white/5 bg-white/[0.01]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            gp.completed ? "bg-green-500" : currentGP?.id === gp.id ? "bg-primary" : "bg-white/20"
                          }`}
                        />
                        <div>
                          <p className="font-black text-xs uppercase tracking-wide">{gp.name}</p>
                          <p className="text-white/20 text-[10px]">{gp.circuit} · {gp.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        {myPred && <span className="text-primary">✓ pronostico</span>}
                        {res && <span className="text-green-500">✓ risultato</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PRONOSTICO ── */}
        {activeTab === "pronostico" && (
          <div className="max-w-lg mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-black tracking-tighter italic uppercase">
                Il tuo Pronostico
              </h2>
              {currentGP && (
                <p className="text-white/40 text-sm mt-1">{currentGP.name}</p>
              )}
            </div>

            {!currentGP ? (
              <div className="f1-card p-8 text-center">
                <p className="text-white/40">Nessun GP disponibile per i pronostici.</p>
                <p className="text-white/20 text-sm mt-2">
                  The next race classification is not yet available.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSavePrediction} className="f1-card p-6 sm:p-8 space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                  Podio Previsto — {currentGP.name}
                </p>

                {[
                  { label: "🥇 1° Posto (P1)", value: p1, set: setP1 },
                  { label: "🥈 2° Posto (P2)", value: p2, set: setP2 },
                  { label: "🥉 3° Posto (P3)", value: p3, set: setP3 },
                ].map(({ label, value, set }) => (
                  <div key={label} className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20">
                      {label}
                    </label>
                    <input
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      placeholder="Es. Verstappen"
                      className="f1-input"
                      required
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={saving}
                  className="f1-button w-full py-6 text-xl disabled:opacity-50"
                >
                  {saving ? "Salvataggio..." : "Salva Pronostico 🏎️"}
                </button>
              </form>
            )}

            {/* All predictions for this GP */}
            {currentGP && (
              <div className="f1-card p-6 sm:p-8 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20">
                  Pronostici di tutti — {currentGP.name}
                </h3>
                {predictions
                  .filter((p) => p.gp_id === currentGP.id)
                  .map((pred) => {
                    const team = teams.find((t) => t.id === pred.team_id);
                    return (
                      <div
                        key={pred.team_id}
                        className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                      >
                        <span className="font-black text-sm uppercase">{team?.name || pred.team_id}</span>
                        <span className="text-white/40 text-xs">
                          {pred.p1} · {pred.p2} · {pred.p3}
                        </span>
                      </div>
                    );
                  })}
                {predictions.filter((p) => p.gp_id === currentGP.id).length === 0 && (
                  <p className="text-white/20 text-sm text-center py-2">
                    Nessun pronostico ancora per questo GP.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── RISULTATI ── */}
        {activeTab === "risultati" && (
          <div className="space-y-10">
            <h2 className="text-2xl font-black tracking-tighter italic uppercase">
              Risultati Ufficiali
            </h2>
            {results.length === 0 ? (
              <div className="f1-card p-8 text-center">
                <p className="text-white/40">Nessun risultato ufficiale ancora.</p>
              </div>
            ) : (
              results.map((res) => {
                const gp = gps.find((g) => g.id === res.gp_id);
                const gpPredictions = predictions.filter((p) => p.gp_id === res.gp_id);
                return (
                  <div key={res.gp_id} className="f1-card p-6 sm:p-8 space-y-6">
                    <div className="border-t-4 border-t-primary -mt-6 sm:-mt-8 -mx-6 sm:-mx-8 px-6 sm:px-8 pt-6 sm:pt-8">
                      <h3 className="font-black uppercase tracking-tighter text-xl">{gp?.name}</h3>
                      <p className="text-primary font-black text-sm mt-1">
                        Podio: {res.p1} · {res.p2} · {res.p3}
                      </p>
                      {res.dnf.length > 0 && (
                        <p className="text-white/40 text-xs mt-1">DNF: {res.dnf.join(", ")}</p>
                      )}
                    </div>

                    {/* Scores for this GP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gpPredictions.map((pred) => {
                        const team = teams.find((t) => t.id === pred.team_id);
                        const score = calcScore(pred, res);
                        return (
                          <div
                            key={pred.team_id}
                            className="bg-white/5 rounded-xl p-4 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-black text-sm uppercase">{team?.name}</p>
                              <p className="text-white/40 text-xs">
                                {pred.p1} · {pred.p2} · {pred.p3}
                              </p>
                            </div>
                            <span className={`text-xl font-black ${score > 0 ? "text-primary" : "text-white/20"}`}>
                              +{score}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── ADMIN ── */}
        {activeTab === "admin" && (
          <div className="max-w-lg mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-black tracking-tighter italic uppercase">
                Admin Panel
              </h2>
              <p className="text-white/40 text-sm mt-1">Inserisci i risultati ufficiali del GP</p>
            </div>

            {!currentGP ? (
              <div className="f1-card p-8 text-center">
                <p className="text-white/40">Nessun GP disponibile.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveResult} className="f1-card p-6 sm:p-8 space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                  Risultati Ufficiali — {currentGP.name}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "🥇 P1", value: rp1, set: setRp1 },
                    { label: "🥈 P2", value: rp2, set: setRp2 },
                    { label: "🥉 P3", value: rp3, set: setRp3 },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/20">
                        {label}
                      </label>
                      <input
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        placeholder="Pilota"
                        className="f1-input"
                        required
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20">
                      Ritirati (DNF)
                    </label>
                    <input
                      value={dnf}
                      onChange={(e) => setDnf(e.target.value)}
                      placeholder="Verstappen, Hamilton..."
                      className="f1-input"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20">
                      Penalità FIA
                    </label>
                    <input
                      value={penalties}
                      onChange={(e) => setPenalties(e.target.value)}
                      placeholder="Perez, Alonso..."
                      className="f1-input"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20">
                      Rimonta Killer (11°+ → Top 10)
                    </label>
                    <input
                      value={rimonta}
                      onChange={(e) => setRimonta(e.target.value)}
                      placeholder="Norris, Bearman..."
                      className="f1-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="f1-button w-full py-6 text-xl disabled:opacity-50"
                >
                  {saving ? "Salvataggio..." : "Pubblica Risultati Ufficiali"}
                </button>
              </form>
            )}

            {/* Reset */}
            <div className="f1-card p-6 border-destructive/50 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20">
                Zona Pericolosa
              </h3>
              <p className="text-white/40 text-sm">
                Il reset cancella tutti i dati: utenti, pronostici e risultati.
              </p>
              <button
                onClick={handleAdminReset}
                className="f1-button w-full py-4 bg-destructive hover:bg-destructive/80"
              >
                Reset Completo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
