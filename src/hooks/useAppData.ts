// =============================================
// useAppData.ts - Hook centrale per tutti i dati
// Sostituisce la gestione manuale dello stato in Index.tsx
// =============================================

import { useState, useEffect, useCallback } from 'react';
import {
  getTeams, getGPs, getNextGP, getPredictions, getResults,
  getCurrentUser, loginUser, logoutUser, registerUser,
  savePrediction, saveResult, getLeaderboard, adminReset,
  type Team, type GP, type Prediction, type User, type Result,
} from '@/lib/storage';
import type { AuthResult } from '@/types';

export function useAppData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [gps, setGPs] = useState<GP[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [currentGP, setCurrentGP] = useState<GP | null>(null);
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [t, g, p, r, nextGP] = await Promise.all([
      getTeams(),
      getGPs(),
      getPredictions(),
      getResults(),
      getNextGP(),
    ]);
    setTeams(t);
    setGPs(g);
    setPredictions(p);
    setResults(r);
    setCurrentGP(nextGP);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLogin = async (teamName: string, password: string): Promise<AuthResult> => {
    const result = await loginUser(teamName, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const handleRegister = async (teamName: string, password: string): Promise<AuthResult> => {
    return await registerUser(teamName, password);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  const handleSavePrediction = async (
    gpId: string, p1: string, p2: string, p3: string
  ) => {
    if (!user) return { success: false, error: 'Non autenticato' };
    const result = await savePrediction(gpId, user.team_id, p1, p2, p3);
    if (result.success) await refresh();
    return result;
  };

  const handleSaveResult = async (
    gpId: string, p1: string, p2: string, p3: string,
    dnf: string[], penalties: string[], rimonta: string
  ) => {
    const result = await saveResult(gpId, p1, p2, p3, dnf, penalties, rimonta);
    if (result.success) await refresh();
    return result;
  };

  const handleAdminReset = async (password: string): Promise<boolean> => {
    const ok = await adminReset(password);
    if (ok) {
      logoutUser();
      setUser(null);
      await refresh();
    }
    return ok;
  };

  const leaderboard = getLeaderboard(teams, predictions, results);

  return {
    // Dati
    teams,
    gps,
    predictions,
    results,
    currentGP,
    user,
    loading,
    leaderboard,
    // Azioni
    refresh,
    handleLogin,
    handleRegister,
    handleLogout,
    handleSavePrediction,
    handleSaveResult,
    handleAdminReset,
  };
}

