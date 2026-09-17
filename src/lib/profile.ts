import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export async function updateMyProfile(
  uid: string,
  updates: {
    displayName?: string;
    bio?: string;
    website?: string;
    photoURL?: string;
    bannerURL?: string;
  }
) {
  const clean: Record<string, string> = {};
  if (updates.displayName !== undefined) {
    const trimmed = updates.displayName.trim().slice(0, 50);
    if (!trimmed) throw new Error("Display name can't be empty.");
    clean.displayName = trimmed;
    clean.displayNameLower = trimmed.toLowerCase();
  }
  if (updates.bio !== undefined) clean.bio = updates.bio.trim().slice(0, 160);
  if (updates.website !== undefined) {
    const w = updates.website.trim();
    if (w && !/^https?:\/\//i.test(w)) {
      throw new Error("Website must start with http:// or https://");
    }
    clean.website = w.slice(0, 200);
  }
  if (updates.photoURL !== undefined) clean.photoURL = updates.photoURL;
  if (updates.bannerURL !== undefined) clean.bannerURL = updates.bannerURL;

  await updateDoc(doc(db, "users", uid), clean);
}

export async function uploadAvatar(file: File) {
  return uploadImageToCloudinary(file);
}

export async function setAccountStatus(
  uid: string,
  status: "active" | "deactivated"
) {
  await updateDoc(doc(db, "users", uid), { accountStatus: status });
}
