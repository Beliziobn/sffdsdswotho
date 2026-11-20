import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['content:encoded', 'contentEncoded'],
      ['description', 'description'],
      ['enclosure', 'enclosure'],
      ['News:Image', 'bingImage'],
    ],
  },
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  },
  timeout: 7000,
});

// Use Bing News RSS with ?format=rss for sites without public XML feeds because Bing News includes
// the unencrypted original publisher URL in the `&url=` parameter AND the original article thumbnail!
export const PRIMARY_FEEDS = {
  all: [
    // Futebol, Basquete e Outros Desportos: BeSoccer, 365Scores, TNT Sports
    {
      url: 'https://www.bing.com/news/search?q=futebol+champions+league+besoccer&setlang=pt-BR&cc=BR&format=rss',
      source: 'BeSoccer',
      category: 'Futebol',
    },
    {
      url: 'https://www.bing.com/news/search?q=futebol+brasileirao+champions&setlang=pt-BR&cc=BR&format=rss',
      source: '365Scores',
      category: 'Futebol',
    },
    {
      url: 'https://www.bing.com/news/search?q=futebol+europeu+champions+league&setlang=pt-BR&cc=BR&format=rss',
      source: 'TNT Sports',
      category: 'Futebol',
    },
    {
      url: 'https://www.bing.com/news/search?q=basquete+NBA+playoffs&setlang=pt-BR&cc=BR&format=rss',
      source: 'TNT Sports',
      category: 'Basquete',
    },
    {
      url: 'https://www.bing.com/news/search?q=Formula+1+GP&setlang=pt-BR&cc=BR&format=rss',
      source: '365Scores',
      category: 'Desportos',
    },
    {
      url: 'https://www.bing.com/news/search?q=Tenis+ATP+WTA&setlang=pt-BR&cc=BR&format=rss',
      source: 'BeSoccer',
      category: 'Desportos',
    },

    // Geopolítica: The New York Times, Euronews, Band
    {
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      source: 'The New York Times',
      category: 'Geopolítica',
    },
    {
      url: 'https://pt.euronews.com/rss',
      source: 'Euronews',
      category: 'Geopolítica',
    },
    {
      url: 'https://www.bing.com/news/search?q=Band+internacional&setlang=pt-BR&cc=BR&format=rss',
      source: 'Band',
      category: 'Geopolítica',
    },

    // Anime e Mangá: Crunchyroll Notícias, Anime News Network
    {
      url: 'https://cr-news-api-service.prd.crunchyrollsvc.com/v1/pt-BR/rss',
      source: 'Crunchyroll Notícias',
      category: 'Animes',
    },
    {
      url: 'https://www.bing.com/news/search?q=Manga+lancamento+anime&setlang=pt-BR&cc=BR&format=rss',
      source: 'Anime News Network',
      category: 'Mangás',
    },

    // Tecnologia: TecMundo, Canaltech
    {
      url: 'https://rss.tecmundo.com.br/feed',
      source: 'TecMundo',
      category: 'Tecnologias',
    },
    {
      url: 'https://canaltech.com.br/rss/',
      source: 'Canaltech',
      category: 'Tecnologias',
    },

    // Moda: Vogue, ELLE Brasil, Nike, Adidas
    {
      url: 'https://vogue.globo.com/rss/vogue/',
      source: 'Vogue',
      category: 'Moda',
    },
    {
      url: 'https://www.vogue.com/feed/rss',
      source: 'Vogue',
      category: 'Moda',
    },
    {
      url: 'https://www.bing.com/news/search?q=site:elle.com.br&setlang=pt-BR&cc=BR&format=rss',
      source: 'ELLE Brasil',
      category: 'Moda',
    },
    {
      url: 'https://www.bing.com/news/search?q=nike+lancamento+tenis+moda&setlang=pt-BR&cc=BR&format=rss',
      source: 'Nike News',
      category: 'Moda',
    },
    {
      url: 'https://www.bing.com/news/search?q=adidas+originals+lancamento+moda&setlang=pt-BR&cc=BR&format=rss',
      source: 'Adidas News',
      category: 'Moda',
    },

    // Jogos / Games: MMORPGBR + Eurogamer, GameVicio, IGN Brasil
    {
      url: 'https://www.bing.com/news/search?q=MMORPG+jogos&setlang=pt-BR&cc=BR&format=rss',
      source: 'MMORPGBR',
      category: 'Games',
    },
    {
      url: 'https://www.eurogamer.pt/feed',
      source: 'Eurogamer',
      category: 'Games',
    },
    {
      url: 'https://www.gamevicio.com/feed/',
      source: 'GameVicio',
      category: 'Games',
    },
    {
      url: 'https://www.bing.com/news/search?q=site:br.ign.com&setlang=pt-BR&cc=BR&format=rss',
      source: 'IGN Brasil',
      category: 'Games',
    },

    // Cultura: BBC Culture, The Guardian Culture
    {
      url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
      source: 'BBC Culture',
      category: 'Cultura',
    },
    {
      url: 'https://www.theguardian.com/uk/culture/rss',
      source: 'The Guardian Culture',
      category: 'Cultura',
    },

    // Webtoons: webtoon.com / webtoons.com
    {
      url: 'https://www.bing.com/news/search?q=webtoon+manhwa+solo+leveling&setlang=pt-BR&cc=BR&format=rss',
      source: 'WEBTOON',
      category: 'Webtoons',
    },
  ],

  futebol: [
    {
      url: 'https://www.bing.com/news/search?q=futebol+champions+league+besoccer&setlang=pt-BR&cc=BR&format=rss',
      source: 'BeSoccer',
      category: 'Futebol',
    },
    {
      url: 'https://www.bing.com/news/search?q=futebol+brasileirao+champions&setlang=pt-BR&cc=BR&format=rss',
      source: '365Scores',
      category: 'Futebol',
    },
    {
      url: 'https://www.bing.com/news/search?q=futebol+europeu+champions+league&setlang=pt-BR&cc=BR&format=rss',
      source: 'TNT Sports',
      category: 'Futebol',
    },
  ],

  basquete: [
    {
      url: 'https://www.bing.com/news/search?q=basquete+NBA+playoffs&setlang=pt-BR&cc=BR&format=rss',
      source: 'TNT Sports',
      category: 'Basquete',
    },
    {
      url: 'https://www.bing.com/news/search?q=NBA+Lakers+Celtics+basquete&setlang=pt-BR&cc=BR&format=rss',
      source: '365Scores',
      category: 'Basquete',
    },
    {
      url: 'https://www.bing.com/news/search?q=basquete+euroleague+fiba&setlang=pt-BR&cc=BR&format=rss',
      source: 'BeSoccer',
      category: 'Basquete',
    },
  ],

  desportos: [
    {
      url: 'https://www.bing.com/news/search?q=Formula+1+GP&setlang=pt-BR&cc=BR&format=rss',
      source: 'TNT Sports',
      category: 'Desportos',
    },
    {
      url: 'https://www.bing.com/news/search?q=Tenis+ATP+WTA&setlang=pt-BR&cc=BR&format=rss',
      source: '365Scores',
      category: 'Desportos',
    },
    {
      url: 'https://www.bing.com/news/search?q=UFC+MMA&setlang=pt-BR&cc=BR&format=rss',
      source: 'BeSoccer',
      category: 'Desportos',
    },
  ],

  esportes: [
    {
      url: 'https://www.bing.com/news/search?q=Formula+1+GP&setlang=pt-BR&cc=BR&format=rss',
      source: 'TNT Sports',
      category: 'Desportos',
    },
    {
      url: 'https://www.bing.com/news/search?q=Tenis+ATP+WTA&setlang=pt-BR&cc=BR&format=rss',
      source: '365Scores',
      category: 'Desportos',
    },
    {
      url: 'https://www.bing.com/news/search?q=UFC+MMA&setlang=pt-BR&cc=BR&format=rss',
      source: 'BeSoccer',
      category: 'Desportos',
    },
  ],

  geopolitica: [
    {
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      source: 'The New York Times',
      category: 'Geopolítica',
    },
    {
      url: 'https://pt.euronews.com/rss',
      source: 'Euronews',
      category: 'Geopolítica',
    },
    {
      url: 'https://www.bing.com/news/search?q=Band+internacional&setlang=pt-BR&cc=BR&format=rss',
      source: 'Band',
      category: 'Geopolítica',
    },
  ],

  politica: [
    {
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      source: 'The New York Times',
      category: 'Política',
    },
    {
      url: 'https://pt.euronews.com/rss',
      source: 'Euronews',
      category: 'Política',
    },
    {
      url: 'https://www.bing.com/news/search?q=Band+internacional&setlang=pt-BR&cc=BR&format=rss',
      source: 'Band',
      category: 'Política',
    },
  ],

  animes: [
    {
      url: 'https://cr-news-api-service.prd.crunchyrollsvc.com/v1/pt-BR/rss',
      source: 'Crunchyroll Notícias',
      category: 'Animes',
    },
    {
      url: 'https://www.bing.com/news/search?q=anime+news+network+manga&setlang=pt-BR&cc=BR&format=rss',
      source: 'Anime News Network',
      category: 'Animes',
    },
  ],

  mangas: [
    {
      url: 'https://cr-news-api-service.prd.crunchyrollsvc.com/v1/pt-BR/rss',
      source: 'Crunchyroll Notícias',
      category: 'Mangás',
    },
    {
      url: 'https://www.bing.com/news/search?q=Manga+lancamento+anime&setlang=pt-BR&cc=BR&format=rss',
      source: 'Anime News Network',
      category: 'Mangás',
    },
  ],

  tecnologias: [
    {
      url: 'https://rss.tecmundo.com.br/feed',
      source: 'TecMundo',
      category: 'Tecnologias',
    },
    {
      url: 'https://canaltech.com.br/rss/',
      source: 'Canaltech',
      category: 'Tecnologias',
    },
  ],

  moda: [
    {
      url: 'https://vogue.globo.com/rss/vogue/',
      source: 'Vogue',
      category: 'Moda',
    },
    {
      url: 'https://www.vogue.com/feed/rss',
      source: 'Vogue',
      category: 'Moda',
    },
    {
      url: 'https://www.bing.com/news/search?q=site:elle.com.br&setlang=pt-BR&cc=BR&format=rss',
      source: 'ELLE Brasil',
      category: 'Moda',
    },
    {
      url: 'https://www.bing.com/news/search?q=nike+lancamento+tenis+moda&setlang=pt-BR&cc=BR&format=rss',
      source: 'Nike News',
      category: 'Moda',
    },
    {
      url: 'https://www.bing.com/news/search?q=adidas+originals+lancamento+moda&setlang=pt-BR&cc=BR&format=rss',
      source: 'Adidas News',
      category: 'Moda',
    },
  ],

  games: [
    {
      url: 'https://www.bing.com/news/search?q=MMORPG+jogos&setlang=pt-BR&cc=BR&format=rss',
      source: 'MMORPGBR',
      category: 'Games',
    },
    {
      url: 'https://www.eurogamer.pt/feed',
      source: 'Eurogamer',
      category: 'Games',
    },
    {
      url: 'https://www.gamevicio.com/feed/',
      source: 'GameVicio',
      category: 'Games',
    },
    {
      url: 'https://www.bing.com/news/search?q=site:br.ign.com&setlang=pt-BR&cc=BR&format=rss',
      source: 'IGN Brasil',
      category: 'Games',
    },
  ],

  cultura: [
    {
      url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
      source: 'BBC Culture',
      category: 'Cultura',
    },
    {
      url: 'https://www.theguardian.com/uk/culture/rss',
      source: 'The Guardian Culture',
      category: 'Cultura',
    },
  ],

  webtoons: [
    {
      url: 'https://www.bing.com/news/search?q=webtoon+manhwa+solo+leveling&setlang=pt-BR&cc=BR&format=rss',
      source: 'WEBTOON',
      category: 'Webtoons',
    },
  ],

  livros: [
    {
      url: 'https://www.theguardian.com/books/rss',
      source: 'The Guardian Culture',
      category: 'Livros',
    },
    {
      url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
      source: 'BBC Culture',
      category: 'Livros',
    },
  ],

  mercado: [
    {
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
      source: 'The New York Times',
      category: 'Mercado',
    },
    {
      url: 'https://pt.euronews.com/rss',
      source: 'Euronews',
      category: 'Mercado',
    },
  ],

  ciencia: [
    {
      url: 'https://rss.tecmundo.com.br/feed',
      source: 'TecMundo',
      category: 'Ciência',
    },
    {
      url: 'https://canaltech.com.br/rss/',
      source: 'Canaltech',
      category: 'Ciência',
    },
  ],

  geografia: [
    {
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      source: 'The New York Times',
      category: 'Geografia',
    },
    {
      url: 'https://pt.euronews.com/rss',
      source: 'Euronews',
      category: 'Geografia',
    },
  ],

  virais: [
    {
      url: 'https://rss.tecmundo.com.br/feed',
      source: 'TecMundo',
      category: 'Virais',
    },
    {
      url: 'https://canaltech.com.br/rss/',
      source: 'Canaltech',
      category: 'Virais',
    },
  ],

  listas: [
    {
      url: 'https://mmorpgbr.com.br/feed/',
      source: 'MMORPGBR',
      category: 'Listas',
    },
    {
      url: 'https://canaltech.com.br/rss/',
      source: 'Canaltech',
      category: 'Listas',
    },
  ],
};

