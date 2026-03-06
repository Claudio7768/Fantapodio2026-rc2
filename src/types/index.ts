export interface Team {
  id: string;
  name: string;
  color?: string;
  created_at?: string;
}

export interface GP {
  id: string;
  name: string;
  date?: string;
  circuit?: string;
  completed: boolean;
}

export interface Prediction {
  id?: string;
  gp_id: string;
  team_id: string;
  p1: string;
  p2: string;
  p3: string;
  created_at?: string;
}

export interface User {
  id?: string;
  team_id: string;
  team_name: string;
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
  created_at?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

