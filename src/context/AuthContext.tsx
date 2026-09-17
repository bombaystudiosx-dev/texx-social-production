"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import type { AccountType, UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
    dateOfBirth: string,
    accountType: AccountType
  ) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logInWithGoogle: (accountType: AccountType) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function isUsernameTaken(username: string) {
  const q = query(
    collection(db, "users"),
    where("usernameLower", "==", username.toLowerCase())
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

function calculateAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

async function createUserProfile(
  uid: string,
  username: string,
  displayName: string,
  photoURL: string,
  accountType: AccountType,
  dateOfBirth: string | null = null
) {
  const profile: Omit<UserProfile, "createdAt"> & { createdAt: unknown } = {
    uid,
    username,
    usernameLower: username.toLowerCase(),
    displayName,
    displayNameLower: displayName.toLowerCase(),
    bio: "",
    website: "",
    photoURL: photoURL || "",
    bannerURL: "",
    accountType,
    role: "user",
    accountStatus: "active",
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    dateOfBirth,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", uid), profile);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          if (data.accountStatus === "deactivated") {
            await setDoc(userRef, { accountStatus: "active" }, { merge: true });
            data.accountStatus = "active";
          }
          setProfile(data);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signUp = async (
    email: string,
    password: string,
    username: string,
    dateOfBirth: string,
    accountType: AccountType
  ) => {
    const clean = username.trim().replace(/\s+/g, "");
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(clean)) {
      throw new Error(
        "Username must be 3-20 characters: letters, numbers, underscore."
      );
    }
    if (!dateOfBirth) {
      throw new Error("Date of birth is required.");
    }
    if (calculateAge(dateOfBirth) < 13) {
      throw new Error("You must be at least 13 years old to sign up.");
    }
    if (await isUsernameTaken(clean)) {
      throw new Error("That username is already taken.");
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: clean });
    await createUserProfile(cred.user.uid, clean, clean, "", accountType, dateOfBirth);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    setProfile(snap.data() as UserProfile);
  };

  const logIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logInWithGoogle = async (accountType: AccountType) => {
    const result = await signInWithPopup(auth, googleProvider);
    const snap = await getDoc(doc(db, "users", result.user.uid));
    if (!snap.exists()) {
      const base = (result.user.displayName || "user").replace(/\s+/g, "");
      let candidate = base;
      let i = 0;
      while (await isUsernameTaken(candidate)) {
        i += 1;
        candidate = `${base}${i}`;
      }
      await createUserProfile(
        result.user.uid,
        candidate,
        result.user.displayName || candidate,
        result.user.photoURL || "",
        accountType
      );
      const newSnap = await getDoc(doc(db, "users", result.user.uid));
      setProfile(newSnap.data() as UserProfile);
    } else {
      setProfile(snap.data() as UserProfile);
    }
  };

  const logOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signUp, logIn, logInWithGoogle, logOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
