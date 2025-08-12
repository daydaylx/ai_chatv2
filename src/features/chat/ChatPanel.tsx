import { FormEvent, useEffect, useRef, useState } from 'react';
import { ChatMessage, chat } from '../../lib/openrouter';

type Props = { model: string };

export default function ChatPanel({ model }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'Du bist ein hilfreicher Assistent.' },
  ]);
  const [input, setInput] = useState<string>('');
  const [pending, setPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  function scrollToBottom(): void {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }

  useEffect(() => { scrollToBottom(); }, [messages.length, pending]);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const content = input.trim();
    if (!content || pending) return;

    const userMsg: ChatMessage = { role: 'user', content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setPending(true);
    setError(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await chat(model, next, ctrl.signal);
      const assistant: ChatMessage = { role: 'assistant', content: res.content || '(keine Antwort)' };
      setMessages(m => [...m, assistant]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setPending(false);
      abortRef.current = null;
    }
  }

  function onAbort(): void {
    abortRef.current?.abort();
    setPending(false);
  }

  return (
    <div style={{ display: 'grid', gridTemplateRows: '1fr auto', height: '100%' }}>
      <div ref={listRef} style={{ overflow: 'auto', padding: 16 }}>
        {messages.filter(m => m.role !== 'system').map((m, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase' }}>{m.role}</div>
            <div style={{ whiteSpace: 'pre-wrap', background: '#151f2f', border: '1px solid #1f2937', borderRadius: 10, padding: '10px 12px' }}>
              {m.content}
            </div>
          </div>
        ))}
        {pending && (
          <div>
            <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase' }}>assistant</div>
            <div style={{ whiteSpace: 'pre-wrap', background: '#151f2f', border: '1px solid #1f2937', borderRadius: 10, padding: '10px 12px' }}>
              …denke nach
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: 12, borderTop: '1px solid #1f2937' }}>
        <textarea
          placeholder="Frage eingeben…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          style={{
            width: '100%', minHeight: 56, maxHeight: 220, resize: 'vertical',
            padding: '10px 12px', borderRadius: 10, border: '1px solid #1f2937',
            background: '#0b1324', color: '#e5e7eb', fontSize: 15, lineHeight: 1.5,
          }}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button
            type="submit"
            disabled={pending || !input.trim()}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: (pending || !input.trim()) ? .6 : 1 }}
          >
            Senden
          </button>
          <button
            type="button"
            disabled={!pending}
            onClick={onAbort}
            style={{ background: '#1f2937', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: !pending ? .6 : 1 }}
          >
            Abbrechen
          </button>
        </div>
      </form>

      {error && (
        <div style={{ padding: '8px 12px', color: '#ef4444', fontSize: 12 }}>
          Fehler: {error}
        </div>
      )}
    </div>
  );
}
