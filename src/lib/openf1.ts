import { supabase } from '@/integrations/supabase/client';

const BASE = 'https://api.openf1.org/v1';

const GP_TO_COUNTRY: Record<string, string> = {
  australia: 'Australia', china: 'China', japan: 'Japan',
  bahrain: 'Bahrain', saudi: 'Saudi Arabia', miami: 'United States',
  canada: 'Canada', monaco: 'Monaco', barcelona: 'Spain',
  austria: 'Austria', britain: 'United Kingdom', belgium: 'Belgium',
  hungary: 'Hungary', netherlands: 'Netherlands', italy: 'Italy',
  madrid: 'Spain', azerbaijan: 'Azerbaijan', singapore: 'Singapore',
  usa: 'United States', mexico: 'Mexico', brazil: 'Brazil',
  lasvegas: 'United States', qatar: 'Qatar', abudhabi: 'United Arab Emirates',
};

const GP_MEETING_HINT: Record<string, string> = {
  miami: 'miami', usa: 'austin', lasvegas: 'las vegas',
  barcelona: 'barcelona', madrid: 'madrid',
};

export interface DriverResult {
  pos: number;
  number: number;
  name: string;
  acronym: string;
  team: string;
  gap: string;
  gapToLeader: number | null;
  fastestLap: boolean;
  dnf: boolean;
  startPos: number;
}

export interface OpenF1RaceData {
  p1: string; p2: string; p3: string;
  dnf: string[];
  rimonta: string[];
  classification: DriverResult[];
}

