import { Link, createFileRoute } from '@tanstack/react-router';
import { PWAStatusBadge } from '@/shared/pwa';
import { Smartphone, FileText, ArrowRight, Layers } from 'lucide-react';

export const Route = createFileRoute('/')({ component: HomePage });

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-zinc-950 text-zinc-100">
      <div className="flex flex-col items-center text-center max-w-lg space-y-2">
        <PWAStatusBadge />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3">Fullstack Payload + TanStack</h1>
        <p className="text-sm text-zinc-400">
          Template starter com Bun, Payload 3.88 API-only, TanStack Router/Query/Store e suporte nativo a PWA com Workbox.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/posts"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white"
        >
          <FileText className="h-4 w-4" />
          Ver Exemplo (Posts)
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/pwa"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
        >
          <Smartphone className="h-4 w-4 text-indigo-400" />
          Painel PWA & Workbox
        </Link>
        <Link
          to="/components"
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-4 py-2 text-sm font-semibold text-indigo-300 transition-colors hover:bg-indigo-900/60"
        >
          <Layers className="h-4 w-4" />
          UI Kit Mobile
        </Link>
      </div>
    </main>
  );
}
