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

export interface DriverResult {
  pos: number; number: number; name: string; acronym: string; team: string;
  gap: string; gapToLeader: number | null; fastestLap: boolean; dnf: boolean; startPos: number;
}

export interface OpenF1RaceData {
  p1: string; p2: string; p3: string;
  dnf: string[]; rimonta: string[]; classification: DriverResult[];
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function apiFetch<T>(path: string, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
    if (res.status === 429) {
      if (attempt < retries) { await delay(parseInt(res.headers.get('Retry-After') || '2', 10) * 1000); continue; }
      throw new Error(`429 rate limit`);
    }
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  }
  throw new Error('max retries');
}

export async function fetchRaceResults(gpId: string): Promise<OpenF1RaceData | null> {
  try {
    const country = GP_TO_COUNTRY[gpId];
    if (!country) return null;
    let sessionKey: number | null = null;
    const year = new Date().getFullYear();
    for (const y of [year, year - 1]) {
      try {
        const sessions = await apiFetch<Array<{ session_key: number; session_name: string; date_start: string; }>>(`/sessions?year=${y}&session_name=Race&country_name=${encodeURIComponent(country)}`);
        if (sessions.length) { sessionKey = sessions.sort((a, b) => b.date_start.localeCompare(a.date_start))[0].session_key; break; }
      } catch { continue; }
    }
    if (!sessionKey) return null;

    const driversRaw = await apiFetch<Array<{ driver_number: number; last_name: string; name_acronym: string; team_name: string; }>>(`/drivers?session_key=${sessionKey}`);
    await delay(600);
    const positions = await apiFetch<Array<{ driver_number: number; position: number; date: string; }>>(`/position?session_key=${sessionKey}`);
    await delay(600);
    const laps = await apiFetch<Array<{ driver_number: number; lap_number: number; lap_duration: number | null; }>>(`/laps?session_key=${sessionKey}`);

    if (!driversRaw.length || !positions.length) return null;

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
    const threshold = Math.floor(maxLaps * 0.85);

    const classification: DriverResult[] = Object.entries(finalPos)
      .map(([n, pos]) => ({ num: parseInt(n), pos }))
      .sort((a, b) => a.pos - b.pos)
      .map(({ num, pos }, idx) => {
        const d = driverMap[num];
        const isDnf = (lapsPerDriver[num] || 0) < threshold;
        const lapsDown = maxLaps - (lapsPerDriver[num] || 0);
        return {
          pos, number: num, name: d?.last_name || `#${num}`,
          acronym: d?.name_acronym || '???', team: d?.team_name || '',
          gap: idx === 0 ? 'WINNER' : isDnf ? 'DNF' : lapsDown >= 1 ? `+${lapsDown} LAP${lapsDown > 1 ? 'S' : ''}` : '—',
          gapToLeader: null, fastestLap: num === fastestNum, dnf: isDnf,
          startPos: startPos[num] || pos,
        };
      });

    return {
      p1: classification[0]?.name || '', p2: classification[1]?.name || '', p3: classification[2]?.name || '',
      dnf: classification.filter(d => d.dnf).map(d => d.name),
      rimonta: classification.filter(d => !d.dnf && d.pos <= 10 && d.startPos >= 11).map(d => d.name),
      classification,
    };
  } catch { return null; }
}
