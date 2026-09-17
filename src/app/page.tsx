"use client";

import { useEffect, useState } from "react";
import { subscribeToFeed, loadOlderPosts } from "@/lib/posts";
import PostComposer from "@/components/PostComposer";
import PostCard from "@/components/PostCard";
import WorldPostCard from "@/components/WorldPostCard";
import { useAuth } from "@/context/AuthContext";
import type { Post } from "@/types";
import type { WorldPost } from "@/app/api/world/route";

type FeedItem =
  | { kind: "post"; ts: number; post: Post }
  | { kind: "world"; ts: number; post: WorldPost };

export default function Home() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [olderPosts, setOlderPosts] = useState<Post[]>([]);
  const [worldPosts, setWorldPosts] = useState<WorldPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [worldLoading, setWorldLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const unsub = subscribeToFeed((data) => {
      setPosts(data);
      setPostsLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/world?category=all")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setWorldPosts(data.posts || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setWorldLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allPosts = [...posts, ...olderPosts];

  const handleLoadMore = async () => {
    const oldest = allPosts[allPosts.length - 1];
    if (!oldest?.createdAt) return;
    setLoadingMore(true);
    try {
      const { posts: more, hasMore: more_ } = await loadOlderPosts(oldest.createdAt);
      setOlderPosts((prev) => [...prev, ...more]);
      setHasMore(more_);
    } finally {
      setLoadingMore(false);
    }
  };

  const feed: FeedItem[] = [
    ...allPosts.map(
      (post): FeedItem => ({
        kind: "post",
        // A brand-new post's serverTimestamp() hasn't resolved locally yet;
        // treat it as "now" (top of feed) until the snapshot updates.
        ts: post.createdAt ? post.createdAt.toMillis() : Number.MAX_SAFE_INTEGER,
        post,
      })
    ),
    ...worldPosts.map(
      (post): FeedItem => ({
        kind: "world",
        ts: post.createdUtc * 1000,
        post,
      })
    ),
  ].sort((a, b) => b.ts - a.ts);

  const isLoading = postsLoading && worldLoading;

  return (
    <div>
      <div className="sticky top-[57px] z-[5] bg-black/80 backdrop-blur border-b border-neutral-800 px-4 py-3">
        <h2 className="text-xl font-bold">Home</h2>
      </div>

      <div id="compose">
        {!loading && user && <PostComposer />}
        {!loading && !user && (
          <div className="p-6 text-center text-neutral-400 border-b border-neutral-800">
            Log in to post and like.
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-neutral-500">
          Loading your feed…
        </div>
      ) : feed.length === 0 ? (
        <div className="p-8 text-center text-neutral-500">
          Nothing to show yet. Be the first to post!
        </div>
      ) : (
        <>
          {feed.map((item) =>
            item.kind === "post" ? (
              <PostCard key={`post-${item.post.id}`} post={item.post} />
            ) : (
              <WorldPostCard key={`world-${item.post.id}`} post={item.post} />
            )
          )}
          {hasMore && allPosts.length >= 20 && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-4 text-center text-sm font-semibold text-blue-400 hover:bg-neutral-950/50 disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more posts"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
