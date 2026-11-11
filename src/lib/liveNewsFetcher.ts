import type { NewsItem } from "@/hooks/useCatalog";
import { getSmartNewsCover } from "./newsImageResolver";
import { expandNewsToDeepReport } from "./newsExpander";
import { slugifyEditorial } from "./editorialStore";

export interface FeedSource {
  url: string;
  category: string;
  source: string;
}

export const RSS_FEED_CHANNELS: Record<string, FeedSource[]> = {
  futebol: [
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/liga-dos-campeoes/", category: "Futebol", source: "UEFA Champions League" },
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-espanhol/", category: "Futebol", source: "La Liga" },
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-ingles/", category: "Futebol", source: "Premier League" },
  ],
  basquete: [
    { url: "https://ge.globo.com/rss/ge/basquete/nba/", category: "Basquete", source: "NBA Brasil" },
  ],
  mercado: [
    { url: "https://g1.globo.com/rss/g1/economia/", category: "Mercado", source: "G1 Economia" },
  ],
  politica: [
    { url: "https://g1.globo.com/rss/g1/politica/", category: "Política", source: "G1 Política" },
  ],
  ciencia: [
    { url: "https://g1.globo.com/rss/g1/ciencia-e-saude/", category: "Ciência", source: "G1 Ciência" },
  ],
  geografia: [
    { url: "https://g1.globo.com/rss/g1/natureza/", category: "Geografia", source: "G1 Natureza" },
  ],
  animes: [
    { url: "https://www.jbox.com.br/feed/", category: "Animes", source: "JBox" },
    { url: "https://www.otakupt.com/feed/", category: "Animes", source: "OtakuPT" },
    { url: "https://anmtv.com.br/feed/", category: "Animes", source: "AnMTV" },
  ],
  mangas: [
    { url: "https://animeunited.com.br/feed/", category: "Mangás", source: "Anime United" },
    { url: "https://www.otakupt.com/feed/", category: "Mangás", source: "OtakuPT" },
  ],
  games: [
    { url: "https://criticalhits.com.br/feed/", category: "Games", source: "Critical Hits" },
    { url: "https://www.adrenaline.com.br/rss/", category: "Games", source: "Adrenaline" },
  ],
  tecnologias: [
    { url: "https://tecnoblog.net/feed/", category: "Tecnologias", source: "Tecnoblog" },
    { url: "https://rss.tecmundo.com.br/feed", category: "Tecnologias", source: "TecMundo" },
  ],
  cultura: [
    { url: "https://legiaodosherois.com.br/feed", category: "Cultura", source: "Legião dos Heróis" },
    { url: "https://g1.globo.com/rss/g1/pop-arte/", category: "Cultura", source: "G1 Pop & Arte" },
  ],
  livros: [
    { url: "https://www.publishnews.com.br/rss/", category: "Livros", source: "PublishNews" },
  ],
};

function extractImageFromXmlItem(itemEl: Element, title: string, category: string): string {
  // 1. Enclosure
  const enclosure = itemEl.querySelector("enclosure");
  if (enclosure) {
    const url = enclosure.getAttribute("url");
    const type = enclosure.getAttribute("type") || "";
    if (url && (type.includes("image") || /\.(jpg|jpeg|png|webp|avif)/i.test(url))) {
      return url;
    }
  }

  // 2. Media content or thumbnail
  const mediaElements = Array.from(itemEl.getElementsByTagNameNS("*", "content")).concat(
    Array.from(itemEl.getElementsByTagNameNS("*", "thumbnail"))
  );
  for (const m of mediaElements) {
    const u = m.getAttribute("url");
    if (u && !/(1x1|spacer|tracking|pixel|feedburner|\.gif)/i.test(u)) {
      return u;
    }
  }

  // 3. Img in description or content:encoded
  const desc = itemEl.querySelector("description")?.textContent || "";
  const encoded = itemEl.getElementsByTagNameNS("*", "encoded")[0]?.textContent || "";
  const combinedHtml = `${desc} ${encoded}`;
  const imgMatch = combinedHtml.match(/<img[^>]+(?:src|data-src)=["'](https?:\/\/[^"'\s>]+)["']/i);
  if (imgMatch && imgMatch[1] && !/(1x1|spacer|pixel|emoji|\.gif)/i.test(imgMatch[1])) {
    return imgMatch[1].replace(/&amp;/g, "&");
  }

  // 4. Contextual smart cover generator
  return getSmartNewsCover(title, category);
}

