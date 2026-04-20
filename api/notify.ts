import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:locarno.claudio@gmail.com',
  process.env.VITE_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const auth = req.headers['x-notify-secret'];
  if (auth !== process.env.NOTIFY_SECRET) return res.status(401).end('Unauthorized');

  const { subscriptions, title, body, tag, requireInteraction } = req.body;
  if (!subscriptions?.length) return res.json({ sent: 0 });

  const payload = JSON.stringify({ title, body, tag, requireInteraction });

  const results = await Promise.allSettled(
    subscriptions.map((sub: webpush.PushSubscription) =>
      webpush.sendNotification(sub, payload)
    )
  );

  const sent   = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  return res.json({ sent, failed });
}
