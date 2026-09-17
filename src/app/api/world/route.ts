import { NextRequest, NextResponse } from "next/server";
import { fetchRssFeed } from "@/lib/rss";

export interface WorldPost {
  id: string;
  title: string;
  author: string;
  source: string;
  permalink: string;
  imageURL: string | null;
  score: number;
  numComments: number;
  createdUtc: number;
  selftext: string;
  category?: string;
}

// Real public posts from Hacker News's official public API
// (https://github.com/HackerNews/API) — no key, no auth, no rate-limit
// headaches, and it doesn't block server-side/datacenter traffic the way
// Reddit's public .json endpoints now do.
interface HNItem {
  id: number;
  title?: string;
  by?: string;
  score?: number;
  descendants?: number;
  time?: number;
  text?: string;
  type?: string;
  deleted?: boolean;
  dead?: boolean;
}

const HTML_ENTITIES: Record<string, string> = {
  "&#x2F;": "/",
  "&#x27;": "'",
  "&quot;": '"',
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
};

function decodeAndStripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(
      /&#x2F;|&#x27;|&quot;|&amp;|&lt;|&gt;/g,
      (entity) => HTML_ENTITIES[entity] || entity
    );
}

async function fetchHackerNews(): Promise<WorldPost[]> {
  const idsRes = await fetch(
    "https://hacker-news.firebaseio.com/v0/topstories.json",
    { next: { revalidate: 300 } }
  );
  if (!idsRes.ok) return [];
  const ids: number[] = await idsRes.json();

  const items = await Promise.all(
    ids.slice(0, 30).map(async (id) => {
      const res = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
        { next: { revalidate: 300 } }
      );
      if (!res.ok) return null;
      return (await res.json()) as HNItem;
    })
  );

  return items
    .filter(
      (item): item is HNItem =>
        Boolean(item) &&
        item!.type === "story" &&
        !item!.deleted &&
        !item!.dead &&
        Boolean(item!.title)
    )
    .map((item) => ({
      id: String(item.id),
      title: decodeAndStripHtml(item.title || ""),
      author: item.by || "unknown",
      source: "Hacker News",
      permalink: `https://news.ycombinator.com/item?id=${item.id}`,
      imageURL: null,
      score: item.score || 0,
      numComments: item.descendants || 0,
      createdUtc: item.time || 0,
      selftext: item.text ? decodeAndStripHtml(item.text).slice(0, 500) : "",
    }));
}

interface CategoryConfig {
  label: string;
  fetch: () => Promise<WorldPost[]>;
}

const CATEGORIES: Record<string, CategoryConfig> = {
  tech: { label: "Tech", fetch: fetchHackerNews },
  business: {
    label: "Business",
    fetch: () => fetchRssFeed("https://www.inc.com/rss/", "Inc.com"),
  },
  music: {
    label: "Music",
    fetch: () => fetchRssFeed("https://pitchfork.com/rss/news/", "Pitchfork"),
  },
  fashion: {
    label: "Fashion",
    fetch: () => fetchRssFeed("https://www.vogue.com/feed/rss", "Vogue"),
  },
  food: {
    label: "Food",
    fetch: () =>
      fetchRssFeed("https://www.bonappetit.com/feed/rss", "Bon Appétit"),
  },
  pets: {
    label: "Pets",
    fetch: () => fetchRssFeed("https://www.dogtime.com/feed", "DogTime"),
  },
  women: {
    label: "Women",
    fetch: () =>
      fetchRssFeed("https://www.refinery29.com/en-us/rss.xml", "Refinery29"),
  },
  credit: {
    label: "Credit",
    fetch: () =>
      fetchRssFeed("https://www.nerdwallet.com/blog/feed/", "NerdWallet"),
  },
  ai: {
    label: "AI Tools",
    fetch: () =>
      fetchRssFeed(
        "https://techcrunch.com/category/artificial-intelligence/feed/",
        "TechCrunch"
      ),
  },
};

export const CATEGORY_LIST = Object.entries(CATEGORIES).map(([id, c]) => ({
  id,
  label: c.label,
}));

async function fetchCategory(id: string): Promise<WorldPost[]> {
  const config = CATEGORIES[id];
  if (!config) return [];

  try {
    const posts = await config.fetch();
    return posts.map((p) => ({ ...p, category: id }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") || "all";

  if (category !== "all" && !CATEGORIES[category]) {
    return NextResponse.json(
      { posts: [], error: "Unknown category." },
      { status: 400 }
    );
  }

  const idsToFetch = category === "all" ? Object.keys(CATEGORIES) : [category];
  const results = await Promise.all(idsToFetch.map(fetchCategory));
  const posts = results.flat();
  posts.sort((a, b) => b.createdUtc - a.createdUtc);

  return NextResponse.json({ posts: posts.slice(0, 200) });
}
