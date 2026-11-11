import Parser from "rss-parser";

const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 WorscoiNewsBot/4.0",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
      ["content:encoded", "contentEncoded"],
    ],
  },
  timeout: 8000,
});

interface FeedSource {
  url: string;
  category: string;
  source: string;
}

const PRIMARY_FEEDS: Record<string, FeedSource[]> = {
  all: [
    { url: "https://g1.globo.com/rss/g1/economia/", category: "Mercado", source: "G1 Economia" },
    { url: "https://g1.globo.com/rss/g1/politica/", category: "Política", source: "G1 Política" },
    { url: "https://g1.globo.com/rss/g1/ciencia-e-saude/", category: "Ciência", source: "G1 Ciência" },
    { url: "https://g1.globo.com/rss/g1/natureza/", category: "Geografia", source: "G1 Natureza & Clima" },
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/liga-dos-campeoes/", category: "Futebol", source: "UEFA Champions League" },
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-espanhol/", category: "Futebol", source: "La Liga • Espanha" },
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-ingles/", category: "Futebol", source: "Premier League • Inglaterra" },
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-alemao/", category: "Futebol", source: "Bundesliga • Alemanha" },
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-italiano/", category: "Futebol", source: "Serie A • Itália" },
    { url: "https://www.jbox.com.br/feed/", category: "Animes", source: "JBox" },
    { url: "https://www.otakupt.com/feed/", category: "Animes", source: "OtakuPT" },
    { url: "https://anmtv.com.br/feed/", category: "Animes", source: "AnMTV" },
    { url: "https://animeunited.com.br/feed/", category: "Mangás", source: "Anime United" },
    { url: "https://legiaodosherois.com.br/feed", category: "Cultura", source: "Legião dos Heróis" },
    { url: "https://criticalhits.com.br/feed/", category: "Games", source: "Critical Hits" },
    { url: "https://tecnoblog.net/feed/", category: "Tecnologias", source: "Tecnoblog" },
    { url: "https://www.adrenaline.com.br/rss/", category: "Games", source: "Adrenaline" },
    { url: "https://rss.tecmundo.com.br/feed", category: "Tecnologias", source: "TecMundo" },
    { url: "https://www.publishnews.com.br/rss/", category: "Livros", source: "PublishNews" },
  ],
  futebol: [
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/liga-dos-campeoes/", category: "Futebol", source: "UEFA Champions League" },
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-espanhol/", category: "Futebol", source: "La Liga" },
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-ingles/", category: "Futebol", source: "Premier League" },
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-alemao/", category: "Futebol", source: "Bundesliga" },
    { url: "https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-italiano/", category: "Futebol", source: "Serie A" },
    { url: "https://trivela.com.br/feed/", category: "Futebol", source: "Trivela Futebol Europeu" },
  ],
  basquete: [
    { url: "https://ge.globo.com/rss/ge/basquete/nba/", category: "Basquete", source: "NBA Brasil" },
    { url: "https://ge.globo.com/rss/ge/basquete/", category: "Basquete", source: "Basquete GE" },
  ],
  mercado: [
    { url: "https://g1.globo.com/rss/g1/economia/", category: "Mercado", source: "G1 Economia" },
    { url: "https://www.infomoney.com.br/feed/", category: "Mercado", source: "InfoMoney" },
  ],
  politica: [
    { url: "https://g1.globo.com/rss/g1/politica/", category: "Política", source: "G1 Política" },
  ],
  ciencia: [
    { url: "https://g1.globo.com/rss/g1/ciencia-e-saude/", category: "Ciência", source: "G1 Ciência" },
    { url: "https://tecnoblog.net/feed/", category: "Ciência", source: "Tecnoblog Ciência" },
  ],
  geografia: [
    { url: "https://g1.globo.com/rss/g1/natureza/", category: "Geografia", source: "G1 Natureza & Clima" },
  ],
  virais: [
    { url: "https://tecnoblog.net/feed/", category: "Virais", source: "Tecnoblog Internet" },
    { url: "https://g1.globo.com/rss/g1/pop-arte/", category: "Virais", source: "G1 Pop & Trends" },
  ],
  listas: [
    { url: "https://legiaodosherois.com.br/feed", category: "Listas", source: "Legião Rankings" },
    { url: "https://criticalhits.com.br/feed/", category: "Listas", source: "Critical Hits Top 10" },
  ],
  animes: [
    { url: "https://www.jbox.com.br/feed/", category: "Animes", source: "JBox" },
    { url: "https://www.otakupt.com/feed/", category: "Animes", source: "OtakuPT" },
    { url: "https://anmtv.com.br/feed/", category: "Animes", source: "AnMTV" },
  ],
  mangas: [
    { url: "https://animeunited.com.br/feed/", category: "Mangás", source: "Anime United" },
    { url: "https://www.otakupt.com/feed/", category: "Mangás", source: "OtakuPT" },
    { url: "https://www.jbox.com.br/feed/", category: "Mangás", source: "JBox" },
  ],
  webtoons: [
    { url: "https://www.otakupt.com/feed/", category: "Webtoons", source: "OtakuPT" },
    { url: "https://anmtv.com.br/feed/", category: "Webtoons", source: "AnMTV" },
    { url: "https://animeunited.com.br/feed/", category: "Webtoons", source: "Anime United" },
  ],
  games: [
    { url: "https://criticalhits.com.br/feed/", category: "Games", source: "Critical Hits" },
    { url: "https://www.adrenaline.com.br/rss/", category: "Games", source: "Adrenaline" },
    { url: "https://www.otakupt.com/feed/", category: "Games", source: "OtakuPT" },
  ],
  tecnologias: [
    { url: "https://tecnoblog.net/feed/", category: "Tecnologias", source: "Tecnoblog" },
    { url: "https://rss.tecmundo.com.br/feed", category: "Tecnologias", source: "TecMundo" },
    { url: "https://g1.globo.com/rss/g1/tecnologia/", category: "Tecnologias", source: "G1 Tecnologia" },
  ],
  cultura: [
    { url: "https://legiaodosherois.com.br/feed", category: "Cultura", source: "Legião dos Heróis" },
    { url: "https://g1.globo.com/rss/g1/pop-arte/", category: "Cultura", source: "G1 Pop & Arte" },
    { url: "https://www.jbox.com.br/feed/", category: "Cultura", source: "JBox" },
  ],
  livros: [
    { url: "https://www.publishnews.com.br/rss/", category: "Livros", source: "PublishNews" },
  ],
};

