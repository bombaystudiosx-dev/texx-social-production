import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function isPostSaved(uid: string, postId: string) {
  const snap = await getDoc(doc(db, "users", uid, "savedPosts", postId));
  return snap.exists();
}

export async function toggleSavePost(uid: string, postId: string) {
  const ref = doc(db, "users", uid, "savedPosts", postId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { postId, createdAt: serverTimestamp() });
  return true;
}

/** Saved post IDs only — private to the owner, ordered newest first. */
export function subscribeToSavedPostIds(
  uid: string,
  callback: (postIds: string[]) => void
) {
  const q = query(
    collection(db, "users", uid, "savedPosts"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.id));
  });
}
