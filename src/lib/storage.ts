// =============================================
// storage.ts - SOSTITUISCE localStorage con Supabase
// Tutti i dati sono ora condivisi tra tutti gli utenti
// =============================================

import { supabase } from '@/integrations/supabase/client';
import type { Team, GP, Prediction, User, Result, AuthResult } from '@/types';

// =============================================
// DATI DEFAULT (usati solo al primo avvio)
// =============================================

export const DEFAULT_TEAMS: Team[] = [
  { id: 'CL', name: 'Team CL', color: '#e10600' },
  { id: 'ML', name: 'Team ML', color: '#ff8000' },
  { id: 'FL', name: 'Team FL', color: '#00d2be' },
];

export const DEFAULT_GPS: GP[] = [
  { id: 'bahrain', name: 'Bahrain Grand Prix', date: '2026-03-15', circuit: 'Sakhir', completed: false },
  { id: 'saudi', name: 'Saudi Arabian Grand Prix', date: '2026-03-22', circuit: 'Jeddah', completed: false },
  { id: 'australia', name: 'Australian Grand Prix', date: '2026-03-29', circuit: 'Melbourne', completed: false },
  { id: 'japan', name: 'Japanese Grand Prix', date: '2026-04-05', circuit: 'Suzuka', completed: false },
  { id: 'china', name: 'Chinese Grand Prix', date: '2026-04-19', circuit: 'Shanghai', completed: false },
  { id: 'miami', name: 'Miami Grand Prix', date: '2026-05-03', circuit: 'Miami', completed: false },
  { id: 'emilia', name: 'Emilia Romagna Grand Prix', date: '2026-05-17', circuit: 'Imola', completed: false },
  { id: 'monaco', name: 'Monaco Grand Prix', date: '2026-05-24', circuit: 'Monaco', completed: false },
  { id: 'spain', name: 'Spanish Grand Prix', date: '2026-06-01', circuit: 'Barcelona', completed: false },
  { id: 'canada', name: 'Canadian Grand Prix', date: '2026-06-15', circuit: 'Montreal', completed: false },
  { id: 'austria', name: 'Austrian Grand Prix', date: '2026-06-28', circuit: 'Spielberg', completed: false },
  { id: 'britain', name: 'British Grand Prix', date: '2026-07-05', circuit: 'Silverstone', completed: false },
  { id: 'belgium', name: 'Belgian Grand Prix', date: '2026-07-26', circuit: 'Spa', completed: false },
  { id: 'hungary', name: 'Hungarian Grand Prix', date: '2026-08-02', circuit: 'Budapest', completed: false },
  { id: 'netherlands', name: 'Dutch Grand Prix', date: '2026-08-30', circuit: 'Zandvoort', completed: false },
  { id: 'italy', name: 'Italian Grand Prix', date: '2026-09-06', circuit: 'Monza', completed: false },
  { id: 'singapore', name: 'Singapore Grand Prix', date: '2026-09-20', circuit: 'Marina Bay', completed: false },
  { id: 'usa', name: 'United States Grand Prix', date: '2026-10-18', circuit: 'Austin', completed: false },
  { id: 'mexico', name: 'Mexico City Grand Prix', date: '2026-10-25', circuit: 'Mexico City', completed: false },
  { id: 'brazil', name: 'São Paulo Grand Prix', date: '2026-11-08', circuit: 'São Paulo', completed: false },
  { id: 'lasvegas', name: 'Las Vegas Grand Prix', date: '2026-11-21', circuit: 'Las Vegas', completed: false },
  { id: 'qatar', name: 'Qatar Grand Prix', date: '2026-11-29', circuit: 'Lusail', completed: false },
  { id: 'abudhabi', name: 'Abu Dhabi Grand Prix', date: '2026-12-06', circuit: 'Yas Marina', completed: false },
];

// =============================================
// TEAMS
// =============================================

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from('teams').select('*').order('id');
  if (error) {
    console.error('Error fetching teams:', error);
    return DEFAULT_TEAMS;
  }
  if (!data || data.length === 0) {
    await initializeTeams();
    return DEFAULT_TEAMS;
  }
  return data as Team[];
}

async function initializeTeams() {
  await supabase.from('teams').insert(DEFAULT_TEAMS);
}

// =============================================
// GRAND PRIX
// =============================================

export async function getGPs(): Promise<GP[]> {
  const { data, error } = await supabase.from('gps').select('*').order('date');
  if (error) {
    console.error('Error fetching GPs:', error);
    return DEFAULT_GPS;
  }
  if (!data || data.length === 0) {
    await initializeGPs();
    return DEFAULT_GPS;
  }
  return data as GP[];
}

async function initializeGPs() {
  await supabase.from('gps').insert(DEFAULT_GPS);
}

export async function getNextGP(): Promise<GP | null> {
  const { data } = await supabase
    .from('gps')
    .select('*')
    .eq('completed', false)
    .order('date')
    .limit(1);
  if (!data || data.length === 0) return null;
  return data[0] as GP;
}

