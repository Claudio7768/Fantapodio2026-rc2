import { useState } from 'react';
import { ChevronUp, ChevronDown, Zap, Download, Loader2 } from 'lucide-react';
import { DRIVERS } from '@/lib/constants';
import type { DriverResult } from '@/lib/openf1';

interface Props {
  gpId: string;
  value: DriverResult[];
  onChange: (rows: DriverResult[]) => void;
}

// Mappa GP ID → numero round 2026
const GP_ROUND: Record<string, number> = {
  australia: 1, china: 2, japan: 3, bahrain: 4, saudi: 5,
  miami: 6, canada: 7, monaco: 8, barcelona: 9, austria: 10,
  britain: 11, belgium: 12, hungary: 13, netherlands: 14, italy: 15,
  madrid: 16, azerbaijan: 17, singapore: 18, usa: 19, mexico: 20,
  brazil: 21, lasvegas: 22, qatar: 23, abudhabi: 24,
};

// Mappa constructor name Jolpica → team name app
const TEAM_MAP: Record<string, string> = {
  'Mercedes': 'Mercedes', 'Ferrari': 'Ferrari', 'Red Bull': 'Red Bull',
  'McLaren': 'McLaren', 'Aston Martin': 'Aston Martin', 'Alpine F1 Team': 'Alpine',
  'Williams': 'Williams', 'RB F1 Team': 'Racing Bulls', 'Haas F1 Team': 'Haas',
  'Kick Sauber': 'Cadillac', 'Audi': 'Audi', 'Cadillac': 'Cadillac',
};

const TEAM_COLORS: Record<string, string> = {
  'McLaren': '#FF8000', 'Red Bull': '#3671C6', 'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2', 'Aston Martin': '#229971', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'Racing Bulls': '#6692FF', 'Haas': '#B6BABD',
  'Audi': '#C9D246', 'Cadillac': '#FFFFFF',
};

function teamColor(team: string) {
  const k = Object.keys(TEAM_COLORS).find(t => team.includes(t));
  return k ? TEAM_COLORS[k] : '#555';
}

function initRows(existing: DriverResult[]): DriverResult[] {
  if (existing.length > 0) return existing;
  return DRIVERS.map((d, i) => ({
    pos: i + 1, number: d.number, name: d.name,
    acronym: d.name.slice(0, 3).toUpperCase(), team: d.team,
    gap: i === 0 ? 'WINNER' : '', gapToLeader: null,
    fastestLap: false, dnf: false, startPos: i + 1,
  }));
}

