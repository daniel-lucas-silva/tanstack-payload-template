import { useEffect, useState, useCallback } from 'react';
import { type Workbox } from 'workbox-window';
import { registerPWA, applyUpdate, getWorkbox } from './register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  updateAvailable: boolean;
  queuedCount: number;
  wb: Workbox | null;
}

export function usePWA() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as any).standalone)
    );
  });

  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [wb, setWb] = useState<Workbox | null>(() => getWorkbox());

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to install prompt
  useEffect(() => {
    if (isInstalled) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  // Query queue count helper
  const checkQueue = useCallback(async () => {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) return;
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      if (event.data?.type === 'QUEUE_STATUS') {
        setQueuedCount(event.data.count ?? 0);
      }
    };
    controller.postMessage({ type: 'GET_QUEUE_STATUS' }, [channel.port2]);
  }, []);

  // Register service worker once
  useEffect(() => {
    const instance = registerPWA({
      onUpdateAvailable: () => {
        setUpdateAvailable(true);
      },
      onMessage: (msg) => {
        if (msg.type === 'MUTATION_QUEUED') {
          setQueuedCount((c) => c + 1);
        } else if (msg.type === 'SYNC_COMPLETED') {
          setQueuedCount(typeof msg.remaining === 'number' ? msg.remaining : 0);
        }
      },
    });

    setWb(instance);
    checkQueue();
  }, [checkQueue]);

  // Prompt user to install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (outcome === 'accepted') {
      setIsInstalled(true);
      return true;
    }
    return false;
  }, [installPrompt]);

  // Trigger app reload with new SW
  const updateApp = useCallback(async () => {
    await applyUpdate(wb);
  }, [wb]);

  // Manually replay mutation queue
  const replayQueue = useCallback(async (): Promise<{
    ok: boolean;
    replayed?: number;
    remaining?: number;
  }> => {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) {
      return { ok: false };
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (event.data?.type === 'REPLAY_RESULT') {
          setQueuedCount(event.data.remaining ?? 0);
          resolve(event.data);
        }
      };
      controller.postMessage({ type: 'REPLAY_MUTATIONS' }, [channel.port2]);
    });
  }, []);

  // Ping Service Worker
  const pingSW = useCallback(async (): Promise<{ ok: boolean; latencyMs?: number }> => {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) {
      return { ok: false };
    }

    const start = performance.now();
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (event.data?.type === 'PONG') {
          const latencyMs = Math.round(performance.now() - start);
          resolve({ ok: true, latencyMs });
        }
      };
      controller.postMessage({ type: 'PING' }, [channel.port2]);
      setTimeout(() => resolve({ ok: false }), 2000);
    });
  }, []);

  return {
    isOnline,
    isInstallable: Boolean(installPrompt),
    isInstalled,
    updateAvailable,
    queuedCount,
    wb,
    promptInstall,
    updateApp,
    replayQueue,
    pingSW,
    checkQueue,
  };
}
