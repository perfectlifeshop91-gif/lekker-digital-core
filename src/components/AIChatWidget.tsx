import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/lib/i18n";

export function AIChatWidget() {
  const { t, dir, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat", body: { lang } }),
  });

  const send = async () => {
    if (!input.trim() || status === "submitted" || status === "streaming") return;
    const text = input.trim();
    setInput("");
    await sendMessage({ text });
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition hover:scale-105"
        aria-label="Assistant IA"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[70vh] max-h-[600px] w-[calc(100vw-32px)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 p-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <div className="font-serif font-semibold">LEKKER AI</div>
              <div className="text-xs text-muted-foreground">Recommandations & analyse</div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>👋 Hi! Ask me anything:</p>
                <ul className="text-xs space-y-1">
                  <li>• "Quel CA cette semaine ?"</li>
                  <li>• "Recommande-moi un dessert"</li>
                  <li>• "Top 5 products"</li>
                </ul>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.parts.map((p, i) => p.type === "text" ? <span key={i}>{p.text}</span> : null)}
                </div>
              </div>
            ))}
            {(status === "submitted" || status === "streaming") && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start"><div className="rounded-2xl bg-muted px-3 py-2 text-sm">●●●</div></div>
            )}
          </div>

          <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-border p-3">
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Posez votre question…" autoFocus />
            <Button type="submit" size="icon" disabled={status === "submitted" || status === "streaming"}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
