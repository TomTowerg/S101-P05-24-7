import { useState, useEffect, useCallback } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function usePushSubscription() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Auto-subscribe once service worker is ready and permission allows
  useEffect(() => {
    if (!isSupported || isLoading || subscription) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'denied') return;
    subscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, isLoading]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      setPermissionState(Notification.permission);
    } catch (error) {
      console.error('Service worker registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return;

    try {
      setIsLoading(true);

      // Check if permission is already denied
      if (Notification.permission === 'denied') {
        alert('Las notificaciones están bloqueadas en tu navegador. Por favor, actívalas en la configuración del sitio (icono del candado en la barra de direcciones).');
        setIsLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });

      if (response.ok) {
        setSubscription(sub);
        setPermissionState(Notification.permission);
      } else {
        throw new Error('Failed to save subscription on server');
      }
    } catch (error) {
      console.error('Push subscription failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      if (response.ok) {
        await subscription.unsubscribe();
        setSubscription(null);
      } else {
        throw new Error('Failed to delete subscription on server');
      }
    } catch (error) {
      console.error('Push unsubscription failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  return {
    subscription,
    isSupported,
    isLoading,
    permissionState,
    subscribe,
    unsubscribe,
    isSubscribed: !!subscription,
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
