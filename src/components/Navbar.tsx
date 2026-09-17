"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Settings } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import MessagesIcon from "@/components/MessagesIcon";

export default function Navbar() {
  const { user, logOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-800 bg-black/80 backdrop-blur">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icon-mark.png" alt="" width={32} height={32} className="h-8 w-auto" priority />
          <span className="font-brand text-2xl tracking-wide text-white">
            TEXX <span className="text-sm align-middle tracking-[0.2em] text-neutral-300">SOCIAL</span>
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <MessagesIcon />
            <NotificationBell />
            <Link href="/settings" className="text-neutral-500 hover:text-neutral-200" title="Settings">
              <Settings size={20} />
            </Link>
            <button
              onClick={() => logOut()}
              className="text-neutral-500 hover:text-red-400"
              title="Log out"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm px-3 py-1.5 rounded-full border border-neutral-700 hover:bg-neutral-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm px-3 py-1.5 rounded-full bg-white text-black font-semibold hover:bg-neutral-200"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
