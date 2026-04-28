import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Chiave pubblica VAPID — deve corrispondere a VITE_VAPID_PUBLIC_KEY in Vercel
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BPvCYNyzF6nRlQKMUHnDkJeM9c4V3Z5w6xjVHvyujTe6NDR0njMagShL6yin8QMXLKiT_KB24XtiTod89twI8uQ';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr;
}

export function usePushNotifications(teamId: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check supporto e stato iniziale
  useEffect(() => {
    const ok =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setSupported(ok);
    if (ok) {
      setPermission(Notification.permission);
      checkCurrentSubscription();
    }
  }, []);

  const checkCurrentSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      setSubscribed(false);
    }
  };

  const subscribe = async () => {
    if (!supported || !teamId) return;
    setLoading(true);
    try {
      // Richiedi permesso
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      // Ottieni registrazione SW
      const reg = await navigator.serviceWorker.ready;

      // Sottoscrivi push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      // Salva su Supabase
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          team_id: teamId,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        { onConflict: 'endpoint' }
      );

      if (error) {
        console.error('Errore salvataggio subscription:', error);
        return;
      }

      setSubscribed(true);
    } catch (err) {
      console.error('Errore push subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error('Errore unsubscribe:', err);
    } finally {
      setLoading(false);
    }
  };

  return { permission, subscribed, supported, loading, subscribe, unsubscribe };
}
