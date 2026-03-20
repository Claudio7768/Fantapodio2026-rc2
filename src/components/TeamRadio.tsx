import { useState, useEffect, useRef } from 'react';
import { Radio, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Reaction {
  id: string;
  message_id: string;
  team_id: string;
  emoji: string;
}

interface Message {
  id: string;
  team_id: string;
  team_name: string;
  text: string;
  created_at: string;
}

const TEAM_COLORS: Record<string, string> = {
  CL: 'hsl(1 96% 44%)',
  ML: 'hsl(32 100% 50%)',
  FL: 'hsl(174 100% 42%)',
};

const QUICK_REACTIONS = ['🏎️', '🏆', '💥', '😂', '👏'];

function teamColor(id: string) { return TEAM_COLORS[id] || '#888'; }

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return ''; }
}

function groupReactions(reactions: Reaction[]): Record<string, string[]> {
  const g: Record<string, string[]> = {};
  reactions.forEach(r => { if (!g[r.emoji]) g[r.emoji] = []; g[r.emoji].push(r.team_id); });
  return g;
}

interface Props {
  user: { team_id: string; team_name: string };
  onUnread?: (n: number) => void;
}

export function TeamRadio({ user, onUnread }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeReactionMsg, setActiveReactionMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Caricamento iniziale
  useEffect(() => {
    const load = async () => {
      const [{ data: msgs }, { data: reacts }] = await Promise.all([
        supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(200),
        supabase.from('message_reactions').select('*'),
      ]);
      setMessages((msgs as Message[]) || []);
      setReactions((reacts as Reaction[]) || []);
      setLoading(false);
    };
    load();

    // Segna come letti al mount (quando l'utente apre il tab Radio)
    const lastSeen = new Date().toISOString();
    localStorage.setItem('fp_radio_last_seen', lastSeen);
    onUnread?.(0);
  }, []);

  // Realtime messaggi
  useEffect(() => {
    const ch = supabase.channel('radio-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, p => {
        setMessages(prev => [...prev, p.new as Message]);
        // Messaggi ricevuti mentre si è sul tab Radio → già letti
        const lastSeen = new Date().toISOString();
        localStorage.setItem('fp_radio_last_seen', lastSeen);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Realtime reactions
  useEffect(() => {
    const ch = supabase.channel('radio-reactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' }, p => {
        setReactions(prev => {
          // Evita duplicati
          if (prev.some(r => r.id === (p.new as Reaction).id)) return prev;
          return [...prev, p.new as Reaction];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' }, p => {
        // p.old contiene almeno l'id (primary key)
        const deletedId = (p.old as any)?.id;
        if (deletedId) {
          setReactions(prev => prev.filter(r => r.id !== deletedId));
        } else {
          // Fallback: ricarica reactions dal DB
          supabase.from('message_reactions').select('*').then(({ data }) => {
            if (data) setReactions(data as Reaction[]);
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Scroll in fondo ai nuovi messaggi
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    await supabase.from('messages').insert({
      team_id: user.team_id, team_name: user.team_name, text: trimmed,
    });
    setSending(false);
    inputRef.current?.focus();
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    setActiveReactionMsg(null);
    const existing = reactions.find(r =>
      r.message_id === messageId && r.team_id === user.team_id && r.emoji === emoji
    );
    if (existing) {
      // Ottimistic update
      setReactions(prev => prev.filter(r => r.id !== existing.id));
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({
        message_id: messageId, team_id: user.team_id, emoji,
      });
    }
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
      <div
        className="f1-card flex-1 overflow-y-auto p-4 space-y-2 mb-2"
        onClick={() => setActiveReactionMsg(null)}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/10 space-y-3">
            <Radio className="w-10 h-10 opacity-20" />
            <p className="text-[10px] uppercase font-black tracking-widest italic">Canale silenzioso</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isOwn = msg.team_id === user.team_id;
          const color = teamColor(msg.team_id);
          const showSender = !messages[idx - 1] || messages[idx - 1].team_id !== msg.team_id;
          const msgReactions = groupReactions(reactions.filter(r => r.message_id === msg.id));
          const hasReactions = Object.keys(msgReactions).length > 0;
          const isPickerOpen = activeReactionMsg === msg.id;

          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              {showSender && !isOwn && (
                <span className="text-[9px] font-black uppercase tracking-widest mb-1 ml-3" style={{ color }}>
                  Team {msg.team_name}
                </span>
              )}

              <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {showSender
                  ? <div className="w-2 h-2 rounded-full flex-shrink-0 mb-1" style={{ backgroundColor: color }} />
                  : <div className="w-2 flex-shrink-0" />
                }

                <div className="flex flex-col gap-1 max-w-[75%]">
                  {/* Bolla messaggio */}
                  <div
                    className={`relative px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed cursor-pointer select-none ${
                      isOwn ? 'rounded-br-sm text-white' : 'rounded-bl-sm bg-white/10 text-white/90'
                    }`}
                    style={isOwn ? { backgroundColor: color } : {}}
                    onClick={e => { e.stopPropagation(); setActiveReactionMsg(isPickerOpen ? null : msg.id); }}
                  >
                    {msg.text}

                    {/* Picker emoji */}
                    {isPickerOpen && (
                      <div
                        className={`absolute bottom-full mb-2 flex items-center gap-1 p-1.5 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-20 ${isOwn ? 'right-0' : 'left-0'}`}
                        onClick={e => e.stopPropagation()}
                      >
                        {QUICK_REACTIONS.map(emoji => {
                          const alreadyReacted = reactions.some(r =>
                            r.message_id === msg.id && r.team_id === user.team_id && r.emoji === emoji
                          );
                          return (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg transition-all active:scale-90 hover:scale-125 ${
                                alreadyReacted ? 'bg-white/20 ring-1 ring-white/30' : 'hover:bg-white/10'
                              }`}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Reactions display */}
                  {hasReactions && (
                    <div className={`flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(msgReactions).map(([emoji, teams]) => {
                        const isMine = teams.includes(user.team_id);
                        return (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                              isMine
                                ? 'bg-primary/30 border border-primary/40 text-white'
                                : 'bg-white/10 border border-white/10 text-white/70 hover:bg-white/20'
                            }`}
                          >
                            <span>{emoji}</span>
                            {teams.length > 1 && <span className="opacity-70">{teams.length}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <span className={`text-[9px] text-white/20 font-bold mt-0.5 ${isOwn ? 'mr-4' : 'ml-4'}`}>
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
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
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
