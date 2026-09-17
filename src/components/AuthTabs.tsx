"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthTabs() {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
      <Link
        href="/login"
        className={`flex-1 text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
          isLogin
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className={`flex-1 text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
          !isLogin
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Join
      </Link>
    </div>
  );
}
