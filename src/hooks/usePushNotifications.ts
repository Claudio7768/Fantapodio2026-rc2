import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = 'BGHXri_0LC2iM3UeFLT64M0qPcpakKe_KR7VuvF82USRdxUBB0GXzGNM_C3nDzZgOZWxC9KQFD2arRKe2V3-tnA';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications(teamId: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        checkExistingSubscription();
      }
    }
  }, [teamId]);

  const checkExistingSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setSubscribed(!!sub);
  };

  const subscribe = async (): Promise<boolean> => {
    if (!teamId) return false;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Le notifiche push non sono supportate su questo browser.');
      return false;
    }

    try {
      // Richiedi permesso
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return false;

      // Ottieni/crea subscription
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Salva in Supabase
      const subJson = sub.toJSON();
      await supabase.from('push_subscriptions').upsert({
        team_id: teamId,
        endpoint: subJson.endpoint,
        subscription: subJson,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' });

      setSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscription error:', err);
      return false;
    }
  };

  const unsubscribe = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await supabase.from('push_subscriptions')
        .delete().eq('endpoint', sub.endpoint);
    }
    setSubscribed(false);
  };

  return { permission, subscribed, subscribe, unsubscribe };
}