// =============================================
// AUTENTICAZIONE (senza Supabase Auth)
// =============================================

export async function loginUser(teamName: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('team_name', teamName.trim())
    .single();

  if (error || !data) {
    return { success: false, error: 'Team non trovato. Registrati prima.' };
  }

  if (data.password !== password) {
    return { success: false, error: 'Password errata.' };
  }

  const user: User = { id: data.id, team_id: data.team_id, team_name: data.team_name };
  // Salva sessione locale (solo per questo browser)
  localStorage.setItem('fp_current_user', JSON.stringify(user));
  return { success: true, user };
}

export async function registerUser(teamName: string, password: string): Promise<AuthResult> {
  const trimmed = teamName.trim();

  // Controlla se esiste già
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .ilike('team_name', trimmed)
    .single();

  if (existing) {
    return { success: false, error: 'Questo nome team è già in uso.' };
  }

  // Controlla che il team esista nella lista team
  const { data: teamData } = await supabase
    .from('teams')
    .select('id')
    .ilike('name', trimmed)
    .single();

  const teamId = teamData?.id || trimmed.toLowerCase().replace(/\s+/g, '_');

  const { data, error } = await supabase
    .from('users')
    .insert({ team_id: teamId, team_name: trimmed, password })
    .select()
    .single();

  if (error) {
    return { success: false, error: 'Errore durante la registrazione.' };
  }

  return { success: true };
}

export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem('fp_current_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem('fp_current_user');
}

// =============================================
// PRONOSTICI
// =============================================

export async function getPredictions(): Promise<Prediction[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .order('created_at');
  if (error) {
    console.error('Error fetching predictions:', error);
    return [];
  }
  return (data || []) as Prediction[];
}

export async function savePrediction(
  gpId: string,
  teamId: string,
  p1: string,
  p2: string,
  p3: string
): Promise<{ success: boolean; error?: string }> {
  // Upsert: aggiorna se già esiste, altrimenti inserisce
  const { error } = await supabase
    .from('predictions')
    .upsert(
      { gp_id: gpId, team_id: teamId, p1, p2, p3 },
      { onConflict: 'gp_id,team_id' }
    );

  if (error) {
    console.error('Error saving prediction:', error);
    return { success: false, error: 'Errore nel salvare il pronostico.' };
  }
  return { success: true };
}

// =============================================
// RISULTATI UFFICIALI
// =============================================

export async function getResults(): Promise<Result[]> {
  const { data, error } = await supabase.from('results').select('*');
  if (error) {
    console.error('Error fetching results:', error);
    return [];
  }
  return (data || []) as Result[];
}

export async function saveResult(
  gpId: string,
  p1: string,
  p2: string,
  p3: string,
  dnf: string[],
  penalties: string[],
  rimonta: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('results')
    .upsert(
      { gp_id: gpId, p1, p2, p3, dnf, penalties, rimonta },
      { onConflict: 'gp_id' }
    );

  if (error) {
    console.error('Error saving result:', error);
    return { success: false, error: 'Errore nel salvare i risultati.' };
  }

  // Segna il GP come completato
  await supabase.from('gps').update({ completed: true }).eq('id', gpId);

  return { success: true };
}

// =============================================
// RESET ADMIN
// =============================================

export async function adminReset(password: string): Promise<boolean> {
  if (password !== 'FANTAPODIO2026') return false;
  await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('gps').update({ completed: false }).neq('id', '');
  return true;
}

// =============================================
// CALCOLO PUNTEGGI
// =============================================

export function calculateScore(
  prediction: Prediction,
  result: Result
): number {
  let score = 0;

  // Podio esatto in posizione: 25 punti
  if (prediction.p1 === result.p1) score += 25;
  if (prediction.p2 === result.p2) score += 25;
  if (prediction.p3 === result.p3) score += 25;

  // Pilota nel podio ma posizione sbagliata: 10 punti
  const resultPodio = [result.p1, result.p2, result.p3];
  const predPodio = [prediction.p1, prediction.p2, prediction.p3];

  predPodio.forEach((driver, idx) => {
    const inResult = resultPodio.includes(driver);
    const correctPos = resultPodio[idx] === driver;
    if (inResult && !correctPos) score += 10;
  });

  return score;
}

export async function getLeaderboard(
  teams: Team[],
  predictions: Prediction[],
  results: Result[]
): Promise<Array<{ team: Team; score: number; predictions: number }>> {
  return teams
    .map((team) => {
      const teamPredictions = predictions.filter((p) => p.team_id === team.id);
      const score = teamPredictions.reduce((total, pred) => {
        const result = results.find((r) => r.gp_id === pred.gp_id);
        if (!result) return total;
        return total + calculateScore(pred, result);
      }, 0);
      return { team, score, predictions: teamPredictions.length };
    })
    .sort((a, b) => b.score - a.score);
}
