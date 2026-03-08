import { Trophy, Zap, TrendingUp } from 'lucide-react';
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

// Formatta secondi → "+5.234" oppure "+1:02.345" oppure "+1 LAP"
function formatGap(raw: string): string {
  if (!raw || raw === 'WINNER' || raw === 'DNF' || raw === '—') return raw;
  if (raw.includes('LAP')) return raw;

  // raw è tipo "+5.234" o "+65.123" — converti se > 60s
  const val = parseFloat(raw.replace('+', ''));
  if (isNaN(val)) return raw;

  if (val >= 60) {
    const mins = Math.floor(val / 60);
    const secs = (val % 60).toFixed(3).padStart(6, '0');
    return `+${mins}:${secs}`;
  }
  return `+${val.toFixed(3)}`;
}

// Calcola gap al pilota precedente dalla classifica
// classification[i].gap è gap_to_leader → differenza tra consecutivi
function gapToPrev(classification: DriverResult[], idx: number): string {
  if (idx === 0) return classification[0].gap; // tempo gara vincitore
  const curr = classification[idx];
  const prev = classification[idx - 1];
  if (curr.dnf) return 'DNF';
  if (curr.gap.includes('LAP')) return curr.gap;
  if (curr.gap === '—') return '—';

  // Entrambi hanno gap numerico — sottrai
  const gapCurr = parseFloat(curr.gap.replace('+', ''));
  const gapPrev = parseFloat(prev.gap.replace('+', ''));
  if (isNaN(gapCurr) || isNaN(gapPrev)) return curr.gap;
  const diff = gapCurr - gapPrev;
  return formatGap(`+${diff}`);
}

interface Props {
  classification: DriverResult[];
  gpName: string;
}

export function RaceClassification({ classification, gpName }: Props) {
  if (!classification.length) return null;

  return (
    <div className="f1-card overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-4 py-2.5 flex items-center gap-2">
        <Trophy className="w-3.5 h-3.5 text-white flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60">Race Classification</p>
          <p className="text-[10px] font-black italic uppercase text-white leading-tight truncate">{gpName}</p>
        </div>
      </div>

      {/* Header colonne */}
      <div className="grid grid-cols-[24px_12px_44px_1fr] gap-x-2 px-3 py-1 bg-white/[0.03] border-b border-white/5">
        {['P', '', 'DRV', 'GAP / TIME'].map((h, i) => (
          <span key={i} className="text-[7px] font-black uppercase tracking-widest text-white/20">{h}</span>
        ))}
      </div>

      {/* Righe */}
      <div className="divide-y divide-white/[0.03]">
        {classification.map((d, idx) => {
          const color = teamColor(d.team);
          const gap = gapToPrev(classification, idx);

          return (
            <div
              key={d.number}
              className={`grid grid-cols-[24px_12px_44px_1fr] gap-x-2 items-center px-3 py-1.5 ${
                d.dnf ? 'opacity-30' : idx < 3 ? 'bg-white/[0.015]' : ''
              }`}
            >
              {/* POS */}
              <span className={`text-[11px] font-black tabular-nums ${
                idx === 0 ? 'text-yellow-400' :
                idx === 1 ? 'text-zinc-300' :
                idx === 2 ? 'text-orange-500' :
                'text-white/30'
              }`}>
                {d.dnf ? '–' : d.pos}
              </span>

              {/* Barra colore team */}
              <div className="w-[3px] h-4 rounded-full" style={{ backgroundColor: color }} />

              {/* Acronimo 3 lettere */}
              <div className="flex items-center gap-1">
                <span className={`text-[11px] font-black italic tracking-wide ${d.dnf ? 'line-through text-white/30' : 'text-white'}`}>
                  {d.acronym}
                </span>
                {d.fastestLap && !d.dnf && (
                  <Zap className="w-2 h-2 text-purple-400 flex-shrink-0" />
                )}
                {!d.dnf && d.startPos >= 11 && d.pos <= 10 && (
                  <TrendingUp className="w-2 h-2 text-green-400 flex-shrink-0" />
                )}
              </div>

              {/* Gap al precedente */}
              <span className={`text-[10px] font-black tabular-nums ${
                idx === 0 ? 'text-white/50 text-[9px]' :
                d.gap === 'DNF' ? 'text-red-400' :
                d.gap.includes('LAP') ? 'text-orange-400' :
                'text-white/50'
              }`}>
                {idx === 0
                  ? (gap === 'WINNER' ? '–' : gap)
                  : (gap === 'DNF' ? 'DNF' : gap)
                }
              </span>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="px-3 py-1.5 border-t border-white/5 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Zap className="w-2 h-2 text-purple-400" />
          <span className="text-[7px] text-white/20 font-bold uppercase">Fastest</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-2 h-2 text-green-400" />
          <span className="text-[7px] text-white/20 font-bold uppercase">Rimonta</span>
        </div>
      </div>
    </div>
  );
}
