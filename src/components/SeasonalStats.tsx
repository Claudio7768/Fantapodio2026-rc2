import { TrendingUp, Star, Zap, Flag } from 'lucide-react';
import { SeasonStats } from '@/lib/constants';

interface SeasonalStatsProps {
  stats: SeasonStats | null;
}

export function SeasonalStats({ stats }: SeasonalStatsProps) {
  if (!stats) {
    return (
      <div className="f1-card p-16 text-center text-white/20">
        <TrendingUp className="w-10 h-10 mx-auto mb-4 opacity-20" />
        <p className="text-xs font-black uppercase tracking-widest italic">No season data yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Season summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Flag className="w-5 h-5" />, label: 'GPs completati', value: `${stats.completed_gps}/${stats.total_gps}` },
          { icon: <Star className="w-5 h-5" />, label: 'Leader', value: stats.leaderboard[0]?.team_id || '-' },
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

              {/* GP breakdown */}
              {stats.gp_breakdown.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {stats.gp_breakdown.map(gp => {
                    const entry = gp.scores.find(s => s.team_id === team.team_id);
                    const score = entry?.score ?? 0;
                    return (
                      <div
                        key={gp.gp_id}
                        className="flex flex-col items-center p-2 rounded-lg bg-white/5 min-w-[52px]"
                        title={gp.gp_name}
                      >
                        <span className={`text-xs font-black italic tabular-nums ${score === 75 ? 'text-yellow-400' : score >= 25 ? 'text-primary' : score > 0 ? 'text-white/60' : 'text-white/15'}`}>
                          {score}
                        </span>
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
