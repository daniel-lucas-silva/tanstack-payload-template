import { WifiOff } from 'lucide-react';
import { usePWA } from '../use-pwa';

export function OfflineBanner() {
  const { isOnline, queuedCount } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs font-medium text-amber-300 backdrop-blur-md"
    >
      <WifiOff className="h-3.5 w-3.5" />
      <span>
        Você está offline. Alterações serão sincronizadas automaticamente ao reconectar.
        {queuedCount > 0 && ` (${queuedCount} pendente${queuedCount > 1 ? 's' : ''})`}
      </span>
    </div>
  );
}
