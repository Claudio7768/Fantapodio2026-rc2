// ── OpenF1 API helper ─────────────────────────────────────────
// Docs: https://openf1.org/docs
// Nessuna API key richiesta. Rate limit: 30 req/min free tier.

const BASE = 'https://api.openf1.org/v1';

// Mappa ID GP Fantapodio → country_name per OpenF1
const GP_TO_COUNTRY: Record<string, string> = {
  australia:   'Australia',
  china:       'China',
  japan:       'Japan',
  bahrain:     'Bahrain',
  saudi:       'Saudi Arabia',
  miami:       'United States',   // Miami usa country USA come Austin
  canada:      'Canada',
  monaco:      'Monaco',
  barcelona:   'Spain',           // Barcelona-Catalunya
  austria:     'Austria',
  britain:     'United Kingdom',
  belgium:     'Belgium',
  hungary:     'Hungary',
  netherlands: 'Netherlands',
  italy:       'Italy',
  madrid:      'Spain',           // Madrid — stessa country di Barcelona
  azerbaijan:  'Azerbaijan',
  singapore:   'Singapore',
  usa:         'United States',
  mexico:      'Mexico',
  brazil:      'Brazil',
  lasvegas:    'United States',   // Las Vegas
  qatar:       'Qatar',
  abudhabi:    'United Arab Emirates',
};

// Per i GP con stessa country (USA x3, Spagna x2) usiamo meeting_name
const GP_TO_MEETING_HINT: Record<string, string> = {
  miami:    'Miami',
  usa:      'United States',
  lasvegas: 'Las Vegas',
  barcelona: 'Spanish',
  madrid:    'Madrid',
};

export interface OpenF1RaceData {
  p1: string;
  p2: string;
  p3: string;
  dnf: string[];
  rimonta: string[];   // Partiti 11°+ → arrivati top 10
}

// Converte driver_number → last name tramite endpoint /drivers
async function fetchDriverMap(sessionKey: number): Promise<Record<number, string>> {
  const res = await fetch(`${BASE}/drivers?session_key=${sessionKey}`);
  const data: Array<{ driver_number: number; last_name: string; full_name: string }> = await res.json();
  const map: Record<number, string> = {};
  data.forEach(d => {
    // Usa last_name che corrisponde ai nomi in DRIVERS di constants.ts
    map[d.driver_number] = d.last_name;
  });
  return map;
}

// Trova il session_key della Race per un GP
async function findRaceSessionKey(gpId: string, year = 2026): Promise<number | null> {
  const country = GP_TO_COUNTRY[gpId];
  if (!country) return null;

  const res = await fetch(`${BASE}/sessions?year=${year}&session_name=Race&country_name=${encodeURIComponent(country)}`);
  const sessions: Array<{ session_key: number; session_name: string; meeting_key: number; location: string; meeting_official_name?: string }> = await res.json();

  if (!sessions.length) return null;

  // Se c'è ambiguità (più gare nello stesso paese), filtra per hint
  const hint = GP_TO_MEETING_HINT[gpId];
  if (hint && sessions.length > 1) {
    const match = sessions.find(s =>
      (s.meeting_official_name || s.location || '').toLowerCase().includes(hint.toLowerCase())
    );
    if (match) return match.session_key;
  }

  return sessions[sessions.length - 1].session_key; // ultimo = più recente
}

// Recupera i risultati completi della gara
export async function fetchRaceResults(gpId: string): Promise<OpenF1RaceData | null> {
  try {
    const sessionKey = await findRaceSessionKey(gpId);
    if (!sessionKey) throw new Error(`Sessione non trovata per GP: ${gpId}`);

    // 1. Risultati finali
    const resultRes = await fetch(`${BASE}/session_result?session_key=${sessionKey}`);
    const results: Array<{
      driver_number: number;
      position: number;
      dnf: boolean;
      dns: boolean;
      dsq: boolean;
    }> = await resultRes.json();

    if (!results.length) throw new Error('Nessun risultato disponibile');

    // 2. Posizioni di partenza (griglia) — prendi la prima entry per ogni pilota
    const posRes = await fetch(`${BASE}/position?session_key=${sessionKey}`);
    const positions: Array<{ driver_number: number; position: number; date: string }> = await posRes.json();

    // Per ogni pilota prendi la posizione più vecchia (= griglia di partenza)
    const startGrid: Record<number, number> = {};
    positions.forEach(p => {
      const existing = startGrid[p.driver_number];
      if (!existing) {
        startGrid[p.driver_number] = p.position;
      }
    });

    // 3. Mappa driver_number → last_name
    const driverMap = await fetchDriverMap(sessionKey);

    // Ordina per posizione finale
    const sorted = [...results].sort((a, b) => a.position - b.position);

    // P1, P2, P3
    const p1 = driverMap[sorted[0]?.driver_number] || '';
    const p2 = driverMap[sorted[1]?.driver_number] || '';
    const p3 = driverMap[sorted[2]?.driver_number] || '';

    // DNF — tutti con dnf:true o dns:true o dsq:true
    const dnf = results
      .filter(r => r.dnf || r.dns || r.dsq)
      .map(r => driverMap[r.driver_number])
      .filter(Boolean);

    // Rimonta killer: partiti dalla 11ª posizione in poi, finiti top 10
    const rimonta = results
      .filter(r => {
        const finishPos = r.position;
        const startPos = startGrid[r.driver_number] || 99;
        return !r.dnf && !r.dns && finishPos <= 10 && startPos >= 11;
      })
      .map(r => driverMap[r.driver_number])
      .filter(Boolean);

    return { p1, p2, p3, dnf, rimonta };

  } catch (err) {
    console.error('OpenF1 fetch error:', err);
    return null;
  }
}
