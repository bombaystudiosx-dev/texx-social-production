import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isBlockedEitherWay } from "@/lib/moderation";
import { createNotification } from "@/lib/notifications";
import type { Conversation, Message } from "@/types";

type Participant = { username: string; displayName: string; photoURL: string };

/** Deterministic id so the same pair of users always lands on the same thread. */
function conversationId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join("_");
}

export async function getOrCreateConversation(
  myUid: string,
  myProfile: Participant,
  otherUid: string,
  otherProfile: Participant
) {
  if (myUid === otherUid) throw new Error("Can't message yourself.");
  if (await isBlockedEitherWay(myUid, otherUid)) {
    throw new Error("You can't message this account.");
  }

  const id = conversationId(myUid, otherUid);
  const ref = doc(db, "conversations", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participantIds: [myUid, otherUid],
      participants: { [myUid]: myProfile, [otherUid]: otherProfile },
      lastMessageText: "",
      lastMessageAt: null,
      lastMessageSenderId: null,
      unreadCounts: { [myUid]: 0, [otherUid]: 0 },
      createdAt: serverTimestamp(),
    });
  }
  return id;
}

export function subscribeToConversations(
  uid: string,
  callback: (conversations: Conversation[]) => void
) {
  const q = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", uid),
    orderBy("lastMessageAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation)
    );
  });
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  count = 100
) {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc"),
    limit(count)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message));
  });
}

export async function sendMessage({
  conversationId,
  senderId,
  recipientId,
  text,
}: {
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
}) {
  const trimmed = text.trim().slice(0, 2000);
  if (!trimmed) return;

  if (await isBlockedEitherWay(senderId, recipientId)) {
    throw new Error("You can't message this account.");
  }

  const convoRef = doc(db, "conversations", conversationId);
  const convoSnap = await getDoc(convoRef);
  const convo = convoSnap.data() as Conversation | undefined;
  const currentUnread = convo?.unreadCounts?.[recipientId] || 0;

  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    conversationId,
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDoc(convoRef, {
    lastMessageText: trimmed,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
    [`unreadCounts.${recipientId}`]: currentUnread + 1,
    [`unreadCounts.${senderId}`]: 0,
  });

  const senderProfile = convo?.participants?.[senderId];
  if (senderProfile) {
    await createNotification({
      recipientId,
      type: "message",
      actorId: senderId,
      actor: senderProfile,
      conversationId,
    }).catch(() => {});
  }
}

export async function markConversationRead(conversationId: string, uid: string) {
  await updateDoc(doc(db, "conversations", conversationId), {
    [`unreadCounts.${uid}`]: 0,
  });
}
