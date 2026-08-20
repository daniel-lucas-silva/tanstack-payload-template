import { Wifi, WifiOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWA } from '../use-pwa';

export function PWAStatusBadge() {
  const { isOnline, isInstalled } = usePWA();

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isOnline
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}
      >
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {isInstalled && (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
          <CheckCircle2 className="h-3 w-3" />
          PWA Instalado
        </span>
      )}
    </div>
  );
}