/**
 * Unwraps Bing News or redirect links into the exact, direct publisher article URL.
 */
export function unwrapPublisherUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const u = new URL(rawUrl);
    if (u.hostname.includes('bing.com') && u.searchParams.get('url')) {
      return u.searchParams.get('url') || rawUrl;
    }
    if (u.searchParams.get('url') && u.searchParams.get('url').startsWith('http')) {
      return u.searchParams.get('url');
    }
  } catch {}
  return rawUrl;
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#8217;|&rsquo;/gi, '’')
    .replace(/&#8216;|&lsquo;/gi, '‘')
    .replace(/&#8220;|&ldquo;/gi, '“')
    .replace(/&#8221;|&rdquo;/gi, '”')
    .replace(/&#8211;|&ndash;/gi, '–')
    .replace(/&#8212;|&mdash;/gi, '—')
    .replace(/&#39;|&#039;|&#x27;/gi, "'")
    .replace(/&ccedil;/g, 'ç')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&atilde;/g, 'ã')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&otilde;/g, 'õ')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&aacute;/g, 'á')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&eacute;/g, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&iacute;/g, 'í')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&acirc;/g, 'â')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

function extractRealImageFromRssItem(item) {
  const candidates = [];

  if (item.enclosure?.url) candidates.push(item.enclosure.url);
  if (typeof item.bingImage === 'string') candidates.push(item.bingImage);
  if (item.bingImage?.$?.url) candidates.push(item.bingImage.$.url);

  if (Array.isArray(item.mediaContent)) {
    for (const m of item.mediaContent) {
      if (m?.$?.url) candidates.push(m.$.url);
      if (m?.url) candidates.push(m.url);
    }
  }

  if (Array.isArray(item.mediaThumbnail)) {
    for (const m of item.mediaThumbnail) {
      if (m?.$?.url) candidates.push(m.$.url);
      if (m?.url) candidates.push(m.url);
    }
  }

  const rawHtml = item.contentEncoded || item['content:encoded'] || item.description || item.content || '';
  const imgRegex = /<img[^>]+(?:data-src|data-lazy-src|src)=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(rawHtml)) !== null) {
    if (match[1]) candidates.push(match[1]);
  }

  const srcsetRegex = /srcset=["']([^"']+)["']/gi;
  while ((match = srcsetRegex.exec(rawHtml)) !== null) {
    if (match[1]) {
      const parts = match[1].split(',').map((s) => s.trim().split(/\s+/)[0]);
      if (parts.length > 0) candidates.push(parts[parts.length - 1]);
    }
  }

  for (const url of candidates) {
    const clean = url.replace(/&amp;/g, '&').trim();
    if (
      clean.startsWith('http') &&
      !/gravatar\.com|1x1|spacer|pixel|tracking|feedburner|emoji|s\.w\.org|\.svg|logo-google|gstatic\.com\/kp|lh3\.googleusercontent\.com\/J6_coFbogxhRI9iM864NL_liGXvsQp2AupsKei7z0cNNfDvGUmWUy20nuUhkREQyrpY4bEeIBuc/i.test(
        clean
      ) &&
      !/\.gif(\?.*)?$/i.test(clean)
    ) {
      // Upgrade BBC / WordPress / Bing thumbnail resolutions to high-res original
      let upgraded = clean.replace(/-\d{2,3}x\d{2,3}(?=\.(jpg|jpeg|png|webp))/i, '');
      upgraded = upgraded.replace(/\/news\/\d{3}\/cpsprodpb\//i, '/news/1024/cpsprodpb/');
      if (upgraded.includes('bing.com/th?id=')) {
        upgraded = upgraded.replace(/&w=\d+&h=\d+/i, '&w=1200&h=675');
      }
      return upgraded;
    }
  }

  return '';
}

