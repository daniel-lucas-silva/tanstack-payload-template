/**
 * Web Push Notification Utilities
 */

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function isPushNotificationSupported(): Promise<boolean> {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }
  const reg = await navigator.serviceWorker.ready;
  return await reg.pushManager.getSubscription();
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported by this browser.');
  }

  const reg = await navigator.serviceWorker.ready;
  const keyBytes = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBytes as unknown as BufferSource,
  });

  return subscription;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const sub = await getCurrentPushSubscription();
  if (sub) {
    return await sub.unsubscribe();
  }
  return false;
}
