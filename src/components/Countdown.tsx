import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

function useCountdown(target: string) {
  const calc = () => {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      total:   diff,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [target]);
  return time;
}

// ── Compact countdown (dentro il bottone submit) ──────────────
export function ButtonCountdown({ targetDate }: { targetDate: string }) {
  const t = useCountdown(targetDate);
  if (!t) return <span className="text-primary">CLOSED</span>;
  if (t.days > 0) return <span>{t.days}d {t.hours}h</span>;
  return <span className={t.hours < 1 ? 'text-red-400 animate-pulse' : ''}>{t.hours}h {t.minutes}m</span>;
}

// ── Full countdown — visibile nella card Next GP ──────────────
export function Countdown({ targetDate }: { targetDate: string }) {
  const t = useCountdown(targetDate);

  if (!t) return (
    <div className="flex items-center gap-2 text-white/20">
      <Clock className="w-3 h-3" />
      <span className="text-[10px] font-black uppercase tracking-widest italic">Gara in corso</span>
    </div>
  );

  const isUrgent = t.total < 3600000; // meno di 1 ora
  const isToday  = t.days === 0;

  const units = t.days > 0
    ? [{ v: t.days, l: 'GG' }, { v: t.hours, l: 'OO' }, { v: t.minutes, l: 'MM' }]
    : [{ v: t.hours, l: 'OO' }, { v: t.minutes, l: 'MM' }, { v: t.seconds, l: 'SS' }];

  return (
    <div className={`flex items-center gap-1 sm:gap-2 ${isUrgent ? 'animate-pulse' : ''}`}>
      {units.map(({ v, l }, i) => (
        <div key={l} className="flex items-center gap-1 sm:gap-2">
          {i > 0 && (
            <span className={`text-base sm:text-xl font-black ${isUrgent ? 'text-red-400' : 'text-white/20'}`}>:</span>
          )}
          <div className="flex flex-col items-center">
            <span className={`text-xl sm:text-3xl font-black italic tabular-nums leading-none ${
              isUrgent ? 'text-red-400' :
              isToday  ? 'text-primary' :
              'text-white'
            }`}>
              {String(v).padStart(2, '0')}
            </span>
            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-white/20 mt-0.5">
              {l}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
