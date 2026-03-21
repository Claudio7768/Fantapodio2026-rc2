import { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DRIVERS } from '@/lib/constants';
import type { GP } from '@/lib/constants';

interface SyncResult {
  gpId: string;
  gpName: string;
  status: 'ok' | 'err' | 'skip' | 'pending';
  message: string;
}

const GP_ROUND: Record<string, number> = {
  australia: 1, china: 2, japan: 3, bahrain: 4, saudi: 5,
  miami: 6, canada: 7, monaco: 8, barcelona: 9, austria: 10,
  britain: 11, belgium: 12, hungary: 13, netherlands: 14, italy: 15,
  madrid: 16, azerbaijan: 17, singapore: 18, usa: 19, mexico: 20,
  brazil: 21, lasvegas: 22, qatar: 23, abudhabi: 24,
};

const TEAM_MAP: Record<string, string> = {
  'Mercedes': 'Mercedes', 'Ferrari': 'Ferrari', 'Red Bull': 'Red Bull',
  'McLaren': 'McLaren', 'Aston Martin': 'Aston Martin', 'Alpine F1 Team': 'Alpine',
  'Williams': 'Williams', 'RB F1 Team': 'Racing Bulls', 'Haas F1 Team': 'Haas',
  'Kick Sauber': 'Cadillac', 'Audi': 'Audi', 'Cadillac': 'Cadillac',
};

