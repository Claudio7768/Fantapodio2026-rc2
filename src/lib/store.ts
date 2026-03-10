// ============================================================
// store.ts — wrapper asincrono Supabase (stessa interfaccia del vecchio store)
// ============================================================

import { supabase } from '@/integrations/supabase/client';
import {
  Team, GP, Prediction, Result, SeasonStats,
  INITIAL_TEAMS, INITIAL_GPS, calcScore,
} from '@/lib/constants';

// ── lookup start_time e location da dati locali ──────────────
const GP_META: Record<string, { start_time: string; location: string }> = {};
INITIAL_GPS.forEach(g => {
  GP_META[g.id] = { start_time: g.start_time, location: g.location };
});

const VALID_GP_IDS = new Set(INITIAL_GPS.map(g => g.id));

function enrichGP(row: any): GP {
  const meta = GP_META[row.id] || { start_time: `${row.date}T13:00:00Z`, location: row.circuit || '' };
  // fallback su INITIAL_GPS: se DB ha completed=false ma la costante dice true, usa true
  const initialCompleted = INITIAL_GPS.find(g => g.id === row.id)?.completed ?? false;
  return {
    id: row.id,
    name: row.name,
    location: meta.location,
    date: row.date || '',
    start_time: meta.start_time,
    completed: !!row.completed || initialCompleted,
  };
}

// ── Teams ─────────────────────────────────────────────────────
export async function getTeams(): Promise<Team[]> {
  await supabase.from('teams').upsert(INITIAL_TEAMS, { onConflict: 'id' });
  const { data, error } = await supabase.from('teams').select('*').order('id');
  if (error || !data || data.length === 0) return INITIAL_TEAMS;
  return data as Team[];
}

// ── GPs ───────────────────────────────────────────────────────
export async function getGPs(): Promise<GP[]> {
  // 1. Elimina vecchi GP con ID non validi (es. numerici dalla migrazione precedente)
  const { data: existing } = await supabase.from('gps').select('id');
  if (existing) {
    const oldIds = existing.map((r: any) => String(r.id)).filter((id: string) => !VALID_GP_IDS.has(id));
    if (oldIds.length > 0) {
      await supabase.from('gps').delete().in('id', oldIds);
    }
  }

  // 2. Forza aggiornamento nomi e date (ma preserva completed se già settato)
  await supabase.from('gps').upsert(
    INITIAL_GPS.map(g => ({ id: g.id, name: g.name, date: g.date, circuit: g.location })),
    { onConflict: 'id', ignoreDuplicates: false }
  );

  // 3. Leggi da Supabase (solo ID validi)
  const { data, error } = await supabase.from('gps').select('*').order('date');
  if (error || !data || data.length === 0) return INITIAL_GPS;
  return data.filter((r: any) => VALID_GP_IDS.has(String(r.id))).map(enrichGP);
}

// ── Predictions ───────────────────────────────────────────────
export async function getPredictions(): Promise<Prediction[]> {
  const { data, error } = await supabase.from('predictions').select('*').order('created_at');
  if (error) return [];
  return (data || []).map((p: any) => ({
    ...p,
    team_name: p.team_id,
  })) as Prediction[];
}

// ── Results ───────────────────────────────────────────────────
export async function getResults(): Promise<Result[]> {
  const { data, error } = await supabase.from('results').select('*');
  if (error) return [];
  return (data || []) as Result[];
}

