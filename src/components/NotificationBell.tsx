"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToNotifications,
  markAllNotificationsRead,
} from "@/lib/notifications";
import type { AppNotification } from "@/types";

const VERB: Record<AppNotification["type"], string> = {
  follow: "followed you",
  like: "liked your post",
  comment: "commented on your post",
  message: "sent you a message",
  share: "shared your post",
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeToNotifications(user.uid, setItems);
  }, [user]);

  if (!user) return null;

  const unreadCount = items.filter((n) => !n.read).length;

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      await markAllNotificationsRead(user.uid).catch(() => {});
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative text-neutral-500 hover:text-neutral-200"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-72 max-h-96 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg">
          {items.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">No notifications yet.</p>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm border-b border-neutral-800 last:border-0 ${
                  n.read ? "text-neutral-400" : "text-neutral-100"
                }`}
              >
                <span className="font-semibold">{n.actor.displayName}</span>
                <span>{VERB[n.type]}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