async function fetchFromJolpica(gpId: string) {
  const round = GP_ROUND[gpId];
  if (!round) throw new Error('Round non trovato');

  const res = await fetch(`https://api.jolpi.ca/ergast/f1/2026/${round}/results.json?limit=30`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  const races = json?.MRData?.RaceTable?.Races;
  if (!races?.length) throw new Error('Nessun risultato disponibile');

  const results = races[0].Results;
  const fastestDriver = results.find((r: any) => r.FastestLap?.rank === '1');

  const classification = results.map((r: any, idx: number) => {
    const posText = String(r.positionText || '');
    const isClassified = /^\d+$/.test(posText);
    const isDns = posText === 'W' || r.status === 'Did not start';
    const isDnf = !isClassified && !isDns;
    const isLapped = isClassified && r.status !== 'Finished';

    let gap = '';
    if (idx === 0) gap = 'WINNER';
    else if (isDns) gap = 'DNS';
    else if (isDnf) gap = 'DNF';
    else if (isLapped) gap = /^\+\d+ Lap/.test(r.status) ? r.status : '+1 LAP';
    else if (r.Time?.time) gap = '+' + r.Time.time;
    else gap = r.status || '—';

    const jolpicaName = r.Driver.familyName;
    const appDriver = DRIVERS.find(d =>
      d.name.toLowerCase() === jolpicaName.toLowerCase() ||
      d.name.toLowerCase().includes(jolpicaName.toLowerCase())
    );
    const team = TEAM_MAP[r.Constructor.name] || r.Constructor.name;

    return {
      pos: parseInt(r.position) || idx + 1,
      number: parseInt(r.number) || 0,
      name: appDriver?.name || jolpicaName,
      acronym: r.Driver.code || jolpicaName.slice(0, 3).toUpperCase(),
      team, gap, gapToLeader: null,
      fastestLap: fastestDriver?.Driver?.driverId === r.Driver.driverId,
      dnf: isDnf || isDns,
      startPos: parseInt(r.grid) || idx + 1,
    };
  });

  const finishers = classification.filter((d: any) => !d.dnf).sort((a: any, b: any) => a.pos - b.pos);
  const dnfList = classification.filter((d: any) => d.dnf).map((d: any) => d.name);
  const rimontaList = classification
    .filter((d: any) => !d.dnf && d.pos <= 10 && d.startPos >= 11)
    .map((d: any) => d.name);

  return {
    p1: finishers[0]?.name || '',
    p2: finishers[1]?.name || '',
    p3: finishers[2]?.name || '',
    dnf: dnfList,
    rimonta: rimontaList.join(', '),
    classification,
  };
}

interface Props {
  gps: GP[];
  onSynced: () => void;
}

export function JolpicaSync({ gps, onSynced }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [done, setDone] = useState(false);

  // GP che potrebbero avere nuovi risultati:
  // - non cancellati
  // - start_time nel passato (gara disputata)
  // - non ancora completati O completati ma senza classification
  const candidateGps = gps.filter(g =>
    !g.cancelled &&
    new Date(g.start_time) < new Date() &&
    !g.completed // solo quelli non ancora pubblicati
  );

  const syncAll = async () => {
    if (!candidateGps.length) return;
    setSyncing(true);
    setDone(false);
    setResults(candidateGps.map(g => ({
      gpId: g.id, gpName: g.name.replace(' Grand Prix', ''),
      status: 'pending', message: 'In attesa...',
    })));

    for (const gp of candidateGps) {
      setResults(prev => prev.map(r => r.gpId === gp.id ? { ...r, status: 'pending', message: 'Fetching Jolpica...' } : r));

      try {
        const data = await fetchFromJolpica(gp.id);

        // Save to Supabase
        const { error } = await supabase.from('results').upsert({
          gp_id: gp.id,
          p1: data.p1, p2: data.p2, p3: data.p3,
          dnf: data.dnf, penalties: [], rimonta: data.rimonta,
          classification: data.classification,
        }, { onConflict: 'gp_id' });

        if (error) throw new Error(error.message);

        // Mark GP as completed
        await supabase.from('gps').update({ completed: true }).eq('id', gp.id);

        setResults(prev => prev.map(r => r.gpId === gp.id
          ? { ...r, status: 'ok', message: `${data.p1} / ${data.p2} / ${data.p3}` }
          : r
        ));
      } catch (e: any) {
        const msg = e.message || 'Errore';
        setResults(prev => prev.map(r => r.gpId === gp.id
          ? { ...r, status: msg.includes('disponibile') ? 'skip' : 'err', message: msg }
          : r
        ));
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, 800));
    }

    setSyncing(false);
    setDone(true);
    onSynced();
  };

  if (candidateGps.length === 0) return null;

  return (
    <div className="f1-card p-5 space-y-4 border border-primary/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">
            🔄 Sync automatico Jolpica
          </p>
          <p className="text-[9px] text-white/30 font-bold mt-0.5">
            {candidateGps.length} GP {candidateGps.length === 1 ? 'completato senza risultati' : 'completati senza risultati'}:&nbsp;
            {candidateGps.map(g => g.name.replace(' Grand Prix', '')).join(', ')}
          </p>
        </div>
        <button
          type="button"
          onClick={syncAll}
          disabled={syncing}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black italic uppercase tracking-widest transition-all flex-shrink-0 ${
            syncing ? 'bg-white/10 text-white/30 cursor-wait' :
            done ? 'bg-green-600/20 text-green-400 border border-green-600/20' :
            'bg-primary/20 text-primary border border-primary/20 hover:bg-primary hover:text-white'
          }`}
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {syncing ? 'Sync...' : done ? 'Completato' : 'Sincronizza'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-1.5">
          {results.map(r => (
            <div key={r.gpId} className="flex items-center gap-3 text-[10px]">
              {r.status === 'pending' && <Loader2 className="w-3 h-3 text-white/30 animate-spin flex-shrink-0" />}
              {r.status === 'ok'      && <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />}
              {r.status === 'err'     && <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
              {r.status === 'skip'    && <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
              <span className="font-black uppercase text-white/40 w-20 flex-shrink-0">{r.gpName}</span>
              <span className={`font-bold ${r.status === 'ok' ? 'text-green-400' : r.status === 'err' ? 'text-red-400' : r.status === 'skip' ? 'text-yellow-400' : 'text-white/20'}`}>
                {r.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