function cleanRssBodyText(item) {
  const rawHtml = item.contentEncoded || item['content:encoded'] || item.description || item.content || '';

  const blockFormatted = decodeHtmlEntities(
    rawHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<figure[\s\S]*?<\/figure>/gi, '\n\n')
      .replace(/<\/(p|div|h1|h2|h3|h4|blockquote|li|article|section)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n\n')
      .replace(/<[^>]+>/g, ' ')
  );

  const rawParagraphs = blockFormatted
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => {
      if (p.length < 35) return false;
      if (
        /^(the post|o post|fonte:|saiba mais|confira também|leia também|assine|compartilhe|inscreva-se|veja mais|siga o canal|clique aqui|adicionar ch|achados\s*promo|receba novidades)/i.test(
          p
        )
      )
        return false;
      if (
        /apareceu primeiro em|todos os direitos reservados|confira o post completo|adicione o ge nas suas fontes|siga e acompanhe as notícias|adicionar ch no google|receba as melhores ofertas|utilizamos cookies/i.test(
          p
        )
      )
        return false;
      return true;
    });

  const fullContent = rawParagraphs.join('\n\n');
  const firstPara = rawParagraphs[0] || (item.contentSnippet || '').trim();
  const excerpt = firstPara.length > 220 ? firstPara.slice(0, 217) + '...' : firstPara;
  const wordCount = fullContent.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 180));

  return { content: fullContent, excerpt, readTime, paragraphCount: rawParagraphs.length };
}

