"use client";

import { useState, useRef, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { createPost } from "@/lib/posts";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { ImageIcon, X } from "lucide-react";
import toast from "react-hot-toast";

const MAX_CHARS = 280;

export default function PostComposer() {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user || !profile) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;
    setSubmitting(true);
    try {
      await createPost({
        authorId: user.uid,
        author: {
          username: profile.username,
          displayName: profile.displayName,
          photoURL: profile.photoURL || "",
        },
        text: text.trim(),
        imageFile,
      });
      setText("");
      clearImage();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-b border-neutral-800 p-4">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[2px] flex-shrink-0">
          <div className="w-full h-full rounded-full bg-neutral-700 overflow-hidden ring-2 ring-black">
            {profile.photoURL && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="What's happening?"
            rows={3}
            className="w-full bg-transparent resize-none text-lg placeholder-neutral-500 focus:outline-none"
          />
          {imagePreview && (
            <div className="relative mt-2 rounded-2xl overflow-hidden border border-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="" className="w-full max-h-96 object-cover" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5 hover:bg-black"
              >
                <X size={18} />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            {isCloudinaryConfigured ? (
              <label className="cursor-pointer text-blue-400 hover:text-blue-300">
                <ImageIcon size={20} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">
                {text.length}/{MAX_CHARS}
              </span>
              <button
                type="submit"
                disabled={submitting || (!text.trim() && !imageFile)}
                className="rounded-full bg-white text-black font-semibold px-5 py-2 hover:bg-neutral-200 disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