// ── Risultati ufficiali per gare già disputate ────────────────
// Questi dati vengono salvati su Supabase al primo Fetch
// e letti da Supabase nelle chiamate successive
const HARDCODED_RESULTS: Record<string, OpenF1RaceData> = {
  australia: {
    p1: 'Russell', p2: 'Antonelli', p3: 'Leclerc',
    dnf: ['Hadjar', 'Bottas', 'Alonso', 'Norris', 'Piastri', 'Hulkenberg'],
    rimonta: ['Verstappen'],
    classification: [
      { pos:1,  number:63, name:'Russell',    acronym:'RUS', team:'Mercedes',     gap:'WINNER', gapToLeader:null,  fastestLap:false, dnf:false, startPos:1  },
      { pos:2,  number:12, name:'Antonelli',  acronym:'ANT', team:'Mercedes',     gap:'+2.9',   gapToLeader:2.9,   fastestLap:false, dnf:false, startPos:2  },
      { pos:3,  number:16, name:'Leclerc',    acronym:'LEC', team:'Ferrari',      gap:'+15.0',  gapToLeader:15.0,  fastestLap:false, dnf:false, startPos:4  },
      { pos:4,  number:44, name:'Hamilton',   acronym:'HAM', team:'Ferrari',      gap:'+15.6',  gapToLeader:15.6,  fastestLap:false, dnf:false, startPos:7  },
      { pos:5,  number:1,  name:'Norris',     acronym:'NOR', team:'McLaren',      gap:'+55.3',  gapToLeader:55.3,  fastestLap:false, dnf:false, startPos:5  },
      { pos:6,  number:3,  name:'Verstappen', acronym:'VER', team:'Red Bull',     gap:'+62.1',  gapToLeader:62.1,  fastestLap:true,  dnf:false, startPos:20 },
      { pos:7,  number:87, name:'Bearman',    acronym:'BEA', team:'Haas',         gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:8  },
      { pos:8,  number:41, name:'Lindblad',   acronym:'LIN', team:'Racing Bulls', gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:9  },
      { pos:9,  number:5,  name:'Bortoleto',  acronym:'BOR', team:'Audi',         gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:15 },
      { pos:10, number:10, name:'Gasly',      acronym:'GAS', team:'Alpine',       gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:12 },
      { pos:11, number:31, name:'Ocon',       acronym:'OCO', team:'Haas',         gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:14 },
      { pos:12, number:30, name:'Lawson',     acronym:'LAW', team:'Racing Bulls', gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:13 },
      { pos:13, number:43, name:'Colapinto',  acronym:'COL', team:'Alpine',       gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:10 },
      { pos:14, number:23, name:'Albon',      acronym:'ALB', team:'Williams',     gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:16 },
      { pos:15, number:55, name:'Sainz',      acronym:'SAI', team:'Williams',     gap:'+2 LAPS',gapToLeader:null,  fastestLap:false, dnf:false, startPos:21 },
      { pos:16, number:11, name:'Perez',      acronym:'PER', team:'Cadillac',     gap:'+2 LAPS',gapToLeader:null,  fastestLap:false, dnf:false, startPos:17 },
      { pos:17, number:18, name:'Stroll',     acronym:'STR', team:'Aston Martin', gap:'+2 LAPS',gapToLeader:null,  fastestLap:false, dnf:false, startPos:22 },
      { pos:18, number:14, name:'Alonso',     acronym:'ALO', team:'Aston Martin', gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:3  },
      { pos:19, number:77, name:'Bottas',     acronym:'BOT', team:'Cadillac',     gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:18 },
      { pos:20, number:6,  name:'Hadjar',     acronym:'HAD', team:'Red Bull',     gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:3  },
      { pos:21, number:81, name:'Piastri',    acronym:'PIA', team:'McLaren',      gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:6  },
      { pos:22, number:27, name:'Hulkenberg', acronym:'HUL', team:'Audi',         gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:11 },
    ],
  },

  china: {
    p1: 'Antonelli', p2: 'Russell', p3: 'Hamilton',
    dnf: ['Verstappen', 'Alonso', 'Stroll', 'Norris', 'Piastri', 'Bortoleto', 'Albon'],
    rimonta: [],
    classification: [
      { pos:1,  number:12, name:'Antonelli',  acronym:'ANT', team:'Mercedes',     gap:'WINNER', gapToLeader:null,  fastestLap:false, dnf:false, startPos:1  },
      { pos:2,  number:63, name:'Russell',    acronym:'RUS', team:'Mercedes',     gap:'+5.5',   gapToLeader:5.5,   fastestLap:false, dnf:false, startPos:2  },
      { pos:3,  number:44, name:'Hamilton',   acronym:'HAM', team:'Ferrari',      gap:'+25.0',  gapToLeader:25.0,  fastestLap:false, dnf:false, startPos:3  },
      { pos:4,  number:16, name:'Leclerc',    acronym:'LEC', team:'Ferrari',      gap:'+28.3',  gapToLeader:28.3,  fastestLap:false, dnf:false, startPos:4  },
      { pos:5,  number:87, name:'Bearman',    acronym:'BEA', team:'Haas',         gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:9  },
      { pos:6,  number:10, name:'Gasly',      acronym:'GAS', team:'Alpine',       gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:11 },
      { pos:7,  number:30, name:'Lawson',     acronym:'LAW', team:'Racing Bulls', gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:12 },
      { pos:8,  number:6,  name:'Hadjar',     acronym:'HAD', team:'Red Bull',     gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:13 },
      { pos:9,  number:55, name:'Sainz',      acronym:'SAI', team:'Williams',     gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:14 },
      { pos:10, number:43, name:'Colapinto',  acronym:'COL', team:'Alpine',       gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:15 },
      { pos:11, number:11, name:'Perez',      acronym:'PER', team:'Cadillac',     gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:16 },
      { pos:12, number:77, name:'Bottas',     acronym:'BOT', team:'Cadillac',     gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:17 },
      { pos:13, number:27, name:'Hulkenberg', acronym:'HUL', team:'Audi',         gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:10 },
      { pos:14, number:41, name:'Lindblad',   acronym:'LIN', team:'Racing Bulls', gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:19 },
      { pos:15, number:3,  name:'Verstappen', acronym:'VER', team:'Red Bull',     gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:5  },
      { pos:16, number:14, name:'Alonso',     acronym:'ALO', team:'Aston Martin', gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:6  },
      { pos:17, number:18, name:'Stroll',     acronym:'STR', team:'Aston Martin', gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:7  },
      { pos:18, number:1,  name:'Norris',     acronym:'NOR', team:'McLaren',      gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:18 },
      { pos:19, number:81, name:'Piastri',    acronym:'PIA', team:'McLaren',      gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:20 },
      { pos:20, number:5,  name:'Bortoleto',  acronym:'BOR', team:'Audi',         gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:21 },
      { pos:21, number:23, name:'Albon',      acronym:'ALB', team:'Williams',     gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:8  },
    ],
  },
};

