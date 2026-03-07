// ============================================================
// constants.ts — tipi, dati statici, funzioni di utilità
// ============================================================

export interface Team {
  id: string;
  name: string;
  color?: string;
  score?: number;
}

export interface GP {
  id: string;
  name: string;
  location: string;
  date: string;
  start_time: string; // ISO datetime — deadline pronostici
  completed: boolean;
}

export interface Prediction {
  id?: string;
  gp_id: string;
  team_id: string;
  team_name: string;
  p1: string;
  p2: string;
  p3: string;
  attempts?: number;
  created_at?: string;
}

export interface Result {
  id?: string;
  gp_id: string;
  p1: string;
  p2: string;
  p3: string;
  dnf: string[];
  penalties: string[];
  rimonta: string;
}

export interface SeasonStats {
  leaderboard: Array<{
    team_id: string;
    team_name: string;
    total_score: number;
    gps_count: number;
    perfect_podiums: number;
    best_score: number;
  }>;
  gp_breakdown: Array<{
    gp_id: string;
    gp_name: string;
    scores: Array<{ team_id: string; score: number }>;
  }>;
  completed_gps: number;
  total_gps: number;
}

// ── Piloti 2026 ──────────────────────────────────────────────
export const DRIVERS: Array<{ number: number; name: string; team: string }> = [
  { number: 1,  name: 'Norris',      team: 'McLaren' },
  { number: 81, name: 'Piastri',     team: 'McLaren' },
  { number: 3,  name: 'Verstappen',  team: 'Red Bull' },
  { number: 6,  name: 'Hadjar',      team: 'Red Bull' },
  { number: 44, name: 'Hamilton',    team: 'Ferrari' },
  { number: 16, name: 'Leclerc',     team: 'Ferrari' },
  { number: 63, name: 'Russell',     team: 'Mercedes' },
  { number: 12, name: 'Antonelli',   team: 'Mercedes' },
  { number: 77, name: 'Bottas',      team: 'Cadillac' },
  { number: 11, name: 'Perez',       team: 'Cadillac' },
  { number: 27, name: 'Hülkenberg',  team: 'Audi' },
  { number: 5,  name: 'Bortoleto',   team: 'Audi' },
  { number: 14, name: 'Alonso',      team: 'Aston Martin' },
  { number: 18, name: 'Stroll',      team: 'Aston Martin' },
  { number: 31, name: 'Ocon',        team: 'Haas' },
  { number: 87, name: 'Bearman',     team: 'Haas' },
  { number: 23, name: 'Albon',       team: 'Williams' },
  { number: 55, name: 'Sainz',       team: 'Williams' },
  { number: 10, name: 'Gasly',       team: 'Alpine' },
  { number: 43, name: 'Colapinto',   team: 'Alpine' },
  { number: 30, name: 'Lawson',      team: 'Racing Bulls' },
  { number: 41, name: 'Lindblad',    team: 'Racing Bulls' },
];

// ── Team iniziali ────────────────────────────────────────────
export const INITIAL_TEAMS: Team[] = [
  { id: 'CL', name: 'Team CL', color: '#e10600' },
  { id: 'ML', name: 'Team ML', color: '#ff8000' },
  { id: 'FL', name: 'Team FL', color: '#00d2be' },
];