function cleanHtmlText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch raw RSS text via resilient CORS proxies
 */
async function fetchRssFeedXml(feedUrl: string): Promise<string | null> {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(feedUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(feedUrl)}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && (text.includes("<rss") || text.includes("<feed") || text.includes("<channel"))) {
          return text;
        }
      }
    } catch {
      // Try next proxy
    }
  }

  return null;
}

/**
 * Client-side direct RSS parser: runs directly in the browser on Vercel or any static deployment.
 */
export async function fetchLiveNewsDirectFromRss(channelsLimit = 12): Promise<NewsItem[]> {
  if (typeof window === "undefined") return [];

  const topics = Object.keys(RSS_FEED_CHANNELS);
  const selectedFeeds: FeedSource[] = [];

  for (const t of topics) {
    const list = RSS_FEED_CHANNELS[t] || [];
    if (list.length > 0) {
      selectedFeeds.push(list[0]);
      if (list.length > 1 && selectedFeeds.length < channelsLimit) {
        selectedFeeds.push(list[1]);
      }
    }
  }

  const parser = new window.DOMParser();
  const allParsedItems: NewsItem[] = [];

  const promises = selectedFeeds.slice(0, channelsLimit).map(async (feed) => {
    try {
      const xmlText = await fetchRssFeedXml(feed.url);
      if (!xmlText) return [];

      const doc = parser.parseFromString(xmlText, "text/xml");
      const items = Array.from(doc.querySelectorAll("item, entry"));
      const feedItems: NewsItem[] = [];

      for (const itemEl of items.slice(0, 8)) {
        const title = (
          itemEl.querySelector("title")?.textContent || ""
        ).trim();
        if (!title || title.length < 5) continue;

        const link =
          itemEl.querySelector("link")?.textContent ||
          itemEl.querySelector("link")?.getAttribute("href") ||
          "";

        const pubDateRaw =
          itemEl.querySelector("pubDate")?.textContent ||
          itemEl.querySelector("published")?.textContent ||
          itemEl.querySelector("updated")?.textContent ||
          new Date().toISOString();

        const descRaw =
          itemEl.querySelector("description")?.textContent || "";
        const encodedRaw =
          itemEl.getElementsByTagNameNS("*", "encoded")[0]?.textContent || "";

        const cleanDesc = cleanHtmlText(descRaw);
        const cleanContent = cleanHtmlText(encodedRaw || descRaw);

        const slug = slugifyEditorial(title) || `news-${Date.now()}`;
        const cover_url = extractImageFromXmlItem(itemEl, title, feed.category);

        const parsedItem: NewsItem = {
          id: `live-${slug}-${Math.abs(title.length * 31)}`,
          title,
          slug,
          excerpt: cleanDesc.slice(0, 240) + "...",
          content: cleanContent || cleanDesc || title,
          cover_url,
          category: feed.category,
          published: true,
          published_at: new Date(pubDateRaw).toISOString(),
          author: `${feed.source} (Correspondente Worscoi)`,
          source_name: feed.source,
          source_url: link,
        } as any;

        // Enhance with deep journalistic structure
        feedItems.push(expandNewsToDeepReport(parsedItem) as unknown as NewsItem);
      }

      return feedItems;
    } catch {
      return [];
    }
  });

  const batches = await Promise.all(promises);
  for (const b of batches) {
    allParsedItems.push(...b);
  }

  return allParsedItems;
}
