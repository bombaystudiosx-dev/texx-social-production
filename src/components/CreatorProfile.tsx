"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import WorldPostCard from "@/components/WorldPostCard";
import { getCategoryStyle } from "@/lib/categoryStyle";
import type { WorldPost } from "@/app/api/world/route";

export default function CreatorProfile() {
  const params = useSearchParams();
  const name = params.get("name") || "";
  const source = params.get("source") || "";

  const [posts, setPosts] = useState<WorldPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/world?category=all")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const all: WorldPost[] = data.posts || [];
        const matches = all.filter(
          (p) =>
            typeof p.author === "string" &&
            p.author.toLowerCase() === name.toLowerCase() &&
            p.source.toLowerCase() === source.toLowerCase()
        );
        matches.sort((a, b) => b.createdUtc - a.createdUtc);
        setPosts(matches);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [name, source]);

  const { icon: Icon, gradient } = getCategoryStyle(posts[0]?.category);
  const latestLink = posts[0]?.permalink;

  if (!name) {
    return (
      <div className="p-8 text-center text-neutral-500">
        No creator specified.
      </div>
    );
  }

  return (
    <div>
      <div className="p-6 border-b border-neutral-800">
        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
          <Icon size={32} className="text-white" />
        </div>
        <h1 className="text-xl font-bold">{name}</h1>
        <p className="text-neutral-500">Writes for {source}</p>
        {latestLink && (
          <a
            href={latestLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-400 hover:underline"
          >
            View latest article at {source}
            <ExternalLink size={14} />
          </a>
        )}
        <p className="mt-3 text-xs text-neutral-600">
          Profile built only from what {source} publicly attributes to this
          byline. No financial, biographical, or influence data is inferred
          or estimated.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-neutral-500">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-neutral-500">
          No articles found for this byline right now.
        </div>
      ) : (
        <div>
          <div className="px-4 py-3 text-sm text-neutral-500 border-b border-neutral-800">
            {posts.length} {posts.length === 1 ? "article" : "articles"} in
            your feed
          </div>
          {posts.map((post) => (
            <WorldPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
