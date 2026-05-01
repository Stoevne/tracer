/**
 * Schlanker RSS/Atom-Parser via fast-xml-parser.
 * Liefert ein normalisiertes Item-Format unabhängig vom Feed-Stil.
 */
import { XMLParser } from "fast-xml-parser";

export interface FeedItem {
  title: string;
  url: string;
  content: string | null;
  publishedAt: Date | null;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "_text",
  cdataPropName: "_cdata",
});

export async function fetchFeed(url: string): Promise<FeedItem[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "TracerBriefBot/1.0 (+https://tracer.molmed.eu) — editorial digest crawler",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
    },
    // Vercel-Cron: 30s soft-limit pro fetch
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const xml = await res.text();
  const tree = parser.parse(xml);

  // RSS 2.0
  if (tree?.rss?.channel) {
    const items = toArray(tree.rss.channel.item);
    return items.map(parseRssItem).filter(validItem);
  }
  // Atom
  if (tree?.feed) {
    const entries = toArray(tree.feed.entry);
    return entries.map(parseAtomEntry).filter(validItem);
  }
  return [];
}

function parseRssItem(item: unknown): FeedItem {
  const it = item as Record<string, unknown>;
  return {
    title: textOf(it.title) ?? "(untitled)",
    url: textOf(it.link) ?? "",
    content:
      textOf(it["content:encoded"]) ??
      textOf(it.description) ??
      null,
    publishedAt: parseDate(textOf(it.pubDate) ?? textOf(it["dc:date"])),
  };
}

function parseAtomEntry(entry: unknown): FeedItem {
  const it = entry as Record<string, unknown>;
  const linkRaw = it.link;
  let url = "";
  if (Array.isArray(linkRaw)) {
    const alt = linkRaw.find(
      (l: unknown) =>
        (l as Record<string, unknown>)?.["@_rel"] === "alternate" ||
        !(l as Record<string, unknown>)?.["@_rel"],
    );
    url =
      ((alt as Record<string, unknown>)?.["@_href"] as string) ??
      ((linkRaw[0] as Record<string, unknown>)?.["@_href"] as string) ??
      "";
  } else if (linkRaw && typeof linkRaw === "object") {
    url = ((linkRaw as Record<string, unknown>)["@_href"] as string) ?? "";
  } else if (typeof linkRaw === "string") {
    url = linkRaw;
  }
  return {
    title: textOf(it.title) ?? "(untitled)",
    url,
    content: textOf(it.content) ?? textOf(it.summary) ?? null,
    publishedAt: parseDate(textOf(it.published) ?? textOf(it.updated)),
  };
}

function textOf(node: unknown): string | null {
  if (node == null) return null;
  if (typeof node === "string") return node.trim() || null;
  if (typeof node === "number") return String(node);
  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o._cdata === "string") return o._cdata.trim() || null;
    if (typeof o._text === "string") return o._text.trim() || null;
    if (typeof o["#text"] === "string") return (o["#text"] as string).trim() || null;
  }
  return null;
}

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function validItem(it: FeedItem): boolean {
  return Boolean(it.title && it.url && /^https?:\/\//i.test(it.url));
}
