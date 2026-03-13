import { useState, useEffect, useRef } from 'react';
import { Radio, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  team_id: string;
  team_name: string;
  text: string;
  created_at: string;
}

interface Props {
  user: { team_id: string; team_name: string };
}

const TEAM_COLORS: Record<string, string> = {
  CL: 'hsl(1 96% 44%)',
  ML: 'hsl(32 100% 50%)',
  FL: 'hsl(174 100% 42%)',
};

function teamColor(teamId: string) {
  return TEAM_COLORS[teamId] || '#888';
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function TeamRadio({ user }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carica messaggi iniziali
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(200);
      setMessages((data as Message[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('team-radio')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Scroll al fondo quando arrivano nuovi messaggi
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    await supabase.from('messages').insert({
      team_id: user.team_id,
      team_name: user.team_name,
      text: trimmed,
    });
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '420px' }}>

      {/* Header */}
      <div className="f1-card px-5 py-3 mb-2 flex items-center gap-3 flex-shrink-0">
        <Radio className="w-4 h-4 text-primary" />
        <span className="text-xs font-black italic uppercase tracking-widest">Team Radio</span>
        <span className="ml-auto text-[10px] text-white/20 font-bold uppercase tracking-widest">
          {messages.length} msg
        </span>
      </div>

      {/* Messaggi */}
      <div className="f1-card flex-1 overflow-y-auto p-4 space-y-2 mb-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/10 space-y-3">
            <Radio className="w-10 h-10 opacity-20" />
            <p className="text-[10px] uppercase font-black tracking-widest italic">Canale silenzioso</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isOwn = msg.team_id === user.team_id;
          const color = teamColor(msg.team_id);
          const prevMsg = messages[idx - 1];
          const showSender = !prevMsg || prevMsg.team_id !== msg.team_id;

          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              {/* Nome team (solo se cambia mittente) */}
              {showSender && !isOwn && (
                <span
                  className="text-[9px] font-black uppercase tracking-widest mb-1 ml-1"
                  style={{ color }}
                >
                  Team {msg.team_name}
                </span>
              )}

              <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Pallino colore team (solo primo di un gruppo) */}
                {showSender ? (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mb-1"
                    style={{ backgroundColor: color }}
                  />
                ) : (
                  <div className="w-2 flex-shrink-0" />
                )}

                {/* Bolla */}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                    isOwn
                      ? 'rounded-br-sm text-white'
                      : 'rounded-bl-sm bg-white/10 text-white/90'
                  }`}
                  style={isOwn ? { backgroundColor: color } : {}}
                >
                  {msg.text}
                </div>
              </div>

              {/* Orario */}
              <span className={`text-[9px] text-white/20 font-bold mt-0.5 ${isOwn ? 'mr-5' : 'ml-5'}`}>
                {formatTime(msg.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="f1-card px-3 py-3 flex-shrink-0 flex items-center gap-3">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Messaggio..."
          maxLength={300}
          className="f1-input flex-1 py-2.5 text-sm"
          disabled={sending}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white flex-shrink-0 disabled:opacity-30 hover:opacity-80 transition-opacity"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
