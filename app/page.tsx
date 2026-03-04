"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Calendar, 
  MessageCircle, 
  ChevronRight, 
  Info, 
  Settings, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Zap,
  ShieldAlert,
  Clock,
  Search,
  Loader2,
  BarChart3,
  History,
  LogIn,
  LogOut,
  UserPlus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// --- Types ---

interface Team {
  id: number;
  name: string;
  total_points: number;
  password?: string;
}

interface GP {
  id: number;
  name: string;
  location: string;
  date: string;
  start_time: string;
  completed: number;
}

interface Prediction {
  id: number;
  gp_id: number;
  team_id: number;
  team_name: string;
  p1: string;
  p2: string;
  p3: string;
  attempts: number;
}

interface SeasonStats {
  gps: GP[];
  stats: {
    team_id: number;
    team_name: string;
    total_points: number;
    gpBreakdown: {
      gp_id: number;
      gp_name: string;
      points: number;
      cumulative: number;
    }[];
  }[];
}

const DRIVERS = [
  { number: 1, name: 'Lando Norris', team: 'McLaren' },
  { number: 3, name: 'Max Verstappen', team: 'Red Bull' },
  { number: 5, name: 'Gabriel Bortoleto', team: 'Audi' },
  { number: 6, name: 'Isack Hadjar', team: 'Red Bull' },
  { number: 10, name: 'Pierre Gasly', team: 'Alpine' },
  { number: 11, name: 'Sergio Perez', team: 'Cadillac' },
  { number: 12, name: 'Andrea Kimi Antonelli', team: 'Mercedes' },
  { number: 14, name: 'Fernando Alonso', team: 'Aston Martin' },
  { number: 16, name: 'Charles Leclerc', team: 'Ferrari' },
  { number: 18, name: 'Lance Stroll', team: 'Aston Martin' },
  { number: 23, name: 'Alexander Albon', team: 'Williams' },
  { number: 27, name: 'Nico Hülkenberg', team: 'Audi' },
  { number: 31, name: 'Esteban Ocon', team: 'Haas' },
  { number: 30, name: 'Liam Lawson', team: 'Racing Bulls' },
  { number: 41, name: 'Arvid Lindblad', team: 'Racing Bulls' },
  { number: 43, name: 'Franco Colapinto', team: 'Alpine' },
  { number: 44, name: 'Lewis Hamilton', team: 'Ferrari' },
  { number: 55, name: 'Carlos Sainz', team: 'Williams' },
  { number: 63, name: 'George Russell', team: 'Mercedes' },
  { number: 77, name: 'Valtteri Bottas', team: 'Cadillac' },
  { number: 81, name: 'Oscar Piastri', team: 'McLaren' },
  { number: 87, name: 'Oliver Bearman', team: 'Haas' },
];

// --- Utils ---