// ── Auth ──────────────────────────────────────────────────────
export function getCurrentUser(): { team_id: string; team_name: string } | null {
  try {
    const stored = localStorage.getItem('fp_current_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: { team_id: string; team_name: string } | null) {
  if (user) localStorage.setItem('fp_current_user', JSON.stringify(user));
  else localStorage.removeItem('fp_current_user');
}

export async function loginTeam(
  name: string,
  password: string
): Promise<{ success: boolean; user?: { team_id: string; team_name: string }; error?: string }> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('team_name', name.trim())
    .single();

  if (error || !data) return { success: false, error: 'Team non trovato. Registrati prima.' };
  if (data.password !== password) return { success: false, error: 'Password errata.' };

  const user = { team_id: data.team_id, team_name: data.team_name };
  setCurrentUser(user);
  return { success: true, user };
}

export async function registerTeam(
  name: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = name.trim();

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .ilike('team_name', trimmed)
    .single();

  if (existing) return { success: false, error: 'Questo nome team è già in uso.' };

  const { error } = await supabase
    .from('users')
    .insert({ team_id: trimmed, team_name: trimmed, password })
    .select()
    .single();

  if (error) return { success: false, error: 'Errore durante la registrazione.' };
  return { success: true };
}

// ── Submit Prediction ─────────────────────────────────────────
export async function submitPrediction(
  gpId: string,
  teamId: string,
  p1: string,
  p2: string,
  p3: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('predictions')
    .upsert({ gp_id: gpId, team_id: teamId, p1, p2, p3 }, { onConflict: 'gp_id,team_id' });

  if (error) return { success: false, error: 'Errore nel salvare il pronostico.' };

  const key = `fp_attempts_${gpId}_${teamId}`;
  const prev = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, String(prev + 1));

  return { success: true };
}

// ── Submit Result ─────────────────────────────────────────────
export async function submitResult(
  gpId: string,
  p1: string,
  p2: string,
  p3: string,
  dnfs: string[],
  penalties: string[],
  rimonte: string[]
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('results')
    .upsert(
      { gp_id: gpId, p1, p2, p3, dnf: dnfs, penalties, rimonta: rimonte.join(', ') },
      { onConflict: 'gp_id' }
    );

  if (error) return { success: false, error: 'Errore nel salvare i risultati.' };

  await supabase.from('gps').update({ completed: true }).eq('id', gpId);
  return { success: true };
}

// ── Season Stats ──────────────────────────────────────────────
export function getSeasonStats(
  teams: Team[],
  predictions: Prediction[],
  results: Result[],
  gps: GP[]
): SeasonStats {
  const completedGps = gps.filter(g => g.completed);

  const leaderboard = teams.map(team => {
    const tp = predictions.filter(p => p.team_id === team.id);
    let total_score = 0;
    let perfect_podiums = 0;
    let best_score = 0;

    tp.forEach(pred => {
      const res = results.find(r => r.gp_id === pred.gp_id);
      if (!res) return;
      const s = calcScore(pred, res);
      total_score += s;
      if (s > best_score) best_score = s;
      if (s === 75) perfect_podiums++;
    });

    return {
      team_id: team.id,
      team_name: team.name,
      total_score,
      gps_count: tp.length,
      perfect_podiums,
      best_score,
    };
  }).sort((a, b) => b.total_score - a.total_score);

  const gp_breakdown = completedGps.map(gp => ({
    gp_id: gp.id,
    gp_name: gp.name,
    scores: teams.map(team => {
      const pred = predictions.find(p => p.team_id === team.id && p.gp_id === gp.id);
      const res = results.find(r => r.gp_id === gp.id);
      return {
        team_id: team.id,
        score: pred && res ? calcScore(pred, res) : 0,
      };
    }),
  }));

  return {
    leaderboard,
    gp_breakdown,
    completed_gps: completedGps.length,
    total_gps: gps.length,
  };
}

// ── Reset App ─────────────────────────────────────────────────
export async function resetApp(password: string): Promise<boolean> {
  if (password !== 'FANTAPODIO2026') return false;
  await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('gps').update({ completed: false }).neq('id', '');
  Object.keys(localStorage).filter(k => k.startsWith('fp_attempts_')).forEach(k => localStorage.removeItem(k));
  return true;
}

// no-op: Supabase è la fonte di verità
export async function saveTeams(_teams: Team[]) {}
export async function saveGPs(_gps: GP[]) {}
