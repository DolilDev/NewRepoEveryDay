"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import {
  chatMessages,
  currentUser,
  type ChatMessage,
} from "@/lib/mock-data";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll na dół po dodaniu wiadomości.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        authorName: currentUser.name,
        authorLogin: currentUser.login,
        content,
        time,
      },
    ]);
    setText("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gh-text">Czat na żywo</h1>
        <p className="text-sm text-gh-muted">
          Wspólny pokój dla wszystkich graczy.{" "}
          <span className="text-gh-subtle">
            (Na razie lokalny — realtime przez Pusher dojdzie później.)
          </span>
        </p>
      </div>

      <div className="flex h-[60vh] flex-col overflow-hidden rounded-lg border border-gh-border bg-gh-surface">
        {/* Lista wiadomości */}
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m) => {
            const isMe = m.authorLogin === currentUser.login;
            return (
              <div key={m.id} className="flex items-start gap-3">
                <Avatar name={m.authorName} login={m.authorLogin} size={32} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-gh-text">
                      {m.authorName}
                      {isMe && (
                        <span className="ml-1.5 text-xs font-normal text-gh-green-hover">
                          (Ty)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gh-subtle">
                      @{m.authorLogin}
                    </span>
                    <span className="text-xs text-gh-subtle">· {m.time}</span>
                  </div>
                  <p className="mt-0.5 break-words text-sm text-gh-text">
                    {m.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pole wpisywania */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-gh-border bg-gh-surface2 p-3"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Napisz wiadomość..."
            className="flex-1 rounded-md border border-gh-border bg-gh-bg px-3 py-2 text-sm text-gh-text placeholder:text-gh-subtle focus:border-gh-blue focus:outline-none focus:ring-1 focus:ring-gh-blue"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="rounded-md bg-gh-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gh-green-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Wyślij
          </button>
        </form>
      </div>
    </div>
  );
}
