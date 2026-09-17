"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Home, Compass, PlusSquare, User as UserIcon } from "lucide-react";

export default function BottomNav() {
  const { user, profile } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  if (!user) return null;

  const profileHref = profile ? `/profile/${profile.username}` : "/login";

  const items = [
    { href: "/", icon: Home, label: "Home", active: isActive("/") && pathname === "/" },
    { href: "/explore", icon: Compass, label: "Explore", active: isActive("/explore") },
    { href: "/#compose", icon: PlusSquare, label: "Post", active: false },
    {
      href: profileHref,
      icon: UserIcon,
      label: "Profile",
      active: isActive("/profile"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-black/95 backdrop-blur border-t border-neutral-800">
      <div className="max-w-2xl mx-auto flex items-center justify-around py-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg ${
                item.active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon size={24} strokeWidth={item.active ? 2.5 : 2} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
