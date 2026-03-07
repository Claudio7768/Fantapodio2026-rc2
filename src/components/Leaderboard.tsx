import { Trophy } from 'lucide-react';
import { Team } from '@/lib/constants';

interface LeaderboardProps {
  teams: Team[];
}

export function Leaderboard({ teams }: LeaderboardProps) {
  const sorted = [...teams].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <section className="f1-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Championship</h3>
      </div>

      <div className="space-y-3">
        {sorted.map((team, idx) => (
          <div
            key={team.id}
            className="flex items-center gap-4 p-3 sm:p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-primary/20 transition-all"
          >
            {/* Position */}
            <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-black italic ${
              idx === 0 ? 'bg-yellow-500 text-black' :
              idx === 1 ? 'bg-zinc-400 text-black' :
              idx === 2 ? 'bg-orange-600 text-black' :
              'bg-white/5 text-white/40'
            }`}>
              {idx + 1}
            </span>

            {/* Team name */}
            <span className="flex-1 font-black italic uppercase text-sm tracking-tight">
              Team {team.id}
            </span>

            {/* Score */}
            <div className="text-right">
              <span className="text-xl font-black italic text-white tabular-nums">
                {team.score ?? 0}
              </span>
              <span className="text-[8px] font-black text-white/20 uppercase ml-1">pts</span>
            </div>
          </div>
        ))}

        {sorted.length === 0 && (
          <div className="h-24 flex items-center justify-center text-white/10 text-xs font-black uppercase tracking-widest italic">
            No data yet
          </div>
        )}
      </div>
    </section>
  );
}
