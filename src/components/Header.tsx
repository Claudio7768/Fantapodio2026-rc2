import { LogOut, Zap } from 'lucide-react';

interface HeaderProps {
  user: { team_id: string; team_name: string };
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
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

        {/* User info */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center">
              <span className="text-[9px] font-black italic text-primary uppercase">{user.team_id}</span>
            </div>
            <span className="hidden sm:block text-xs font-black italic uppercase text-white/60 tracking-tight">
              {user.team_name}
            </span>
          </div>
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
