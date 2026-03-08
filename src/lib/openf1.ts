// ── OpenF1 API helper ─────────────────────────────────────────
// Docs: https://openf1.org/docs
// Endpoint reali: /sessions /drivers /position /laps
// Nessuna API key. CORS aperto per browser.

const BASE = 'https://api.openf1.org/v1';

const GP_TO_COUNTRY: Record<string, string> = {
  australia:   'Australia',
  china:       'China',
  japan:       'Japan',
  bahrain:     'Bahrain',
  saudi:       'Saudi Arabia',
  miami:       'United States',
  canada:      'Canada',
  monaco:      'Monaco',
  barcelona:   'Spain',
  austria:     'Austria',
  britain:     'United Kingdom',
  belgium:     'Belgium',
  hungary:     'Hungary',
  netherlands: 'Netherlands',
  italy:       'Italy',
  madrid:      'Spain',
  azerbaijan:  'Azerbaijan',
  singapore:   'Singapore',
  usa:         'United States',
  mexico:      'Mexico',
  brazil:      'Brazil',
  lasvegas:    'United States',
  qatar:       'Qatar',
  abudhabi:    'United Arab Emirates',
};

// Per GP con stessa country, filtriamo per nome meeting
const GP_MEETING_HINT: Record<string, string> = {
  miami:     'miami',
  usa:       'united states',
  lasvegas:  'las vegas',
  barcelona: 'spanish',
  madrid:    'madrid',
};

export interface OpenF1RaceData {
  p1: string;
  p2: string;
  p3: string;
  dnf: string[];
  rimonta: string[];
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`OpenF1 ${path} → ${res.status}`);
  return res.json();
}

// Trova session_key della Race per un GP
async function findRaceSession(gpId: string, year = 2026): Promise<number | null> {
  const country = GP_TO_COUNTRY[gpId];
  if (!country) throw new Error(`GP sconosciuto: ${gpId}`);

  const sessions = await apiFetch<Array<{
    session_key: number;
    session_name: string;
    country_name: string;
    location: string;
    meeting_official_name: string;
    year: number;
  }>>(`/sessions?year=${year}&session_name=Race&country_name=${encodeURIComponent(country)}`);

  if (!sessions.length) throw new Error(`Nessuna sessione Race trovata per ${country} ${year}`);

  // Disambigua GP con stessa country (USA x3, Spagna x2)
  const hint = GP_MEETING_HINT[gpId];
  if (hint && sessions.length > 1) {
    const match = sessions.find(s =>
      (s.meeting_official_name + ' ' + s.location).toLowerCase().includes(hint)
    );
    if (match) return match.session_key;
  }

  return sessions[0].session_key;
}

// Mappa driver_number → cognome (matching con DRIVERS in constants.ts)
async function getDriverMap(sessionKey: number): Promise<Record<number, string>> {
  const drivers = await apiFetch<Array<{
    driver_number: number;
    last_name: string;
    name_acronym: string;
  }>>(`/drivers?session_key=${sessionKey}`);

  const map: Record<number, string> = {};
  drivers.forEach(d => { map[d.driver_number] = d.last_name; });
  return map;
}

export async function fetchRaceResults(gpId: string): Promise<OpenF1RaceData> {
  const sessionKey = await findRaceSession(gpId);
  if (!sessionKey) throw new Error('Sessione non trovata');

  const [driverMap, positions, laps] = await Promise.all([
    getDriverMap(sessionKey),
    // Position: entries durante tutta la gara → ultima per ogni pilota = posizione finale
    apiFetch<Array<{ driver_number: number; position: number; date: string }>>(
      `/position?session_key=${sessionKey}`
    ),
    // Laps: per calcolare giri completati (DNF = molto meno giri del vincitore)
    apiFetch<Array<{ driver_number: number; lap_number: number; lap_duration: number | null }>>(
      `/laps?session_key=${sessionKey}`
    ),
  ]);

  // ── Posizione finale: ultima entry per ogni pilota ──────────
  const finalPos: Record<number, number> = {};
  positions.forEach(p => { finalPos[p.driver_number] = p.position; });

  // Ordina per posizione finale crescente
  const sorted = Object.entries(finalPos)
    .map(([num, pos]) => ({ num: parseInt(num), pos }))
    .sort((a, b) => a.pos - b.pos);

  const p1 = driverMap[sorted[0]?.num] || '';
  const p2 = driverMap[sorted[1]?.num] || '';
  const p3 = driverMap[sorted[2]?.num] || '';

  // ── Giri completati per pilota ──────────────────────────────
  const lapsPerDriver: Record<number, number> = {};
  laps.forEach(l => {
    lapsPerDriver[l.driver_number] = Math.max(
      lapsPerDriver[l.driver_number] || 0,
      l.lap_number
    );
  });

  const maxLaps = Math.max(...Object.values(lapsPerDriver), 0);
  // DNF = ha completato meno dell'85% dei giri totali
  const dnfThreshold = Math.floor(maxLaps * 0.85);

  const dnf = Object.entries(lapsPerDriver)
    .filter(([, lapCount]) => lapCount < dnfThreshold)
    .map(([num]) => driverMap[parseInt(num)])
    .filter(Boolean);

  // ── Posizione di partenza: prima entry position per ogni pilota ─
  const startPos: Record<number, number> = {};
  // Le prime entries sono la griglia (ordinate per data)
  const sortedByDate = [...positions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  sortedByDate.forEach(p => {
    if (!(p.driver_number in startPos)) {
      startPos[p.driver_number] = p.position;
    }
  });

  // Rimonta killer: partito 11°+ → finito top 10
  const rimonta = sorted
    .filter(({ num, pos }) => pos <= 10 && (startPos[num] || 99) >= 11)
    .map(({ num }) => driverMap[num])
    .filter(Boolean);

  return { p1, p2, p3, dnf, rimonta };
}
