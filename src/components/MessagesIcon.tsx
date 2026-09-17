"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToConversations } from "@/lib/messages";

export default function MessagesIcon() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    return subscribeToConversations(user.uid, (conversations) => {
      const total = conversations.reduce(
        (sum, c) => sum + (c.unreadCounts?.[user.uid] || 0),
        0
      );
      setUnreadCount(total);
    });
  }, [user]);

  if (!user) return null;

  return (
    <Link
      href="/messages"
      className="relative text-neutral-500 hover:text-neutral-200"
      title="Messages"
    >
      <MessageSquare size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
