import { RefreshCw } from 'lucide-react';
import { usePWA } from '../use-pwa';

export function UpdateBanner() {
  const { updateAvailable, updateApp } = usePWA();

  if (!updateAvailable) {
    return null;
  }

  return (
    <aside
      aria-label="Atualização Disponível"
      className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-zinc-900/95 px-4 py-3 text-zinc-100 shadow-xl backdrop-blur-md"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
        <RefreshCw className="h-4 w-4 animate-spin" />
      </div>
      <div>
        <p className="text-sm font-medium">Nova versão disponível</p>
        <p className="text-xs text-zinc-400">Clique para recarregar com as novidades.</p>
      </div>
      <button
        type="button"
        onClick={() => updateApp()}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
      >
        Atualizar
      </button>
    </aside>
  );
}