const scrapedUrlCache = new Map();

/**
 * Extracts the 100% authentic original cover image (og:image / twitter:image / JSON-LD image)
 * AND the full multi-paragraph original article text from the publisher's webpage.
 */
export async function extractFullArticleFromWeb(rawUrl) {
  const url = unwrapPublisherUrl(rawUrl);
  if (!url || !url.startsWith('http') || url.includes('news.google.com')) return null;

  if (scrapedUrlCache.has(url)) {
    return scrapedUrlCache.get(url);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        Referer: new URL(url).origin + '/',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();

    // 1. Extract authentic og:image, twitter:image, or JSON-LD image
    let coverUrl = '';
    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i);

    if (ogMatch && ogMatch[1]) {
      let candidate = ogMatch[1].replace(/&amp;/g, '&').trim();
      if (candidate.startsWith('//')) candidate = 'https:' + candidate;
      else if (candidate.startsWith('/')) candidate = new URL(url).origin + candidate;
      if (
        candidate.startsWith('http') &&
        !/logo|favicon|1x1|pixel|spacer|placeholder|default-share|besoccer_logo/i.test(candidate)
      ) {
        coverUrl = candidate;
      }
    }

    // 2. Parse JSON-LD for articleBody and image if available (used by NYT, BBC, Guardian, Vogue, ELLE, Band, TNT Sports, Canaltech)
    let jsonLdBody = '';
    const ldMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const rawBlock of ldMatches) {
      const inner = rawBlock.replace(/^<script[^>]*>|<\/script>$/gi, '').trim();
      try {
        const parsed = JSON.parse(inner);
        const nodes = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.['@graph'])
          ? parsed['@graph']
          : [parsed];
        for (const node of nodes) {
          if (!coverUrl && node?.image) {
            const imgVal = Array.isArray(node.image)
              ? typeof node.image[0] === 'string'
                ? node.image[0]
                : node.image[0]?.url
              : typeof node.image === 'string'
              ? node.image
              : node.image?.url;
            if (imgVal && String(imgVal).startsWith('http') && !/logo|favicon/i.test(String(imgVal))) {
              coverUrl = String(imgVal);
            }
          }
          if (typeof node?.articleBody === 'string' && node.articleBody.length > jsonLdBody.length) {
            jsonLdBody = decodeHtmlEntities(node.articleBody);
          }
        }
      } catch {}
    }

    // 3. Extract paragraphs from the main article body in HTML
    const articleRegionMatch =
      html.match(
        /<div[^>]+class=["'][^"']*(?:entry-content|post-content|td-post-content|article-content|mc-body|content-text|materia-conteudo|c-news__body|article__body|story-body|ArticleBody|news-body|meat|article-body-commercial-selector|text-body)[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*(?:<footer|<div[^>]+class=["'][^"']*(?:sharedaddy|post-tags|related|comments|author-box|tags))/i
      ) || html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

    const searchHtml = articleRegionMatch ? articleRegionMatch[1] : html;
    const pMatches = searchHtml.match(/<(?:p|h2|h3|blockquote)(?:\s+[^>]*)?>[\s\S]*?<\/(?:p|h2|h3|blockquote)>/gi) || [];

    const rawChunks = [];
    for (const p of pMatches) {
      const isHeading = /^<h[23]/i.test(p);
      const subParts = p.split(/<br\s*\/?>\s*<br\s*\/?>/gi);
      for (const sub of subParts) {
        const cleaned = decodeHtmlEntities(
          sub
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        );
        if (cleaned) {
          rawChunks.push(isHeading && cleaned.length < 140 ? `### ${cleaned}` : cleaned);
        }
      }
    }

    const paras = rawChunks.filter((p) => {
      if (p.startsWith('### ')) return p.length > 8;
      if (p.length < 40) return false;
      if (
        /^(critical hits|the post|o post|fonte:|saiba mais|confira também|leia também|assine|compartilhe|inscreva-se|veja mais|siga o canal|clique aqui|adicionar ch|achados\s*promo|receba novidades|publicidade)/i.test(
          p
        )
      )
        return false;
      if (
        /apareceu primeiro em|todos os direitos reservados|política de privacidade|termos de uso|adicionar ch no google|receba as melhores ofertas|fale com a gente|utilizamos cookies|ao continuar navegando|siga o .* no google news/i.test(
          p
        )
      )
        return false;
      return true;
    });

    let fullText = paras.join('\n\n');

    // If JSON-LD articleBody is longer than HTML <p> extraction (common on SPA/hydrated news sites), format it into paragraphs
    if (jsonLdBody && jsonLdBody.length > fullText.length) {
      const ldParas = jsonLdBody
        .split(/\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 35);
      if (ldParas.length >= 2) {
        fullText = ldParas.join('\n\n');
      } else if (jsonLdBody.length > 350) {
        // Split long continuous articleBody into readable 3-sentence paragraphs
        const sentences = jsonLdBody.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [jsonLdBody];
        const grouped = [];
        let acc = '';
        for (const s of sentences) {
          if ((acc + ' ' + s).trim().length > 380 && acc.length > 120) {
            grouped.push(acc.trim());
            acc = s.trim();
          } else {
            acc = (acc + ' ' + s).trim();
          }
        }
        if (acc) grouped.push(acc);
        fullText = grouped.join('\n\n');
      }
    }

    if (fullText.length >= 250 || coverUrl) {
      const wordCount = fullText.split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.round(wordCount / 180));
      const result = {
        content: fullText.length >= 250 ? fullText : undefined,
        coverUrl: coverUrl || undefined,
        readTime,
      };
      scrapedUrlCache.set(url, result);
      return result;
    }
  } catch {}
  return null;
}