export function ClassificationEditor({ gpId, value, onChange }: Props) {
  const [rows, setRows] = useState<DriverResult[]>(() => initRows(value));
  const [loading, setLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [loadMsg, setLoadMsg] = useState('');

  // ── Carica da Jolpica API ─────────────────────────────────
  const loadFromJolpica = async () => {
    const round = GP_ROUND[gpId];
    if (!round) { setLoadStatus('err'); setLoadMsg('Round non trovato per questo GP'); return; }

    setLoading(true);
    setLoadStatus('idle');
    setLoadMsg('');

    try {
      const url = `https://api.jolpi.ca/ergast/f1/2026/${round}/results.json?limit=30`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Jolpica API → ${res.status}`);
      const json = await res.json();

      const races = json?.MRData?.RaceTable?.Races;
      if (!races?.length) throw new Error('Nessun risultato trovato — gara non ancora disputata?');

      const results = races[0].Results;
      if (!results?.length) throw new Error('Risultati vuoti');

      // Trova il driver con fastest lap
      const fastestLapDriver = results.find((r: any) => r.FastestLap?.rank === '1');

      const newRows: DriverResult[] = results.map((r: any, idx: number) => {
        // Doppiati: status è "+N Lap/Laps" — non sono DNF
        const isLapped = /^\+\d+ Lap/.test(r.status);
        const isDns = r.status === 'Did not start' || r.grid === '0';
        const isDnf = !isDns && !isLapped && r.status !== 'Finished';

        let gap = '';
        if (idx === 0) gap = 'WINNER';
        else if (isDns) gap = 'DNS';
        else if (isDnf) gap = 'DNF';
        else if (isLapped) gap = r.status.toUpperCase().replace('LAPS', 'LAPS').replace('LAP', 'LAP'); // es. "+1 LAP"
        else if (r.Time?.time) gap = '+' + r.Time.time;
        else gap = r.status || '—';

        // Mappa nome Jolpica → nome nell'app (usa familyName)
        const jolpicaName = r.Driver.familyName;
        // Cerca corrispondenza in DRIVERS
        const appDriver = DRIVERS.find(d =>
          d.name.toLowerCase() === jolpicaName.toLowerCase() ||
          d.name.toLowerCase().includes(jolpicaName.toLowerCase()) ||
          jolpicaName.toLowerCase().includes(d.name.toLowerCase())
        );

        const teamRaw = r.Constructor.name;
        const team = TEAM_MAP[teamRaw] || teamRaw;

        return {
          pos: parseInt(r.position) || idx + 1,
          number: parseInt(r.number) || 0,
          name: appDriver?.name || jolpicaName,
          acronym: r.Driver.code || jolpicaName.slice(0, 3).toUpperCase(),
          team,
          gap,
          gapToLeader: null,
          fastestLap: fastestLapDriver?.Driver?.driverId === r.Driver.driverId,
          dnf: isDnf || isDns,
          startPos: parseInt(r.grid) || idx + 1,
        };
      });

      setRows(newRows);
      onChange(newRows);
      setLoadStatus('ok');
      setLoadMsg(`✓ ${results.length} piloti caricati — ${races[0].raceName} ${races[0].date}`);
    } catch (e: any) {
      setLoadStatus('err');
      setLoadMsg(e.message || 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  const update = (idx: number, field: keyof DriverResult, val: any) => {
    const next = rows.map((r, i) => i === idx ? { ...r, [field]: val } : r);
    if (field === 'dnf' && val) next[idx] = { ...next[idx], gap: 'DNF' };
    setRows(next);
    onChange(next);
  };

  const moveRow = (idx: number, dir: -1 | 1) => {
    const next = [...rows];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    const reindexed = next.map((r, i) => ({
      ...r, pos: i + 1,
      gap: i === 0 && !r.dnf ? 'WINNER' : r.gap,
    }));
    setRows(reindexed);
    onChange(reindexed);
  };

  const autoNumberPos = () => {
    const reindexed = rows.map((r, i) => ({
      ...r, pos: i + 1,
      gap: i === 0 ? 'WINNER' : r.dnf ? 'DNF' : r.gap,
    }));
    setRows(reindexed);
    onChange(reindexed);
  };

  return (
    <div className="space-y-3">
      {/* Bottone carica da internet */}
      <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-2xl">
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Classifica ufficiale</p>
          <p className="text-[9px] text-white/15 font-bold mt-0.5">
            {loadStatus === 'ok' ? loadMsg : loadStatus === 'err' ? `✗ ${loadMsg}` : 'Carica i risultati ufficiali FIA da Jolpica F1'}
          </p>
        </div>
        <button
          type="button"
          onClick={loadFromJolpica}
          disabled={loading || !GP_ROUND[gpId]}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black italic uppercase tracking-widest transition-all ${
            loading ? 'bg-white/10 text-white/30 cursor-wait' :
            loadStatus === 'ok' ? 'bg-green-600/30 text-green-400 border border-green-600/30' :
            loadStatus === 'err' ? 'bg-red-600/20 text-red-400 border border-red-600/20' :
            'bg-primary/20 text-primary border border-primary/20 hover:bg-primary hover:text-white'
          }`}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {loading ? 'Caricamento...' : loadStatus === 'ok' ? 'Ricarica' : 'Carica da internet'}
        </button>
      </div>

      {/* Griglia piloti */}
      {rows.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
              {rows.length} piloti — modifica se necessario
            </span>
            <button type="button" onClick={autoNumberPos}
              className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors px-2 py-1 bg-primary/10 rounded-lg">
              Rinumera
            </button>
          </div>

          {/* Header */}
          <div className="grid gap-1 text-[8px] font-black uppercase tracking-widest text-white/20 px-1"
               style={{ gridTemplateColumns: '24px 8px 80px 32px 1fr 44px 32px 26px' }}>
            <span>↕</span><span></span><span>Pilota</span><span>P.</span>
            <span>Gap</span><span>Grid</span><span>DNF</span><span>FL</span>
          </div>

          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
            {rows.map((row, idx) => (
              <div key={row.number + '-' + idx}
                className={`grid items-center gap-1 p-1.5 rounded-xl border transition-all ${
                  row.dnf ? 'bg-white/[0.01] border-white/5 opacity-40'
                  : idx < 3 ? 'bg-white/[0.03] border-white/10'
                  : 'bg-white/[0.02] border-white/5'
                }`}
                style={{ gridTemplateColumns: '24px 8px 80px 32px 1fr 44px 32px 26px' }}
              >
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveRow(idx, -1)} className="text-white/20 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
                  <button type="button" onClick={() => moveRow(idx, 1)} className="text-white/20 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
                </div>
                <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: teamColor(row.team) }} />
                <span className={`text-[10px] font-black italic uppercase truncate ${row.dnf ? 'line-through text-white/30' : 'text-white'}`}>
                  {row.name}
                </span>
                <input type="number" min={1} max={30} value={row.pos}
                  onChange={e => update(idx, 'pos', parseInt(e.target.value) || idx + 1)}
                  className="f1-input py-1 px-1 text-center text-[10px] font-black" />
                <input type="text" value={row.gap} placeholder={idx === 0 ? 'WINNER' : '+0.000'}
                  onChange={e => update(idx, 'gap', e.target.value)}
                  className="f1-input py-1 px-1.5 text-[10px] font-mono" />
                <input type="number" min={0} max={30} value={row.startPos}
                  onChange={e => update(idx, 'startPos', parseInt(e.target.value) || 1)}
                  className="f1-input py-1 px-1 text-center text-[10px] font-black" />
                <button type="button" onClick={() => update(idx, 'dnf', !row.dnf)}
                  className={`text-[8px] font-black uppercase rounded-lg px-1 py-1 transition-all ${
                    row.dnf ? 'bg-red-500/30 text-red-400' : 'bg-white/5 text-white/20 hover:bg-white/10'}`}>
                  DNF
                </button>
                <button type="button" onClick={() => {
                    const next = rows.map((r, i) => ({ ...r, fastestLap: i === idx ? !row.fastestLap : false }));
                    setRows(next); onChange(next);
                  }}
                  className={`flex items-center justify-center rounded-lg p-1 transition-all ${
                    row.fastestLap ? 'bg-purple-500/30 text-purple-400' : 'bg-white/5 text-white/20 hover:bg-white/10'}`}>
                  <Zap className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
