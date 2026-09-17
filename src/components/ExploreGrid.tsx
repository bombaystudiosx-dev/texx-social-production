"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { WorldPost } from "@/app/api/world/route";
import { getCategoryStyle } from "@/lib/categoryStyle";

const CATEGORIES = [
  { id: "tech", label: "Tech" },
  { id: "business", label: "Business" },
  { id: "music", label: "Music" },
  { id: "fashion", label: "Fashion" },
  { id: "food", label: "Food" },
  { id: "pets", label: "Pets" },
  { id: "women", label: "Women" },
  { id: "credit", label: "Credit" },
  { id: "ai", label: "AI Tools" },
];

const ALL_IDS = CATEGORIES.map((c) => c.id);

export default function ExploreGrid() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(ALL_IDS)
  );
  const [posts, setPosts] = useState<WorldPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    fetch("/api/world?category=all")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPosts(data.posts || []);
        setError(data.error || null);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load Explore right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = activeFilters.size === ALL_IDS.length;

  const visiblePosts = useMemo(
    () => posts.filter((p) => p.category && activeFilters.has(p.category)),
    [posts, activeFilters]
  );

  const filterLabel = allSelected
    ? "All categories"
    : activeFilters.size === 0
    ? "No categories selected"
    : `${activeFilters.size} ${activeFilters.size === 1 ? "category" : "categories"}`;

  return (
    <div className="relative">
      <div className="sticky top-[57px] z-[5] bg-black/80 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Explore</h2>
        <button
          onClick={() => setMenuOpen(true)}
          className="flex items-center gap-1.5 text-sm text-neutral-300 hover:text-white"
        >
          <SlidersHorizontal size={16} />
          {filterLabel}
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-30" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 max-w-[80vw] bg-black border-l border-neutral-800 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <span className="font-bold">Filter categories</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex gap-2 px-4 py-3 border-b border-neutral-800 text-sm">
              <button
                onClick={() => setActiveFilters(new Set(ALL_IDS))}
                className="text-blue-400 hover:underline"
              >
                Select all
              </button>
              <span className="text-neutral-600">·</span>
              <button
                onClick={() => setActiveFilters(new Set())}
                className="text-blue-400 hover:underline"
              >
                Clear
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {CATEGORIES.map((c) => {
                const checked = activeFilters.has(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-950"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFilter(c.id)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className={checked ? "text-white" : "text-neutral-400"}>
                      {c.label}
                    </span>
                  </label>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-neutral-500">Loading…</div>
      ) : error ? (
        <div className="p-8 text-center text-neutral-500">{error}</div>
      ) : visiblePosts.length === 0 ? (
        <div className="p-8 text-center text-neutral-500">
          {activeFilters.size === 0
            ? "Select at least one category to see posts."
            : "Nothing here right now. Try again shortly."}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {visiblePosts.map((post) => {
            const { icon: Icon, gradient } = getCategoryStyle(post.category);
            return (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden group"
            >
              {post.imageURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageURL}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-2 text-center`}
                >
                  <Icon size={18} className="text-white/70 mb-1" />
                  <span className="text-white text-xs font-medium line-clamp-4 break-words">
                    {post.title}
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-[11px] font-medium line-clamp-2">
                  {post.title}
                </span>
              </div>
            </a>
            );
          })}
        </div>
      )}

      {!loading && visiblePosts.length > 0 && (
        <p className="p-4 text-center text-xs text-neutral-600">
          Real public posts, pulled live from each source&apos;s own public
          feed. Tap a tile to view it at the source.
        </p>
      )}
    </div>
  );
}
