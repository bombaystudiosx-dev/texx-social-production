import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ReportTargetType } from "@/types";

export async function isBlocked(myUid: string, otherUid: string) {
  const snap = await getDoc(doc(db, "users", myUid, "blocked", otherUid));
  return snap.exists();
}

/** True if either user has blocked the other — the direction that matters for feed/DM gating. */
export async function isBlockedEitherWay(uidA: string, uidB: string) {
  const [aBlockedB, bBlockedA] = await Promise.all([
    isBlocked(uidA, uidB),
    isBlocked(uidB, uidA),
  ]);
  return aBlockedB || bBlockedA;
}

export async function blockUser(myUid: string, targetUid: string) {
  if (myUid === targetUid) return;
  await setDoc(doc(db, "users", myUid, "blocked", targetUid), {
    uid: targetUid,
    createdAt: serverTimestamp(),
  });
  // Blocking implies unfollowing in both directions so counts stay honest.
  await Promise.all([
    deleteDoc(doc(db, "users", targetUid, "followers", myUid)).catch(() => {}),
    deleteDoc(doc(db, "users", myUid, "following", targetUid)).catch(() => {}),
    deleteDoc(doc(db, "users", myUid, "followers", targetUid)).catch(() => {}),
    deleteDoc(doc(db, "users", targetUid, "following", myUid)).catch(() => {}),
  ]);
}

export async function unblockUser(myUid: string, targetUid: string) {
  await deleteDoc(doc(db, "users", myUid, "blocked", targetUid));
}

export async function getBlockedUids(myUid: string): Promise<Set<string>> {
  const snap = await getDocs(collection(db, "users", myUid, "blocked"));
  return new Set(snap.docs.map((d) => d.id));
}

export async function submitReport({
  reporterId,
  targetType,
  targetId,
  reason,
  details = "",
}: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}) {
  await addDoc(collection(db, "reports"), {
    reporterId,
    targetType,
    targetId,
    reason,
    details: details.slice(0, 1000),
    status: "open",
    createdAt: serverTimestamp(),
    resolvedAt: null,
    resolvedBy: null,
  });
}
