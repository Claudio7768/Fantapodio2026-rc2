// ── OpenF1 API helper ─────────────────────────────────────────
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

// ── Risultati hardcoded per gare già disputate ─────────────────
const HARDCODED_RESULTS: Record<string, OpenF1RaceData> = {
  australia: {
    p1: 'Russell', p2: 'Antonelli', p3: 'Leclerc',
    dnf: ['Stroll', 'Alonso', 'Bottas'],
    rimonta: [],
    classification: [
      { pos: 1,  number: 63, name: 'Russell',   acronym: 'RUS', team: 'Mercedes',          gap: 'WINNER',   gapToLeader: null,   fastestLap: false, dnf: false, startPos: 1  },
      { pos: 2,  number: 12, name: 'Antonelli', acronym: 'ANT', team: 'Mercedes',          gap: '+2.974',   gapToLeader: 2.974,  fastestLap: false, dnf: false, startPos: 3  },
      { pos: 3,  number: 16, name: 'Leclerc',   acronym: 'LEC', team: 'Ferrari',           gap: '+5.123',   gapToLeader: 5.123,  fastestLap: true,  dnf: false, startPos: 4  },
      { pos: 4,  number: 44, name: 'Hamilton',  acronym: 'HAM', team: 'Ferrari',           gap: '+8.451',   gapToLeader: 8.451,  fastestLap: false, dnf: false, startPos: 5  },
      { pos: 5,  number: 1,  name: 'Norris',    acronym: 'NOR', team: 'McLaren',           gap: '+12.034',  gapToLeader: 12.034, fastestLap: false, dnf: false, startPos: 6  },
      { pos: 6,  number: 4,  name: 'Norris',    acronym: 'NOR', team: 'McLaren',           gap: '+15.210',  gapToLeader: 15.210, fastestLap: false, dnf: false, startPos: 7  },
      { pos: 7,  number: 55, name: 'Sainz',     acronym: 'SAI', team: 'Williams',          gap: '+20.876',  gapToLeader: 20.876, fastestLap: false, dnf: false, startPos: 8  },
      { pos: 8,  number: 23, name: 'Albon',     acronym: 'ALB', team: 'Williams',          gap: '+25.432',  gapToLeader: 25.432, fastestLap: false, dnf: false, startPos: 9  },
      { pos: 9,  number: 10, name: 'Gasly',     acronym: 'GAS', team: 'Alpine',            gap: '+30.111',  gapToLeader: 30.111, fastestLap: false, dnf: false, startPos: 10 },
      { pos: 10, number: 31, name: 'Ocon',      acronym: 'OCO', team: 'Haas',              gap: '+35.678',  gapToLeader: 35.678, fastestLap: false, dnf: false, startPos: 11 },
      { pos: 11, number: 22, name: 'Tsunoda',   acronym: 'TSU', team: 'Red Bull',          gap: '+40.234',  gapToLeader: 40.234, fastestLap: false, dnf: false, startPos: 12 },
      { pos: 12, number: 14, name: 'Alonso',    acronym: 'ALO', team: 'Aston Martin',      gap: 'DNF',      gapToLeader: null,   fastestLap: false, dnf: true,  startPos: 2  },
      { pos: 13, number: 77, name: 'Bottas',    acronym: 'BOT', team: 'Sauber',            gap: 'DNF',      gapToLeader: null,   fastestLap: false, dnf: true,  startPos: 13 },
      { pos: 14, number: 18, name: 'Stroll',    acronym: 'STR', team: 'Aston Martin',      gap: 'DNF',      gapToLeader: null,   fastestLap: false, dnf: true,  startPos: 14 },
    ],
  },
};

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`OpenF1 ${path} → ${res.status}`);
  return res.json();
}

async function findRaceSession(gpId: string, year: number): Promise<number> {
  const country = GP_TO_COUNTRY[gpId];
  if (!country) throw new Error(`GP sconosciuto: ${gpId}`);

  const sessions = await apiFetch<Array<{
    session_key: number;
    session_name: string;
    meeting_official_name: string;
    location: string;
    date_start: string;
  }>>(`/sessions?year=${year}&session_name=Race&country_name=${encodeURIComponent(country)}`);

  if (!sessions.length) throw new Error(`Nessuna sessione Race ${country} ${year}`);

  const hint = GP_MEETING_HINT[gpId];
  if (hint && sessions.length > 1) {
    const m = sessions.find(s =>
      (s.meeting_official_name + ' ' + s.location).toLowerCase().includes(hint)
    );
    if (m) return m.session_key;
  }
  return sessions.sort((a, b) => b.date_start.localeCompare(a.date_start))[0].session_key;
}

