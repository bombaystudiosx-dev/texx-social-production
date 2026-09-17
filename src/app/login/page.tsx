"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import AuthBrand from "@/components/AuthBrand";
import AuthTabs from "@/components/AuthTabs";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { logIn, logInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await logIn(email, password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email above first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send reset email."
      );
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      await logInWithGoogle("personal");
      toast.success("Welcome!");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log in.");
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
                Password
              </label>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 hover:opacity-90 disabled:opacity-50"
            >
              Log in
            </button>
          </form>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="block w-full text-center mt-4 text-sm text-blue-600 hover:underline"
          >
            Forgot password?
          </button>

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
