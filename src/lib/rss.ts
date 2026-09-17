import { XMLParser } from "fast-xml-parser";
import type { WorldPost } from "@/app/api/world/route";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeEntities(text: string) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, code) => {
    if (code[0] === "#") {
      const codePoint =
        code[1] === "x" || code[1] === "X"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return NAMED_ENTITIES[code] ?? match;
  });
}

function stripHtml(html: string) {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).trim();
}

type MediaRef = { "@_url"?: string } | { "@_url"?: string }[] | undefined;

function firstUrl(ref: MediaRef): string | null {
  const single = Array.isArray(ref) ? ref[0] : ref;
  return single?.["@_url"] || null;
}

function extractImage(item: Record<string, unknown>): string | null {
  const thumbnail = firstUrl(item["media:thumbnail"] as MediaRef);
  if (thumbnail) return thumbnail;

  const media = firstUrl(item["media:content"] as MediaRef);
  if (media) return media;

  const enclosure = item.enclosure as
    | { "@_url"?: string; "@_type"?: string }
    | undefined;
  if (enclosure?.["@_url"] && enclosure["@_type"]?.startsWith("image")) {
    return enclosure["@_url"];
  }

  const content = (item["content:encoded"] || item.description || "") as string;
  const match = /<img[^>]+src="([^"]+)"/.exec(content);
  return match ? match[1] : null;
}

export async function fetchRssFeed(
  url: string,
  sourceName: string
): Promise<WorldPost[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TexxSocialBot/1.0)" },
    next: { revalidate: 900 },
  });
  if (!res.ok) return [];

  const xml = await res.text();
  const parsed = parser.parse(xml);
  const items: Record<string, unknown>[] =
    parsed?.rss?.channel?.item || parsed?.feed?.entry || [];

  const list = Array.isArray(items) ? items : [items];

  return list.slice(0, 25).map((item, i) => {
    const title = stripHtml(String(item.title || ""));
    const link =
      typeof item.link === "string"
        ? item.link
        : (item.link as { "@_href"?: string })?.["@_href"] || "";
    const description = stripHtml(
      String(item.description || item.summary || "")
    );
    const pubDate = String(
      item.pubDate || item.published || item.updated || ""
    );
    const createdUtc = pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : 0;
    const creator = item["dc:creator"];
    const creatorName = Array.isArray(creator) ? creator[0] : creator;
    const author =
      (typeof creatorName === "string" ? creatorName : null) ||
      (typeof item.author === "object"
        ? ((item.author as { name?: string })?.name as string)
        : (item.author as string)) ||
      sourceName;

    return {
      id: `${sourceName}-${link || i}`,
      title,
      author,
      source: sourceName,
      permalink: link,
      imageURL: extractImage(item),
      score: 0,
      numComments: 0,
      createdUtc,
      selftext: description.slice(0, 300),
    };
  });
}
