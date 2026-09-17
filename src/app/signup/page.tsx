"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthBrand from "@/components/AuthBrand";
import AuthTabs from "@/components/AuthTabs";
import type { AccountType } from "@/types";
import toast from "react-hot-toast";

const ACCOUNT_TYPES: { value: AccountType; label: string; hint: string }[] = [
  { value: "personal", label: "Personal", hint: "Followers" },
  { value: "artist", label: "Artist", hint: "Fans" },
  { value: "business", label: "Business", hint: "Followers" },
];

export default function SignupPage() {
  const { signUp, logInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signUp(email, password, username, dateOfBirth, accountType);
      toast.success("Account created!");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign up.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      await logInWithGoogle(accountType);
      toast.success("Welcome!");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign up.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <AuthBrand />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <AuthTabs />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                @ Username
              </label>
              <input
                type="text"
                placeholder="@ yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="6+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Date of birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                max={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Account type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ACCOUNT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setAccountType(t.value)}
                    className={`rounded-lg border px-2 py-2.5 text-center transition ${
                      accountType === t.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-[11px] text-slate-400">{t.hint}</div>
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 hover:opacity-90 disabled:opacity-50"
            >
              Create account
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-sm">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 text-slate-800 py-3 font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
