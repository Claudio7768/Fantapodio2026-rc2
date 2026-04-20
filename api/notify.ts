import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:locarno.claudio@gmail.com',
  process.env.VITE_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verifica secret interno per sicurezza
  const auth = req.headers.get('x-notify-secret');
  if (auth !== process.env.NOTIFY_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { subscriptions, title, body, tag, requireInteraction } = await req.json();

  if (!subscriptions?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const payload = JSON.stringify({ title, body, tag, requireInteraction });

  const results = await Promise.allSettled(
    subscriptions.map((sub: PushSubscription) =>
      webpush.sendNotification(sub as any, payload)
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return new Response(JSON.stringify({ sent, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
