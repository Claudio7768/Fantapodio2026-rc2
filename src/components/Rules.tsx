import { BookOpen } from 'lucide-react';

export function Rules() {
  const rules = [
    { pts: '25', label: 'Pilota in posizione esatta' },
    { pts: '10', label: 'Pilota nel podio, posizione sbagliata' },
    { pts: '0',  label: 'Pilota fuori dal podio' },
  ];

  return (
    <section className="f1-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Scoring System</h3>
      </div>

      <div className="space-y-3">
        {rules.map((r, i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-xl border border-white/5">
            <span className={`w-10 text-center font-black italic text-lg ${r.pts === '25' ? 'text-yellow-400' : r.pts === '10' ? 'text-primary' : 'text-white/20'}`}>
              {r.pts}
            </span>
            <span className="text-xs text-white/40 font-bold uppercase tracking-wide">{r.label}</span>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-white/15 font-bold uppercase tracking-widest italic leading-relaxed">
        Pronostici chiusi all'inizio della gara. Max 3 tentativi per GP.
      </p>
    </section>
  );
}