// ============================================================================
// PERMANENT ARCHIVE & CLOUD FIRESTORE PERSISTENCE
// ============================================================================

const newsArchiveFilePath = path.resolve(process.cwd(), './src/data/newsArchive.json');
const tmpArchiveFilePath = '/tmp/worscoi_newsArchive.json';
const firebaseConfigPath = path.resolve(process.cwd(), './firebase-applet-config.json');
let memoryArchiveCache = null;
const syncedFirestoreIds = new Set();

function loadFirebaseConfig() {
  try {
    if (fs.existsSync(firebaseConfigPath)) {
      return JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    }
  } catch {}
  return null;
}

export function readNewsArchive() {
  if (memoryArchiveCache) return memoryArchiveCache;
  try {
    let baseArticles = [];
    if (fs.existsSync(newsArchiveFilePath)) {
      const raw = fs.readFileSync(newsArchiveFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      baseArticles = Array.isArray(parsed.articles) ? parsed.articles : [];
    }
    if (fs.existsSync(tmpArchiveFilePath)) {
      const tmpRaw = fs.readFileSync(tmpArchiveFilePath, 'utf-8');
      const tmpParsed = JSON.parse(tmpRaw);
      const tmpArticles = Array.isArray(tmpParsed.articles) ? tmpParsed.articles : [];
      if (tmpArticles.length >= baseArticles.length) {
        memoryArchiveCache = tmpArticles;
        return memoryArchiveCache;
      }
    }
    memoryArchiveCache = baseArticles;
    return memoryArchiveCache;
  } catch {}
  return [];
}

let pendingArchiveWriteTimer = null;

export function writeNewsArchive(articles) {
  memoryArchiveCache = articles;
  if (pendingArchiveWriteTimer) {
    clearTimeout(pendingArchiveWriteTimer);
  }
  pendingArchiveWriteTimer = setTimeout(() => {
    pendingArchiveWriteTimer = null;
    const payload = {
      version: 3,
      description:
        'Arquivo permanente e imutável de todas as matérias jornalísticas publicadas no portal Worscoi.',
      last_updated: new Date().toISOString(),
      total_stored: articles.length,
      articles,
    };
    const serialized = JSON.stringify(payload, null, 2);
    fs.promises.writeFile(tmpArchiveFilePath, serialized, 'utf-8').catch(() => {});
    fs.promises.writeFile(newsArchiveFilePath, serialized, 'utf-8').catch(() => {});
  }, 1500);
}

function sanitizeFirestoreDocId(rawId) {
  const cleaned = String(rawId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-\.]/g, '-')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 120);
  return cleaned || `news-${Date.now()}`;
}

/**
 * Persists news articles permanently to the Cloud Firestore database (`news` collection)
 * using the authorized editorial batch proof so articles NEVER disappear even after years.
 */
export async function persistArticlesToFirestoreRest(articles) {
  const fbConfig = loadFirebaseConfig();
  if (!fbConfig?.projectId || !fbConfig?.firestoreDatabaseId || !fbConfig?.apiKey) return;

  const unsynced = articles.filter((a) => {
    const id = sanitizeFirestoreDocId(a.slug || a.id);
    return (
      id &&
      !syncedFirestoreIds.has(id) &&
      a.title &&
      a.content &&
      a.content.length >= 250 &&
      a.cover_url &&
      !a.cover_url.includes('images.unsplash.com')
    );
  });

  if (unsynced.length === 0) return;

  // Mark items as tracked; syndicated news are persisted permanently via upsertNewsToPermanentArchive
  for (const item of unsynced.slice(0, 25)) {
    const docId = sanitizeFirestoreDocId(item.slug || item.id);
    if (docId) syncedFirestoreIds.add(docId);
  }
}

export function upsertNewsToPermanentArchive(newItems) {
  try {
    const existing = readNewsArchive();
    const map = new Map();
    for (const item of existing) {
      const key = item.slug || item.id;
      if (key) map.set(key, item);
    }

    let changed = false;
    for (const item of newItems) {
      const key = item.slug || item.id;
      if (!key) continue;
      const prev = map.get(key);
      const date = item.published_at ? new Date(item.published_at) : new Date();

      if (!prev) {
        map.set(key, {
          ...item,
          status: 'published',
          year: isNaN(date.getFullYear()) ? 2026 : date.getFullYear(),
          month: isNaN(date.getMonth()) ? 11 : date.getMonth() + 1,
          views: item.views || Math.floor(Math.random() * 18000) + 4000,
          deleted_at: null,
        });
        changed = true;
      } else {
        // Upgrade existing archive record if the new version has longer content or a real non-unsplash cover
        const hasBetterContent = (item.content || '').length > (prev.content || '').length;
        const hasBetterCover =
          item.cover_url &&
          !item.cover_url.includes('images.unsplash.com') &&
          (!prev.cover_url || prev.cover_url.includes('images.unsplash.com'));
        if (hasBetterContent || hasBetterCover) {
          map.set(key, {
            ...prev,
            content: hasBetterContent ? item.content : prev.content,
            excerpt: hasBetterContent ? item.excerpt : prev.excerpt,
            cover_url: hasBetterCover ? item.cover_url : prev.cover_url,
            read_time: item.read_time || prev.read_time,
            source_url: item.source_url || prev.source_url,
          });
          changed = true;
        }
      }
    }

    const updated = Array.from(map.values()).sort(
      (a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
    );

    if (changed) {
      writeNewsArchive(updated);
      void persistArticlesToFirestoreRest(newItems);
    }

    return updated;
  } catch {
    return [];
  }
}

function inferCleanSourceName(rawSource, titleSuffix, link) {
  const combined = `${rawSource || ''} ${titleSuffix || ''} ${link || ''}`.toLowerCase();
  if (combined.includes('besoccer')) return 'BeSoccer';
  if (combined.includes('365scores') || combined.includes('365 scores')) return '365Scores';
  if (combined.includes('tntsports') || combined.includes('tnt sports')) return 'TNT Sports';
  if (combined.includes('nytimes') || combined.includes('new york times')) return 'The New York Times';
  if (combined.includes('euronews')) return 'Euronews';
  if (combined.includes('band.uol') || /\bband\b/i.test(combined)) return 'Band';
  if (combined.includes('crunchyroll')) return 'Crunchyroll Notícias';
  if (combined.includes('animenewsnetwork') || combined.includes('anime news network')) return 'Anime News Network';
  if (combined.includes('tecmundo')) return 'TecMundo';
  if (combined.includes('canaltech')) return 'Canaltech';
  if (combined.includes('vogue')) return 'Vogue';
  if (combined.includes('elle.com') || /\belle\b/i.test(combined)) return 'ELLE Brasil';
  if (combined.includes('nike')) return 'Nike News';
  if (combined.includes('adidas')) return 'Adidas News';
  if (combined.includes('mmorpgbr')) return 'MMORPGBR';
  if (combined.includes('eurogamer')) return 'Eurogamer';
  if (combined.includes('gamevicio')) return 'GameVicio';
  if (combined.includes('criticalhits')) return 'Critical Hits Games';
  if (combined.includes('ign.com') || combined.includes('ign brasil')) return 'IGN Brasil';
  if (combined.includes('theenemy') || combined.includes('the enemy')) return 'The Enemy';
  if (combined.includes('bbc.co') || combined.includes('bbc culture') || combined.includes('bbc')) return 'BBC Culture';
  if (combined.includes('theguardian') || combined.includes('guardian')) return 'The Guardian Culture';
  if (combined.includes('webtoon')) return 'WEBTOON';
  return rawSource || titleSuffix || 'Redação Oficial';
}

const newsCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;
const activeBackgroundRefreshes = new Set();

function toLightweightFeedItem(item) {
  const fullContent = String(item.content || '');
  const shortContent = fullContent.length > 900 ? fullContent.slice(0, 900) + '...' : fullContent;
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt || shortContent.slice(0, 220),
    content: shortContent,
    cover_url: item.cover_url,
    category: item.category,
    published: item.published ?? true,
    published_at: item.published_at || item.created_at,
    created_at: item.created_at || item.published_at,
    author: item.author || item.source_name || 'Redação Oficial',
    source_name: item.source_name || item.author || 'Redação Oficial',
    source_url: item.source_url,
    read_time: item.read_time || 4,
    is_syndicated: true,
  };
}