const THEMATIC_COVERS: Record<string, string[]> = {
  Futebol: [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&auto=format&fit=crop&q=80",
  ],
  Basquete: [
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=1200&auto=format&fit=crop&q=80",
  ],
  Mercado: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
  ],
  Virais: [
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
  ],
  Listas: [
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507842229450-799042b314a5?w=1200&auto=format&fit=crop&q=80",
  ],
  Política: [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&auto=format&fit=crop&q=80",
  ],
  Geografia: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
  ],
  Ciência: [
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80",
  ],
  Animes: [
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80",
  ],
  Mangás: [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
  ],
  Webtoons: [
    "/covers/webtoons/solo-leveling-cover.jpg",
    "/covers/webtoons/orv-cover.jpg",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
  ],
  Games: [
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop&q=80",
  ],
  Tecnologias: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&auto=format&fit=crop&q=80",
  ],
  Cultura: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
  ],
  Livros: [
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80",
  ],
};

function extractRealImage(item: any, title: string, cat: string): string {
  // 1. Enclosure
  if (
    item.enclosure?.url &&
    (item.enclosure.type?.includes("image") || /\.(jpg|jpeg|png|webp|avif)/i.test(item.enclosure.url)) &&
    !/(1x1|spacer|tracking|pixel|feedburner|emoji|\.gif)/i.test(item.enclosure.url)
  ) {
    return item.enclosure.url;
  }

  // 2. Media content or thumbnail
  const mediaCandidates = [
    ...(Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent]),
    ...(Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail : [item.mediaThumbnail]),
    ...(Array.isArray(item["media:content"]) ? item["media:content"] : [item["media:content"]]),
    ...(Array.isArray(item["media:thumbnail"]) ? item["media:thumbnail"] : [item["media:thumbnail"]]),
  ].filter(Boolean);

  for (const med of mediaCandidates) {
    const url = med?.url || med?.$?.url || med?.attributes?.url || (typeof med === "string" ? med : null);
    if (
      url &&
      typeof url === "string" &&
      url.startsWith("http") &&
      !/(1x1|spacer|tracking|pixel|feedburner|emoji|\.gif)/i.test(url)
    ) {
      return url.replace(/&amp;/g, "&");
    }
  }

  // 3. Search HTML for first genuine <img> tag
  const rawHtml =
    (item.contentEncoded || item["content:encoded"] || "") +
    " " +
    (item.content || "") +
    " " +
    (item.description || "");
  const matches = rawHtml.matchAll(/<img[^>]+(?:src|data-src)=["'](https?:\/\/[^"'\s>]+)["']/gi);
  for (const m of matches) {
    let url = m[1].replace(/&amp;/g, "&");
    if (!/gravatar\.com|emoji|icon|pixel|feedburner|spacer|tracking|1x1|\.gif/i.test(url)) {
      if (url.includes("infomoney.com.br") && url.includes("fit=300")) {
        url = url.split("?")[0];
      }
      if (url.includes("anmtv.com.br") && url.includes("resize=600")) {
        url = url.replace(/resize=600%2C300/g, "fit=1280%2C720");
      }
      return url;
    }
  }

  // 4. Deterministic contextual pool
  let hash = 0;
  for (let i = 0; i < (title || "").length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const pool = THEMATIC_COVERS[cat] || THEMATIC_COVERS.Cultura;
  return pool[Math.abs(hash) % pool.length];
}

