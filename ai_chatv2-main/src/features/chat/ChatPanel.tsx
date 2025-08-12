import { FormEvent, useEffect, useRef, useState } from 'react';
import { ChatMessage, chat } from '../../lib/openrouter';

type Props = { model: string };

export default function ChatPanel({ model }: Props) {
const [messages, setMessages] = useState<ChatMessage[]>([
{ role: 'system', content: 'Du bist ein hilfreicher Assistent.' },
]);
const [input, setInput] = useState('');
const [pending, setPending] = useState(false);
const [error, setError] = useState<string | null>(null);
const abortRef = useRef<AbortController | null>(null);
const listRef = useRef<HTMLDivElement | null>(null);

function scrollToBottom() {
listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
}

useEffect(() => { scrollToBottom(); }, [messages.length, pending]);

async function onSubmit(e: FormEvent) {
e.preventDefault();
const content = input.trim();
if (!content || pending) return;

typescript
Kopieren
Bearbeiten
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
} catch (e: any) {
  setError(e?.message ?? String(e));
} finally {
  setPending(false);
  abortRef.current = null;
}
}

function onAbort() {
abortRef.current?.abort();
setPending(false);
}

return (
<>
<div className="chat" ref={listRef}>
{messages.filter(m => m.role !== 'system').map((m, idx) => (
<div key={idx} className={msg ${m.role}}>
<div className="role">{m.role}</div>
<div className="bubble">{m.content}</div>
</div>
))}
{pending && (
<div className="msg assistant">
<div className="role">assistant</div>
<div className="bubble">…denke nach</div>
</div>
)}
</div>

php-template
Kopieren
Bearbeiten
  <form className="composer" onSubmit={onSubmit}>
    <textarea
      className="textarea"
      placeholder="Frage eingeben…"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.form?.requestSubmit();
        }
      }}
    />
    <div className="actions">
      <button className="button" type="submit" disabled={pending || !input.trim()}>
        Senden
      </button>
      <button className="button secondary" type="button" disabled={!pending} onClick={onAbort}>
        Abbrechen
      </button>
    </div>
  </form>

  {error && <div className="footer err">Fehler: {error}</div>}
</>
);
}
