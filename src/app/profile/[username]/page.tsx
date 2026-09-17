"use client";

import { useEffect, useState, use } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { subscribeToUserPosts } from "@/lib/posts";
import { isFollowing, toggleFollow } from "@/lib/follow";
import { isBlocked, blockUser, unblockUser, submitReport } from "@/lib/moderation";
import PostCard from "@/components/PostCard";
import { audienceLabel } from "@/types";
import type { Post, UserProfile } from "@/types";
import { MoreHorizontal, Flag, Ban, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user, profile: myProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let unsubPosts: (() => void) | undefined;

    async function load() {
      setLoading(true);
      const q = query(
        collection(db, "users"),
        where("usernameLower", "==", username.toLowerCase())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const data = snap.docs[0].data() as UserProfile;
      setProfile(data);
      setLoading(false);

      unsubPosts = subscribeToUserPosts(data.uid, setPosts);

      if (user && user.uid !== data.uid) {
        const [f, b] = await Promise.all([
          isFollowing(user.uid, data.uid),
          isBlocked(user.uid, data.uid),
        ]);
        setFollowing(f);
        setBlocked(b);
      }
    }

    load();
    return () => {
      if (unsubPosts) unsubPosts();
    };
  }, [username, user]);

  const handleFollow = async () => {
    if (!user) {
      toast.error("Log in to follow users.");
      return;
    }
    if (!profile) return;
    setFollowBusy(true);
    try {
      await toggleFollow(user.uid, profile.uid);
      setFollowing((prev) => !prev);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followersCount: following
                ? prev.followersCount - 1
                : prev.followersCount + 1,
            }
          : prev
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update follow status.");
    } finally {
      setFollowBusy(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!user || !profile) return;
    setMenuOpen(false);
    try {
      if (blocked) {
        await unblockUser(user.uid, profile.uid);
        setBlocked(false);
        toast.success(`Unblocked @${profile.username}.`);
      } else {
        await blockUser(user.uid, profile.uid);
        setBlocked(true);
        setFollowing(false);
        toast.success(`Blocked @${profile.username}.`);
      }
    } catch {
      toast.error("Failed to update block status.");
    }
  };

  const handleReport = async () => {
    if (!user || !profile) return;
    setMenuOpen(false);
    try {
      await submitReport({
        reporterId: user.uid,
        targetType: "user",
        targetId: profile.uid,
        reason: "reported_from_profile",
      });
      toast.success("Report submitted.");
    } catch {
      toast.error("Failed to submit report.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Loading…</div>;
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-neutral-500">User not found.</div>
    );
  }

  const isMe = myProfile?.uid === profile.uid;
  const label = audienceLabel(profile.accountType);

  return (
    <div>
      <div className="h-32 bg-neutral-800" />
      <div className="p-4 border-b border-neutral-800">
        <div className="flex justify-between items-start -mt-14">
          <div className="w-24 h-24 rounded-full bg-neutral-700 border-4 border-black overflow-hidden">
            {profile.photoURL && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoURL}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {!isMe && (
            <div className="flex items-center gap-2 mt-16">
              {!blocked && (
                <button
                  onClick={handleFollow}
                  disabled={followBusy}
                  className={`rounded-full px-5 py-2 font-semibold ${
                    following
                      ? "border border-neutral-700 hover:border-red-500 hover:text-red-400"
                      : "bg-white text-black hover:bg-neutral-200"
                  } disabled:opacity-50`}
                >
                  {following ? "Following" : "Follow"}
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-full border border-neutral-700 p-2 text-neutral-400 hover:text-neutral-200"
                >
                  <MoreHorizontal size={18} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-11 z-10 w-44 rounded-lg border border-neutral-800 bg-neutral-900 shadow-lg overflow-hidden">
                    <button
                      onClick={handleToggleBlock}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                    >
                      {blocked ? <ShieldCheck size={14} /> : <Ban size={14} />}
                      {blocked ? "Unblock" : "Block"} @{profile.username}
                    </button>
                    <button
                      onClick={handleReport}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-neutral-800"
                    >
                      <Flag size={14} /> Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <h1 className="text-xl font-bold">{profile.displayName}</h1>
          <span className="text-[11px] uppercase tracking-wide rounded-full border border-neutral-700 text-neutral-400 px-2 py-0.5">
            {profile.accountType}
          </span>
        </div>
        <p className="text-neutral-500">@{profile.username}</p>
        {profile.bio && <p className="mt-2">{profile.bio}</p>}
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-blue-400 hover:underline"
          >
            {profile.website}
          </a>
        )}
        <div className="flex gap-4 mt-3 text-sm">
          <span>
            <strong>{profile.followingCount}</strong>{" "}
            <span className="text-neutral-500">Following</span>
          </span>
          <span>
            <strong>{profile.followersCount}</strong>{" "}
            <span className="text-neutral-500">{label}</span>
          </span>
          <span>
            <strong>{profile.postsCount}</strong>{" "}
            <span className="text-neutral-500">Posts</span>
          </span>
        </div>
      </div>

      {blocked ? (
        <div className="p-8 text-center text-neutral-500">
          You&apos;ve blocked @{profile.username}. Unblock to see their posts.
        </div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-neutral-500">No posts yet.</div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
