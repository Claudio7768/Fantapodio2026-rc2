import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:locarno.claudio@gmail.com',
  process.env.VITE_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const auth = req.headers['x-notify-secret'];
  if (auth !== process.env.NOTIFY_SECRET) return res.status(401).end('Unauthorized');

  const record = req.body?.record;
  if (!record) return res.status(400).end('No record');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription, team_id')
    .neq('team_id', record.team_id);

  if (!subs?.length) return res.json({ sent: 0 });

  const isRC = record.team_id === 'RC';
  const title = isRC ? '🏁 Direzione Gara' : `📻 Team Radio — ${record.team_name}`;
  const body  = record.text.length > 80 ? record.text.slice(0, 80) + '…' : record.text;

  const payload = JSON.stringify({ title, body, tag: 'radio-message', requireInteraction: false });

  const results = await Promise.allSettled(
    subs.map(row => webpush.sendNotification(row.subscription as webpush.PushSubscription, payload))
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  return res.json({ sent });
}
