import { useState, useEffect } from 'react';

function getTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export function Countdown({ targetDate }: { targetDate: string }) {
  const [left, setLeft] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const t = setInterval(() => setLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  if (!left) {
    return (
      <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">
        Race started
      </span>
    );
  }

  const parts = left.d > 0
    ? [{ v: left.d, l: 'd' }, { v: left.h, l: 'h' }, { v: left.m, l: 'm' }]
    : [{ v: left.h, l: 'h' }, { v: left.m, l: 'm' }, { v: left.s, l: 's' }];

  return (
    <div className="flex items-center gap-2">
      {parts.map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <span className="text-xl font-black italic tabular-nums leading-none text-white">
            {String(v).padStart(2, '0')}
          </span>
          <span className="text-[7px] font-black uppercase text-white/20 tracking-widest">{l}</span>
        </div>
      ))}
    </div>
  );
}

export function ButtonCountdown({ targetDate }: { targetDate: string }) {
  const [left, setLeft] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const t = setInterval(() => setLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  if (!left) return <span>Closed</span>;

  if (left.d > 0) return <span>{left.d}d {left.h}h</span>;
  return <span>{String(left.h).padStart(2,'0')}:{String(left.m).padStart(2,'0')}:{String(left.s).padStart(2,'0')}</span>;
}
