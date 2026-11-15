import { SyndicatedNewsItem } from "./newsSyndication";
import { expandNewsToDeepReport } from "./newsExpander";
import { getSmartNewsCover, isValidCoverUrl } from "./newsImageResolver";
import { persistSyndicatedNewsBatchToCloud } from "./cloudEditorialService";

interface RssFeedChannel {
  url: string;
  category: string;
  sourceName: string;
}

const RSS_FEED_CHANNELS: RssFeedChannel[] = [
  // Futebol, Basquete e Outros Desportos: BeSoccer, 365Scores, TNT Sports
  {
    url: "https://www.bing.com/news/search?q=futebol+champions+league+besoccer&setlang=pt-BR&cc=BR&format=rss",
    category: "Futebol",
    sourceName: "BeSoccer",
  },
  {
    url: "https://www.bing.com/news/search?q=futebol+brasileirao+champions&setlang=pt-BR&cc=BR&format=rss",
    category: "Futebol",
    sourceName: "365Scores",
  },
  {
    url: "https://www.bing.com/news/search?q=futebol+europeu+champions+league&setlang=pt-BR&cc=BR&format=rss",
    category: "Futebol",
    sourceName: "TNT Sports",
  },
  {
    url: "https://www.bing.com/news/search?q=basquete+NBA+playoffs&setlang=pt-BR&cc=BR&format=rss",
    category: "Basquete",
    sourceName: "TNT Sports",
  },
  {
    url: "https://www.bing.com/news/search?q=NBA+Lakers+Celtics+basquete&setlang=pt-BR&cc=BR&format=rss",
    category: "Basquete",
    sourceName: "365Scores",
  },
  {
    url: "https://www.bing.com/news/search?q=Formula+1+GP&setlang=pt-BR&cc=BR&format=rss",
    category: "Desportos",
    sourceName: "TNT Sports",
  },
  {
    url: "https://www.bing.com/news/search?q=Tenis+ATP+WTA&setlang=pt-BR&cc=BR&format=rss",
    category: "Desportos",
    sourceName: "365Scores",
  },
  // Geopolítica: The New York Times, Euronews, Band
  {
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    category: "Geopolítica",
    sourceName: "The New York Times",
  },
  {
    url: "https://pt.euronews.com/rss",
    category: "Geopolítica",
    sourceName: "Euronews",
  },
  {
    url: "https://www.bing.com/news/search?q=Band+internacional&setlang=pt-BR&cc=BR&format=rss",
    category: "Geopolítica",
    sourceName: "Band",
  },
  // Anime e Mangá: Crunchyroll Notícias, Anime News Network
  {
    url: "https://cr-news-api-service.prd.crunchyrollsvc.com/v1/pt-BR/rss",
    category: "Animes",
    sourceName: "Crunchyroll Notícias",
  },
  {
    url: "https://www.bing.com/news/search?q=Manga+lancamento+anime&setlang=pt-BR&cc=BR&format=rss",
    category: "Mangás",
    sourceName: "Anime News Network",
  },
  // Tecnologia: TecMundo, Canaltech
  {
    url: "https://rss.tecmundo.com.br/feed",
    category: "Tecnologias",
    sourceName: "TecMundo",
  },
  {
    url: "https://canaltech.com.br/rss/",
    category: "Tecnologias",
    sourceName: "Canaltech",
  },
  // Moda: Vogue, ELLE Brasil, Nike, Adidas
  {
    url: "https://vogue.globo.com/rss/vogue/",
    category: "Moda",
    sourceName: "Vogue",
  },
  {
    url: "https://www.bing.com/news/search?q=site:elle.com.br&setlang=pt-BR&cc=BR&format=rss",
    category: "Moda",
    sourceName: "ELLE Brasil",
  },
  {
    url: "https://www.bing.com/news/search?q=nike+lancamento+tenis+moda&setlang=pt-BR&cc=BR&format=rss",
    category: "Moda",
    sourceName: "Nike News",
  },
  {
    url: "https://www.bing.com/news/search?q=adidas+originals+lancamento+moda&setlang=pt-BR&cc=BR&format=rss",
    category: "Moda",
    sourceName: "Adidas News",
  },
  // Jogos: MMORPGBR + Eurogamer, GameVicio, IGN Brasil
  {
    url: "https://www.bing.com/news/search?q=MMORPG+jogos&setlang=pt-BR&cc=BR&format=rss",
    category: "Games",
    sourceName: "MMORPGBR",
  },
  {
    url: "https://www.eurogamer.pt/feed",
    category: "Games",
    sourceName: "Eurogamer",
  },
  {
    url: "https://www.gamevicio.com/feed/",
    category: "Games",
    sourceName: "GameVicio",
  },
  {
    url: "https://www.bing.com/news/search?q=site:br.ign.com&setlang=pt-BR&cc=BR&format=rss",
    category: "Games",
    sourceName: "IGN Brasil",
  },
  // Cultura: BBC Culture, The Guardian Culture
  {
    url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
    category: "Cultura",
    sourceName: "BBC Culture",
  },
  {
    url: "https://www.theguardian.com/uk/culture/rss",
    category: "Cultura",
    sourceName: "The Guardian Culture",
  },
  // Webtoons: webtoon.com
  {
    url: "https://www.bing.com/news/search?q=webtoon+manhwa+solo+leveling&setlang=pt-BR&cc=BR&format=rss",
    category: "Webtoons",
    sourceName: "WEBTOON",
  },
];

function unwrapPublisherUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname.includes("bing.com") && parsed.searchParams.get("url")) {
      return parsed.searchParams.get("url")!;
    }
  } catch {}
  return rawUrl;
}

function extractCoverFromHtml(html: string): string | null {
  if (!html) return null;
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    const candidate = imgMatch[1].replace(/&amp;/g, "&").trim();
    if (isValidCoverUrl(candidate)) return candidate;
  }
  return null;
}

function stripHtmlAndPreserveParagraphs(rawHtml: string): string {
  if (!rawHtml) return "";
  return rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "\n\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|blockquote|li|article|section)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

function makeSlug(title: string, link: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 75);
  let hash = 0;
  for (let i = 0; i < link.length; i++) {
    hash = (hash << 5) - hash + link.charCodeAt(i);
    hash |= 0;
  }
  return `${base}-${Math.abs(hash)}`;
}

async function fetchChannelViaRss2Json(channel: RssFeedChannel): Promise<SyndicatedNewsItem[]> {
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(channel.url)}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(6500) });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== "ok" || !Array.isArray(data.items)) return [];

    return data.items
      .filter((item: any) => {
        const link = unwrapPublisherUrl(item.link || "");
        return !link.includes("/jogo/") && !link.includes("/achados/") && !link.includes("/tempo-real/");
      })
      .map((item: any) => {
        const rawTitle = (item.title || "").trim();
        const lastDash = rawTitle.lastIndexOf(" - ");
        const title = lastDash > 25 ? rawTitle.substring(0, lastDash).trim() : rawTitle;
        const link = unwrapPublisherUrl(item.link || "");
        const slug = makeSlug(title, link);
        const rawBody = stripHtmlAndPreserveParagraphs(item.content || item.description || "");
        const extractedImg =
          (isValidCoverUrl(item.enclosure?.link) ? item.enclosure.link : null) ||
          (isValidCoverUrl(item.thumbnail) ? item.thumbnail : null) ||
          extractCoverFromHtml(item.content || item.description || "");

        const coverUrl = getSmartNewsCover(title, channel.category, extractedImg);
        const pubDate = item.pubDate
          ? new Date(item.pubDate.replace(" ", "T") + "Z").toISOString()
          : new Date().toISOString();

        const enriched = expandNewsToDeepReport({
          id: `live-${slug}`,
          title,
          slug,
          content: rawBody,
          excerpt: rawBody.split("\n\n")[0]?.slice(0, 210) || title,
          category: channel.category,
          cover_url: coverUrl,
          published_at: isNaN(new Date(pubDate).getTime()) ? new Date().toISOString() : pubDate,
          source_name: channel.sourceName,
          author: channel.sourceName,
          is_syndicated: true,
        });

        return {
          ...enriched,
          created_at: enriched.published_at,
          author: channel.sourceName,
          source_url: link,
          is_syndicated: true,
        };
      });
  } catch {
    return [];
  }
}

export async function fetchLiveNewsFromAllChannels(): Promise<SyndicatedNewsItem[]> {
  try {
    const res = await fetch("/api/news/feed?topic=all&limit=100", {
      signal: AbortSignal.timeout(12000),
    });
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const mapped = data.items.map((it: any) => ({
          ...expandNewsToDeepReport(it),
          created_at: it.published_at || new Date().toISOString(),
          author: it.source_name || it.author || "Redação Worscoi",
          source_url: it.source_url,
          is_syndicated: true,
        }));
        void persistSyndicatedNewsBatchToCloud(mapped as any);
        return mapped;
      }
    }
  } catch {
    // Fallback to client-side rss2json
  }

  const results = await Promise.all(RSS_FEED_CHANNELS.map((ch) => fetchChannelViaRss2Json(ch)));
  const flat = results.flat();

  const seen = new Set<string>();
  const deduped: SyndicatedNewsItem[] = [];
  for (const item of flat) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (key.length > 5 && !seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  deduped.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  void persistSyndicatedNewsBatchToCloud(deduped as any);
  return deduped;
}
