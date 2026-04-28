import { LogOut, Zap, Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface HeaderProps {
  user: { team_id: string; team_name: string };
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const { subscribed, supported, loading, subscribe, unsubscribe, permission } =
    usePushNotifications(user.team_id);

  const handleBell = () => {
    if (subscribed) unsubscribe();
    else subscribe();
  };

  const bellTitle = !supported
    ? 'Notifiche non supportate da questo browser'
    : permission === 'denied'
    ? 'Notifiche bloccate — abilitale nelle impostazioni del browser'
    : subscribed
    ? 'Disattiva notifiche GP'
    : 'Attiva notifiche GP';

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-black italic text-sm uppercase tracking-tighter">
            Fantapodio <span className="text-primary">2026</span>
          </span>
        </div>

        {/* User info + actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Team badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center">
              <span className="text-[9px] font-black italic text-primary uppercase">
                {user.team_id}
              </span>
            </div>
            <span className="hidden sm:block text-xs font-black italic uppercase text-white/60 tracking-tight">
              {user.team_name}
            </span>
          </div>

          {/* Bell — notifiche push */}
          {supported && permission !== 'denied' && (
            <button
              onClick={handleBell}
              disabled={loading}
              title={bellTitle}
              className={`p-2 rounded-lg transition-colors ${
                subscribed
                  ? 'text-primary hover:text-white hover:bg-primary/20'
                  : 'text-white/20 hover:text-white hover:bg-white/5'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : subscribed ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 text-white/20 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
