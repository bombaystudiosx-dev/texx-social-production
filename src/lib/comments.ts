import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  runTransaction,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import type { Comment, Post } from "@/types";

export async function addComment({
  postId,
  authorId,
  author,
  text,
}: {
  postId: string;
  authorId: string;
  author: { username: string; displayName: string; photoURL: string };
  text: string;
}) {
  const trimmed = text.trim().slice(0, 500);
  if (!trimmed) throw new Error("Comment cannot be empty.");

  const postRef = doc(db, "posts", postId);
  const commentRef = doc(collection(db, "posts", postId, "comments"));

  await runTransaction(db, async (tx) => {
    const postSnap = await tx.get(postRef);
    if (!postSnap.exists()) throw new Error("Post no longer exists.");
    const current = (postSnap.data().commentsCount as number) || 0;
    tx.set(commentRef, {
      postId,
      authorId,
      author,
      text: trimmed,
      status: "published",
      createdAt: serverTimestamp(),
    });
    tx.update(postRef, { commentsCount: current + 1 });
  });

  const postSnap = await getDoc(postRef);
  const post = postSnap.data() as Post | undefined;
  if (post) {
    await createNotification({
      recipientId: post.authorId,
      type: "comment",
      actorId: authorId,
      actor: author,
      postId,
    }).catch(() => {});
  }

  return commentRef.id;
}

export function subscribeToComments(
  postId: string,
  callback: (comments: Comment[]) => void
) {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment));
  });
}

export async function deleteComment(postId: string, commentId: string) {
  const postRef = doc(db, "posts", postId);
  const commentRef = doc(db, "posts", postId, "comments", commentId);

  await runTransaction(db, async (tx) => {
    const postSnap = await tx.get(postRef);
    if (!postSnap.exists()) {
      tx.delete(commentRef);
      return;
    }
    const current = (postSnap.data().commentsCount as number) || 0;
    tx.delete(commentRef);
    tx.update(postRef, { commentsCount: Math.max(0, current - 1) });
  });
}
