import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  runTransaction,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  where,
  deleteDoc,
  setDoc,
  getDoc,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { createNotification } from "@/lib/notifications";
import type { Post, PostMusic, UserProfile } from "@/types";

export async function createPost({
  authorId,
  author,
  text,
  imageFile,
  music = null,
}: {
  authorId: string;
  author: { username: string; displayName: string; photoURL: string };
  text: string;
  imageFile?: File | null;
  music?: PostMusic | null;
}) {
  let imageURL: string | null = null;

  if (imageFile) {
    imageURL = await uploadImageToCloudinary(imageFile);
  }

  await addDoc(collection(db, "posts"), {
    authorId,
    author,
    text,
    imageURL,
    music,
    status: "published",
    likesCount: 0,
    repliesCount: 0,
    repostsCount: 0,
    commentsCount: 0,
    replyToId: null,
    createdAt: serverTimestamp(),
  });

  const userRef = doc(db, "users", authorId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await setDoc(
      userRef,
      { postsCount: ((snap.data() as UserProfile).postsCount || 0) + 1 },
      { merge: true }
    );
  }
}

const FEED_PAGE_SIZE = 20;

/** Live subscription to the first page only — used for the initial real-time feed. */
export function subscribeToFeed(
  callback: (posts: Post[]) => void,
  count = FEED_PAGE_SIZE
) {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post);
    callback(posts);
  });
}

/**
 * Cursor-paginated feed for "load more" — replaces the old hard 50-post cap.
 * Pass the last document snapshot from the previous page as `cursor`.
 */
export async function loadFeedPage(
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
  pageSize = FEED_PAGE_SIZE
) {
  const constraints = [
    orderBy("createdAt", "desc"),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(pageSize),
  ];
  const snap = await getDocs(query(collection(db, "posts"), ...constraints));
  return {
    posts: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.docs.length === pageSize,
  };
}

export function subscribeToUserPosts(
  authorId: string,
  callback: (posts: Post[]) => void
) {
  const q = query(
    collection(db, "posts"),
    where("authorId", "==", authorId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post);
    callback(posts);
  });
}

export async function toggleLike(postId: string, userId: string) {
  const likeRef = doc(db, "posts", postId, "likes", userId);
  const postRef = doc(db, "posts", postId);

  const wasLiked = await getDoc(likeRef).then((s) => s.exists());

  await runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef);
    const postSnap = await tx.get(postRef);
    if (!postSnap.exists()) return;
    const currentLikes = (postSnap.data().likesCount as number) || 0;

    if (likeSnap.exists()) {
      tx.delete(likeRef);
      tx.update(postRef, { likesCount: Math.max(0, currentLikes - 1) });
    } else {
      tx.set(likeRef, { userId, createdAt: serverTimestamp() });
      tx.update(postRef, { likesCount: currentLikes + 1 });
    }
  });

  if (!wasLiked) {
    const [postSnap, userSnap] = await Promise.all([
      getDoc(postRef),
      getDoc(doc(db, "users", userId)),
    ]);
    const post = postSnap.data() as Post | undefined;
    const actorProfile = userSnap.data() as UserProfile | undefined;
    if (post && actorProfile) {
      await createNotification({
        recipientId: post.authorId,
        type: "like",
        actorId: userId,
        actor: {
          username: actorProfile.username,
          displayName: actorProfile.displayName,
          photoURL: actorProfile.photoURL,
        },
        postId,
      }).catch(() => {});
    }
  }
}

export async function isPostLikedByUser(postId: string, userId: string) {
  const likeRef = doc(db, "posts", postId, "likes", userId);
  const snap = await getDoc(likeRef);
  return snap.exists();
}

export async function deletePost(postId: string) {
  await deleteDoc(doc(db, "posts", postId));
}
