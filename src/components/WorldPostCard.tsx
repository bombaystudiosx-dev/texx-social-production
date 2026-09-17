import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowUp, MessageCircle } from "lucide-react";
import type { WorldPost } from "@/app/api/world/route";
import { getCategoryStyle } from "@/lib/categoryStyle";

export default function WorldPostCard({ post }: { post: WorldPost }) {
  const { icon: Icon, gradient } = getCategoryStyle(post.category);
  const creatorHref = `/creator?name=${encodeURIComponent(
    post.author
  )}&source=${encodeURIComponent(post.source)}`;

  return (
    <article className="border-b border-neutral-800 p-4 hover:bg-neutral-950/50">
      <div className="flex gap-3">
        <Link href={creatorHref} className="flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <Icon size={18} className="text-white" />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="font-semibold">{post.source}</span>
            <span className="text-neutral-500">·</span>
            <Link
              href={creatorHref}
              className="text-neutral-400 hover:text-white hover:underline"
            >
              {post.author}
            </Link>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-500">
              {post.createdUtc
                ? formatDistanceToNowStrict(post.createdUtc * 1000, {
                    addSuffix: true,
                  })
                : ""}
            </span>
          </div>
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1"
          >
            <p className="font-medium break-words">{post.title}</p>
            {post.selftext && (
              <p className="mt-1 text-neutral-400 text-sm line-clamp-3 break-words">
                {post.selftext}
              </p>
            )}
            {post.imageURL && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-neutral-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageURL}
                  alt=""
                  className="w-full max-h-96 object-cover"
                />
              </div>
            )}
          </a>
          {(post.score > 0 || post.numComments > 0) && (
            <div className="flex items-center gap-5 mt-3 text-neutral-500 text-sm">
              <span className="flex items-center gap-1.5">
                <ArrowUp size={16} />
                {post.score.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle size={16} />
                {post.numComments.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