// ── Calendario 2026 con start_time (orari gara locali approx.) ──
export const INITIAL_GPS: GP[] = [
  { id: 'bahrain',    name: 'Bahrain Grand Prix',         location: 'Sakhir',      date: '2026-03-15', start_time: '2026-03-15T12:00:00Z', completed: false },
  { id: 'saudi',     name: 'Saudi Arabian Grand Prix',   location: 'Jeddah',      date: '2026-03-22', start_time: '2026-03-22T17:00:00Z', completed: false },
  { id: 'australia', name: 'Australian Grand Prix',      location: 'Melbourne',   date: '2026-03-29', start_time: '2026-03-29T04:00:00Z', completed: false },
  { id: 'japan',     name: 'Japanese Grand Prix',        location: 'Suzuka',      date: '2026-04-05', start_time: '2026-04-05T05:00:00Z', completed: false },
  { id: 'china',     name: 'Chinese Grand Prix',         location: 'Shanghai',    date: '2026-04-19', start_time: '2026-04-19T07:00:00Z', completed: false },
  { id: 'miami',     name: 'Miami Grand Prix',           location: 'Miami',       date: '2026-05-03', start_time: '2026-05-03T20:00:00Z', completed: false },
  { id: 'emilia',    name: 'Emilia Romagna Grand Prix',  location: 'Imola',       date: '2026-05-17', start_time: '2026-05-17T13:00:00Z', completed: false },
  { id: 'monaco',    name: 'Monaco Grand Prix',          location: 'Monaco',      date: '2026-05-24', start_time: '2026-05-24T13:00:00Z', completed: false },
  { id: 'spain',     name: 'Spanish Grand Prix',         location: 'Barcelona',   date: '2026-06-01', start_time: '2026-06-01T13:00:00Z', completed: false },
  { id: 'canada',    name: 'Canadian Grand Prix',        location: 'Montréal',    date: '2026-06-15', start_time: '2026-06-15T18:00:00Z', completed: false },
  { id: 'austria',   name: 'Austrian Grand Prix',        location: 'Spielberg',   date: '2026-06-28', start_time: '2026-06-28T13:00:00Z', completed: false },
  { id: 'britain',   name: 'British Grand Prix',         location: 'Silverstone', date: '2026-07-05', start_time: '2026-07-05T14:00:00Z', completed: false },
  { id: 'belgium',   name: 'Belgian Grand Prix',         location: 'Spa',         date: '2026-07-26', start_time: '2026-07-26T13:00:00Z', completed: false },
  { id: 'hungary',   name: 'Hungarian Grand Prix',       location: 'Budapest',    date: '2026-08-02', start_time: '2026-08-02T13:00:00Z', completed: false },
  { id: 'netherlands', name: 'Dutch Grand Prix',         location: 'Zandvoort',   date: '2026-08-30', start_time: '2026-08-30T13:00:00Z', completed: false },
  { id: 'italy',     name: 'Italian Grand Prix',         location: 'Monza',       date: '2026-09-06', start_time: '2026-09-06T13:00:00Z', completed: false },
  { id: 'singapore', name: 'Singapore Grand Prix',       location: 'Marina Bay',  date: '2026-09-20', start_time: '2026-09-20T12:00:00Z', completed: false },
  { id: 'usa',       name: 'United States Grand Prix',   location: 'Austin',      date: '2026-10-18', start_time: '2026-10-18T19:00:00Z', completed: false },
  { id: 'mexico',    name: 'Mexico City Grand Prix',     location: 'Mexico City', date: '2026-10-25', start_time: '2026-10-25T20:00:00Z', completed: false },
  { id: 'brazil',    name: 'São Paulo Grand Prix',       location: 'São Paulo',   date: '2026-11-08', start_time: '2026-11-08T17:00:00Z', completed: false },
  { id: 'lasvegas',  name: 'Las Vegas Grand Prix',       location: 'Las Vegas',   date: '2026-11-21', start_time: '2026-11-22T06:00:00Z', completed: false },
  { id: 'qatar',     name: 'Qatar Grand Prix',           location: 'Lusail',      date: '2026-11-29', start_time: '2026-11-29T16:00:00Z', completed: false },
  { id: 'abudhabi',  name: 'Abu Dhabi Grand Prix',       location: 'Yas Marina',  date: '2026-12-06', start_time: '2026-12-06T13:00:00Z', completed: false },
];

// ── Utility ──────────────────────────────────────────────────
export function formatMilanTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function calcScore(pred: Prediction, result: Result): number {
  let score = 0;
  const rp = [result.p1, result.p2, result.p3];
  const pp = [pred.p1, pred.p2, pred.p3];
  pp.forEach((driver, i) => {
    if (driver === rp[i]) score += 25;
    else if (rp.includes(driver)) score += 10;
  });
  return score;
}
