import { Trophy } from 'lucide-react';
import type { GP, Prediction, Result } from '@/lib/constants';
import { calcScore } from '@/lib/constants';

interface Props {
  gps: GP[];
  predictions: Prediction[];
  results: Result[];
  currentTeamId: string;
}

const TEAM_COLORS: Record<string, string> = {
  CL: 'hsl(1 96% 44%)',
  ML: 'hsl(32 100% 50%)',
  FL: 'hsl(174 100% 42%)',
};

const POS_COLORS = ['bg-yellow-500', 'bg-zinc-400', 'bg-orange-600'];

export function PredictionHistory({ gps, predictions, results, currentTeamId }: Props) {
  const completedGps = gps.filter(g => g.completed && !g.cancelled);

  if (completedGps.length === 0) {
    return (
      <div className="f1-card p-12 text-center space-y-3">
        <Trophy className="w-10 h-10 text-white/10 mx-auto" />
        <p className="text-[10px] uppercase font-black tracking-widest text-white/20 italic">
          Nessuna gara completata
        </p>
      </div>
    );
  }

  const teams = ['CL', 'ML', 'FL'];

  return (
    <div className="space-y-6">
      {completedGps.map(gp => {
        const result = results.find(r => r.gp_id === gp.id);

        return (
          <div key={gp.id} className="f1-card overflow-hidden">
            {/* GP Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
                  {gp.date}
                </p>
                <h3 className="text-sm font-black italic uppercase tracking-tight mt-0.5">
                  {gp.name.replace(' Grand Prix', '')}
                </h3>
              </div>
              {result && (
                <div className="flex items-center gap-2 text-[10px] font-black italic uppercase">
                  {[result.p1, result.p2, result.p3].map((driver, i) => (
                    <span key={i} className={`${POS_COLORS[i]} text-black px-2 py-0.5 rounded-lg`}>
                      {driver}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Team predictions */}
            <div className="grid grid-cols-3 divide-x divide-white/5">
              {teams.map(teamId => {
                const pred = predictions.find(p => p.team_id === teamId && p.gp_id === gp.id);
                const score = pred && result ? calcScore(pred, result) : null;
                const isMe = teamId === currentTeamId;
                const color = TEAM_COLORS[teamId];

                return (
                  <div key={teamId} className={`p-4 space-y-3 ${isMe ? 'bg-white/[0.02]' : ''}`}>
                    {/* Team header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
                          {teamId}
                        </span>
                      </div>
                      {score !== null && (
                        <span className={`text-xs font-black italic ${score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-white/30'}`}>
                          {score > 0 ? '+' : ''}{score}
                        </span>
                      )}
                    </div>

                    {pred ? (
                      <div className="space-y-1">
                        {[pred.p1, pred.p2, pred.p3].map((driver, i) => {
                          const isCorrectPos = result && [result.p1, result.p2, result.p3][i] === driver;
                          const isInPodio = result && [result.p1, result.p2, result.p3].includes(driver);
                          return (
                            <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black italic uppercase ${
                              isCorrectPos ? 'bg-green-500/20 text-green-400' :
                              isInPodio ? 'bg-blue-500/10 text-blue-400' :
                              'bg-white/[0.03] text-white/30'
                            }`}>
                              <span className={`w-3.5 h-3.5 flex-shrink-0 ${POS_COLORS[i]} text-black text-[7px] font-black rounded flex items-center justify-center`}>
                                {i + 1}
                              </span>
                              <span className="truncate">{driver}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[9px] text-white/15 font-black uppercase italic text-center py-2">
                        —
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