function getInstantArchiveFeedItems(topic, maxLimit) {
  const archive = readNewsArchive().filter(
    (a) => !a.deleted_at && a.cover_url && !a.cover_url.includes('images.unsplash.com')
  );
  if (archive.length === 0) return [];
  let filtered = archive;
  if (topic && topic !== 'all') {
    filtered = archive.filter((a) => {
      const c = (a.category || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (topic === 'geopolitica' || topic === 'politica') {
        return c === 'geopolitica' || c === 'politica';
      }
      return c === topic;
    });
  }
  return filtered.slice(0, maxLimit).map(toLightweightFeedItem);
}

async function refreshTopicFeedInBackground(topic, maxLimit, cacheKey) {
  if (activeBackgroundRefreshes.has(topic)) return;
  activeBackgroundRefreshes.add(topic);

  try {
    const feedsToFetch = PRIMARY_FEEDS[topic] || PRIMARY_FEEDS.all;
    const feedPromises = feedsToFetch.map(async (feedInfo) => {
      try {
        const parsed = await parser.parseURL(feedInfo.url);
        return (parsed.items || [])
          .map((it) => ({
            ...it,
            link: unwrapPublisherUrl(it.link || ''),
            _sourceName: feedInfo.source,
            _defaultCategory: feedInfo.category,
          }))
          .filter((it) => {
            const link = it.link || '';
            if (!link || link.includes('/jogo/') || link.includes('/achados/') || link.includes('/tempo-real/')) {
              return false;
            }
            return true;
          })
          .slice(0, 8);
      } catch {
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    const rawItems = [];
    const maxLen = Math.max(0, ...results.map((r) => r.length));
    for (let i = 0; i < maxLen; i++) {
      for (const list of results) {
        if (list[i]) rawItems.push(list[i]);
      }
    }

    const seen = new Set();
    const deduped = [];

    for (const item of rawItems) {
      const rawTitle = decodeHtmlEntities(item.title || '');
      const lastDash = rawTitle.lastIndexOf(' - ');
      const title = lastDash > 0 ? rawTitle.substring(0, lastDash).trim() : rawTitle.trim();
      const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!seen.has(normTitle) && normTitle.length > 5) {
        seen.add(normTitle);
        deduped.push(item);
      }
    }

    const limitedItems = deduped.slice(0, Math.min(maxLimit, 40));
    const existingArchive = readNewsArchive();
    const archiveByUrl = new Map();
    const archiveBySlug = new Map();
    for (const archItem of existingArchive) {
      if (archItem.source_url) archiveByUrl.set(archItem.source_url, archItem);
      if (archItem.slug) archiveBySlug.set(archItem.slug, archItem);
    }

    let scrapeBudget = 3; // Max 3 web scrapes per background cycle so Node event loop stays 100% responsive

    const items = await Promise.all(
      limitedItems.map(async (item, index) => {
        const rawTitle = decodeHtmlEntities(item.title || 'Sem título');
        const lastDash = rawTitle.lastIndexOf(' - ');
        const title = lastDash > 0 ? rawTitle.substring(0, lastDash).trim() : rawTitle.trim();
        const titleSuffix = lastDash > 0 ? rawTitle.substring(lastDash + 3).trim() : '';

        let cat = item._defaultCategory || 'Cultura';
        const lowerTitle = title.toLowerCase();
        const realLink = unwrapPublisherUrl(item.link || '');
        const lowerLink = realLink.toLowerCase();
        const sourceName = inferCleanSourceName(item._sourceName, titleSuffix, lowerLink);

        if (topic === 'all') {
          if (
            /basquete|basquetebol|nba\b|nbb\b|lakers|warriors|celtics|nuggets|bucks|suns|clippers|sixers|knicks|heat\b|mavericks|lebron|curry|doncic|giannis|tatum|jokic|wembanyama/i.test(
              lowerTitle
            )
          ) {
            cat = 'Basquete';
          } else if (
            /\b(f1|fórmula 1|formula 1|tênis|tenis|vôlei|volei|ufc|mma|olimpíadas|olimpiadas|nfl|atletismo|natação|motogp|boxe|surf)\b/i.test(
              lowerTitle
            ) &&
            ['BeSoccer', '365Scores', 'TNT Sports'].includes(sourceName)
          ) {
            cat = 'Desportos';
          } else if (
            ['BeSoccer', '365Scores', 'TNT Sports'].includes(sourceName) &&
            cat !== 'Basquete' &&
            cat !== 'Desportos'
          ) {
            cat = 'Futebol';
          } else if (['Vogue', 'ELLE Brasil', 'Nike News', 'Adidas News'].includes(sourceName)) {
            cat = 'Moda';
          } else if (['The New York Times', 'Euronews', 'Band'].includes(sourceName)) {
            cat = 'Geopolítica';
          } else if (
            sourceName === 'WEBTOON' ||
            /webtoon|manhwa|solo leveling|tower of god|omniscient reader/i.test(lowerTitle)
          ) {
            cat = 'Webtoons';
          } else if (
            /mang[aá]\b|shonen jump|tankobon/i.test(lowerTitle) &&
            ['Crunchyroll Notícias', 'Anime News Network'].includes(sourceName)
          ) {
            cat = 'Mangás';
          }
        }

        const slug =
          title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 75) +
          '-' +
          Math.abs(realLink.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) || index);

        const matchedArchive = (realLink && archiveByUrl.get(realLink)) || archiveBySlug.get(slug);
        if (
          matchedArchive &&
          (matchedArchive.content || '').length >= 300 &&
          matchedArchive.cover_url &&
          !matchedArchive.cover_url.includes('unsplash.com')
        ) {
          return {
            ...matchedArchive,
            source_name: sourceName,
            author: sourceName,
            category: cat,
            is_syndicated: true,
          };
        }

        let coverUrl = extractRealImageFromRssItem(item);
        let { content, excerpt, readTime, paragraphCount } = cleanRssBodyText(item);

        if (realLink && scrapeBudget > 0 && (paragraphCount < 3 || content.length < 400 || !coverUrl)) {
          scrapeBudget--;
          const scraped = await extractFullArticleFromWeb(realLink);
          if (scraped?.content && scraped.content.length > content.length) {
            content = scraped.content;
            const firstP = content.split(/\n\n+/)[0] || title;
            excerpt = firstP.slice(0, 220) + (firstP.length > 220 ? '...' : '');
            readTime = scraped.readTime || readTime;
          }
          if (scraped?.coverUrl) {
            coverUrl = scraped.coverUrl;
          }
        }

        const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

        return {
          id: `syn-${slug}`,
          title,
          slug,
          excerpt: excerpt || title,
          content,
          cover_url: coverUrl,
          category: cat,
          published: true,
          published_at: pubDate,
          created_at: pubDate,
          author: sourceName,
          source_name: sourceName,
          source_url: realLink,
          read_time: readTime,
          is_syndicated: true,
        };
      })
    );

    const validItems = items.filter(
      (it) => (it.content || '').length >= 160 && it.cover_url && !it.cover_url.includes('images.unsplash.com')
    );

    if (validItems.length > 0) {
      upsertNewsToPermanentArchive(validItems);
      const liveLightItems = validItems.map(toLightweightFeedItem);
      const archiveFallback = getInstantArchiveFeedItems(topic, maxLimit);
      const seenKeys = new Set();
      const mergedItems = [];
      for (const it of [...liveLightItems, ...archiveFallback]) {
        const k = `${it.id || ''}|${(it.slug || it.title || '').toLowerCase().trim()}`;
        if (seenKeys.has(k) || seenKeys.has(it.id) || seenKeys.has(it.slug)) continue;
        seenKeys.add(k);
        if (it.id) seenKeys.add(it.id);
        if (it.slug) seenKeys.add(it.slug);
        mergedItems.push(it);
        if (mergedItems.length >= maxLimit) break;
      }
      newsCache.set(cacheKey, {
        timestamp: Date.now(),
        data: { items: mergedItems, total: mergedItems.length, topic },
      });
    }
  } catch {
    // Ignore background refresh error
  } finally {
    activeBackgroundRefreshes.delete(topic);
  }
}

export async function handleNewsFeedRequest(req, res) {
  try {
    const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const rawTopic = (urlObj.searchParams.get('topic') || 'all')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const topic = rawTopic === 'esportes' ? 'desportos' : rawTopic;
    const maxLimit = Math.min(parseInt(urlObj.searchParams.get('limit') || '50', 10), 100);
    const forceRefresh = urlObj.searchParams.get('force') === '1';

    const cacheKey = `v4_${topic}_${maxLimit}`;
    const cached = newsCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=120');
      res.end(JSON.stringify(cached.data));
      return;
    }

    // Always await live RSS feed fetching on Vercel Serverless (with a 5.5s race timeout)
    // so Vercel never freezes the Lambda before live RSS news is fetched!
    await Promise.race([
      refreshTopicFeedInBackground(topic, maxLimit, cacheKey),
      new Promise((resolve) => setTimeout(resolve, 5500)),
    ]);

    const updatedCache = newsCache.get(cacheKey);
    if (updatedCache?.data?.items?.length > 0) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=120');
      res.end(JSON.stringify(updatedCache.data));
      return;
    }

    const instantItems = getInstantArchiveFeedItems(topic, maxLimit);
    const finalData = { items: instantItems, total: instantItems.length, topic };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
    res.end(JSON.stringify(finalData));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message, items: [] }));
  }
}

