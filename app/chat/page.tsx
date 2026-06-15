"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Avatar from "@/components/Avatar";
import { chatMessages, type ChatMessage } from "@/lib/mock-data";

export default function ChatPage() {
  const { data: session } = useSession();
  const me = session?.user;
  // Sender identity from the session (chat is not stored in the database yet).
  const myName = me?.name ?? me?.login ?? "Guest";
  const myLogin = me?.login ?? "guest";

  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom after a message is added.
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
        authorName: myName,
        authorLogin: myLogin,
        content,
        time,
      },
    ]);
    setText("");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-gh-text">Live chat</h1>
        <p className="text-sm text-gh-muted">
          A shared room for all players.{" "}
          <span className="text-gh-subtle">
            (Local for now — realtime via Pusher coming later.)
          </span>
        </p>
      </div>

      <div className="flex h-[60vh] flex-col overflow-hidden rounded-lg border border-gh-border bg-gh-surface">
        {/* Message list */}
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m) => {
            const isMe = m.authorLogin === myLogin;
            return (
              <div key={m.id} className="flex items-start gap-3">
                <Avatar name={m.authorName} login={m.authorLogin} size={32} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-gh-text">
                      {m.authorName}
                      {isMe && (
                        <span className="ml-1.5 text-xs font-normal text-gh-green-hover">
                          (You)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gh-subtle">@{m.authorLogin}</span>
                    <span className="text-xs text-gh-subtle">· {m.time}</span>
                  </div>
                  <p className="mt-0.5 break-words text-sm text-gh-text">{m.content}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input field */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-gh-border bg-gh-surface2 p-3"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-md border border-gh-border bg-gh-bg px-3 py-2 text-sm text-gh-text placeholder:text-gh-subtle focus:border-gh-blue focus:outline-none focus:ring-1 focus:ring-gh-blue"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="rounded-md bg-gh-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gh-green-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
