import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
  Share2,
  Download,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { usePWA, subscribeToPush, unsubscribeFromPush, getCurrentPushSubscription } from '@/shared/pwa';
import { useSync, SyncStatusBadge } from '@/shared/sync';

export const Route = createFileRoute('/pwa/')({ component: PWAPage });

function PWAPage() {
  const {
    isOnline: pwaOnline,
    isInstallable,
    isInstalled,
    updateAvailable,
    queuedCount: swQueueCount,
    promptInstall,
    updateApp,
    replayQueue,
    pingSW,
  } = usePWA();

  const {
    isOnline,
    isSyncing,
    pendingCount: syncEnginePendingCount,
    lastSyncedAt,
    syncNow,
  } = useSync();

  const [pingResult, setPingResult] = useState<{ ok: boolean; latencyMs?: number } | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const [replayLoading, setReplayLoading] = useState(false);
  const [replayStatus, setReplayStatus] = useState<string | null>(null);

  // Check push subscription status
  useEffect(() => {
    getCurrentPushSubscription().then((sub) => {
      setPushSubscribed(Boolean(sub));
    });
  }, []);

  const handlePing = async () => {
    setIsPinging(true);
    const result = await pingSW();
    setPingResult(result);
    setIsPinging(false);
  };

  const handleTogglePush = async () => {
    setPushLoading(true);
    setPushStatus(null);
    try {
      if (pushSubscribed) {
        await unsubscribeFromPush();
        setPushSubscribed(false);
        setPushStatus('Notificações desativadas.');
      } else {
        const res = await fetch('/api/pwa/vapid-key');
        const { publicKey } = await res.json();
        if (!publicKey) throw new Error('Chave VAPID pública não encontrada.');

        const sub = await subscribeToPush(publicKey);
        if (sub) {
          await fetch('/api/pwa/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub),
          });
          setPushSubscribed(true);
          setPushStatus('Inscrito com sucesso em notificações Push!');
        }
      }
    } catch (err: any) {
      setPushStatus(`Erro: ${err?.message || String(err)}`);
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    setPushLoading(true);
    try {
      const res = await fetch('/api/pwa/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Notificação PWA!',
          body: 'Esta é uma notificação disparada pelo servidor via Web Push.',
          url: '/pwa',
        }),
      });
      const data = await res.json();
      setPushStatus(`Push enviado: ${data.totalSent} entregue(s).`);
    } catch (err: any) {
      setPushStatus(`Erro ao enviar push: ${err?.message || String(err)}`);
    } finally {
      setPushLoading(false);
    }
  };

  const handleReplaySWQueue = async () => {
    setReplayLoading(true);
    setReplayStatus(null);
    try {
      const res = await replayQueue();
      if (res.ok) {
        setReplayStatus(`Sincronização concluída (${res.replayed ?? 0} processadas).`);
      } else {
        setReplayStatus('Falha ao sincronizar.');
      }
    } catch (err: any) {
      setReplayStatus(`Erro: ${err?.message || String(err)}`);
    } finally {
      setReplayLoading(false);
    }
  };

  const handleManualSyncEngine = async () => {
    await syncNow();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fullstack Payload + TanStack PWA',
          text: 'Template Fullstack moderno com Bun, Workbox e Payload CMS.',
          url: window.location.origin,
        });
      } catch (err) {
        console.log('Share cancelado ou não suportado', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Início
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Smartphone className="h-7 w-7 text-indigo-400" />
              Painel PWA & Sincronização
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Demonstração e controle de capacidades Offline-First, Workbox e Payload SDK Sync.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isOnline && pwaOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isOnline ? 'Online' : 'Offline'}
            </span>

            {isInstalled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Instalado
              </span>
            )}
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Offline-First Store Sync Engine */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-indigo-400" />
                <h3 className="font-semibold text-sm">Store Sync Engine (Payload SDK)</h3>
              </div>
              <SyncStatusBadge />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mutações nos stores (<code className="text-zinc-300">useCollection</code> / <code className="text-zinc-300">useGlobal</code>) são otimistas com 0ms de atraso, gravadas no IndexedDB e sincronizadas em background.
            </p>
            <div className="space-y-1.5 text-xs text-zinc-400 font-mono pt-1">
              <div className="flex justify-between">
                <span>Mutações Pendentes:</span>
                <span className="text-zinc-200 font-semibold">{syncEnginePendingCount}</span>
              </div>
              {lastSyncedAt && (
                <div className="flex justify-between">
                  <span>Última Sincronização:</span>
                  <span className="text-zinc-300">{new Date(lastSyncedAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleManualSyncEngine}
                disabled={isSyncing || syncEnginePendingCount === 0}
                className="w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Stores Agora'}
              </button>
            </div>
          </div>

          {/* Card 2: Service Worker & Lifecycle */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="h-5 w-5 text-emerald-400" />
                <h3 className="font-semibold text-sm">Service Worker & Workbox</h3>
              </div>
              {updateAvailable ? (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Atualização Pendente
                </span>
              ) : (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Gerenciado via <code className="text-zinc-300">workbox-window</code> com precaching automático de assets e fallback offline.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePing}
                disabled={isPinging}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                {isPinging ? 'Testando...' : 'Testar Ping no SW'}
              </button>
              {updateAvailable && (
                <button
                  type="button"
                  onClick={() => updateApp()}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Recarregar App
                </button>
              )}
              {pingResult && (
                <span className="text-xs text-zinc-400">
                  {pingResult.ok ? `Latência: ${pingResult.latencyMs}ms` : 'Sem resposta'}
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Background Sync (Workbox Network Queue) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold text-sm">Background Sync (Workbox Network)</h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {swQueueCount} na fila HTTP
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Requisições HTTP falhadas são interceptadas pelo SW e reenviadas quando a rede é restabelecida.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleReplaySWQueue}
                disabled={replayLoading || swQueueCount === 0}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {replayLoading ? 'Reenviando...' : 'Sincronizar Fila HTTP'}
              </button>
              {replayStatus && <span className="text-xs text-zinc-400">{replayStatus}</span>}
            </div>
          </div>

          {/* Card 4: Web Push Notifications */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-sm">Web Push Notifications</h3>
              </div>
              <span className={`text-xs ${pushSubscribed ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {pushSubscribed ? 'Inscrito' : 'Não inscrito'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Integração com <code className="text-zinc-300">web-push</code> e chaves VAPID geradas dinamicamente pelo backend.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTogglePush}
                disabled={pushLoading}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  pushSubscribed
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-purple-600 text-white hover:bg-purple-500'
                }`}
              >
                {pushLoading ? 'Carregando...' : pushSubscribed ? 'Cancelar Inscrição' : 'Inscrever-se'}
              </button>
              {pushSubscribed && (
                <button
                  type="button"
                  onClick={handleSendTestPush}
                  disabled={pushLoading}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  Enviar Push de Teste
                </button>
              )}
            </div>
            {pushStatus && <p className="text-xs text-zinc-400 pt-1">{pushStatus}</p>}
          </div>
        </div>

        {/* Instalação & Compartilhamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-sm font-semibold">Instalar Aplicativo</p>
                <p className="text-xs text-zinc-400">{isInstalled ? 'App já instalado' : 'Instale na tela inicial'}</p>
              </div>
            </div>
            {isInstallable && (
              <button
                type="button"
                onClick={() => promptInstall()}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Instalar
              </button>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Share2 className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-sm font-semibold">Compartilhar</p>
                <p className="text-xs text-zinc-400">Web Share API nativa.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              Compartilhar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
