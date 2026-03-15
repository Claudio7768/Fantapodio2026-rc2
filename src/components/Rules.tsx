import { BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';

export function Rules() {
  const scoring = [
    { pts: '+25', label: 'Pilota in posizione esatta',                         color: 'text-yellow-400' },
    { pts: '+10', label: 'Pilota nel podio, posizione sbagliata',               color: 'text-primary' },
    { pts: '+20', label: 'Bonus En Plein — podio esatto nell'ordine',          color: 'text-green-400' },
    { pts: '+10', label: 'Bonus Rimonta Killer — parte 11°+ e arriva a podio',  color: 'text-blue-400' },
    { pts: '−10', label: 'Malus DNF — pilota pronosticato ritirato',            color: 'text-red-400' },
    { pts: '−5',  label: 'Malus Penalità FIA — pilota penalizzato e scalato',   color: 'text-orange-400' },
  ];

  return (
    <section className="f1-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Scoring System</h3>
      </div>

      <div className="space-y-2">
        {scoring.map((r, i) => (
          <div key={i} className={`flex items-center gap-4 p-3 bg-white/[0.02] rounded-xl border border-white/5 ${
            r.pts.startsWith('−') ? 'border-red-500/10' :
            r.pts === '+20' ? 'border-green-500/10' :
            r.pts === '+10' && i === 3 ? 'border-blue-500/10' : ''
          }`}>
            <span className={`w-10 text-center font-black italic text-base flex-shrink-0 ${r.color}`}>
              {r.pts}
            </span>
            <span className="text-[11px] text-white/40 font-bold uppercase tracking-wide leading-tight">{r.label}</span>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-white/15 font-bold uppercase tracking-widest italic leading-relaxed">
        Pronostici chiusi all'inizio della gara. Max 3 tentativi per GP.
      </p>
    </section>
  );
}
