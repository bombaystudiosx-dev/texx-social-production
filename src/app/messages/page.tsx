"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { subscribeToConversations } from "@/lib/messages";
import { avatarUrl } from "@/lib/avatar";
import type { Conversation } from "@/types";

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeToConversations(user.uid, setConversations);
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-neutral-500">
        Log in to see your messages.
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-[57px] z-[5] bg-black/80 backdrop-blur border-b border-neutral-800 px-4 py-3">
        <h2 className="text-xl font-bold">Messages</h2>
      </div>

      {conversations.length === 0 ? (
        <div className="p-8 text-center text-neutral-500">
          No conversations yet. Message someone from their profile.
        </div>
      ) : (
        conversations.map((c) => {
          const otherUid = c.participantIds.find((id) => id !== user.uid);
          if (!otherUid) return null;
          const other = c.participants[otherUid];
          const unread = c.unreadCounts?.[user.uid] || 0;
          return (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 border-b border-neutral-800 p-4 hover:bg-neutral-950/50"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-neutral-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl(otherUid, other?.photoURL)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate">
                    {other?.displayName || "Unknown"}
                  </span>
                  {c.lastMessageAt && (
                    <span className="text-xs text-neutral-500 flex-shrink-0">
                      {formatDistanceToNowStrict(c.lastMessageAt.toDate(), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm truncate ${
                    unread > 0 ? "text-white font-medium" : "text-neutral-500"
                  }`}
                >
                  {c.lastMessageText || "Say hello 👋"}
                </p>
              </div>
              {unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1.5 text-xs font-semibold text-white flex-shrink-0">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          );
        })
      )}
    </div>
  );
}