function cleanContent(raw: string): { content: string; excerpt: string; readTime: number } {
  const cleaned = (raw || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    .replace(/<p[^>]*>/gi, "\n\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n\n### $1\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n• $1")
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '\n\n> "$1"\n\n')
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&ccedil;/g, "ç")
    .replace(/&atilde;/g, "ã")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&aacute;/g, "á")
    .replace(/&ecirc;/g, "ê")
    .replace(/&ocirc;/g, "ô");

  const paragraphs = cleaned
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 25 && !/^(the post|o post|fonte:|saiba mais|confira também|leia também|assine)/i.test(p));

  const content = paragraphs.join("\n\n");
  const excerpt = paragraphs[0]
    ? paragraphs[0].slice(0, 220) + (paragraphs[0].length > 220 ? "..." : "")
    : "";
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 180));

  return { content, excerpt, readTime };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers?.host || "localhost"}`);
  const topic = (url.searchParams.get("topic") || "all").toLowerCase();
  const limit = Math.min(80, Math.max(5, parseInt(url.searchParams.get("limit") || "35", 10)));

  const sources = PRIMARY_FEEDS[topic] || PRIMARY_FEEDS.all;
  const rawBatches = await Promise.all(
    sources.map(async (src) => {
      try {
        const feed = await parser.parseURL(src.url);
        return (feed.items || []).slice(0, 10).map((it) => {
          const rawTitle = (it.title || "").trim();
          const lastDash = rawTitle.lastIndexOf(" - ");
          const title = lastDash > 0 ? rawTitle.substring(0, lastDash).trim() : rawTitle;
          const sourceName = src.source;

          const slug =
            slugify(title) +
            "-" +
            Math.abs(it.link?.split("").reduce((a: number, b: string) => (a << 5) - a + b.charCodeAt(0), 0) || 1);

          const cover_url = extractRealImage(it, title, src.category);
          const rawBody = (it as any).contentEncoded || (it as any)["content:encoded"] || it.content || it.contentSnippet || it.description || title;
          const { content, excerpt, readTime } = cleanContent(rawBody);

          return {
            id: `feed-${slug}`,
            title,
            slug,
            excerpt: excerpt || (content.slice(0, 200) + "..."),
            content: content || excerpt || title,
            cover_url,
            category: src.category,
            published: true,
            published_at: it.isoDate || it.pubDate || new Date().toISOString(),
            created_at: it.isoDate || it.pubDate || new Date().toISOString(),
            author: sourceName,
            source_name: sourceName,
            source_url: it.link || "",
            read_time: readTime,
            is_syndicated: true,
          };
        });
      } catch {
        return [];
      }
    })
  );

  const seen = new Set<string>();
  const items: any[] = [];
  for (const b of rawBatches) {
    for (const item of b) {
      if (!item.title) continue;
      const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!seen.has(norm) && norm.length > 5) {
        seen.add(norm);
        items.push(item);
      }
    }
  }

  items.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  res.statusCode = 200;
  res.end(JSON.stringify({ items: items.slice(0, limit), count: items.length, topic }));
}
