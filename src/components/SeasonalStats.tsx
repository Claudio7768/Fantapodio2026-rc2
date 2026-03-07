import { TrendingUp, Star, Zap, Flag } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { SeasonStats } from '@/lib/constants';

interface SeasonalStatsProps {
  stats: SeasonStats | null;
}

const TEAM_COLORS: Record<string, string> = {
  CL: '#e10600',
  ML: '#ff8000',
  FL: '#00d2be',
};

// Tooltip personalizzato dark
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          <span className="text-xs font-black italic uppercase text-white">
            Team {p.dataKey}: <span style={{ color: p.color }}>{p.value} pts</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export function SeasonalStats({ stats }: SeasonalStatsProps) {
  if (!stats) {
    return (
      <div className="f1-card p-16 text-center text-white/20">
        <TrendingUp className="w-10 h-10 mx-auto mb-4 opacity-20" />
        <p className="text-xs font-black uppercase tracking-widest italic">No season data yet</p>
      </div>
    );
  }

  // Costruisce dati cumulativi per il grafico
  const chartData = stats.gp_breakdown.map((gp, idx) => {
    const entry: Record<string, any> = {
      name: gp.gp_name.replace(/ Grand Prix| GP/g, '').replace(/Barcelona-Catalunya/, 'Barcellona'),
    };
    stats.leaderboard.forEach(team => {
      // somma cumulativa fino a questo GP
      const cumulative = stats.gp_breakdown
        .slice(0, idx + 1)
        .reduce((sum, g) => {
          const s = g.scores.find(s => s.team_id === team.team_id);
          return sum + (s?.score ?? 0);
        }, 0);
      entry[team.team_id] = cumulative;
    });
    return entry;
  });

  const teamIds = stats.leaderboard.map(t => t.team_id);

  return (
    <div className="space-y-10">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Flag className="w-5 h-5" />, label: 'GPs completati', value: `${stats.completed_gps}/${stats.total_gps}` },
          { icon: <Star className="w-5 h-5" />, label: 'Leader', value: stats.leaderboard[0]?.team_id ? `Team ${stats.leaderboard[0].team_id}` : '-' },
          { icon: <Zap className="w-5 h-5" />, label: 'Top score', value: `${Math.max(...stats.leaderboard.map(t => t.total_score), 0)} pts` },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Podio perfetto', value: `${stats.leaderboard.reduce((s, t) => s + t.perfect_podiums, 0)}x` },
        ].map((stat, i) => (
          <div key={i} className="f1-card p-5 space-y-3">
            <span className="text-primary">{stat.icon}</span>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">{stat.label}</p>
              <p className="text-2xl font-black italic">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grafico andamento classifica */}
      {chartData.length > 0 && (
        <div className="f1-card p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Championship Chart</h2>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: TEAM_COLORS[value] || '#fff', fontWeight: 900, fontStyle: 'italic', fontSize: 11, textTransform: 'uppercase' }}>
                    Team {value}
                  </span>
                )}
              />
              {teamIds.map(id => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  stroke={TEAM_COLORS[id] || '#fff'}
                  strokeWidth={2.5}
                  dot={{ fill: TEAM_COLORS[id], r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Leaderboard dettagliato */}
      <div className="f1-card p-6 sm:p-10 space-y-8">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Season Standings</h2>
        <div className="space-y-4">
          {stats.leaderboard.map((team, idx) => (
            <div key={team.team_id} className="p-5 bg-white/[0.02] rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center gap-4">
                <span className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-black italic ${
                  idx === 0 ? 'bg-yellow-500 text-black' :
                  idx === 1 ? 'bg-zinc-400 text-black' :
                  'bg-orange-600 text-black'
                }`}>{idx + 1}</span>
                <div className="flex-1">
                  <p className="font-black italic uppercase tracking-tight text-lg">Team {team.team_id}</p>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                    {team.gps_count} GP — {team.perfect_podiums} podio perfetto — best: {team.best_score} pts
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black italic tabular-nums">{team.total_score}</span>
                  <span className="text-[10px] font-black text-white/20 uppercase ml-1">pts</span>
                </div>
              </div>

              {/* GP score breakdown */}
              {stats.gp_breakdown.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {stats.gp_breakdown.map(gp => {
                    const entry = gp.scores.find(s => s.team_id === team.team_id);
                    const score = entry?.score ?? 0;
                    return (
                      <div key={gp.gp_id} className="flex flex-col items-center p-2 rounded-lg bg-white/5 min-w-[52px]" title={gp.gp_name}>
                        <span className={`text-xs font-black italic tabular-nums ${
                          score === 75 ? 'text-yellow-400' : score >= 25 ? 'text-primary' : score > 0 ? 'text-white/60' : 'text-white/15'
                        }`}>{score}</span>
                        <span className="text-[7px] text-white/20 font-bold uppercase tracking-wide truncate max-w-[48px] text-center">
                          {gp.gp_name.replace(/ Grand Prix| GP/, '').slice(0, 6)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
