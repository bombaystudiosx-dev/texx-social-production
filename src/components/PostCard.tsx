"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { Heart, Trash2, MessageCircle, Bookmark, Flag, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toggleLike, isPostLikedByUser, deletePost } from "@/lib/posts";
import { addComment, subscribeToComments } from "@/lib/comments";
import { isPostSaved, toggleSavePost } from "@/lib/savedPosts";
import { submitReport } from "@/lib/moderation";
import { avatarUrl } from "@/lib/avatar";
import type { Comment, Post } from "@/types";
import toast from "react-hot-toast";

export default function PostCard({ post }: { post: Post }) {
  const { user, profile } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [optimisticDelta, setOptimisticDelta] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const likesCount = post.likesCount + optimisticDelta;

  useEffect(() => {
    if (user) {
      isPostLikedByUser(post.id, user.uid).then(setLiked);
      isPostSaved(user.uid, post.id).then(setSaved);
    }
  }, [post.id, user]);

  useEffect(() => {
    if (!showComments) return;
    return subscribeToComments(post.id, setComments);
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Log in to like posts.");
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setOptimisticDelta((prev) => (wasLiked ? prev - 1 : prev + 1));
    try {
      await toggleLike(post.id, user.uid);
    } catch {
      setLiked(wasLiked);
      setOptimisticDelta((prev) => (wasLiked ? prev + 1 : prev - 1));
      toast.error("Failed to update like.");
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Log in to save posts.");
      return;
    }
    const prev = saved;
    setSaved(!prev);
    try {
      await toggleSavePost(user.uid, post.id);
    } catch {
      setSaved(prev);
      toast.error("Failed to update saved posts.");
    }
  };

  const handleReport = async () => {
    if (!user) {
      toast.error("Log in to report posts.");
      return;
    }
    setMenuOpen(false);
    try {
      await submitReport({
        reporterId: user.uid,
        targetType: "post",
        targetId: post.id,
        reason: "reported_from_feed",
      });
      toast.success("Report submitted. Thanks for flagging it.");
    } catch {
      toast.error("Failed to submit report.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost(post.id);
    } catch {
      toast.error("Failed to delete post.");
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast.error("Log in to comment.");
      return;
    }
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      await addComment({
        postId: post.id,
        authorId: user.uid,
        author: {
          username: profile.username,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
        },
        text: commentText,
      });
      setCommentText("");
    } catch {
      toast.error("Failed to post comment.");
    } finally {
      setPostingComment(false);
    }
  };

  const timeAgo = post.createdAt
    ? formatDistanceToNowStrict(post.createdAt.toDate(), { addSuffix: true })
    : "";

  return (
    <article className="border-b border-neutral-800 p-4 hover:bg-neutral-950/50">
      <div className="flex gap-3">
        <Link href={`/profile/${post.author.username}`}>
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[2px] flex-shrink-0">
            <div className="w-full h-full rounded-full bg-neutral-700 overflow-hidden ring-2 ring-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl(post.authorId, post.author.photoURL)}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/profile/${post.author.username}`}
              className="font-semibold hover:underline"
            >
              {post.author.displayName}
            </Link>
            <span className="text-neutral-500">@{post.author.username}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-500">{timeAgo}</span>

            <div className="ml-auto relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="text-neutral-500 hover:text-neutral-300"
                title="More"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-6 z-10 w-40 rounded-lg border border-neutral-800 bg-neutral-900 shadow-lg overflow-hidden">
                  {user?.uid === post.authorId ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleDelete();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-neutral-800"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  ) : (
                    <button
                      onClick={handleReport}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                    >
                      <Flag size={14} /> Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {post.text && (
            <p className="mt-1 whitespace-pre-wrap break-words">{post.text}</p>
          )}
          {post.imageURL && (
            <div className="mt-2 rounded-2xl overflow-hidden border border-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageURL}
                alt=""
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
          <div className="flex items-center gap-6 mt-3 text-neutral-500">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 hover:text-pink-400 ${
                liked ? "text-pink-500" : ""
              }`}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
              <span className="text-sm">{likesCount}</span>
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              className={`flex items-center gap-1.5 hover:text-blue-400 ${
                showComments ? "text-blue-400" : ""
              }`}
            >
              <MessageCircle size={18} />
              <span className="text-sm">{post.commentsCount || 0}</span>
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 hover:text-yellow-400 ${
                saved ? "text-yellow-500" : ""
              }`}
              title={saved ? "Unsave" : "Save"}
            >
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>

          {showComments && (
            <div className="mt-3 border-t border-neutral-800 pt-3 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-neutral-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl(c.authorId, c.author.photoURL)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-semibold">{c.author.displayName}</span>
                  <span className="text-neutral-300 break-words">{c.text}</span>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-neutral-600">No comments yet.</p>
              )}
              {user && (
                <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment…"
                    className="flex-1 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={postingComment || !commentText.trim()}
                    className="text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-40 px-2"
                  >
                    Post
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