// ── Salva i dati su Supabase ──────────────────────────────────
async function saveToSupabase(gpId: string, data: OpenF1RaceData): Promise<void> {
  try {
    await supabase.from('results').upsert(
      {
        gp_id: gpId,
        p1: data.p1,
        p2: data.p2,
        p3: data.p3,
        dnf: data.dnf,
        penalties: [],
        rimonta: data.rimonta.join(', '),
        classification: data.classification,
      },
      { onConflict: 'gp_id' }
    );
    await supabase.from('gps').update({ completed: true }).eq('id', gpId);
    console.log(`[openf1] Dati salvati su Supabase per GP: ${gpId}`);
  } catch (e) {
    console.warn('[openf1] Errore salvataggio Supabase:', e);
  }
}

// ── Leggi da Supabase ─────────────────────────────────────────
async function readFromSupabase(gpId: string): Promise<OpenF1RaceData | null> {
  try {
    const { data } = await supabase
      .from('results')
      .select('p1,p2,p3,dnf,penalties,rimonta,classification')
      .eq('gp_id', gpId)
      .single();

    if (!data?.p1) return null;

    // classification deve essere un array non vuoto
    const cls = Array.isArray(data.classification) && data.classification.length > 0
      ? data.classification as DriverResult[]
      : null;
    if (!cls) return null;

    const parseField = (v: any): string[] => {
      if (Array.isArray(v)) return v;
      if (typeof v === 'string' && v.startsWith('[')) {
        try { return JSON.parse(v); } catch { return []; }
      }
      if (typeof v === 'string' && v.length > 0) return v.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    return {
      p1: data.p1,
      p2: data.p2,
      p3: data.p3,
      dnf: parseField(data.dnf),
      rimonta: parseField(data.rimonta),
      classification: cls,
    };
  } catch {
    return null;
  }
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function apiFetch<T>(path: string, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
    if (res.status === 429) {
      if (attempt < retries) { await delay((parseInt(res.headers.get('Retry-After') || '2', 10)) * 1000); continue; }
      throw new Error(`OpenF1 ${path} → 429`);
    }
    if (!res.ok) throw new Error(`OpenF1 ${path} → ${res.status}`);
    return res.json();
  }
  throw new Error(`OpenF1 ${path} → max retries`);
}

async function findRaceSession(gpId: string, year: number): Promise<number> {
  const country = GP_TO_COUNTRY[gpId];
  if (!country) throw new Error(`GP sconosciuto: ${gpId}`);
  const sessions = await apiFetch<Array<{
    session_key: number; session_name: string;
    meeting_official_name: string; location: string; date_start: string;
  }>>(`/sessions?year=${year}&session_name=Race&country_name=${encodeURIComponent(country)}`);
  if (!sessions.length) throw new Error(`Nessuna sessione ${country} ${year}`);
  const hint = GP_MEETING_HINT[gpId];
  if (hint && sessions.length > 1) {
    const m = sessions.find(s => (s.meeting_official_name + ' ' + s.location).toLowerCase().includes(hint));
    if (m) return m.session_key;
  }
  return sessions.sort((a, b) => b.date_start.localeCompare(a.date_start))[0].session_key;
}

export async function fetchRaceResults(gpId: string): Promise<OpenF1RaceData | null> {

  // ── 1. Leggi da Supabase (già popolato da un fetch precedente) ──
  const fromDb = await readFromSupabase(gpId);
  if (fromDb) {
    console.log(`[openf1] ${gpId} — dati da Supabase`);
    return fromDb;
  }

  // ── 2. Dati hardcoded → salva su Supabase → restituisce ────────
  if (HARDCODED_RESULTS[gpId]) {
    console.log(`[openf1] ${gpId} — dati hardcoded, salvo su Supabase`);
    const data = HARDCODED_RESULTS[gpId];
    await saveToSupabase(gpId, data);
    return data;
  }

  // ── 3. Fallback: OpenF1 API ─────────────────────────────────────
  try {
    let sessionKey: number | null = null;
    const currentYear = new Date().getFullYear();
    for (const year of [currentYear, currentYear - 1, currentYear - 2]) {
      try { sessionKey = await findRaceSession(gpId, year); break; }
      catch { continue; }
    }
    if (!sessionKey) throw new Error(`Nessuna sessione per ${gpId}`);

    const driversRaw = await apiFetch<Array<{ driver_number: number; last_name: string; name_acronym: string; team_name: string; }>>(`/drivers?session_key=${sessionKey}`);
    await delay(600);
    const positions = await apiFetch<Array<{ driver_number: number; position: number; date: string; }>>(`/position?session_key=${sessionKey}`);
    await delay(600);
    const laps = await apiFetch<Array<{ driver_number: number; lap_number: number; lap_duration: number | null; }>>(`/laps?session_key=${sessionKey}`);
    await delay(600);
    let intervals: Array<{ driver_number: number; gap_to_leader: number | null; date: string; }> = [];
    try { intervals = await apiFetch(`/intervals?session_key=${sessionKey}`); } catch {}

    if (!driversRaw.length || !positions.length) throw new Error('Dati insufficienti');

    const driverMap: Record<number, typeof driversRaw[0]> = {};
    driversRaw.forEach(d => { driverMap[d.driver_number] = d; });

    const startPos: Record<number, number> = {};
    [...positions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(p => { if (!(p.driver_number in startPos)) startPos[p.driver_number] = p.position; });

    const finalPos: Record<number, number> = {};
    [...positions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(p => { if (!(p.driver_number in finalPos)) finalPos[p.driver_number] = p.position; });

    const lapsPerDriver: Record<number, number> = {};
    let fastestNum = 0, fastestDur = Infinity;
    laps.forEach(l => {
      lapsPerDriver[l.driver_number] = Math.max(lapsPerDriver[l.driver_number] || 0, l.lap_number);
      if (l.lap_duration && l.lap_duration < fastestDur) { fastestDur = l.lap_duration; fastestNum = l.driver_number; }
    });
    const maxLaps = Math.max(...Object.values(lapsPerDriver), 0);
    const dnfThreshold = Math.floor(maxLaps * 0.85);

    const finalGap: Record<number, number | null> = {};
    [...intervals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(i => { if (!(i.driver_number in finalGap)) finalGap[i.driver_number] = i.gap_to_leader; });

    const classification: DriverResult[] = Object.entries(finalPos)
      .map(([num, pos]) => ({ num: parseInt(num), pos }))
      .sort((a, b) => a.pos - b.pos)
      .map(({ num, pos }, idx) => {
        const d = driverMap[num];
        const completedLaps = lapsPerDriver[num] || 0;
        const isDnf = completedLaps < dnfThreshold;
        const lapsDown = maxLaps - completedLaps;
        const gapVal = finalGap[num] ?? null;
        let gapStr: string;
        if (idx === 0) gapStr = 'WINNER';
        else if (isDnf) gapStr = 'DNF';
        else if (lapsDown >= 1) gapStr = `+${lapsDown} LAP${lapsDown > 1 ? 'S' : ''}`;
        else if (gapVal !== null) {
          gapStr = gapVal >= 60
            ? `+${Math.floor(gapVal/60)}:${(gapVal%60).toFixed(3).padStart(6,'0')}`
            : `+${gapVal.toFixed(3)}`;
        } else gapStr = '—';
        return { pos, number: num, name: d?.last_name || `#${num}`, acronym: d?.name_acronym || '???',
          team: d?.team_name || '', gap: gapStr, gapToLeader: gapVal,
          fastestLap: num === fastestNum, dnf: isDnf, startPos: startPos[num] || pos };
      });

    const result: OpenF1RaceData = {
      p1: classification[0]?.name || '',
      p2: classification[1]?.name || '',
      p3: classification[2]?.name || '',
      dnf: classification.filter(d => d.dnf).map(d => d.name),
      rimonta: classification.filter(d => !d.dnf && d.pos <= 10 && d.startPos >= 11).map(d => d.name),
      classification,
    };

    await saveToSupabase(gpId, result);
    return result;

  } catch (err) {
    console.error('[openf1] API error:', err);
    return null;
  }
}
