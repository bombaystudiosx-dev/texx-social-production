import {
  collection,
  addDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppNotification, NotificationType } from "@/types";

/**
 * Written directly by the acting client into the recipient's subcollection.
 * Firestore security rules constrain the shape (actorId must match the
 * writer, recipient can only ever toggle `read`). There is no Cloud
 * Function / Admin SDK in this deployment, so this is best-effort delivery
 * rather than a fully trusted server-generated event — acceptable for likes/
 * follows/comments, which are inherently visible to the recipient anyway.
 */
export async function createNotification({
  recipientId,
  type,
  actorId,
  actor,
  targetId = null,
  postId = null,
  conversationId = null,
}: {
  recipientId: string;
  type: NotificationType;
  actorId: string;
  actor: { username: string; displayName: string; photoURL: string };
  targetId?: string | null;
  postId?: string | null;
  conversationId?: string | null;
}) {
  if (recipientId === actorId) return; // never notify yourself
  await addDoc(collection(db, "users", recipientId, "notifications"), {
    type,
    actorId,
    actor,
    targetId,
    postId,
    conversationId,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToNotifications(
  uid: string,
  callback: (notifications: AppNotification[]) => void,
  count = 30
) {
  const q = query(
    collection(db, "users", uid, "notifications"),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification)
    );
  });
}

export async function markNotificationRead(uid: string, notificationId: string) {
  await updateDoc(doc(db, "users", uid, "notifications", notificationId), {
    read: true,
  });
}

export async function markAllNotificationsRead(uid: string) {
  const snap = await getDocs(
    query(collection(db, "users", uid, "notifications"), limit(200))
  );
  const unread = snap.docs.filter((d) => d.data().read === false);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  unread.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}
