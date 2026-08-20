import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '../use-pwa';

export function InstallPrompt() {
  const { isInstallable, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Reset dismissal if it becomes installable again
    if (isInstallable) {
      setDismissed(false);
    }
  }, [isInstallable]);

  if (!isInstallable || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Instalação do Aplicativo"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center justify-between gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-zinc-100 shadow-2xl transition-all sm:bottom-6 sm:right-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200">
          <Download className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-semibold">Instalar Aplicativo</p>
          <p className="text-xs text-zinc-400">Acesse offline e direto da tela de início.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => promptInstall()}
          className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-white active:scale-95"
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
