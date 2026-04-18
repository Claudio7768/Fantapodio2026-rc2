import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:locarno.claudio@gmail.com',
  process.env.VITE_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // service key per leggere le subscriptions
);

export const config = { runtime: 'nodejs18.x' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Supabase webhook manda il secret come query param o header
  const auth = req.headers.get('x-notify-secret');
  if (auth !== process.env.NOTIFY_SECRET) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  // Payload Supabase webhook: { type: 'INSERT', record: { team_id, team_name, text, ... } }
  const record = body.record;
  if (!record) return new Response('No record', { status: 400 });

  // Non notificare le proprie iscrizioni — invia a tutti
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription, team_id')
    .neq('team_id', record.team_id); // non notifica chi ha scritto

  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  const isRC = record.team_id === 'RC';
  const title = isRC ? '🏁 Direzione Gara' : `📻 Team Radio — ${record.team_name}`;
  const bodyText = record.text.length > 80 ? record.text.slice(0, 80) + '…' : record.text;

  const payload = JSON.stringify({
    title,
    body: bodyText,
    tag: 'radio-message',
    requireInteraction: false,
  });

  const results = await Promise.allSettled(
    subs.map(row => webpush.sendNotification(row.subscription as any, payload))
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  return new Response(JSON.stringify({ sent }), { status: 200 });
}
