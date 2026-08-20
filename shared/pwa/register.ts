/**
 * Service Worker Registration & Lifecycle Management via workbox-window
 */

import { Workbox } from 'workbox-window';

export type SWMessage = {
  type: string;
  [key: string]: unknown;
};

export interface RegisterPWAOptions {
  onUpdateAvailable?: (wb: Workbox) => void;
  onActivated?: () => void;
  onMessage?: (msg: SWMessage) => void;
}

let wbInstance: Workbox | null = null;

export function getWorkbox(): Workbox | null {
  return wbInstance;
}

export function registerPWA(options: RegisterPWAOptions = {}): Workbox | null {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (wbInstance) {
    return wbInstance;
  }

  const wb = new Workbox('/sw.js');
  wbInstance = wb;

  wb.addEventListener('waiting', () => {
    options.onUpdateAvailable?.(wb);
  });

  wb.addEventListener('activated', () => {
    options.onActivated?.();
  });

  wb.addEventListener('message', (event) => {
    options.onMessage?.(event.data as SWMessage);
  });

  wb.register().catch((err) => {
    console.warn('[PWA] Service Worker registration failed:', err);
  });

  return wb;
}

export async function applyUpdate(wb?: Workbox | null): Promise<void> {
  const instance = wb ?? wbInstance;
  if (!instance) return;

  try {
    await instance.messageSW({ type: 'SKIP_WAITING' });
    window.location.reload();
  } catch (err) {
    console.error('[PWA] Failed to apply update:', err);
  }
}
