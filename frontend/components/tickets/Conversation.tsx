'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/primitives';
import type { Message } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

export function Conversation({
  messages,
  currentUserId,
  onSend,
  disabled,
  disabledHint,
}: {
  messages: Message[];
  currentUserId: string;
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      await onSend(value);
      setText('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3 text-sm font-semibold">Conversation</div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4" style={{ maxHeight: '52vh' }}>
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            No messages yet. Start the conversation below.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          const system = m.message.startsWith('✅ Ticket resolved');
          if (system) {
            return (
              <div key={m.id} className="flex justify-center">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-500 ring-1 ring-inset ring-emerald-500/30">
                  {m.message}
                </span>
              </div>
            );
          }
          return (
            <div
              key={m.id}
              className={cn('flex animate-fade-in gap-2', mine ? 'flex-row-reverse' : 'flex-row')}
            >
              <Avatar name={m.senderName} className="h-7 w-7" />
              <div className={cn('max-w-[78%]', mine && 'items-end text-right')}>
                <div className="text-[11px] text-muted">
                  <span className="font-medium text-content">{m.senderName}</span>
                  <span className="ml-1.5 capitalize">· {m.senderRole}</span>
                  <span className="ml-1.5">· {formatDate(m.createdAt)}</span>
                </div>
                <div
                  className={cn(
                    'mt-1 inline-block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm',
                    mine
                      ? 'rounded-br-sm bg-gradient-to-br from-gold-strong to-gold text-black'
                      : 'rounded-bl-sm bg-surface-2 text-content',
                  )}
                >
                  {m.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="border-t border-line p-3">
        {disabled ? (
          <p className="px-1 py-2 text-center text-xs text-muted">
            {disabledHint ?? 'Messaging is disabled for this ticket.'}
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void submit(e);
                }
              }}
              rows={1}
              placeholder="Type a message…  (Enter to send, Shift+Enter for a new line)"
              className="max-h-32 min-h-[42px] flex-1 resize-none rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
            <Button type="submit" loading={sending} disabled={!text.trim()}>
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
