import { Trophy, Zap, TrendingUp } from 'lucide-react';
import { DriverResult } from '@/lib/openf1';

// Colori team F1 2026
const TEAM_COLORS: Record<string, string> = {
  'McLaren':        '#FF8000',
  'Red Bull':       '#3671C6',
  'Ferrari':        '#E8002D',
  'Mercedes':       '#27F4D2',
  'Aston Martin':   '#229971',
  'Alpine':         '#FF87BC',
  'Williams':       '#64C4FF',
  'Racing Bulls':   '#6692FF',
  'Haas':           '#B6BABD',
  'Audi':           '#C9D246',
  'Cadillac':       '#FFFFFF',
};

function teamColor(team: string): string {
  const key = Object.keys(TEAM_COLORS).find(k => team.includes(k));
  return key ? TEAM_COLORS[key] : '#666';
}

interface Props {
  classification: DriverResult[];
  gpName: string;
}

export function RaceClassification({ classification, gpName }: Props) {
  if (!classification.length) return null;

  return (
    <div className="f1-card overflow-hidden">
      {/* Header stile torre F1 */}
      <div className="bg-primary px-4 py-3 flex items-center gap-3">
        <Trophy className="w-4 h-4 text-white" />
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Race Classification</p>
          <p className="text-xs font-black italic uppercase text-white leading-tight truncate">{gpName}</p>
        </div>
      </div>

      {/* Header colonne */}
      <div className="grid grid-cols-[28px_36px_1fr_56px] gap-1 px-3 py-1.5 bg-white/5 border-b border-white/5">
        {['POS', 'NO', 'DRIVER', 'GAP'].map(h => (
          <span key={h} className="text-[7px] font-black uppercase tracking-widest text-white/20">{h}</span>
        ))}
      </div>

      {/* Righe piloti */}
      <div className="divide-y divide-white/[0.03]">
        {classification.map((d, idx) => {
          const color = teamColor(d.team);
          const isTop3 = idx < 3;
          const isWinner = idx === 0;

          return (
            <div
              key={d.number}
              className={`grid grid-cols-[28px_36px_1fr_56px] gap-1 items-center px-3 py-2 transition-colors ${
                d.dnf ? 'opacity-30' : isTop3 ? 'bg-white/[0.02]' : ''
              }`}
            >
              {/* POS */}
              <span className={`text-xs font-black tabular-nums ${
                isWinner ? 'text-yellow-400' :
                idx === 1 ? 'text-zinc-400' :
                idx === 2 ? 'text-orange-500' :
                'text-white/40'
              }`}>
                {d.dnf ? 'DNF' : d.pos}
              </span>

              {/* Numero con colore team */}
              <div className="flex items-center gap-1">
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-black text-white/50 tabular-nums">{d.number}</span>
              </div>

              {/* Nome + team */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black italic uppercase truncate ${d.dnf ? 'line-through' : ''}`}>
                    {d.name}
                  </span>
                  {d.fastestLap && !d.dnf && (
                    <Zap className="w-2.5 h-2.5 text-purple-400 flex-shrink-0" title="Giro più veloce" />
                  )}
                  {!d.dnf && d.startPos >= 11 && d.pos <= 10 && (
                    <TrendingUp className="w-2.5 h-2.5 text-green-400 flex-shrink-0" title="Rimonta killer" />
                  )}
                </div>
                <span className="text-[7px] text-white/20 font-bold uppercase tracking-wide truncate block">
                  {d.team.replace('Formula One', '').replace('Racing', '').trim()}
                </span>
              </div>

              {/* GAP */}
              <span className={`text-[9px] font-black tabular-nums text-right ${
                isWinner ? 'text-yellow-400 italic' :
                d.gap.includes('LAP') ? 'text-orange-400' :
                d.dnf ? 'text-red-400' :
                'text-white/50'
              }`}>
                {d.gap}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="px-3 py-2 border-t border-white/5 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-purple-400" />
          <span className="text-[7px] text-white/20 font-bold uppercase tracking-wide">Fastest lap</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-2.5 h-2.5 text-green-400" />
          <span className="text-[7px] text-white/20 font-bold uppercase tracking-wide">Rimonta killer</span>
        </div>
      </div>
    </div>
  );
}