const formatMilanTime = (isoString: string) => {
  return new Date(isoString).toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Countdown = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        setTimeLeft(null);
        return false;
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
        return true;
      }
    };

    calculate();
    const timer = setInterval(() => {
      if (!calculate()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return (
    <div className="flex items-center gap-2 text-white/20 font-black italic uppercase text-[10px] tracking-widest">
      <Zap className="w-3 h-3 text-[#e10600]" /> Session Live
    </div>
  );

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hrs', value: timeLeft.hours },
        { label: 'Min', value: timeLeft.minutes },
        { label: 'Sec', value: timeLeft.seconds }
      ].map(item => (
        <div key={item.label} className="flex flex-col items-center bg-white/5 border border-white/5 rounded-xl p-2 min-w-[45px] sm:min-w-[60px] backdrop-blur-sm">
          <span className="text-lg sm:text-xl font-black italic text-[#e10600] leading-none">{item.value}</span>
          <span className="text-[7px] sm:text-[8px] uppercase font-bold text-white/20 tracking-widest mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const ButtonCountdown = ({ targetDate }: { targetDate: string }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;
      if (distance < 0) {
        setTime('00:00:00');
        return;
      }
      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      
      const timeStr = d > 0 
        ? `${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      
      setTime(timeStr);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [targetDate]);

  return <span>{time}</span>;
};

// --- Components ---

const Header = ({ user, onLogout }: { user: any, onLogout: () => void }) => (
  <header className="border-b border-white/5 bg-[#0f0f12]/80 backdrop-blur-xl text-white sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="h-10 w-14 bg-[#e10600] flex items-center justify-center rounded-xl shadow-lg shadow-red-600/20">
          <span className="text-white font-black italic text-2xl">F1</span>
        </div>
        <h1 className="text-lg sm:text-2xl font-black tracking-tighter italic uppercase block">
          Fantapodio <span className="text-[#e10600]">2026</span> <span className="text-[8px] sm:text-[10px] bg-[#e10600] text-white px-2 py-0.5 rounded-full ml-1 sm:ml-2 not-italic tracking-widest">DARK EDITION</span>
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-6">
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4 bg-white/5 p-1 sm:p-2 pr-3 sm:pr-4 rounded-xl sm:rounded-2xl border border-white/5">
            <div className="w-8 h-8 sm:w-10 h-10 bg-[#e10600] rounded-lg sm:rounded-xl flex items-center justify-center font-black italic text-sm sm:text-lg">
              {user.team_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[10px] uppercase font-bold text-white/40 tracking-widest">Team</span>
              <span className="text-xs sm:text-sm font-black italic uppercase leading-none">{user.team_name}</span>
            </div>
            <button 
              onClick={onLogout} 
              className="ml-1 sm:ml-2 p-1.5 sm:p-2 hover:bg-white/10 rounded-lg sm:rounded-xl transition-colors text-white/40 hover:text-[#e10600]"
            >
              <LogOut className="w-4 h-4 sm:w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="text-[8px] sm:text-[10px] uppercase font-bold text-white/40 tracking-widest border-l border-white/10 pl-4 sm:pl-6 h-6 sm:h-8 flex items-center">
            Official Prediction Game
          </div>
        )}
      </div>
    </div>
  </header>
);

const Leaderboard = ({ teams }: { teams: Team[] }) => (
  <section className="f1-card overflow-hidden">
    <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
      <h2 className="font-black italic uppercase tracking-tighter flex items-center gap-2 text-base sm:text-lg">
        <Trophy className="w-4 h-4 sm:w-5 h-5 text-[#e10600]" /> Championship Standings
      </h2>
    </div>
    <div className="divide-y divide-white/5">
      {teams.map((team, idx) => (
        <div key={team.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative w-10 h-10 sm:w-12 h-12 flex items-center justify-center bg-white/5 rounded-xl sm:rounded-2xl border border-white/5 group-hover:border-[#e10600]/30 transition-colors">
              <span className={`text-xl sm:text-2xl font-black italic ${idx === 0 ? 'text-[#e10600]' : 'text-white/40'}`}>
                {idx + 1}
              </span>
              {idx === 0 && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#e10600] rounded-full shadow-lg shadow-red-600/50" />}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl italic tracking-tighter uppercase leading-none">Team {team.name}</span>
              <span className="text-[8px] sm:text-[10px] uppercase text-white/20 font-bold tracking-widest mt-1">Constructor</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black italic leading-none text-[#e10600]">{team.total_points}</div>
            <div className="text-[8px] sm:text-[10px] uppercase text-white/30 font-bold tracking-widest">Points</div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const Rules = () => (
  <section className="f1-card p-6 sm:p-8 space-y-6 sm:space-y-8">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 sm:w-10 h-10 bg-[#e10600]/10 rounded-lg sm:rounded-xl flex items-center justify-center">
        <Info className="w-4 h-4 sm:w-5 h-5 text-[#e10600]" />
      </div>
      <h2 className="font-black italic uppercase tracking-tighter text-base sm:text-lg">Scoring System</h2>
    </div>
    <div className="grid grid-cols-1 gap-6 sm:gap-8">
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-[#e10600] uppercase text-[8px] sm:text-[10px] font-black tracking-widest italic opacity-50">Base Points</h3>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between items-center p-3 sm:p-4 bg-white/2 rounded-xl sm:rounded-2xl border border-white/5">
            <span className="text-xs sm:text-sm font-bold">Exact Position</span>
            <span className="font-black italic text-[#e10600] text-base sm:text-lg">+25 PTS</span>
          </div>
          <div className="flex justify-between items-center p-3 sm:p-4 bg-white/2 rounded-xl sm:rounded-2xl border border-white/5">
            <span className="text-xs sm:text-sm font-bold">Podium Finish</span>
            <span className="font-black italic text-blue-400 text-base sm:text-lg">+10 PTS</span>
          </div>
        </div>
      </div>
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-[#e10600] uppercase text-[8px] sm:text-[10px] font-black tracking-widest italic opacity-50">Bonus & Malus</h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {[
            { label: 'En Plein', val: '+20', color: 'text-yellow-500' },
            { label: 'Rimonta', val: '+10', color: 'text-green-500' },
            { label: 'DNF', val: '-10', color: 'text-red-500' },
            { label: 'Penalty', val: '-5', color: 'text-orange-500' }
          ].map(item => (
            <div key={item.label} className="p-3 sm:p-4 bg-white/2 rounded-xl sm:rounded-2xl border border-white/5 text-center">
              <div className="text-[8px] sm:text-[10px] uppercase font-bold text-white/20 mb-1">{item.label}</div>
              <div className={`font-black italic ${item.color} text-lg sm:text-xl`}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const SeasonalStats = ({ stats }: { stats: SeasonStats | null }) => {
  if (!stats || stats.gps.length === 0) {
    return (
      <div className="f1-card p-8 sm:p-16 text-center space-y-6">
        <div className="w-16 h-16 sm:w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
          <History className="w-8 h-8 sm:w-10 h-10 text-white/20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">No Season Data</h2>
          <p className="text-white/20 text-xs sm:text-sm max-w-xs mx-auto">Championship analytics will be available after the first race classification is published.</p>
        </div>
      </div>
    );
  }

  const chartData = stats.gps.map((gp, index) => {
    const dataPoint: any = { name: gp.name.replace(' GP', '') };
    stats.stats.forEach(team => {
      dataPoint[team.team_name] = team.gpBreakdown[index]?.cumulative || 0;
    });
    return dataPoint;
  });

  const teamColors: Record<string, string> = {
    'CL': '#e10600', // F1 Red
    'ML': '#00d2be', // Petronas Teal
    'FL': '#ff8700'  // McLaren Orange
  };

  return (
    <div className="space-y-12">
      <section className="f1-card p-6 sm:p-10 space-y-8 sm:space-y-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#e10600]/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#e10600]" />
          </div>
          <h2 className="font-black italic uppercase tracking-tighter text-lg sm:text-xl">Points Progression</h2>
        </div>
        <div className="h-[300px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.2)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.2)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1e', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '1.5rem',
                  color: '#ffffff',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}
              />
              <Legend verticalAlign="top" height={48} iconType="circle" wrapperStyle={{ paddingTop: '0px', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900', fontStyle: 'italic' }} />
              {stats.stats.map(team => (
                <Line 
                  key={team.team_name}
                  type="monotone" 
                  dataKey={team.team_name} 
                  stroke={teamColors[team.team_name] || '#ffffff'} 
                  strokeWidth={5}
                  dot={{ r: 6, fill: teamColors[team.team_name], strokeWidth: 3, stroke: '#1a1a1e' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="f1-card overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-white/5 bg-white/2">
          <h2 className="font-black italic uppercase tracking-tighter flex items-center gap-3 text-lg sm:text-xl">
            <BarChart3 className="w-6 h-6 text-[#e10600]" /> Race Results Detail
          </h2>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/1">
                <th className="p-4 sm:p-8 text-[8px] sm:text-[10px] uppercase font-black tracking-[0.2em] text-white/20">Grand Prix</th>
                {stats.stats.map(team => (
                  <th key={team.team_id} className="p-4 sm:p-8 text-[8px] sm:text-[10px] uppercase font-black tracking-[0.2em] text-white/20 text-center">
                    Team {team.team_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.gps.map((gp, gpIdx) => (
                <tr key={gp.id} className="hover:bg-white/2 transition-colors group">
                  <td className="p-4 sm:p-8">
                    <div className="font-black italic text-base sm:text-xl uppercase tracking-tighter group-hover:text-[#e10600] transition-colors">{gp.name}</div>
                    <div className="text-[8px] sm:text-[10px] text-white/20 uppercase font-bold tracking-widest mt-1">{gp.location}</div>
                  </td>
                  {stats.stats.map(team => {
                    const gpData = team.gpBreakdown[gpIdx];
                    return (
                      <td key={team.team_id} className="p-4 sm:p-8 text-center">
                        <div className={`font-black italic text-xl sm:text-3xl tracking-tighter ${gpData?.points > 0 ? 'text-green-500' : 'text-white/10'}`}>
                          {gpData?.points > 0 ? `+${gpData.points}` : gpData?.points || 0}
                        </div>
                        <div className="text-[8px] sm:text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">
                          Total: {gpData?.cumulative || 0}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [gps, setGps] = useState<GP[]>([]);
  const [selectedGp, setSelectedGp] = useState<GP | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [view, setView] = useState<'dashboard' | 'predict' | 'stats' | 'admin'>('dashboard');
  const [isFetchingFIA, setIsFetchingFIA] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isFetchingPredictions, setIsFetchingPredictions] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [p3, setP3] = useState('');

  const [resP1, setResP1] = useState('');
  const [resP2, setResP2] = useState('');
  const [resP3, setResP3] = useState('');
  const [dnfs, setDnfs] = useState('');
  const [penalties, setPenalties] = useState('');
  const [rimonte, setRimonte] = useState('');

  useEffect(() => {
    const init = async () => {
      const savedName = localStorage.getItem('f1_team_name');
      if (savedName) {
        setAuthName(savedName);
        setRememberMe(true);
      }
      await checkSession();
      await fetchData();
    };
    init();
  }, []);

  const checkSession = async () => {
    try {
      console.log('Checking session...');
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const userData = await res.json();
        console.log('Session found for:', userData.team_name);
        setUser(userData);
        return userData;
      } else {
        console.log('No active session found');
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
      return null;
    }
  };

  const fetchData = async () => {
    try {
      console.log('Fetching initial data...');
      const [teamsRes, gpsRes, statsRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/gps'),
        fetch('/api/stats/season')
      ]);
      
      if (!teamsRes.ok || !gpsRes.ok || !statsRes.ok) {
        console.error('One or more initial data fetches failed');
      }

      const teamsData = await teamsRes.json();
      const gpsData = await gpsRes.json();
      const statsData = await statsRes.json();
      console.log('Teams loaded:', teamsData.length);
      setTeams(teamsData);
      setGps(gpsData);
      setSeasonStats(statsData);
      
      const nextGp = gpsData.find((g: GP) => !g.completed) || gpsData[gpsData.length - 1];
      if (nextGp && !selectedGp) setSelectedGp(nextGp);
      if (!nextGp) setIsFetchingPredictions(false);
    } catch (e) {
      console.error('fetchData error:', e);
      setIsFetchingPredictions(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = authView === 'login' ? '/api/auth/login' : '/api/auth/register';
    console.log(`Attempting ${authView} for team: ${authName}`);
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, password: authPassword })
      });
      
      console.log(`${authView} response object:`, res);
      console.log(`Response status: ${res.status} ${res.statusText}`);
      
      if (res.ok) {
        console.log(`${authView} successful`);
        const data = await res.json();
        console.log('Response data:', data);
        
        if (authView === 'login') {
          if (rememberMe) {
            localStorage.setItem('f1_team_name', authName);
          } else {
            localStorage.removeItem('f1_team_name');
          }
          const loggedUser = await checkSession();
          console.log('Session check result:', loggedUser);
          if (loggedUser) {
            setAuthName('');
            setAuthPassword('');
            setView('dashboard');
            await fetchData();
          } else {
            alert('Errore nel recupero della sessione. Riprova.');
          }
        } else {
          alert('Registrazione completata! Ora puoi effettuare il login.');
          setAuthView('login');
        }
      } else {
        let errorMessage = 'Unknown error';
        let rawText = '';
        try {
          rawText = await res.text();
          console.log(`${authView} raw error response:`, rawText);
          
          if (rawText) {
            try {
              const err = JSON.parse(rawText);
              console.error(`${authView} failed (parsed JSON):`, err);
              errorMessage = err.error || err.message || (Object.keys(err).length > 0 ? JSON.stringify(err) : `Server error (empty JSON) - Status: ${res.status}`);
            } catch (parseError) {
              console.error(`${authView} failed to parse error as JSON:`, parseError);
              errorMessage = `Server Error: ${rawText.substring(0, 100)}${rawText.length > 100 ? '...' : ''} (Status: ${res.status})`;
            }
          } else {
            errorMessage = `Server responded with status ${res.status}: ${res.statusText}`;
            if (res.status === 405) {
              errorMessage = "Errore 405: Metodo non consentito. Le rotte API potrebbero essere state generate come statiche. Riprova tra qualche minuto o contatta l'amministratore.";
            }
          }
        } catch (e) {
          console.error(`${authView} failed to read response text:`, e);
          errorMessage = `Network or Server Error (${res.status})`;
        }
        alert(`Errore: ${errorMessage}`);
      }
    } catch (fetchError: any) {
      console.error('Fetch error during auth:', fetchError);
      alert(`Errore di rete: ${fetchError.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout');
      setUser(null);
      setAuthView('login');
      // Keep the team name if it was remembered
      const savedName = localStorage.getItem('f1_team_name');
      setAuthName(savedName || '');
      setAuthPassword('');
      setView('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setAuthView('login');
    }
  };

  useEffect(() => {
    if (selectedGp) {
      // Clear current predictions to show loading state
      setPredictions([]);
      fetchPredictions(selectedGp.id);
    } else if (gps.length > 0) {
      // Waiting for initial selection
    } else {
      setIsFetchingPredictions(false);
    }
  }, [selectedGp, user?.team_id, gps.length]);

  // Sync form with existing prediction
  useEffect(() => {
    if (user && selectedGp) {
      const myPred = predictions.find(p => p.team_id === user.team_id && p.gp_id === selectedGp.id);
      if (myPred) {
        console.log('Syncing form with found prediction:', myPred);
        setP1(myPred.p1);
        setP2(myPred.p2);
        setP3(myPred.p3);
      } else {
        // Only clear if we are NOT currently fetching
        if (!isFetchingPredictions) {
          console.log('No prediction found for user, clearing form');
          setP1('');
          setP2('');
          setP3('');
        }
      }
    } else {
      // No user or no GP selected, clear form
      setP1('');
      setP2('');
      setP3('');
    }
  }, [predictions, user, selectedGp, isFetchingPredictions]);

  const fetchPredictions = async (gpId: number) => {
    setIsFetchingPredictions(true);
    try {
      console.log(`Fetching predictions for GP ${gpId}...`);
      const res = await fetch(`/api/predictions?gpId=${gpId}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Loaded ${data.length} predictions`);
        setPredictions(data);
      }
    } catch (e) {
      console.error('fetchPredictions error:', e);
    } finally {
      setIsFetchingPredictions(false);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGp || !user || !p1 || !p2 || !p3 || isPredicting) return;

    setIsPredicting(true);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gp_id: selectedGp.id,
          team_id: user.team_id,
          p1, p2, p3
        })
      });

      if (res.ok) {
        await fetchPredictions(selectedGp.id);
        await fetchData();
        setP1(''); setP2(''); setP3('');
        // Visual feedback could be improved beyond alert, but alert is a start.
        // Let's add a temporary success message state if needed, but for now alert is functional.
        alert('Pronostico salvato con successo! 🏎️');
      } else {
        const err = await res.json();
        alert(`Errore nella registrazione del pronostico: ${err.error}`);
      }
    } catch (error: any) {
      console.error('handlePredict error:', error);
      alert(`Errore di connessione: ${error.message}`);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGp || !resP1 || !resP2 || !resP3) return;

    await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gp_id: selectedGp.id,
        p1: resP1,
        p2: resP2,
        p3: resP3,
        dnfs: dnfs.split(',').map(s => s.trim()).filter(Boolean),
        penalties: penalties.split(',').map(s => s.trim()).filter(Boolean),
        rimonte: rimonte.split(',').map(s => s.trim()).filter(Boolean)
      })
    });

    fetchData();
    setView('dashboard');
    alert('Risultati salvati e punteggi aggiornati!');
  };

  const fetchFIAResults = async () => {
    if (!selectedGp) return;
    setIsFetchingFIA(true);
    try {
      const res = await fetch('/api/fia-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gpName: selectedGp.name })
      });
      
      const data = await res.json();
      if (res.ok) {
        setResP1(data.p1 || '');
        setResP2(data.p2 || '');
        setResP3(data.p3 || '');
        setDnfs(data.dnfs?.join(', ') || '');
        setPenalties(data.penalties?.join(', ') || '');
        setRimonte(data.rimonte?.join(', ') || '');
        alert('Risultati recuperati con successo!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Errore nel recupero dei risultati FIA.');
    } finally {
      setIsFetchingFIA(false);
    }
  };

  const copyToWhatsApp = (pred: Prediction) => {
    const text = `🏁 FANTAPODIO 2.0 🏁\nTeam ${pred.team_name} - GP ${selectedGp?.name}\n\n1. ${pred.p1}\n2. ${pred.p2}\n3. ${pred.p3}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const isDeadlinePassed = selectedGp ? new Date() > new Date(selectedGp.start_time) : false;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0f12] text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#e10600]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-12">
            <div className="h-16 w-24 bg-[#e10600] flex items-center justify-center rounded-2xl mx-auto mb-6 shadow-2xl shadow-red-600/40">
              <span className="text-white font-black italic text-4xl">F1</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter italic uppercase leading-none">
              Fantapodio <span className="text-[#e10600]">2026</span>
            </h1>
            
            {gps.find(g => !g.completed) && (
              <div className="mt-8 space-y-4">
                <div className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em]">Next Lights Out: {gps.find(g => !g.completed)?.name}</div>
                <Countdown targetDate={gps.find(g => !g.completed)!.start_time} />
              </div>
            )}

            <p className="text-white/20 text-xs uppercase tracking-[0.3em] font-bold mt-8">Paddock Access Required</p>
          </div>
          
          <div className="f1-card p-6 sm:p-10 space-y-8 sm:space-y-10">
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
              <button 
                type="button" 
                onClick={() => { setAuthView('login'); setAuthName(''); }} 
                className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-[10px] sm:text-xs font-black italic uppercase transition-all ${authView === 'login' ? 'bg-[#e10600] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Login
              </button>
              <button 
                type="button" 
                onClick={() => { setAuthView('register'); setAuthName(''); }} 
                className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-[10px] sm:text-xs font-black italic uppercase transition-all ${authView === 'register' ? 'bg-[#e10600] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-8">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">Team Name</label>
                  <div className="relative">
                    <input 
                      required 
                      name="username"
                      autoComplete="username"
                      list="teams-list"
                      placeholder="Select or type Team"
                      value={authName} 
                      onChange={e => setAuthName(e.target.value.toUpperCase())} 
                      className="f1-input italic uppercase pr-10"
                    />
                    <datalist id="teams-list">
                      {teams.map(t => (
                        <option key={t.id} value={t.name} />
                      ))}
                    </datalist>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none rotate-90" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-1">Security Key</label>
                  <input 
                    required 
                    name="password"
                    autoComplete={authView === 'login' ? 'current-password' : 'new-password'}
                    type="password" 
                    placeholder="••••••••" 
                    value={authPassword} 
                    onChange={e => setAuthPassword(e.target.value)} 
                    className="f1-input" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#e10600] focus:ring-[#e10600]"
                />
                <label htmlFor="rememberMe" className="text-[10px] uppercase font-bold tracking-widest text-white/40 cursor-pointer select-none">Remember Team</label>
              </div>
              
              <button 
                type="submit" 
                className="f1-button w-full py-5 text-lg"
              >
                {authView === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                {authView === 'login' ? 'Enter Paddock' : 'Register Team'}
              </button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-[10px] text-white/10 uppercase font-bold tracking-widest">
                {authView === 'login' ? 'Authorized personnel only' : 'Create your constructor identity'}
              </p>
              <div className="pt-4 border-t border-white/5 space-y-4">
                <button 
                  onClick={handleLogout}
                  className="text-[8px] text-[#e10600]/40 hover:text-[#e10600] uppercase tracking-widest font-bold transition-colors"
                >
                  Reset Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white font-sans selection:bg-[#e10600] selection:text-white pb-20">
      <Header user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-12 space-y-8 sm:space-y-12">
        <div className="flex justify-center overflow-x-auto pb-4 sm:pb-0 scrollbar-hide">
          <div className="inline-flex p-1 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl">
            {[
              { id: 'dashboard', icon: <Zap className="w-3 h-3 sm:w-4 h-4" />, label: 'Paddock' },
              { id: 'stats', icon: <TrendingUp className="w-3 h-3 sm:w-4 h-4" />, label: 'Standings' },
              { id: 'predict', icon: <Plus className="w-3 h-3 sm:w-4 h-4" />, label: 'Predict' },
              { id: 'admin', icon: <Settings className="w-3 h-3 sm:w-4 h-4" />, label: 'Race Control' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-4 sm:px-8 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black italic uppercase transition-all whitespace-nowrap ${view === tab.id ? 'bg-[#e10600] text-white shadow-xl shadow-red-600/20' : 'text-white/40 hover:text-white'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-10"
            >
              <div className="lg:col-span-2 space-y-12">
                <section className="f1-card p-6 sm:p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity hidden sm:block">
                    <Calendar className="w-64 h-64" />
                  </div>
                  <div className="relative z-10 space-y-8 sm:space-y-10">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 sm:px-4 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-black italic uppercase tracking-widest rounded-full ${isDeadlinePassed ? 'bg-white/5 text-white/20' : 'bg-[#e10600] text-white shadow-lg shadow-red-600/30 animate-pulse'}`}>
                        {isDeadlinePassed ? 'Event Live / Ended' : 'Next Grand Prix'}
                      </span>
                      <div className="h-[1px] flex-1 bg-white/5" />
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <h2 className="text-3xl sm:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter leading-tight sm:leading-none">{selectedGp?.name}</h2>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/40 font-bold uppercase text-[10px] sm:text-sm tracking-widest">
                          <span>{selectedGp?.location}</span>
                          <span className="hidden sm:block w-1.5 h-1.5 bg-[#e10600] rounded-full" />
                          <span>{selectedGp?.date}</span>
                        </div>
                        {selectedGp && !selectedGp.completed && (
                          <div className="bg-black/20 p-2 rounded-2xl border border-white/5">
                            <Countdown targetDate={selectedGp.start_time} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 pt-4 sm:pt-6">
                      <div className="space-y-2 sm:space-y-3">
                        <span className="text-[8px] sm:text-[10px] uppercase font-black text-white/20 tracking-[0.3em] flex items-center gap-2">
                          <Clock className="w-3 h-3 sm:w-4 h-4 text-[#e10600]" /> Session Deadline
                        </span>
                        <p className={`font-black italic text-lg sm:text-2xl ${isDeadlinePassed ? 'text-white/20' : 'text-white'}`}>
                          {selectedGp ? formatMilanTime(selectedGp.start_time) : '-'}
                        </p>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <span className="text-[8px] sm:text-[10px] uppercase font-black text-white/20 tracking-[0.3em] flex items-center gap-2">
                          <Search className="w-3 h-3 sm:w-4 h-4 text-[#e10600]" /> Select Event
                        </span>
                        <select 
                          className="f1-input py-2.5 sm:py-3 text-[10px] sm:text-xs italic uppercase appearance-none"
                          value={selectedGp?.id || ''}
                          onChange={(e) => setSelectedGp(gps.find(g => g.id === parseInt(e.target.value)) || null)}
                        >
                          {gps.map(gp => (
                            <option key={gp.id} value={gp.id} className="bg-[#1a1a1e]">
                              {gp.completed ? '🏁' : '📅'} {gp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-8">
                  <div className="flex items-center gap-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/20 whitespace-nowrap">Team Predictions</h3>
                    <div className="h-[1px] w-full bg-white/5" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {isFetchingPredictions ? (
                      [1, 2, 3].map(i => (
                        <div key={i} className="f1-card p-6 sm:p-8 h-64 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-white/10" />
                        </div>
                      ))
                    ) : (
                      ['CL', 'ML', 'FL'].map(teamName => {
                        const pred = predictions.find(p => p.team_name === teamName);
                        return (
                          <div key={teamName} className="f1-card p-6 sm:p-8 space-y-6 sm:space-y-8 relative group border-t-4 border-t-transparent hover:border-t-[#e10600]">
                            <div className="flex items-center justify-between">
                              <span className="font-black italic text-lg sm:text-xl tracking-tighter uppercase">Team {teamName}</span>
                              {pred && (
                                <button 
                                  onClick={() => copyToWhatsApp(pred)}
                                  className="p-2 sm:p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-600/5"
                                  title="Share to WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4 sm:w-5 h-5" />
                                </button>
                              )}
                            </div>
                            {pred ? (
                              <div className="space-y-3 sm:space-y-4">
                                {[1, 2, 3].map(pos => (
                                  <div key={pos} className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-white/2 rounded-xl sm:rounded-2xl border border-white/5">
                                    <span className={`w-7 h-7 sm:w-8 h-8 ${pos === 1 ? 'bg-yellow-500' : pos === 2 ? 'bg-zinc-400' : 'bg-orange-600'} text-black text-[8px] sm:text-[10px] font-black italic rounded-lg flex items-center justify-center shadow-lg`}>{pos}</span>
                                    <span className="font-black italic uppercase text-xs sm:text-sm tracking-tight">{(pred as any)[`p${pos}`]}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-32 sm:h-40 flex flex-col items-center justify-center text-white/5 space-y-3">
                                <ShieldAlert className="w-8 h-8 sm:w-10 h-10 opacity-10" />
                                <span className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest italic">No Prediction</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
              <div className="space-y-10">
                <Leaderboard teams={teams} />
                <Rules />
              </div>
            </motion.div>
          )}

          {view === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <SeasonalStats stats={seasonStats} />
            </motion.div>
          )}

          {view === 'predict' && (
            <motion.div key="predict" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-2xl mx-auto">
              {isDeadlinePassed ? (
                <div className="f1-card p-16 text-center space-y-8">
                  <div className="w-24 h-24 bg-[#e10600]/10 text-[#e10600] rounded-3xl flex items-center justify-center mx-auto border border-[#e10600]/20 shadow-2xl shadow-red-600/10">
                    <AlertCircle className="w-12 h-12" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Pit Lane Closed</h2>
                    <p className="text-white/20 text-sm max-w-xs mx-auto">The prediction window for this event has closed. No more modifications allowed.</p>
                  </div>
                  <button onClick={() => setView('dashboard')} className="f1-button px-12">Return to Paddock</button>
                </div>
              ) : (
                <form onSubmit={handlePredict} className="f1-card p-6 sm:p-12 space-y-8 sm:space-y-12 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#e10600] to-transparent" />
                  
                  <div className="text-center space-y-3 sm:space-y-4">
                    <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">Submit Prediction</h2>
                    <p className="text-white/20 text-[8px] sm:text-[10px] uppercase font-bold tracking-[0.3em]">{selectedGp?.name} Podium Classification</p>
                  </div>

                  <div className="space-y-8">
                    {[1, 2, 3].map(pos => (
                      <div key={pos} className="space-y-3">
                        <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${pos === 1 ? 'text-yellow-500' : pos === 2 ? 'text-zinc-400' : 'text-orange-600'} flex items-center gap-2`}>
                          <Trophy className="w-4 h-4" /> Podium Position {pos}
                        </label>
                        <div className="relative">
                          <select 
                            required
                            className="f1-input appearance-none pr-12 italic uppercase"
                            value={pos === 1 ? p1 : pos === 2 ? p2 : p3}
                            onChange={(e) => pos === 1 ? setP1(e.target.value) : pos === 2 ? setP2(e.target.value) : setP3(e.target.value)}
                          >
                            <option value="" className="bg-[#1a1a1e]">Select Driver</option>
                            {DRIVERS.filter(d => {
                              if (pos === 1) return d.name !== p2 && d.name !== p3;
                              if (pos === 2) return d.name !== p1 && d.name !== p3;
                              return d.name !== p1 && d.name !== p2;
                            }).map(d => (
                              <option key={d.number} value={d.name} className="bg-[#1a1a1e]">{d.number} - {d.name} ({d.team})</option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const userPred = predictions.find(p => p.team_id === user?.team_id);
                    const attempts = userPred?.attempts || 0;
                    const remaining = Math.max(0, 3 - attempts);
                    const disabled = remaining === 0 || isDeadlinePassed || isPredicting;

                    return (
                      <div className="space-y-4">
                        <button 
                          type="submit" 
                          disabled={disabled}
                          className={`f1-button w-full py-6 text-xl flex-col gap-1 ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            {isPredicting ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-6 h-6" /> 
                            )}
                            <span>
                              {isPredicting ? 'Transmitting...' : (remaining === 0 ? 'Attempts Exhausted' : 'Confirm Prediction')}
                            </span>
                          </div>
                          {!disabled && !isPredicting && selectedGp && (
                            <div className="text-[10px] font-bold opacity-70 flex items-center gap-2">
                              <span>Remaining: {remaining}/3</span>
                              <span className="w-1 h-1 bg-white/30 rounded-full" />
                              <ButtonCountdown targetDate={selectedGp.start_time} />
                            </div>
                          )}
                        </button>
                        {remaining === 0 && (
                          <p className="text-center text-[10px] text-[#e10600] font-black uppercase tracking-widest italic animate-pulse">
                            Maximum of 3 attempts reached for this Grand Prix
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </form>
              )}
            </motion.div>
          )}

          {view === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
              <form onSubmit={handleSaveResult} className="f1-card p-6 sm:p-12 space-y-8 sm:space-y-12">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3 sm:gap-4">
                      <ShieldAlert className="w-8 h-8 sm:w-10 h-10 text-[#e10600]" /> Race Control
                    </h2>
                    <p className="text-white/20 text-[8px] sm:text-[10px] uppercase tracking-[0.3em] font-bold">Official Classification: {selectedGp?.name}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={fetchFIAResults}
                    disabled={isFetchingFIA}
                    className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-6 sm:px-8 py-3 sm:py-4 text-[8px] sm:text-[10px] font-black italic uppercase flex items-center justify-center gap-3 transition-all disabled:opacity-50 text-white shadow-xl"
                  >
                    {isFetchingFIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-yellow-500" />}
                    AI Scrutineering
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[1, 2, 3].map(pos => (
                    <div key={pos} className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/20">P{pos} Result</label>
                      <select 
                        required
                        className="f1-input py-3 italic uppercase appearance-none"
                        value={pos === 1 ? resP1 : pos === 2 ? resP2 : resP3}
                        onChange={(e) => pos === 1 ? setResP1(e.target.value) : pos === 2 ? setResP2(e.target.value) : setResP3(e.target.value)}
                      >
                        <option value="" className="bg-[#1a1a1e]">Driver</option>
                        {DRIVERS.map(d => <option key={d.number} value={d.name} className="bg-[#1a1a1e]">{d.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Retirements (DNF)</label>
                    <input value={dnfs} onChange={e => setDnfs(e.target.value)} placeholder="Verstappen, Hamilton..." className="f1-input" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20">FIA Penalties</label>
                    <input value={penalties} onChange={e => setPenalties(e.target.value)} placeholder="Perez, Alonso..." className="f1-input" />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Rimonte Killer (Started 11th+ -{'>'} Top 10)</label>
                    <input value={rimonte} onChange={e => setRimonte(e.target.value)} placeholder="Norris, Bearman..." className="f1-input" />
                  </div>
                </div>

                <button type="submit" className="f1-button w-full py-6 text-xl">Publish Official Results</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