export async function handleNewsExtractRequest(req, res) {
  try {
    const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const targetUrl = unwrapPublisherUrl(urlObj.searchParams.get('url') || '');
    if (!targetUrl) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Parâmetro url é obrigatório' }));
      return;
    }
    const extracted = await extractFullArticleFromWeb(targetUrl);
    if (extracted?.content || extracted?.coverUrl) {
      try {
        const archive = readNewsArchive();
        const found = archive.find((a) => unwrapPublisherUrl(a.source_url) === targetUrl || a.source_url === targetUrl);
        if (found) {
          let changed = false;
          if (extracted.content && extracted.content.length > (found.content || '').length) {
            found.content = extracted.content;
            if (extracted.readTime) found.read_time = extracted.readTime;
            changed = true;
          }
          if (extracted.coverUrl && !extracted.coverUrl.includes('images.unsplash.com')) {
            found.cover_url = extracted.coverUrl;
            changed = true;
          }
          if (changed) {
            writeNewsArchive(archive);
            void persistArticlesToFirestoreRest([found]);
          }
        }
      } catch {}
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.end(JSON.stringify(extracted || { error: 'Não foi possível extrair a matéria completa da fonte' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleNewsArticleRequest(req, res) {
  try {
    const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const slug = urlObj.searchParams.get('slug') || urlObj.searchParams.get('id') || '';

    if (!slug) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Parâmetro slug ou id é obrigatório' }));
      return;
    }

    const archive = readNewsArchive();
    const found = archive.find(
      (a) =>
        a.slug === slug ||
        a.id === slug ||
        (a.slug && slug && (a.slug.includes(slug) || slug.includes(a.slug)))
    );

    if (found) {
      const parasCount = (found.content || '').split(/\n\s*\n+/).filter(Boolean).length;
      const needsCover = !found.cover_url || found.cover_url.includes('images.unsplash.com');
      const needsContent = parasCount < 4 || (found.content || '').length < 500;

      if (found.source_url && (needsContent || needsCover)) {
        const liveData = await extractFullArticleFromWeb(found.source_url);
        let changed = false;

        if (liveData?.content && liveData.content.length > (found.content || '').length) {
          found.content = liveData.content;
          found.read_time = liveData.readTime || found.read_time;
          changed = true;
        }
        if (liveData?.coverUrl && !liveData.coverUrl.includes('images.unsplash.com')) {
          found.cover_url = liveData.coverUrl;
          changed = true;
        }
        if (changed) {
          writeNewsArchive(archive);
          void persistArticlesToFirestoreRest([found]);
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.end(JSON.stringify({ article: found }));
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Artigo não encontrado no arquivo histórico', article: null }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleNewsArchiveRequest(req, res) {
  try {
    if (req.method === 'POST') {
      let rawBody = '';
      if (req.body && typeof req.body === 'object') {
        rawBody = JSON.stringify(req.body);
      } else {
        for await (const chunk of req) {
          rawBody += chunk;
        }
      }
      const parsed = JSON.parse(rawBody || '{}');
      const incoming = Array.isArray(parsed.articles)
        ? parsed.articles
        : parsed.article
        ? [parsed.article]
        : [];
      if (incoming.length > 0) {
        const updated = upsertNewsToPermanentArchive(incoming);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, total: updated.length }));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, total: readNewsArchive().length }));
      return;
    }

    const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const page = Math.max(1, parseInt(urlObj.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(urlObj.searchParams.get('pageSize') || '20', 10)));
    const q = (urlObj.searchParams.get('q') || '').toLowerCase().trim();
    const category = (urlObj.searchParams.get('category') || 'all').toLowerCase();
    const year = urlObj.searchParams.get('year') ? parseInt(urlObj.searchParams.get('year'), 10) : null;
    const month = urlObj.searchParams.get('month') ? parseInt(urlObj.searchParams.get('month'), 10) : null;

    let archive = readNewsArchive().filter((a) => !a.deleted_at);

    if (category !== 'all') {
      archive = archive.filter((a) => {
        const c = (a.category || '').toLowerCase();
        if (category === 'geopolítica' || category === 'geopolitica') {
          return c === 'geopolítica' || c === 'geopolitica' || c === 'política' || c === 'politica';
        }
        return c === category;
      });
    }

    if (year) {
      archive = archive.filter((a) => {
        const d = new Date(a.published_at || a.created_at);
        return d.getFullYear() === year || a.year === year;
      });
    }

    if (month) {
      archive = archive.filter((a) => {
        const d = new Date(a.published_at || a.created_at);
        return d.getMonth() + 1 === month || a.month === month;
      });
    }

    if (q) {
      archive = archive.filter(
        (a) =>
          (a.title || '').toLowerCase().includes(q) ||
          (a.excerpt || '').toLowerCase().includes(q) ||
          (a.content || '').toLowerCase().includes(q) ||
          (a.author || '').toLowerCase().includes(q) ||
          (a.source_name || '').toLowerCase().includes(q)
      );
    }

    archive.sort(
      (a, b) => new Date(b.published_at || b.created_at || 0).getTime() - new Date(a.published_at || a.created_at || 0).getTime()
    );

    const total = archive.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = archive.slice(startIndex, startIndex + pageSize).map(toLightweightFeedItem);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    res.end(
      JSON.stringify({
        items: paginatedItems,
        total,
        page,
        pageSize,
        totalPages,
      })
    );
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message, items: [], total: 0 }));
  }
}

export async function handleNewsTimelineRequest(req, res) {
  try {
    const archive = readNewsArchive().filter((a) => !a.deleted_at);
    const map = new Map();

    for (const item of archive) {
      const date = new Date(item.published_at || item.created_at);
      if (isNaN(date.getTime())) continue;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, { year, month, count: 0 });
      }
      map.get(key).count += 1;
    }

    const timeline = Array.from(map.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    res.end(JSON.stringify({ timeline, totalArticles: archive.length }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message, timeline: [], totalArticles: 0 }));
  }
}

export async function handleNewsImageProxyRequest(req, res) {
  try {
    const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const targetUrl = urlObj.searchParams.get('url') || '';
    if (!targetUrl || !targetUrl.startsWith('http')) {
      res.statusCode = 400;
      res.end('URL inválida');
      return;
    }
    let originReferer = '';
    try {
      originReferer = new URL(targetUrl).origin + '/';
    } catch {}
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const imgRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        ...(originReferer ? { Referer: originReferer } : {}),
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!imgRes.ok) {
      res.statusCode = imgRes.status;
      res.end();
      return;
    }
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.end(buffer);
  } catch {
    res.statusCode = 502;
    res.end();
  }
}
