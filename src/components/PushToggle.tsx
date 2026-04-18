import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useState } from 'react';

interface Props {
  teamId: string;
}

export function PushToggle({ teamId }: Props) {
  const { permission, subscribed, subscribe, unsubscribe } = usePushNotifications(teamId);
  const [loading, setLoading] = useState(false);

  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;

  const toggle = async () => {
    setLoading(true);
    if (subscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
    setLoading(false);
  };

  return (
    <div className="f1-card p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {subscribed
          ? <Bell className="w-4 h-4 text-primary flex-shrink-0" />
          : <BellOff className="w-4 h-4 text-white/30 flex-shrink-0" />
        }
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest">
            Notifiche Push
          </p>
          <p className="text-[9px] text-white/30 font-bold mt-0.5">
            {subscribed
              ? 'Attive — ricevi promemoria GP e messaggi radio'
              : permission === 'denied'
                ? 'Bloccate dal browser — abilita nelle impostazioni'
                : 'Ricevi promemoria 24h prima del GP e nuovi messaggi radio'
            }
          </p>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={loading || permission === 'denied'}
        className={`flex-shrink-0 w-12 h-6 rounded-full transition-all relative disabled:opacity-30 ${
          subscribed ? 'bg-primary' : 'bg-white/10'
        }`}
      >
        {loading
          ? <Loader2 className="w-3 h-3 animate-spin absolute top-1.5 left-4 text-white" />
          : <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
              subscribed ? 'left-7' : 'left-1'
            }`} />
        }
      </button>
    </div>
  );
}