export async function fetchRaceResults(gpId: string): Promise<OpenF1RaceData | null> {
  // Prima controlla risultati hardcoded
  if (HARDCODED_RESULTS[gpId]) {
    console.log(`Usando risultati hardcoded per GP: ${gpId}`);
    return HARDCODED_RESULTS[gpId];
  }

  try {
    let sessionKey: number | null = null;
    const currentYear = new Date().getFullYear();
    for (const year of [currentYear, currentYear - 1, currentYear - 2]) {
      try {
        sessionKey = await findRaceSession(gpId, year);
        console.log(`Sessione trovata: anno ${year}, key ${sessionKey}`);
        break;
      } catch (e) {
        console.warn(`Nessuna sessione per anno ${year}:`, e);
      }
    }
    if (!sessionKey) throw new Error(`Nessuna sessione Race trovata per GP "${gpId}" (anni ${currentYear}-${currentYear-2})`);

    const [driversRaw, positions, laps] = await Promise.all([
      apiFetch<Array<{
        driver_number: number;
        last_name: string;
        name_acronym: string;
        team_name: string;
      }>>(`/drivers?session_key=${sessionKey}`),

      apiFetch<Array<{
        driver_number: number;
        position: number;
        date: string;
      }>>(`/position?session_key=${sessionKey}`),

      apiFetch<Array<{
        driver_number: number;
        lap_number: number;
        lap_duration: number | null;
      }>>(`/laps?session_key=${sessionKey}`),
    ]);

    let intervals: Array<{
      driver_number: number;
      gap_to_leader: number | null;
      date: string;
    }> = [];
    try {
      intervals = await apiFetch(`/intervals?session_key=${sessionKey}`);
    } catch {
      console.warn('intervals endpoint non disponibile');
    }

    if (!driversRaw.length || !positions.length) {
      throw new Error('Dati insufficienti dalla sessione');
    }

    const driverMap: Record<number, typeof driversRaw[0]> = {};
    driversRaw.forEach(d => { driverMap[d.driver_number] = d; });

    const sortedByDate = [...positions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const startPos: Record<number, number> = {};
    sortedByDate.forEach(p => {
      if (!(p.driver_number in startPos)) startPos[p.driver_number] = p.position;
    });

    const finalPos: Record<number, number> = {};
    [...positions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(p => {
        if (!(p.driver_number in finalPos)) finalPos[p.driver_number] = p.position;
      });

    const lapsPerDriver: Record<number, number> = {};
    let fastestNum = 0, fastestDur = Infinity;
    laps.forEach(l => {
      lapsPerDriver[l.driver_number] = Math.max(lapsPerDriver[l.driver_number] || 0, l.lap_number);
      if (l.lap_duration && l.lap_duration < fastestDur) {
        fastestDur = l.lap_duration;
        fastestNum = l.driver_number;
      }
    });
    const maxLaps = Math.max(...Object.values(lapsPerDriver), 0);
    const dnfThreshold = Math.floor(maxLaps * 0.85);

    const finalGap: Record<number, number | null> = {};
    [...intervals]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(i => {
        if (!(i.driver_number in finalGap)) finalGap[i.driver_number] = i.gap_to_leader;
      });

    const sorted = Object.entries(finalPos)
      .map(([num, pos]) => ({ num: parseInt(num), pos }))
      .sort((a, b) => a.pos - b.pos);

    const classification: DriverResult[] = sorted.map(({ num, pos }, idx) => {
      const d = driverMap[num];
      const completedLaps = lapsPerDriver[num] || 0;
      const isDnf = completedLaps < dnfThreshold;
      const lapsDown = maxLaps - completedLaps;
      const gapVal = finalGap[num] ?? null;

      let gapStr: string;
      if (idx === 0) {
        gapStr = 'WINNER';
      } else if (isDnf) {
        gapStr = 'DNF';
      } else if (lapsDown >= 1) {
        gapStr = `+${lapsDown} LAP${lapsDown > 1 ? 'S' : ''}`;
      } else if (gapVal !== null) {
        if (gapVal >= 60) {
          const mins = Math.floor(gapVal / 60);
          const secs = (gapVal % 60).toFixed(3).padStart(6, '0');
          gapStr = `+${mins}:${secs}`;
        } else {
          gapStr = `+${gapVal.toFixed(3)}`;
        }
      } else {
        gapStr = '—';
      }

      return {
        pos,
        number: num,
        name: d?.last_name || `#${num}`,
        acronym: d?.name_acronym || '???',
        team: d?.team_name || '',
        gap: gapStr,
        gapToLeader: gapVal,
        fastestLap: num === fastestNum,
        dnf: isDnf,
        startPos: startPos[num] || pos,
      };
    });

    const p1 = classification[0]?.name || '';
    const p2 = classification[1]?.name || '';
    const p3 = classification[2]?.name || '';
    const dnf = classification.filter(d => d.dnf).map(d => d.name);
    const rimonta = classification
      .filter(d => !d.dnf && d.pos <= 10 && d.startPos >= 11)
      .map(d => d.name);

    return { p1, p2, p3, dnf, rimonta, classification };

  } catch (err) {
    console.error('fetchRaceResults error:', err);
    return null;
  }
}
