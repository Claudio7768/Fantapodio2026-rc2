import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Prediction, Result } from '@/lib/constants';
import { calcScore, INITIAL_TEAMS } from '@/lib/constants';

interface Props {
  predictions: Prediction[];
  gpId: string;
  result: Omit<Result, 'id' | 'gp_id'>;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TEAM_COLORS: Record<string, string> = {
  CL: 'hsl(1 96% 44%)',
  ML: 'hsl(32 100% 50%)',
  FL: 'hsl(174 100% 42%)',
};

export function ScorePreview({ predictions, gpId, result, onConfirm, onCancel, isSubmitting }: Props) {
  const teams = ['CL', 'ML', 'FL'];

  const fullResult: Result = { id: 'preview', gp_id: gpId, ...result };

  const teamScores = teams.map(teamId => {
    const pred = predictions.find(p => p.team_id === teamId && p.gp_id === gpId);
    const score = pred ? calcScore(pred, fullResult) : null;
    return { teamId, pred, score };
  });

  const hasPredictions = teamScores.some(t => t.pred);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="f1-card w-full max-w-md p-6 sm:p-8 space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">
            Preview Punteggi
          </h2>
          <p className="text-[10px] uppercase font-black tracking-widest text-white/30">
            Podio: {result.p1} · {result.p2} · {result.p3}
          </p>
        </div>

        {/* Scores */}
        {hasPredictions ? (
          <div className="space-y-3">
            {teamScores.map(({ teamId, pred, score }) => {
              const color = TEAM_COLORS[teamId];
              return (
                <div key={teamId} className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
                      Team {teamId}
                    </span>
                    {pred && (
                      <span className="text-[9px] text-white/20 font-bold truncate ml-1">
                        {pred.p1} / {pred.p2} / {pred.p3}
                      </span>
                    )}
                  </div>
                  {pred ? (
                    <span className={`text-xl font-black italic flex-shrink-0 ${
                      score! > 0 ? 'text-green-400' : score! < 0 ? 'text-red-400' : 'text-white/30'
                    }`}>
                      {score! > 0 ? '+' : ''}{score}
                    </span>
                  ) : (
                    <span className="text-white/20 text-sm font-black">—</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-500/50 mx-auto mb-2" />
            <p className="text-[10px] uppercase font-black tracking-widest text-white/30">
              Nessun pronostico trovato per questo GP
            </p>
          </div>
        )}

        {/* DNF / Rimonte info */}
        {(result.dnf?.length > 0 || (result.rimonta && result.rimonta.length > 0)) && (
          <div className="flex gap-4 text-[9px] font-bold text-white/30 uppercase tracking-widest">
            {result.dnf?.length > 0 && (
              <span>DNF: {Array.isArray(result.dnf) ? result.dnf.join(', ') : result.dnf}</span>
            )}
            {result.rimonta && result.rimonta.length > 0 && (
              <span>Rimonta: {Array.isArray(result.rimonta) ? result.rimonta.join(', ') : result.rimonta}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all text-[11px] font-black uppercase tracking-widest"
          >
            Modifica
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Pubblicazione...' : 'Pubblica'}
          </button>
        </div>
      </div>
    </div>
  );
}
