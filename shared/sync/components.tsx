import { RefreshCw, CheckCircle2, CloudOff, AlertCircle } from 'lucide-react';
import { useSync } from './use-sync';

export function SyncStatusBadge() {
  const { isOnline, isSyncing, pendingCount } = useSync();

  if (!isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
        <CloudOff className="h-3 w-3" />
        Offline {pendingCount > 0 && `(${pendingCount} pendente${pendingCount > 1 ? 's' : ''})`}
      </span>
    );
  }

  if (isSyncing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Sincronizando...
      </span>
    );
  }

  if (pendingCount > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
        <AlertCircle className="h-3 w-3" />
        {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
      <CheckCircle2 className="h-3 w-3" />
      Sincronizado
    </span>
  );
}

export function SyncFloatingIndicator() {
  const { isSyncing, pendingCount, syncNow, isOnline } = useSync();

  if (pendingCount === 0 && !isSyncing) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/95 p-3 shadow-xl backdrop-blur-md text-xs text-zinc-200">
      {isSyncing ? (
        <>
          <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin" />
          <span>Sincronizando alterações com o servidor...</span>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4 text-amber-400" />
          <span>
            {pendingCount} alteraç{pendingCount > 1 ? 'ões' : 'ão'} salva{pendingCount > 1 ? 's' : ''} localmente.
          </span>
          {isOnline && (
            <button
              type="button"
              onClick={() => syncNow()}
              className="ml-2 rounded bg-indigo-600 px-2 py-1 font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Sincronizar
            </button>
          )}
        </>
      )}
    </div>
  );
}
