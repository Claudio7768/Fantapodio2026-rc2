import { Trophy, Zap, TrendingUp, Loader2 } from 'lucide-react';
import { DriverResult } from '@/lib/openf1';

const TEAM_COLORS: Record<string, string> = {
  'McLaren':      '#FF8000',
  'Red Bull':     '#3671C6',
  'Ferrari':      '#E8002D',
  'Mercedes':     '#27F4D2',
  'Aston Martin': '#229971',
  'Alpine':       '#FF87BC',
  'Williams':     '#64C4FF',
  'Racing Bulls': '#6692FF',
  'Haas':         '#B6BABD',
  'Audi':         '#C9D246',
  'Cadillac':     '#FFFFFF',
};

function teamColor(team: string): string {
  const key = Object.keys(TEAM_COLORS).find(k => team.includes(k));
  return key ? TEAM_COLORS[key] : '#555';
}

// Gap al pilota precedente in classifica
function gapToPrev(classification: DriverResult[], idx: number): string {
  const d = classification[idx];
  if (idx === 0) return '—';
  if (d.dnf) return 'DNF';
  if (d.gap.includes('LAP')) return d.gap;
  if (d.gap === '—') return '—';

  const curr = d.gapToLeader;
  const prev = classification[idx - 1]?.gapToLeader;

  // Se entrambi hanno gap numerico → differenza
  if (curr !== null && curr !== undefined && prev !== null && prev !== undefined) {
    const diff = curr - prev;
    if (diff >= 60) {
      const m = Math.floor(diff / 60);
      const s = (diff % 60).toFixed(3).padStart(6, '0');
      return `+${m}:${s}`;
    }
    return `+${diff.toFixed(3)}`;
  }
  // fallback: mostra gap al leader
  return d.gap;
}

interface Props {
  classification: DriverResult[];
  gpName: string;
  loading?: boolean;
}

export function RaceClassification({ classification, gpName, loading }: Props) {
  if (loading) {
    return (
      <div className="f1-card p-8 flex flex-col items-center gap-3 text-white/20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-[8px] font-black uppercase tracking-widest">Caricamento classifica...</p>
      </div>
    );
  }

  if (!classification.length) {
    return (
      <div className="f1-card p-6 text-center opacity-30">
        <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Nessuna classifica</p>
        <p className="text-[7px] text-white/20 mt-1">Usa Fetch Results per caricare</p>
      </div>
    );
  }

  return (
    <div className="f1-card overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-4 py-2.5 flex items-center gap-2">
        <Trophy className="w-3.5 h-3.5 text-white flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/60">Race Classification</p>
          <p className="text-[10px] font-black italic uppercase text-white leading-tight truncate">{gpName}</p>
        </div>
      </div>

      {/* Colonne header */}
      <div className="grid grid-cols-[20px_10px_36px_1fr] gap-x-2 px-3 py-1 bg-white/[0.03] border-b border-white/5">
        {['P', '', 'DRV', 'GAP'].map((h, i) => (
          <span key={i} className="text-[6px] font-black uppercase tracking-widest text-white/20">{h}</span>
        ))}
      </div>

      {/* Righe */}
      <div className="divide-y divide-white/[0.03]">
        {classification.map((d, idx) => {
          const color = teamColor(d.team);
          const gap = gapToPrev(classification, idx);
          const isRimonta = !d.dnf && d.pos <= 10 && d.startPos >= 11;

          return (
            <div
              key={d.number}
              className={`grid grid-cols-[20px_10px_36px_1fr] gap-x-2 items-center px-3 py-[5px] ${
                d.dnf ? 'opacity-25' : idx < 3 ? 'bg-white/[0.015]' : ''
              }`}
            >
              {/* Posizione */}
              <span className={`text-[10px] font-black tabular-nums leading-none ${
                idx === 0 ? 'text-yellow-400' :
                idx === 1 ? 'text-zinc-300' :
                idx === 2 ? 'text-orange-500' :
                'text-white/25'
              }`}>
                {d.dnf ? '–' : d.pos}
              </span>

              {/* Barra colore team */}
              <div className="w-[3px] h-3.5 rounded-full" style={{ backgroundColor: color }} />

              {/* Acronimo + icone */}
              <div className="flex items-center gap-1 min-w-0">
                <span className={`text-[11px] font-black italic tracking-wide leading-none ${
                  d.dnf ? 'line-through text-white/30' : 'text-white'
                }`}>
                  {d.acronym}
                </span>
                {d.fastestLap && !d.dnf && <Zap className="w-2 h-2 text-purple-400 flex-shrink-0" />}
                {isRimonta && <TrendingUp className="w-2 h-2 text-green-400 flex-shrink-0" />}
              </div>

              {/* Gap al precedente */}
              <span className={`text-[9px] font-black tabular-nums leading-none ${
                idx === 0 ? 'text-white/20' :
                d.dnf ? 'text-red-400' :
                d.gap.includes('LAP') ? 'text-orange-400' :
                'text-white/40'
              }`}>
                {gap}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="px-3 py-1.5 border-t border-white/5 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Zap className="w-2 h-2 text-purple-400" />
          <span className="text-[6px] text-white/20 font-black uppercase tracking-wide">Fastest</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-2 h-2 text-green-400" />
          <span className="text-[6px] text-white/20 font-black uppercase tracking-wide">Rimonta</span>
        </div>
      </div>
    </div>
  );
}
