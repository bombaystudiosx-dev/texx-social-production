"use client";

import { useEffect, useState, useRef, use, FormEvent } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Send } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToMessages,
  sendMessage,
  markConversationRead,
} from "@/lib/messages";
import { avatarUrl } from "@/lib/avatar";
import type { Conversation, Message } from "@/types";
import toast from "react-hot-toast";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const { user, loading } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDoc(doc(db, "conversations", conversationId)).then((snap) => {
      if (snap.exists()) setConversation({ id: snap.id, ...snap.data() } as Conversation);
    });
  }, [conversationId]);

  useEffect(() => {
    return subscribeToMessages(conversationId, setMessages);
  }, [conversationId]);

  useEffect(() => {
    if (user) markConversationRead(conversationId, user.uid).catch(() => {});
  }, [conversationId, user, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (loading || !user) {
    return <div className="p-8 text-center text-neutral-500">Loading…</div>;
  }

  const otherUid = conversation?.participantIds.find((id) => id !== user.uid);
  const other = otherUid ? conversation?.participants[otherUid] : undefined;

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !otherUid) return;
    setSending(true);
    const body = text.trim();
    setText("");
    try {
      await sendMessage({
        conversationId,
        senderId: user.uid,
        recipientId: otherUid,
        text: body,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send.");
      setText(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <div className="sticky top-[57px] z-[5] flex items-center gap-3 bg-black/80 backdrop-blur border-b border-neutral-800 px-4 py-3">
        <Link href="/messages" className="text-neutral-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        {other && (
          <>
            <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl(otherUid || "", other.photoURL)}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <Link href={`/profile/${other.username}`} className="font-semibold hover:underline">
              {other.displayName}
            </Link>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => {
          const mine = m.senderId === user.uid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm break-words ${
                  mine
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                    : "bg-neutral-900 text-neutral-100"
                }`}
              >
                <p>{m.text}</p>
                {m.createdAt && (
                  <p className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-neutral-500"}`}>
                    {formatDistanceToNowStrict(m.createdAt.toDate(), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-center text-neutral-600 mt-8">
            Say hello to start the conversation 👋
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-neutral-800 p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          maxLength={2000}
          className="flex-1 rounded-full bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white p-2.5 disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
