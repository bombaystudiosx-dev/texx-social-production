"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { updateMyProfile, uploadAvatar, setAccountStatus } from "@/lib/profile";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { getBlockedUids, unblockUser } from "@/lib/moderation";
import { avatarUrl } from "@/lib/avatar";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sun, Moon, ArrowLeft, LogOut } from "lucide-react";
import toast from "react-hot-toast";

interface BlockedUserInfo {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string;
}

export default function SettingsPage() {
  const { user, profile, loading, logOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [bannerURL, setBannerURL] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserInfo[]>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- seeds editable
       local state from the profile once it loads asynchronously from
       Firestore; not derivable at render time. */
    if (profile) {
      setDisplayName(profile.displayName);
      setBio(profile.bio || "");
      setWebsite(profile.website || "");
      setPhotoURL(profile.photoURL || "");
      setBannerURL(profile.bannerURL || "");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    getBlockedUids(user.uid).then(async (uids) => {
      const list = await Promise.all(
        Array.from(uids).map(async (uid) => {
          const snap = await getDoc(doc(db, "users", uid));
          const data = snap.data();
          return {
            uid,
            displayName: data?.displayName || "Unknown",
            username: data?.username || "",
            photoURL: data?.photoURL || "",
          };
        })
      );
      setBlockedUsers(list);
    });
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Loading…</div>;
  }

  if (!user || !profile) {
    return (
      <div className="p-8 text-center text-neutral-500">
        Log in to manage settings.
      </div>
    );
  }

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file);
      setPhotoURL(url);
      toast.success("Photo uploaded — remember to save.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const url = await uploadAvatar(file);
      setBannerURL(url);
      toast.success("Banner uploaded — remember to save.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile(user.uid, { displayName, bio, website, photoURL, bannerURL });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (uid: string) => {
    try {
      await unblockUser(user.uid, uid);
      setBlockedUsers((prev) => prev.filter((b) => b.uid !== uid));
      toast.success("Unblocked.");
    } catch {
      toast.error("Failed to unblock.");
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Deactivate your account? You can reactivate by logging back in.")) return;
    try {
      await setAccountStatus(user.uid, "deactivated");
      toast.success("Account deactivated.");
      await logOut();
      router.push("/login");
    } catch {
      toast.error("Failed to deactivate.");
    }
  };

  return (
    <div>
      <div className="sticky top-[57px] z-[5] flex items-center gap-3 bg-black/80 backdrop-blur border-b border-neutral-800 px-4 py-3">
        <button onClick={() => router.back()} className="text-neutral-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      <section className="p-4 border-b border-neutral-800">
        <h3 className="font-semibold mb-4">Edit Profile</h3>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl(user.uid, photoURL)} alt="" className="w-full h-full object-cover" />
          </div>
          {isCloudinaryConfigured ? (
            <>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="rounded-full border border-neutral-700 px-4 py-2 text-sm font-semibold hover:bg-neutral-900 disabled:opacity-50"
              >
                {uploadingAvatar ? "Uploading…" : "Change photo"}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </>
          ) : (
            <p className="text-xs text-neutral-500">Image uploads not configured.</p>
          )}
        </div>

        {isCloudinaryConfigured && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-neutral-300 mb-1.5">
              Banner
            </label>
            {bannerURL && (
              <div className="h-24 rounded-lg overflow-hidden mb-2 border border-neutral-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bannerURL} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="rounded-full border border-neutral-700 px-4 py-2 text-sm font-semibold hover:bg-neutral-900 disabled:opacity-50"
            >
              {uploadingBanner ? "Uploading…" : "Change banner"}
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerSelect}
              className="hidden"
            />
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-1.5">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              rows={3}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-neutral-600 mt-1">{bio.length}/160</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-1.5">
              Website
            </label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-white text-black font-semibold px-5 py-2.5 hover:bg-neutral-200 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="p-4 border-b border-neutral-800">
        <h3 className="font-semibold mb-4">Appearance</h3>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 rounded-lg border border-neutral-800 px-4 py-3 hover:bg-neutral-900 w-full"
        >
          {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
          <span className="ml-auto text-sm text-neutral-500">Tap to switch</span>
        </button>
      </section>

      <section className="p-4 border-b border-neutral-800">
        <h3 className="font-semibold mb-4">Blocked accounts</h3>
        {blockedUsers.length === 0 ? (
          <p className="text-sm text-neutral-500">You haven&apos;t blocked anyone.</p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((b) => (
              <div key={b.uid} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl(b.uid, b.photoURL)} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="flex-1 text-sm">{b.displayName}</span>
                <button
                  onClick={() => handleUnblock(b.uid)}
                  className="text-sm text-blue-400 hover:underline"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="p-4 space-y-2">
        <h3 className="font-semibold mb-2">Account</h3>
        <button
          onClick={() => logOut()}
          className="flex items-center gap-2 w-full text-left rounded-lg border border-neutral-800 px-4 py-3 hover:bg-neutral-900"
        >
          <LogOut size={16} /> Log out
        </button>
        <button
          onClick={handleDeactivate}
          className="w-full text-left rounded-lg border border-neutral-800 px-4 py-3 text-red-400 hover:bg-neutral-900"
        >
          Deactivate account
        </button>
      </section>
    </div>
  );
}
