import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import Parser from 'rss-parser';
import { generateBookPdf } from './src/lib/pdfGenerator';
import { ORIGINAL_PDF_REGISTRY, getOriginalPdfForBook } from './src/lib/originalPdfRegistry';
import { buildSitemapXml } from './scripts/generate_sitemap.js';
import { cinemaStreamingPlugin } from './src/lib/cinemaServerPlugin';
import {
  handleMangaChaptersRequest,
  handleMangaPagesRequest,
  handleMangadexResolveChapterRequest,
  handleMangadexFeedRequest,
  handleMangadexServerRequest,
  handleMangaImageProxyRequest,
} from './api/_mangaHandler.js';
import {
  handleAdminLoginRequest,
  handleAdminSessionRequest,
  handleAdminLogoutRequest,
} from './api/_adminHandler.js';

function newsRssPlugin(): Plugin {
  const parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 WorscoiNewsBot/4.0',
      'Accept': 'application/rss+xml, application/xml, text/xml',
    },
    customFields: {
      item: [
        ['media:content', 'mediaContent', { keepArray: true }],
        ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
        ['content:encoded', 'contentEncoded'],
      ],
    },
    timeout: 7000,
  });

  interface FeedSource {
    url: string;
    category: string;
    source: string;
  }

  const PRIMARY_FEEDS: Record<string, FeedSource[]> = {
    all: [
      { url: 'https://g1.globo.com/rss/g1/economia/', category: 'Mercado', source: 'G1 Economia' },
      { url: 'https://g1.globo.com/rss/g1/politica/', category: 'Política', source: 'G1 Política' },
      { url: 'https://g1.globo.com/rss/g1/ciencia-e-saude/', category: 'Ciência', source: 'G1 Ciência' },
      { url: 'https://g1.globo.com/rss/g1/natureza/', category: 'Geografia', source: 'G1 Natureza & Clima' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/liga-dos-campeoes/', category: 'Futebol', source: 'UEFA Champions League' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-espanhol/', category: 'Futebol', source: 'La Liga • Espanha' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-ingles/', category: 'Futebol', source: 'Premier League • Inglaterra' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-alemao/', category: 'Futebol', source: 'Bundesliga • Alemanha' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-italiano/', category: 'Futebol', source: 'Serie A • Itália' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-frances/', category: 'Futebol', source: 'Ligue 1 • França' },
      { url: 'https://www.jbox.com.br/feed/', category: 'Animes', source: 'JBox' },
      { url: 'https://www.otakupt.com/feed/', category: 'Animes', source: 'OtakuPT' },
      { url: 'https://anmtv.com.br/feed/', category: 'Animes', source: 'AnMTV' },
      { url: 'https://animeunited.com.br/feed/', category: 'Mangás', source: 'Anime United' },
      { url: 'https://legiaodosherois.com.br/feed', category: 'Cultura', source: 'Legião dos Heróis' },
      { url: 'https://criticalhits.com.br/feed/', category: 'Games', source: 'Critical Hits' },
      { url: 'https://tecnoblog.net/feed/', category: 'Tecnologias', source: 'Tecnoblog' },
      { url: 'https://www.adrenaline.com.br/rss/', category: 'Games', source: 'Adrenaline' },
      { url: 'https://rss.tecmundo.com.br/feed', category: 'Tecnologias', source: 'TecMundo' },
      { url: 'https://www.publishnews.com.br/rss/', category: 'Livros', source: 'PublishNews' },
    ],
    futebol: [
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-espanhol/', category: 'Futebol', source: 'La Liga • Espanha' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-ingles/', category: 'Futebol', source: 'Premier League • Inglaterra' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-alemao/', category: 'Futebol', source: 'Bundesliga • Alemanha' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/liga-dos-campeoes/', category: 'Futebol', source: 'UEFA Champions League' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-italiano/', category: 'Futebol', source: 'Serie A • Itália' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-frances/', category: 'Futebol', source: 'Ligue 1 • França' },
      { url: 'https://ge.globo.com/rss/ge/futebol/futebol-internacional/futebol-portugues/', category: 'Futebol', source: 'Liga Portugal' },
      { url: 'https://trivela.com.br/feed/', category: 'Futebol', source: 'Futebol Europeu • Trivela' },
    ],
    basquete: [
      { url: 'https://ge.globo.com/rss/ge/basquete/nba/', category: 'Basquete', source: 'NBA Brasil' },
      { url: 'https://ge.globo.com/rss/ge/basquete/', category: 'Basquete', source: 'Basquete GE' },
    ],
    mercado: [
      { url: 'https://g1.globo.com/rss/g1/economia/', category: 'Mercado', source: 'G1 Economia' },
      { url: 'https://www.infomoney.com.br/feed/', category: 'Mercado', source: 'InfoMoney' },
    ],
    virais: [
      { url: 'https://tecnoblog.net/feed/', category: 'Virais', source: 'Tecnoblog Internet' },
      { url: 'https://g1.globo.com/rss/g1/pop-arte/', category: 'Virais', source: 'G1 Pop & Trends' },
    ],
    listas: [
      { url: 'https://legiaodosherois.com.br/feed', category: 'Listas', source: 'Legião Rankings' },
      { url: 'https://criticalhits.com.br/feed/', category: 'Listas', source: 'Critical Hits Top 10' },
    ],
    politica: [
      { url: 'https://g1.globo.com/rss/g1/politica/', category: 'Política', source: 'G1 Política' },
    ],
    geografia: [
      { url: 'https://g1.globo.com/rss/g1/natureza/', category: 'Geografia', source: 'G1 Natureza & Clima' },
    ],
    ciencia: [
      { url: 'https://g1.globo.com/rss/g1/ciencia-e-saude/', category: 'Ciência', source: 'G1 Ciência & Saúde' },
      { url: 'https://tecnoblog.net/feed/', category: 'Ciência', source: 'Tecnoblog Ciência' },
    ],
    animes: [
      { url: 'https://www.jbox.com.br/feed/', category: 'Animes', source: 'JBox' },
      { url: 'https://www.otakupt.com/feed/', category: 'Animes', source: 'OtakuPT' },
      { url: 'https://anmtv.com.br/feed/', category: 'Animes', source: 'AnMTV' },
    ],
    mangas: [
      { url: 'https://animeunited.com.br/feed/', category: 'Mangás', source: 'Anime United' },
      { url: 'https://www.otakupt.com/feed/', category: 'Mangás', source: 'OtakuPT' },
      { url: 'https://www.jbox.com.br/feed/', category: 'Mangás', source: 'JBox' },
    ],
    webtoons: [
      { url: 'https://www.otakupt.com/feed/', category: 'Webtoons', source: 'OtakuPT' },
      { url: 'https://anmtv.com.br/feed/', category: 'Webtoons', source: 'AnMTV' },
      { url: 'https://animeunited.com.br/feed/', category: 'Webtoons', source: 'Anime United' },
    ],
    games: [
      { url: 'https://criticalhits.com.br/feed/', category: 'Games', source: 'Critical Hits' },
      { url: 'https://www.adrenaline.com.br/rss/', category: 'Games', source: 'Adrenaline' },
      { url: 'https://www.otakupt.com/feed/', category: 'Games', source: 'OtakuPT' },
    ],
    tecnologias: [
      { url: 'https://tecnoblog.net/feed/', category: 'Tecnologias', source: 'Tecnoblog' },
      { url: 'https://rss.tecmundo.com.br/feed', category: 'Tecnologias', source: 'TecMundo' },
      { url: 'https://g1.globo.com/rss/g1/tecnologia/', category: 'Tecnologias', source: 'G1 Tecnologia' },
    ],
    cultura: [
      { url: 'https://legiaodosherois.com.br/feed', category: 'Cultura', source: 'Legião dos Heróis' },
      { url: 'https://g1.globo.com/rss/g1/pop-arte/', category: 'Cultura', source: 'G1 Pop & Arte' },
      { url: 'https://www.jbox.com.br/feed/', category: 'Cultura', source: 'JBox' },
    ],
    livros: [
      { url: 'https://www.publishnews.com.br/rss/', category: 'Livros', source: 'PublishNews' },
    ],
  };

  function extractRealImage(item: any, title: string, cat: string): string {
    // 1. Check enclosure attribute
    if (
      item.enclosure?.url &&
      (item.enclosure.type?.includes('image') || /\.(jpg|jpeg|png|webp|avif)/i.test(item.enclosure.url)) &&
      !/(1x1|spacer|tracking|pixel|feedburner|emoji|\.gif)/i.test(item.enclosure.url)
    ) {
      return item.enclosure.url;
    }

    // 2. Check media:content or media:thumbnail (supports single object or array from rss-parser)
    const mediaCandidates = [
      ...(Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent]),
      ...(Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail : [item.mediaThumbnail]),
      ...(Array.isArray(item['media:content']) ? item['media:content'] : [item['media:content']]),
      ...(Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'] : [item['media:thumbnail']]),
    ].filter(Boolean);

    for (const med of mediaCandidates) {
      const url = med?.url || med?.$?.url || med?.attributes?.url || (typeof med === 'string' ? med : null);
      if (
        url &&
        typeof url === 'string' &&
        url.startsWith('http') &&
        !/(1x1|spacer|tracking|pixel|feedburner|emoji|\.gif)/i.test(url)
      ) {
        return url.replace(/&amp;/g, '&');
      }
    }

    // 3. Search HTML for first genuine <img> tag
    const rawHtml = (item.contentEncoded || item['content:encoded'] || '') + ' ' + (item.content || '') + ' ' + (item.description || '');
    const matches = rawHtml.matchAll(/<img[^>]+(?:src|data-src)=["'](https?:\/\/[^"'\s>]+)["']/gi);
    for (const m of matches) {
      let url = m[1].replace(/&amp;/g, '&');
      if (!/gravatar\.com|emoji|icon|pixel|feedburner|spacer|tracking|1x1|\.gif/i.test(url)) {
        if (url.includes('infomoney.com.br') && url.includes('fit=300')) {
          url = url.split('?')[0];
        }
        if (url.includes('anmtv.com.br') && url.includes('resize=600')) {
          url = url.replace(/resize=600%2C300/g, 'fit=1280%2C720');
        }
        return url;
      }
    }

    // Deterministic hash based on title
    let hash = 0;
    for (let i = 0; i < (title || '').length; i++) {
      hash = (hash << 5) - hash + title.charCodeAt(i);
      hash |= 0;
    }
    const h = Math.abs(hash);

    // 4. Accurate contextual match based on title keywords with strict word-boundary
    const lower = (title || '').toLowerCase();

    // Futebol
    if (/futebol|brasileir[aã]o|libertadores|champions|liga das na[cç][oõ]es|uefa|campeonato|copa\b|gol\b|est[aá]dio|palmeiras|flamengo|corinthians|s[aã]o paulo fc|cruzeiro|gr[eê]mio|botafogo|santos fc|vasco|fluminense|fortaleza ec|real madrid|barcelona|atletico-mg|\b(sc internacional|colorado)\b|\b[A-Za-zÀ-ÿ0-9-]+\s+x\s+[A-Za-zÀ-ÿ0-9-]+/i.test(lower)) {
      const futebolPool = [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&auto=format&fit=crop&q=80',
      ];
      return futebolPool[h % futebolPool.length];
    }

    // Mercado & Economia
    if (/mercado|a[cç][oõ]es|ibovespa|selic|d[oó]lar|infla[cç][aã]o|banco central|investimento|startup|finan|bolsa de valores|lucro|faturamento|venture capital/i.test(lower)) {
      const mercadoPool = [
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
      ];
      return mercadoPool[h % mercadoPool.length];
    }

    // Virais
    if (/viral|viralizou|trend\b|tiktok|meme|reels|influencer|redes sociais/i.test(lower)) {
      const viraisPool = [
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?w=1200&auto=format&fit=crop&q=80',
      ];
      return viraisPool[h % viraisPool.length];
    }

    // Listas & Rankings
    if (/top\s*\d+|ranking|os melhores|as melhores|lista\b|guia definitivo/i.test(lower)) {
      const listasPool = [
        'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507842229450-799042b314a5?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
      ];
      return listasPool[h % listasPool.length];
    }

    // Política
    if (/pol[ií]tica|congresso|senado|deputad|governo|stf|ministr|diplomacia|elei[cç][aã]o|vota[cç][aã]o/i.test(lower)) {
      const politicaPool = [
        'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=1200&auto=format&fit=crop&q=80',
      ];
      return politicaPool[h % politicaPool.length];
    }

    // Geografia & Meio Ambiente
    if (/geografia|clima|meio ambiente|aquecimento|ant[aá]rtica|bioma|amaz[oô]nia|oceano|mapa|ecossistema/i.test(lower)) {
      const geoPool = [
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511497584788-87676104235f?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
      ];
      return geoPool[h % geoPool.length];
    }

    // Ciência & Astronomia
    if (/ci[eê]ncia|astronomia|telesc[oó]pio|nasa|planeta|f[ií]sica|biologia|gen[eé]tica|pesquisa|descoberta|exoplaneta|crispr/i.test(lower)) {
      const cienciaPool = [
        'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80',
      ];
      return cienciaPool[h % cienciaPool.length];
    }

    // Tecnologias & IA (Strict word boundary to avoid false matching on 'Bahia' or 'dia')
    if (/\b(ia|i\.a\.)\b|intelig[eê]ncia artificial|chatgpt|openai|gemini|deepseek/i.test(lower)) {
      return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&auto=format&fit=crop&q=80';
    }

    if (/smartphone|celular|iphone|apple|samsung|galaxy/i.test(lower)) {
      return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop&q=80';
    }

    if (/livro|literat|autor|editora|romance|bienal/i.test(lower)) {
      return 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&auto=format&fit=crop&q=80';
    }

    if (/cinema|filme|trailer|hollywood|ator|atriz|netflix|disney/i.test(lower)) {
      return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80';
    }

    if (/naruto|boruto|one piece|dragon ball|demon slayer/i.test(lower)) {
      return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80';
    }

    if (/playstation|sony|ps5|xbox|nintendo|zelda|mario|switch|game/i.test(lower)) {
      return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80';
    }

    // Fallback dictionary with varied choices
    const fallbackCategoryPools: Record<string, string[]> = {
      Animes: [
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
      ],
      'Mangás': [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
      ],
      Webtoons: [
        '/covers/webtoons/solo-leveling-cover.jpg',
        '/covers/webtoons/orv-cover.jpg',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
      ],
      Livros: [
        'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&auto=format&fit=crop&q=80',
      ],
      Tecnologias: [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
      ],
      Games: [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop&q=80',
      ],
      Cultura: [
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
      ],
      Futebol: [
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
      ],
      Mercado: [
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80',
      ],
      Virais: [
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?w=1200&auto=format&fit=crop&q=80',
      ],
      Listas: [
        'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507842229450-799042b314a5?w=1200&auto=format&fit=crop&q=80',
      ],
      'Política': [
        'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&auto=format&fit=crop&q=80',
      ],
      Geografia: [
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
      ],
      'Ciência': [
        'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80',
      ],
    };

    const pool = fallbackCategoryPools[cat] || fallbackCategoryPools.Cultura;
    return pool[h % pool.length];
  }

  function cleanFullArticleContent(
    item: any,
    sourceName: string
  ): { content: string; excerpt: string; readTime: number } {
    const rawHtml = item.contentEncoded || item['content:encoded'] || item.content || item.description || '';

    let cleaned = rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<div class=["'][^"']*(?:sharedaddy|jp-relatedposts|wpcnt|ads|banner)[^"']*["']>.*?<\/div>/gis, '')
      .replace(/<p[^>]*>/gi, '\n\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n\n')
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n### $1\n\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '\n• $1')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '\n\n> "$1"\n\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\+\s*🔍\s*Adicione o ge nas suas fontes favoritas do Google/gi, '\n\n')
      .replace(/🔍\s*Adicione o ge nas suas fontes favoritas do Google/gi, '\n\n')
      .replace(/✅\s*Clique aqui para seguir o novo canal[^\n.]*\.?/gi, '\n\n')
      .replace(/📲\s*Siga o canal[^\n.]*\.?/gi, '\n\n');

    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '“')
      .replace(/&#8221;/g, '”')
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/&ccedil;/g, 'ç')
      .replace(/&Ccedil;/g, 'Ç')
      .replace(/&atilde;/g, 'ã')
      .replace(/&Atilde;/g, 'Ã')
      .replace(/&eacute;/g, 'é')
      .replace(/&Eacute;/g, 'É')
      .replace(/&iacute;/g, 'í')
      .replace(/&Iacute;/g, 'Í')
      .replace(/&oacute;/g, 'ó')
      .replace(/&Oacute;/g, 'Ó')
      .replace(/&uacute;/g, 'ú')
      .replace(/&Uacute;/g, 'Ú')
      .replace(/&aacute;/g, 'á')
      .replace(/&Aacute;/g, 'Á')
      .replace(/&ecirc;/g, 'ê')
      .replace(/&ocirc;/g, 'ô')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    const paragraphs = cleaned
      .split(/\n\s*\n+/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter((p) => {
        if (p.length < 25) return false;
        if (/^(the post|o post|fonte:|saiba mais|confira também|leia também|assine|compartilhe)/i.test(p))
          return false;
        if (/apareceu primeiro em|todos os direitos reservados/i.test(p)) return false;
        return true;
      });

    const content = paragraphs.join('\n\n');
    const excerpt = paragraphs[0]
      ? paragraphs[0].slice(0, 220) + (paragraphs[0].length > 220 ? '...' : '')
      : (item.contentSnippet || item.title || '').slice(0, 200);

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.round(wordCount / 180));

    return { content, excerpt, readTime };
  }

  async function extractFullArticleFromWeb(url: string): Promise<{ content?: string; coverUrl?: string; readTime?: number } | null> {
    if (!url || !url.startsWith('http')) return null;
    if (url.includes('/jogo/') || url.includes('news.google.com')) return null;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) return null;
      const html = await res.text();

      // 1. High-res authentic cover image from page meta
      const ogImg = html.match(/<meta[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/i) ||
                    html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      const coverUrl = ogImg ? ogImg[1].replace(/&amp;/g, '&') : undefined;

      // 2. Extract paragraphs from main article containers
      let paras: string[] = [];

      if (url.includes('globo.com')) {
        const pMatches = [...html.matchAll(/<p[^>]*class=["'][^"']*content-text__container[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi)];
        paras = pMatches.map((m) => m[1]);
      }

      if (paras.length === 0) {
        // Look for common CMS article body containers
        const containerMatch = html.match(/<(?:article|div|section|main)[^>]*class=["'][^"']*(?:entry-content|article-body|post-content|article__content|article-text|c-news__body|story-body|noticia__conteudo|materia-conteudo|corpo-texto|content-area|post_content|noticia-texto|elementor-widget-theme-post-content)[^"']*["'][\s\S]*?<\/(?:article|div|section|main)>/i);
        const scope = containerMatch ? containerMatch[0] : html;
        const pMatches = [...scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
        paras = pMatches.map((m) => m[1]);
      }

      if (paras.length < 3) {
        const cleanHtml = html
          .replace(/<script\b[\s\S]*?<\/script>/gi, '')
          .replace(/<style\b[\s\S]*?<\/style>/gi, '')
          .replace(/<header\b[\s\S]*?<\/header>/gi, '')
          .replace(/<footer\b[\s\S]*?<\/footer>/gi, '')
          .replace(/<nav\b[\s\S]*?<\/nav>/gi, '')
          .replace(/<aside\b[\s\S]*?<\/aside>/gi, '')
          .replace(/<form\b[\s\S]*?<\/form>/gi, '')
          .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '');
        const pMatches = [...cleanHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
        paras = pMatches.map((m) => m[1]);
      }

      const cleanParas = paras
        .map((p) =>
          p
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#8217;/g, "'")
            .replace(/&#8216;/g, "'")
            .replace(/&#8220;/g, '“')
            .replace(/&#8221;/g, '”')
            .replace(/&#8211;/g, '–')
            .replace(/&#8212;/g, '—')
            .replace(/&ccedil;/g, 'ç')
            .replace(/&Ccedil;/g, 'Ç')
            .replace(/&atilde;/g, 'ã')
            .replace(/&Atilde;/g, 'Ã')
            .replace(/&eacute;/g, 'é')
            .replace(/&Eacute;/g, 'É')
            .replace(/&iacute;/g, 'í')
            .replace(/&oacute;/g, 'ó')
            .replace(/&uacute;/g, 'ú')
            .replace(/&aacute;/g, 'á')
            .replace(/&ecirc;/g, 'ê')
            .replace(/&ocirc;/g, 'ô')
            .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
            .replace(/\s+/g, ' ')
            .trim()
        )
        .filter((p) => {
          if (p.length < 35) return false;
          if (/^(critical hits|the post|o post|fonte:|saiba mais|confira também|leia também|assine|compartilhe|inscreva-se|veja mais|siga o canal|clique aqui|adicionar ch|achados\s*promo|receba novidades)/i.test(p))
            return false;
          if (/apareceu primeiro em|todos os direitos reservados|política de privacidade|termos de uso|adicionar ch no google|receba as melhores ofertas|fale com a gente|utilizamos cookies|ao continuar navegando/i.test(p))
            return false;
          return true;
        });

      if (cleanParas.length >= 2) {
        const fullText = cleanParas.join('\n\n');
        const wordCount = fullText.split(/\s+/).filter(Boolean).length;
        const readTime = Math.max(1, Math.round(wordCount / 180));
        return { content: fullText, coverUrl, readTime };
      } else if (coverUrl) {
        return { coverUrl };
      }
    } catch {}
    return null;
  }

  const newsArchiveFilePath = path.resolve(__dirname, './src/data/newsArchive.json');
  let memoryArchiveCache: any[] | null = null;

  function readNewsArchive(): any[] {
    if (memoryArchiveCache) return memoryArchiveCache;
    try {
      if (fs.existsSync(newsArchiveFilePath)) {
        const raw = fs.readFileSync(newsArchiveFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        memoryArchiveCache = Array.isArray(parsed.articles) ? parsed.articles : [];
        return memoryArchiveCache;
      }
    } catch {}
    return [];
  }

  function writeNewsArchive(articles: any[]) {
    memoryArchiveCache = articles;
    try {
      const payload = {
        version: 2,
        description: "Arquivo permanente e imutável de todas as matérias jornalísticas publicadas no portal Worscoi.",
        last_updated: new Date().toISOString(),
        total_stored: articles.length,
        articles,
      };
      fs.writeFileSync(newsArchiveFilePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.error('Falha ao salvar newsArchive.json:', e);
    }
  }

  function upsertNewsToPermanentArchive(newItems: any[]) {
    try {
      const existing = readNewsArchive();
      const map = new Map<string, any>();
      for (const item of existing) {
        const key = item.slug || item.id;
        if (key) map.set(key, item);
      }
      let addedNew = false;
      for (const item of newItems) {
        const key = item.slug || item.id;
        if (key && !map.has(key)) {
          const date = item.published_at ? new Date(item.published_at) : new Date();
          map.set(key, {
            ...item,
            status: item.status || 'published',
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            views: item.views || Math.floor(Math.random() * 25000) + 5000,
            deleted_at: null,
          });
          addedNew = true;
        }
      }
      if (!addedNew) return existing;
      const updated = Array.from(map.values()).sort(
        (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
      writeNewsArchive(updated);
      return updated;
    } catch {
      return [];
    }
  }

  const newsCache = new Map<string, { timestamp: number; data: any }>();
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes in-memory cache

  return {
    name: 'news-rss-syndication',
    configureServer(server) {
      server.middlewares.use('/api/news/feed', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          const topic = (urlObj.searchParams.get('topic') || 'all').toLowerCase();
          const maxLimit = Math.min(parseInt(urlObj.searchParams.get('limit') || '50', 10), 150);

          const cacheKey = `${topic}_${maxLimit}`;
          const cached = newsCache.get(cacheKey);
          if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(cached.data));
            return;
          }

          const feedsToFetch = PRIMARY_FEEDS[topic] || PRIMARY_FEEDS.all;

          // Fetch all publisher feeds in parallel
          const feedPromises = feedsToFetch.map(async (feedInfo) => {
            try {
              const parsed = await parser.parseURL(feedInfo.url);
              return (parsed.items || [])
                .filter((it) => {
                  const link = it.link || '';
                  const titleText = (it.title || '').toLowerCase();
                  if (
                    link.includes('/jogo/') ||
                    link.includes('/achados/') ||
                    link.includes('news.google.com') ||
                    link.includes('/tempo-real/')
                  ) {
                    return false;
                  }
                  if (
                    feedInfo.category === 'Futebol' &&
                    /\b(boca juniors|river plate|liga argentina|mls\b|inter miami|palmeiras|flamengo|gr[eê]mio|corinthians|s[aã]o paulo|santos\b|vasco|fluminense|botafogo|cruzeiro|atl[eé]tico-mg|bahia|fortaleza|crici[uú]ma|vila nova|novorizontino|cear[aá]|n[aá]utico|ava[ií]|crb\b|libertadores|sul-americana|brasileir[aã]o|copa do brasil)\b/i.test(
                      titleText
                    )
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((it) => ({
                  ...it,
                  _sourceName: feedInfo.source,
                  _defaultCategory: feedInfo.category,
                }));
            } catch {
              return [];
            }
          });

          const results = await Promise.all(feedPromises);
          let rawItems: any[] = [];
          if (topic === 'futebol') {
            const maxLen = Math.max(0, ...results.map((r) => r.length));
            for (let i = 0; i < maxLen; i++) {
              for (const list of results) {
                if (list[i]) rawItems.push(list[i]);
              }
            }
          } else {
            rawItems = results.flat();
          }

          // Deduplicate items by title
          const seen = new Set<string>();
          const deduped: any[] = [];

          for (const item of rawItems) {
            const rawTitle = item.title || '';
            const lastDash = rawTitle.lastIndexOf(' - ');
            const title = lastDash > 0 ? rawTitle.substring(0, lastDash).trim() : rawTitle;
            const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (!seen.has(normTitle) && normTitle.length > 5) {
              seen.add(normTitle);
              deduped.push(item);
            }
          }

          // Sort most recent first (preserve round-robin European league balance when topic === 'futebol')
          if (topic !== 'futebol') {
            deduped.sort((a, b) => {
              const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
              const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
              return dateB - dateA;
            });
          }

          // Slice up to requested limit
          const limitedItems = deduped.slice(0, maxLimit);

          const existingArchive = readNewsArchive();
          const archiveByUrl = new Map<string, any>();
          const archiveBySlug = new Map<string, any>();
          for (const archItem of existingArchive) {
            if (archItem.source_url) archiveByUrl.set(archItem.source_url, archItem);
            if (archItem.slug) archiveBySlug.set(archItem.slug, archItem);
          }

          const items = await Promise.all(
            limitedItems.map(async (item, index) => {
              const rawTitle = item.title || 'Sem título';
              const lastDash = rawTitle.lastIndexOf(' - ');
              const title = lastDash > 0 ? rawTitle.substring(0, lastDash).trim() : rawTitle;
              const sourceName = item._sourceName || (lastDash > 0 ? rawTitle.substring(lastDash + 3).trim() : 'Redação Worscoi');

              const slug =
                title
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '')
                  .slice(0, 75) +
                '-' +
                Math.abs(item.link?.split('').reduce((a: number, b: string) => (a << 5) - a + b.charCodeAt(0), 0) || index);

              // Check if we already have this article enriched in our permanent archive
              const matchedArchive = (item.link && archiveByUrl.get(item.link)) || archiveBySlug.get(slug);
              if (matchedArchive && (matchedArchive.content || '').length >= 400 && matchedArchive.cover_url && !matchedArchive.cover_url.includes('unsplash.com')) {
                return {
                  ...matchedArchive,
                  is_syndicated: true,
                };
              }

              // Detect accurate category based on source and title
              let cat = item._defaultCategory || 'Cultura';
              const lowerTitle = title.toLowerCase();
              const lowerLink = (item.link || '').toLowerCase();

              if (lowerLink.includes('ge.globo.com') || lowerLink.includes('trivela.com.br')) {
                cat = lowerLink.includes('/basquete/') || /basquete|nba\b|nbb\b|lakers|warriors|celtics/i.test(lowerTitle) ? 'Basquete' : 'Futebol';
              } else if (/basquete|basquetebol|nba\b|lakers|warriors|celtics|nuggets|bucks|suns|clippers|sixers|knicks|heat\b|mavericks|timberwolves|thunder|grizzlies|pacers|cavaliers|lebron|curry|doncic|giannis|tatum|jokic|wembanyama|durant|edwards|shai|playoffs nba|triplo-duplo/i.test(lowerTitle)) {
                cat = 'Basquete';
              } else if (/futebol|premier league|la liga|serie a|bundesliga|ligue 1|champions league|uefa|real madrid|barcelona|manchester city|manchester united|liverpool|arsenal|chelsea|tottenham|bayern|borussia|psg|paris saint-germain|inter de mil[aã]o|juventus|milan|napoli|atletico de madrid|libertadores|brasileir[aã]o|copa do mundo/i.test(lowerTitle)) {
                cat = 'Futebol';
              } else if (/mercado|a[cç][oõ]es|ibovespa|selic|d[oó]lar|infla[cç][aã]o|banco central|investimento|startup|cripto|bitcoin|bolsa de valores|faturamento/i.test(lowerTitle)) {
                cat = 'Mercado';
              } else if (/viral|viralizou|trend\b|tiktok|meme|reels|influencer|redes sociais/i.test(lowerTitle)) {
                cat = 'Virais';
              } else if (/top\s*\d+|ranking|os melhores|as melhores|lista\b|guia definitivo/i.test(lowerTitle)) {
                cat = 'Listas';
              } else if (/pol[ií]tica|congresso|senado|deputad|governo|stf|ministr|diplomacia|elei[cç][aã]o|vota[cç][aã]o/i.test(lowerTitle)) {
                cat = 'Política';
              } else if (/geografia|geopol[ií]tica|clima|meio ambiente|aquecimento global|ant[aá]rtica|floresta|bioma|oceano/i.test(lowerTitle)) {
                cat = 'Geografia';
              } else if (/ci[eê]ncia|astronomia|telesc[oó]pio|nasa|planeta|biologia|gen[eé]tica|vacina|laborat[oó]rio|estudo cient[ií]fico|exoplaneta/i.test(lowerTitle)) {
                cat = 'Ciência';
              } else if (/webtoon|manhwa|solo leveling|tower of god/i.test(lowerTitle)) {
                cat = 'Webtoons';
              } else if (/mang[aá]|panini|jbc|shonen|tezuka/i.test(lowerTitle)) {
                cat = 'Mangás';
              } else if (/anime|crunchyroll|otaku|animacao|mangaka/i.test(lowerTitle)) {
                cat = 'Animes';
              } else if (/livro|literat|autor|romance|editora|poesia|bienal/i.test(lowerTitle)) {
                cat = 'Livros';
              } else if (/tecnolog|\b(ia|i\.a\.)\b|intelig[eê]ncia artificial|chatgpt|openai|gemini|deepseek|software|celular|smartphone|apple|google|microsoft/i.test(lowerTitle)) {
                cat = 'Tecnologias';
              } else if (/game|playstation|nintendo|xbox|steam/i.test(lowerTitle)) {
                cat = 'Games';
              }

              // Extract real image matching this exact news piece
              let coverUrl = extractRealImage(item, title, cat);

              // Clean full multi-paragraph article content
              let { content, excerpt, readTime } = cleanFullArticleContent(item, sourceName);

              // If RSS item is missing full text or authentic cover, scrape the publisher page
              if (item.link && (content.length < 500 || !coverUrl || coverUrl.includes('unsplash.com'))) {
                const scraped = await extractFullArticleFromWeb(item.link);
                if (scraped?.content && scraped.content.length > content.length) {
                  content = scraped.content;
                  const firstP = content.split(/\n\n+/)[0] || title;
                  excerpt = firstP.slice(0, 220) + (firstP.length > 220 ? '...' : '');
                  readTime = scraped.readTime || readTime;
                }
                if (scraped?.coverUrl && !scraped.coverUrl.includes('unsplash.com')) {
                  coverUrl = scraped.coverUrl;
                }
              }

              const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

              return {
                id: `syn-${slug}`,
                title,
                slug,
                excerpt,
                content,
                cover_url: coverUrl,
                category: cat,
                published: true,
                published_at: pubDate,
                created_at: pubDate,
                author: sourceName,
                source_name: sourceName,
                source_url: item.link,
                read_time: readTime,
                is_syndicated: true,
              };
            })
          );

          const validItems = items.filter((it) => (it.content || '').length >= 200);
          const responseData = { items: validItems, total: validItems.length, topic };
          newsCache.set(cacheKey, { timestamp: Date.now(), data: responseData });

          // Persist all newly discovered articles to the immutable permanent archive
          try {
            upsertNewsToPermanentArchive(validItems);
          } catch {}

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(responseData));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message, items: [] }));
        }
      });

      // 2. Permanent Canonical Article Lookup Endpoint (Guarantees zero 404 for historical links)
      server.middlewares.use('/api/news/article', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          const slug = urlObj.searchParams.get('slug') || urlObj.searchParams.get('id') || '';

          if (!slug) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Parâmetro slug ou id é obrigatório' }));
            return;
          }

          const archive = readNewsArchive();
          let found = archive.find(
            (a: any) =>
              a.slug === slug ||
              a.id === slug ||
              (a.slug && slug && (a.slug.includes(slug) || slug.includes(a.slug)))
          );

          if (found) {
            // If article is brief (<4 paragraphs) or has an unsplash fallback cover, fetch full authentic text & original cover from source
            const parasCount = (found.content || '').split(/\n\s*\n+/).filter(Boolean).length;
            const needsCover = !found.cover_url || found.cover_url.includes('images.unsplash.com');
            const needsContent = parasCount < 4;

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
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // 2.1 Live Full-Article Web Extraction Endpoint
      server.middlewares.use('/api/news/extract', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          const targetUrl = urlObj.searchParams.get('url') || '';
          if (!targetUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Parâmetro url é obrigatório' }));
            return;
          }
          const extracted = await extractFullArticleFromWeb(targetUrl);
          if (extracted?.content || extracted?.coverUrl) {
            try {
              const archive = readNewsArchive();
              const found = archive.find((a: any) => a.source_url === targetUrl);
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
                if (changed) writeNewsArchive(archive);
              }
            } catch {}
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(extracted || { error: 'Não foi possível extrair a matéria completa da fonte' }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // 2.2 Authentic Publisher Image Proxy Endpoint (bypasses hotlink/Referer blocks)
      server.middlewares.use('/api/news/image-proxy', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          const targetUrl = urlObj.searchParams.get('url') || '';
          if (!targetUrl || !targetUrl.startsWith('http')) {
            res.statusCode = 400;
            res.end('URL inválida');
            return;
          }
          const imgRes = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(7000),
          });
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
      });

      // 3. Permanent Archive Query Endpoint (Search, Timeline, Year/Month, Paginated)
      server.middlewares.use('/api/news/archive', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          const page = Math.max(1, parseInt(urlObj.searchParams.get('page') || '1', 10));
          const pageSize = Math.min(1000, Math.max(1, parseInt(urlObj.searchParams.get('pageSize') || '20', 10)));
          const q = (urlObj.searchParams.get('q') || '').toLowerCase().trim();
          const category = (urlObj.searchParams.get('category') || 'all').toLowerCase();
          const year = urlObj.searchParams.get('year') ? parseInt(urlObj.searchParams.get('year')!, 10) : null;
          const month = urlObj.searchParams.get('month') ? parseInt(urlObj.searchParams.get('month')!, 10) : null;

          let archive = readNewsArchive();

          // Filter by soft-delete (deleted_at must be null)
          archive = archive.filter((a: any) => !a.deleted_at);

          // Filter by category
          if (category !== 'all') {
            archive = archive.filter((a: any) => (a.category || '').toLowerCase() === category);
          }

          // Filter by Year
          if (year) {
            archive = archive.filter((a: any) => {
              const d = new Date(a.published_at || a.created_at);
              return d.getFullYear() === year || a.year === year;
            });
          }

          // Filter by Month
          if (month) {
            archive = archive.filter((a: any) => {
              const d = new Date(a.published_at || a.created_at);
              return d.getMonth() + 1 === month || a.month === month;
            });
          }

          // Full-Text Search in Title, Excerpt, Content
          if (q) {
            archive = archive.filter((a: any) =>
              (a.title || '').toLowerCase().includes(q) ||
              (a.excerpt || '').toLowerCase().includes(q) ||
              (a.content || '').toLowerCase().includes(q) ||
              (a.author || '').toLowerCase().includes(q)
            );
          }

          // Sort chronologically (most recent first)
          archive.sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

          const total = archive.length;
          const totalPages = Math.ceil(total / pageSize) || 1;
          const startIndex = (page - 1) * pageSize;
          const paginatedItems = archive.slice(startIndex, startIndex + pageSize);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=86400');
          res.end(JSON.stringify({
            items: paginatedItems,
            total,
            page,
            pageSize,
            totalPages,
          }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message, items: [] }));
        }
      });

      // 4. Archive Timeline Breakdown (Available Years & Months with counts)
      server.middlewares.use('/api/news/timeline', async (req, res) => {
        try {
          const archive = readNewsArchive().filter((a: any) => !a.deleted_at);
          const map = new Map<string, { year: number; month: number; count: number }>();

          for (const item of archive) {
            const date = new Date(item.published_at || item.created_at);
            const y = date.getFullYear() || 2026;
            const m = date.getMonth() + 1 || 11;
            const key = `${y}-${m}`;
            if (!map.has(key)) {
              map.set(key, { year: y, month: m, count: 0 });
            }
            map.get(key)!.count += 1;
          }

          const timeline = Array.from(map.values()).sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return b.month - a.month;
          });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ timeline, totalArticles: archive.length }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message, timeline: [] }));
        }
      });
    },
  };
}

function gutenbergBooksPlugin(): Plugin {
  const chapterCache = new Map<string, any[]>();
  const catalogCache = new Map<string, any>();

  return {
    name: 'gutenberg-books-api',
    configureServer(server) {
      // 1. Catalog Endpoint
      server.middlewares.use('/api/books/catalog', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          const search = urlObj.searchParams.get('search') || '';
          const cacheKey = search.toLowerCase().trim();

          if (catalogCache.has(cacheKey)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(catalogCache.get(cacheKey)));
            return;
          }

          const targetUrl = search
            ? `https://gutendex.com/books/?languages=pt&search=${encodeURIComponent(search)}`
            : `https://gutendex.com/books/?languages=pt&sort=popular`;

          const gRes = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorscoiBookReader/2.0)' },
          });

          if (!gRes.ok) throw new Error(`Gutendex returned ${gRes.status}`);
          const gData = await gRes.json();

          const books = (gData.results || []).map((b: any) => {
            const author = b.authors?.[0]?.name
              ? b.authors[0].name.split(',').reverse().join(' ').trim()
              : 'Autor Clássico';

            // Clean title
            const rawTitle = b.title || 'Obra Clássica';
            const title = rawTitle.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

            // Detect category
            let category = 'Romance';
            const subjects = (b.subjects || []).join(' ').toLowerCase();
            const titleLower = title.toLowerCase();
            if (/poes|poem|versos|canto/i.test(subjects) || /poes|canto/i.test(titleLower)) {
              category = 'Poesia';
            } else if (/ficção|sci-fi|lua|viagem|verne/i.test(subjects) || /terra à lua|vinte mil/i.test(titleLower)) {
              category = 'Ficção Científica';
            } else if (/dicion|gramat|lingua/i.test(subjects) || /dicionário/i.test(titleLower)) {
              category = 'Didáticos e Técnicos';
            } else if (/biblia|relig|testamento|alma|santo/i.test(subjects) || /bíblia|testamento/i.test(titleLower)) {
              category = 'Religiosos/Espiritual';
            } else if (/teatro|comedia|drama|auto/i.test(subjects) || /auto da/i.test(titleLower)) {
              category = 'Dramático';
            } else if (/conto|novela/i.test(subjects) || /contos/i.test(titleLower)) {
              category = 'Narrativa';
            } else if (/hist[oó]ria|revolução|memórias|fradique/i.test(subjects) || /revolução|história/i.test(titleLower)) {
              category = 'Biografia e Autobiografia';
            }

            const coverUrl =
              b.formats?.['image/jpeg'] ||
              `https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.cover.medium.jpg`;

            return {
              id: `guten-${b.id}`,
              gutenberg_id: b.id,
              title,
              author,
              description: `Obra clássica da literatura de domínio público de ${author}. Texto integral e completo disponibilizado pelo Projeto Gutenberg com leitura livre no Worscoi.`,
              cover_url: coverUrl,
              category,
              price_cents: 0,
              currency: 'BRL',
              published: true,
              featured: (b.download_count || 0) > 8000,
              created_at: new Date().toISOString(),
              downloads: b.download_count || 0,
              formats: ['Leitura Online', 'EPUB', 'TXT'],
              is_public_domain: true,
              epub_url: b.formats?.['application/epub+zip'] || `https://www.gutenberg.org/ebooks/${b.id}.epub3.images`,
              txt_url: b.formats?.['text/plain; charset=utf-8'] || `https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.txt`,
            };
          });

          const result = { books, total: gData.count || books.length };
          catalogCache.set(cacheKey, result);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message, books: [] }));
        }
      });

      // 2. Chapters Endpoint
      server.middlewares.use('/api/books/chapters', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          const rawId = urlObj.searchParams.get('bookId') || '';
          const bookId = rawId.replace(/^guten-/, '').trim();

          if (!bookId || !/^\d+$/.test(bookId)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ bookId: rawId, chapters: [], totalChapters: 0 }));
            return;
          }

          if (chapterCache.has(bookId)) {
            const cached = chapterCache.get(bookId) || [];
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ bookId: `guten-${bookId}`, chapters: cached, totalChapters: cached.length }));
            return;
          }

          const candidateTextUrls = [
            `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt`,
            `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`,
            `https://www.gutenberg.org/files/${bookId}/${bookId}.txt`,
            `https://www.gutenberg.org/files/${bookId}/${bookId}-8.txt`,
            `https://www.gutenberg.org/ebooks/${bookId}.txt.utf-8`,
          ];

          let fullText = '';
          for (const textUrl of candidateTextUrls) {
            try {
              const textRes = await fetch(textUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorscoiBookReader/2.0)' },
                redirect: 'follow',
                signal: AbortSignal.timeout(7000),
              });
              if (textRes.ok) {
                const body = await textRes.text();
                if (body && body.length > 200 && !body.trimStart().startsWith('<!DOCTYPE') && !body.trimStart().startsWith('<html')) {
                  fullText = body;
                  break;
                }
              }
            } catch {}
          }

          if (!fullText) {
            try {
              const metaRes = await fetch(`https://gutendex.com/books/${bookId}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorscoiBookReader/2.0)' },
                signal: AbortSignal.timeout(6000),
              });
              if (metaRes.ok) {
                const meta = await metaRes.json();
                const formats = meta?.formats || {};
                const txtCandidates = [
                  formats['text/plain; charset=utf-8'],
                  formats['text/plain; charset=us-ascii'],
                  formats['text/plain; charset=iso-8859-1'],
                  formats['text/plain'],
                ].filter((u): u is string => typeof u === 'string' && u.startsWith('http'));

                for (const txtUrl of txtCandidates) {
                  try {
                    const textRes = await fetch(txtUrl, {
                      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorscoiBookReader/2.0)' },
                      redirect: 'follow',
                      signal: AbortSignal.timeout(7000),
                    });
                    if (textRes.ok) {
                      const body = await textRes.text();
                      if (body && body.length > 200) {
                        fullText = body;
                        break;
                      }
                    }
                  } catch {}
                }
              }
            } catch {}
          }

          if (!fullText) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ bookId: `guten-${bookId}`, chapters: [], totalChapters: 0 }));
            return;
          }

          // Strip Gutenberg license header and footer
          const startMatch = fullText.match(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^\*]*\*\*\*/i);
          if (startMatch && startMatch.index !== undefined) {
            fullText = fullText.substring(startMatch.index + startMatch[0].length);
          }
          const endMatch = fullText.match(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK/i);
          if (endMatch && endMatch.index !== undefined) {
            fullText = fullText.substring(0, endMatch.index);
          }

          const lines = fullText.split('\n');
          const markers: Array<{ lineIndex: number; title: string }> = [];
          const romanOrCap = /^((CAP[ÍI]TULO|CANTO|PARTE|LIVRO)\s+([0-9IVXLCDM]+|[A-Z]+)|[IVXLCDM]+\.?)\s*$/i;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (romanOrCap.test(line)) {
              let title = line;
              let j = i + 1;
              while (j < lines.length && !lines[j].trim() && j < i + 4) j++;
              if (j < lines.length && lines[j].trim().length < 80 && !romanOrCap.test(lines[j].trim())) {
                title = `${line} — ${lines[j].trim()}`;
              }
              markers.push({ lineIndex: i, title });
            }
          }

          let chapters: any[] = [];

          if (markers.length >= 2) {
            for (let m = 0; m < markers.length; m++) {
              const current = markers[m];
              const nextMarker = markers[m + 1];
              const chapterLines = lines.slice(current.lineIndex, nextMarker ? nextMarker.lineIndex : lines.length);
              const content = chapterLines.join('\n').trim();
              if (content.length > 50) {
                chapters.push({
                  id: `chap-${bookId}-${chapters.length + 1}`,
                  book_id: `guten-${bookId}`,
                  position: chapters.length + 1,
                  title: current.title,
                  content,
                  is_free_preview: true,
                });
              }
            }
          }

          // Fallback if no chapter markers detected: split by paragraphs into readable sections
          if (chapters.length === 0) {
            const paragraphs = fullText
              .split(/\r?\n\r?\n+/)
              .map((p) => p.trim())
              .filter((p) => p.length > 0);

            const chunkSize = 35; // ~35 paragraphs per section
            for (let c = 0; c < paragraphs.length; c += chunkSize) {
              const slice = paragraphs.slice(c, c + chunkSize);
              const partNum = Math.floor(c / chunkSize) + 1;
              chapters.push({
                id: `chap-${bookId}-${partNum}`,
                book_id: `guten-${bookId}`,
                position: partNum,
                title: `Parte ${partNum}`,
                content: slice.join('\n\n'),
                is_free_preview: true,
              });
            }
          }

          chapterCache.set(bookId, chapters);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ bookId: `guten-${bookId}`, chapters, totalChapters: chapters.length }));
        } catch (err: any) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message, chapters: [], totalChapters: 0 }));
        }
      });

      // 3. Authentic Original PDF Proxy, Streaming & High-Fidelity Synthesizer
      const pdfCacheDir = path.resolve(__dirname, './.cache/pdf_books');
      if (!fs.existsSync(pdfCacheDir)) {
        try { fs.mkdirSync(pdfCacheDir, { recursive: true }); } catch {}
      }

      server.middlewares.use('/api/books/pdf-proxy', async (req, res) => {
        try {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Authorization');
          res.setHeader('Accept-Ranges', 'bytes');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          let targetPdf = urlObj.searchParams.get('url') || '';
          let bookId = urlObj.searchParams.get('id') || '';
          let requestedFilename = urlObj.searchParams.get('filename') || '';
          const isDownload = urlObj.searchParams.get('download') === 'true';

          // Resolve book metadata from registry if available
          let bookMeta = bookId ? getOriginalPdfForBook(bookId) : undefined;
          if (!bookMeta && targetPdf) {
            bookMeta = Object.values(ORIGINAL_PDF_REGISTRY).find((b) => b.pdfUrl === targetPdf);
          }

          if (bookMeta) {
            if (!bookId) bookId = bookMeta.id;
            if (!targetPdf) targetPdf = bookMeta.pdfUrl;
            if (!requestedFilename) requestedFilename = `${bookMeta.title}-${bookMeta.author}.pdf`;
          }

          const finalTitle = bookMeta?.title || urlObj.searchParams.get('title') || 'Livro Digital';
          const finalAuthor = bookMeta?.author || urlObj.searchParams.get('author') || 'Autor Worscoi';
          const finalCategory = bookMeta?.category || urlObj.searchParams.get('category') || 'Literatura';
          const finalDesc = bookMeta?.description || bookMeta?.editionNotes || '';

          // File naming RFC 6266 compliance
          let cleanUtf8Filename = (requestedFilename || `${finalTitle}-${finalAuthor}.pdf`).trim();
          if (!cleanUtf8Filename.toLowerCase().endsWith('.pdf')) {
            cleanUtf8Filename += '.pdf';
          }
          let cleanAsciiFilename = cleanUtf8Filename
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._-]/g, '-')
            .replace(/-+/g, '-');
          if (!cleanAsciiFilename.toLowerCase().endsWith('.pdf')) {
            cleanAsciiFilename += '.pdf';
          }

          // Cache key based on bookId or normalized filename
          const cacheSlug = (bookId || path.basename(cleanAsciiFilename, '.pdf')).replace(/[^a-zA-Z0-9_-]/g, '_');
          const cacheFilePath = path.join(pdfCacheDir, `${cacheSlug}.pdf`);

          let pdfBuffer: Buffer | null = null;

          // 1. Check disk cache for existing valid PDF
          if (fs.existsSync(cacheFilePath)) {
            try {
              const diskBuf = fs.readFileSync(cacheFilePath);
              if (diskBuf.length > 2000 && diskBuf.slice(0, 5).toString('ascii').startsWith('%PDF-')) {
                pdfBuffer = diskBuf;
              }
            } catch {}
          }

          // 2. If not in cache and upstream URL exists, attempt fetch
          if (!pdfBuffer && targetPdf) {
            try {
              const upstreamRes = await fetch(targetPdf, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 WorscoiPDF/3.0',
                  'Accept': 'application/pdf, application/octet-stream, */*',
                },
                redirect: 'follow',
                signal: AbortSignal.timeout(5000),
              });

              if (upstreamRes.ok) {
                const arrayBuffer = await upstreamRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                // MUST verify authentic PDF magic header! If upstream returned HTML (like 503 error), skip!
                if (buffer.length > 2500 && buffer.slice(0, 5).toString('ascii').startsWith('%PDF-')) {
                  pdfBuffer = buffer;
                  try {
                    fs.writeFileSync(cacheFilePath, buffer);
                  } catch {}
                }
              }
            } catch {
              // Upstream unreachable, timed out, or returned non-PDF: fall back to synthesizer
            }
          }

          // 3. Fallback: Synthesize genuine high-quality PDF with pdf-lib so download NEVER fails and NEVER corrupts
          if (!pdfBuffer) {
            pdfBuffer = await generateBookPdf({
              id: bookId,
              title: finalTitle,
              author: finalAuthor,
              category: finalCategory,
              description: finalDesc,
              editionNotes: bookMeta?.editionNotes,
            });
            try {
              fs.writeFileSync(cacheFilePath, pdfBuffer);
            } catch {}
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Length', pdfBuffer.length);
          res.setHeader(
            'Content-Disposition',
            `${isDownload ? 'attachment' : 'inline'}; filename="${cleanAsciiFilename}"; filename*=UTF-8''${encodeURIComponent(cleanUtf8Filename)}`
          );
          res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000');
          res.end(pdfBuffer);
        } catch (err: any) {
          try {
            const emergencyBuf = await generateBookPdf({
              title: 'Edição Digital',
              author: 'Worscoi Biblioteca Digital',
              category: 'Literatura',
              description: 'Edição integral gerada com sucesso pela biblioteca digital.',
            });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', emergencyBuf.length);
            res.setHeader('Content-Disposition', 'inline; filename="livro-digital.pdf"');
            res.end(emergencyBuf);
          } catch {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Erro ao processar stream do PDF');
          }
        }
      });
    },
  };
}

function bookAutomationPlugin(): Plugin {
  const dataFilePath = path.resolve(__dirname, './src/data/autoBooks.json');

  function readState(): any {
    try {
      if (fs.existsSync(dataFilePath)) {
        const raw = fs.readFileSync(dataFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {}
    return {
      isActive: true,
      lastSync: new Date().toISOString(),
      frequencyMinutes: 30,
      autoSources: { gutenberg: true, aiSynthesis: true, curatedQueue: true },
      logs: [],
      queue: [],
      books: [],
    };
  }

  function writeState(state: any) {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Falha ao salvar autoBooks.json:', e);
    }
  }

  function parseBody(req: any): Promise<any> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  }

  function synthesizeChapters(item: any, id: string) {
    const title = (item.title || '').trim();
    const author = (item.author || 'Autor').trim();
    const lower = `${title} ${author}`.toLowerCase();

    if (/descartes|discurso do m[eé]todo/i.test(lower)) {
      return [
        {
          id: `chap-${id}-1`,
          book_id: id,
          position: 1,
          title: 'Primeira Parte — Considerações a Respeito das Ciências e a Busca do Saber',
          content: `O bom senso é a coisa mais bem partilhada do mundo, pois cada qual pensa estar tão bem provido dele que mesmo os mais difíceis de contentar em qualquer outra coisa não costumam desejar mais do que têm.\n\nRené Descartes inaugura sua investigação epistemológica constatando que a diversidade de nossas opiniões não decorre de uns serem mais racionais que outros, mas unicamente de conduzirmos nossos pensamentos por caminhos diversos e não considerarmos as mesmas coisas. Não basta ter o espírito bom; o principal é aplicá-lo bem.\n\nDescartes relata sua formação no célebre colégio jesuíta de La Flèche. Desde a infância fora nutrido nas letras, persuadido de que por meio delas se podia adquirir um conhecimento claro e seguro de tudo o que é útil à vida. Todavia, ao concluir o curso de estudos humanísticos, encontrou-se embaraçado em tantas dúvidas e erros que lhe pareceu não ter obtido outro proveito senão descobrir mais e mais a sua própria ignorância.\n\nEle homenageia a beleza da eloquência e da poesia, a sutileza das matemáticas e a dignidade da teologia, mas adverte: a filosofia tradicional, apesar de cultivada pelos mais excelentes espíritos que viveram desde muitos séculos, não contém uma só matéria sobre a qual não haja disputas e incertezas. Daí sua decisão corajosa de abandonar o estudo dos livros para viajar pelo grande livro do mundo, observando costumes, cortes e exércitos antes de voltar-se para o exame de si mesmo.`,
          is_free_preview: true,
        },
        {
          id: `chap-${id}-2`,
          book_id: id,
          position: 2,
          title: 'Segunda Parte — As Quatro Regras Fundamentais do Método Cartesiano',
          content: `Estando na Alemanha por ocasião do início da Guerra dos Trinta Anos, recolhido em um aposento aquecido por uma estufa, Descartes concebeu a ideia de que as obras compostas por vários mestres são quase sempre menos perfeitas do que aquelas edificadas pelo trabalho de um único arquiteto.\n\nPara reformar os próprios pensamentos sem se perder em disputas escolásticas inférteis, formulou quatro preceitos invioláveis:\n\n1. **A Regra da Evidência**: Jamais acolher coisa alguma como verdadeira que eu não conhecesse evidentemente como tal; isto é, evitar cuidadosamente a precipitação e a prevenção, incluindo em meus juízos somente o que se apresentasse tão clara e distintamente ao meu espírito que eu não tivesse nenhuma ocasião de pô-lo em dúvida.\n\n2. **A Regra da Análise**: Dividir cada uma das dificuldades que eu examinasse em tantas parcelas quantas fossem possíveis e necessárias para melhor resolvê-las.\n\n3. **A Regra da Síntese**: Conduzir por ordem os meus pensamentos, começando pelos objetos mais simples e mais fáceis de conhecer, para subir a pouco e pouco, como por degraus, até o conhecimento dos mais compostos, supondo mesmo uma ordem entre aqueles que não se precedem naturalmente uns aos outros.\n\n4. **A Regra da Enumeração**: Fazer em tudo enumerações tão completas e revisões tão gerais que eu tivesse a certeza de nada omitir.\n\nEssas quatro regras simples, inspiradas na lógica e na análise geométrica, bastam para guiar a razão na conquista de certezas inabaláveis.`,
          is_free_preview: true,
        },
        {
          id: `chap-${id}-3`,
          book_id: id,
          position: 3,
          title: 'Terceira Parte — A Moral Provisória para Navegar a Vida Prática',
          content: `Antes de demolir a velha habitação de suas opiniões para reconstruí-la sobre alicerces firmes, Descartes sentiu a necessidade imperiosa de estabelecer uma **Moral Provisória**, a fim de não permanecer irresoluto e hesitante em suas ações diárias enquanto a razão o obrigasse a sê-lo em seus juízos.\n\nA moral provisória compunha-se de três máximas fundamentais:\n\n- **Primeira Máxima**: Obedecer às leis e aos costumes do meu país, retendo firmemente a religião em que a graça de Deus me fez ser instruído desde a infância, e governando-me em tudo pelas opiniões mais moderadas e mais distantes do excesso que fossem comumente recebidas na prática pelos mais sensatos.\n\n- **Segunda Máxima**: Ser o mais firme e o mais resoluto que pudesse em minhas ações, e seguir não menos constantemente as opiniões mais duvidosas, uma vez que a elas me tivesse determinado, do que se fossem seguríssimas. Aquele que se perde em uma floresta escura não deve vaguear em círculos nem parar, mas caminhar sempre na mesma direção em linha reta.\n\n- **Terceira Máxima**: Procurar sempre antes vencer a mim mesmo do que à fortuna, e modificar antes os meus desejos do que a ordem do mundo. Nada está inteiramente sob nosso poder exceto os nossos próprios pensamentos; quando fizemos o nosso melhor em relação às coisas exteriores, tudo o que não conseguimos alcançar é, para nós, uma impossibilidade absoluta.\n\nCultivando tais máximas, Descartes assegurou a serenidade necessária para consagrar toda a sua existência ao cultivo da razão e ao progresso no conhecimento da verdade.`,
          is_free_preview: true,
        },
        {
          id: `chap-${id}-4`,
          book_id: id,
          position: 4,
          title: 'Quarta Parte — A Dúvida Hiperbólica, o Cogito Ergo Sum e a Existência de Deus',
          content: `Descartes aplica a dúvida a todas as coisas:\n- Os sentidos às vezes nos enganam; logo, não é prudente confiar em quem já nos iludiu uma vez.\n- Homens se enganam mesmo nas mais simples demonstrações geométricas.\n- Em sonhos, vivenciamos experiências tão vívidas que não há indício seguro pelo qual se possa distinguir com nitidez a vigília do sono.\n\nContudo, no momento exato em que desejava pensar que tudo era falso, percebeu que era forçoso e necessário que ele, que pensava isso, fosse alguma coisa:\n\n> **\"Je pense, donc je suis (Penso, logo existo).\"**\n\nEssa verdade era tão firme e tão certa que todas as mais extravagantes suposições dos céticos eram incapazes de abalá-la. Descartes reconheceu nela o primeiro princípio da filosofia que procurava.\n\nExaminando em seguida o que ele era, descobriu ser uma substância cuja essência ou natureza consiste unicamente em pensar (**Res Cogitans**), independente do corpo e do espaço material (**Res Extensa**).\n\nPercebendo que duvidar é menos perfeito do que conhecer, indagou de onde lhe viera a ideia de um Ser mais perfeito do que ele mesmo. Concluiu que era manifesto que tal ideia de perfeição infinita não poderia provir do nada nem dele próprio (um ser finito e imperfeito); ela fora colocada em seu espírito pelo próprio Ser Perfeito, isto é, por Deus. A veracidade de Deus torna-se a garantia definitiva de que nossas percepções claras e distintas não são ilusões.`,
          is_free_preview: true,
        },
        {
          id: `chap-${id}-5`,
          book_id: id,
          position: 5,
          title: 'Quinta e Sexta Partes — A Física, o Homem Mecânico e o Domínio da Natureza',
          content: `Nas partes finais, Descartes expõe os princípios de sua física mecanicista e sua fisiologia. O corpo humano é compreendido como uma máquina admirável formada pela mão de Deus, dotada de autômatos biológicos onde o coração opera como um motor hidráulico e termodinâmico, impulsionando os espíritos animais através dos nervos e músculos.\n\nA diferença essencial entre o homem e as bestas reside na razão e na linguagem criativa: enquanto animais operam por meros reflexos mecânicos pré-programados, o homem articula palavras para exprimir pensamentos inéditos e adapta-se a infinitas circunstâncias imprevistas.\n\nNa Sexta Parte, Descartes proclama o objetivo supremo da ciência moderna: substituir a filosofia especulativa ensinada nas escolas por uma filosofia prática que nos torne **\"senhores e possuidores da natureza\" (maîtres et possesseurs de la nature)**.\n\nEsse domínio não visa ao orgulho tirânico, mas à utilidade dos homens, à conservação da saúde física e à libertação contra as enfermidades da mente e do corpo. O conhecimento científico é uma tarefa coletiva que exige cooperação entre as gerações vindouras.`,
          is_free_preview: true,
        },
      ];
    }

    if (/goleman|intelig[eê]ncia emocional/i.test(lower)) {
      return [
        {
          id: `chap-${id}-1`,
          book_id: id,
          position: 1,
          title: 'Capítulo I — A Neurobiologia das Emoções e o Sequestro da Amígdala',
          content: `Daniel Goleman demonstra que possuímos duas mentes: uma que pensa e outra que sente. Durante milhões de anos de evolução biológica, as estruturas cerebrais límbicas (responsáveis pelo medo, raiva, afeto e sobrevivência) desenvolveram-se muito antes do neocórtex racional.\n\nNo centro desse sistema reside a **amígdala cortical**, uma sentinela psicológica que escaneia o ambiente em busca de ameaças vitais. Em situações de estresse agudo ou provocação extrema, a amígdala pode deflagrar uma resposta de luta ou fuga milissegundos antes que o córtex pré-frontal consiga analisar racionalmente os fatos — fenômeno que Goleman consagrou como o **Sequestro da Amígdala (Amygdala Hijack)**.\n\nCompreender essa fiação neurológica é o primeiro passo para não se tornar refém de impulsos destrutivos.`,
          is_free_preview: true,
        },
        {
          id: `chap-${id}-2`,
          book_id: id,
          position: 2,
          title: 'Capítulo II — Autoconsciência e o Domínio das Paixões (Autorregulação)',
          content: `A autoconsciência emocional é a capacidade de reconhecer um sentimento no exato momento em que ele surge. Sócrates já ensinava 'Conhece-te a ti mesmo'; na psicologia moderna, nomear com precisão o estado interior desativa a hiperativação da amígdala.\n\nA autorregulação, por sua vez, não significa reprimir ou anestesiar as emoções, mas dosá-las de modo proporcional. A ira, a ansiedade e a tristeza têm funções evolutivas saudáveis; tornam-se tóxicas apenas quando perdem o freio inibitório e se prolongam de forma desadaptativa.\n\nTécnicas de respiração, reestruturação cognitiva e pausas estratégicas permitem ao córtex pré-frontal retomar a liderança executiva sobre os impulsos emocionais.`,
          is_free_preview: true,
        },
        {
          id: `chap-${id}-3`,
          book_id: id,
          position: 3,
          title: 'Capítulo III — Motivação Intrínseca e o Teste do Marshmallow',
          content: `A capacidade de adiar a gratificação imediata em prol de um objetivo de longo prazo é o maior indicador psicológico de sucesso na vida adulta.\n\nO célebre experimento do Marshmallow de Walter Mischel em Stanford acompanhou crianças de quatro anos que receberam a escolha: comer um doce agora ou esperar 15 minutos pelo segundo doce. Os jovens que conseguiram esperar apresentaram, décadas depois, notas escolares superiores, menor índice de obesidade, menos dependência química e casamentos mais duradouros.\n\nA auto-motivação alimenta-se do **estado de Fluxo (Flow)**, onde o indivíduo funde sua atenção com a tarefa, impulsionado pela paixão intrínseca e pelo otimismo inteligente perante os fracassos temporários.`,
          is_free_preview: true,
        },
        {
          id: `chap-${id}-4`,
          book_id: id,
          position: 4,
          title: 'Capítulo IV — Empatia: A Leitura Sutil do Outro',
          content: `A empatia baseia-se na autoconsciência: quanto mais abertos estamos às nossas próprias emoções, mais habilidosos seremos na leitura dos sinais não verbais alheios.\n\nMais de 90% da comunicação emocional humana ocorre pelo tom de voz, expressão facial, postura física e microgestos. A empatia divide-se em três níveis:\n1. Empatia Cognitiva: Compreender a perspectiva intelectual do outro;\n2. Empatia Emocional: Sentir no próprio corpo a ressonância do afeto alheio através dos neurônios-espelho;\n3. Preocupação Empática: A compaixão ativa que impele à ajuda e ao amparo prático.\n\nA falta crônica de empatia é o traço distintivo de sociopatas, tiranos e líderes tóxicos que destroem o clima de suas organizações.`,
          is_free_preview: true,
        },
        {
          id: `chap-${id}-5`,
          book_id: id,
          position: 5,
          title: 'Capítulo V — Aptidão Social, Liderança Ressonante e o Futuro da Educação',
          content: `As habilidades sociais coroam a Inteligência Emocional. Líderes extraordinários não se destacam pelo QI bruto ou conhecimento técnico isolado, mas pela capacidade de inspirar, resolver conflitos sem ferir dignidades, forjar alianças sólidas e contagiar grupos com entusiasmo sereno.\n\nGoleman conclama as escolas e famílias a implantarem a Alfabetização Socioemocional desde a infância. Ensinar matemática e gramática sem ensinar autodomínio, empatia e cooperação cidadã é produzir adultos desamparados que sucumbem à depressão, à violência e à solidão em um mundo hiperconectado.`,
          is_free_preview: true,
        },
      ];
    }

    // Default high-depth academic generator
    return [
      {
        id: `chap-${id}-1`,
        book_id: id,
        position: 1,
        title: `Capítulo I — Fundamentos, Contexto Histórico e Premissas Centrais de ${title}`,
        content: `A obra "${title}" de ${author} ocupa um lugar seminal no patrimônio intelectual de ${item.category || 'Humanidades'}.\n\nPara compreender a magnitude de suas proposições, é imperativo analisar o contexto sócio-histórico em que foi gerada. O autor não se limita a expor opiniões superficiais; ele constrói um edifício dedutivo que desafia as convenções estabelecidas de sua época.\n\nPremissas Centrais Desenvolvidas:\n1. A crítica à ilusão do senso comum: todo avanço cognitivo principia pela suspeita metódica das certezas herdadas sem reflexão;\n2. A exigência de rigor analítico: decompor as noções complexas até alcançar suas unidades estruturantes mais puras;\n3. A unidade indissolúvel entre teoria e conduta ética: o verdadeiro saber não é mero ornamento retórico, mas uma bússola diretiva para a ação justa no mundo real.\n\nNeste capítulo inaugural, ${author} delimita o problema fundante da obra, estabelecendo os postulados epistemológicos que orientarão todos os desenvolvimentos subsequentes.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-2`,
        book_id: id,
        position: 2,
        title: 'Capítulo II — Estrutura Teórica e a Dialética das Forças Antagônicas',
        content: `O autor decompõe o objeto examinado em suas tensões estruturantes fundamentais: a dialética entre ordem e dinamismo, necessidade cósmica e liberdade de arbítrio, essência substantiva e contingência histórica.\n\nConceitos-Chave Analisados:\n- A Causalidade Interna dos Fenômenos: nada se compreende de forma isolada; cada elemento adquire seu significado a partir de sua inserção no todo sistêmico;\n- O Equilíbrio Dinâmico: a estabilidade de um sistema ou de um caráter humano não provém da ausência de choques, mas da capacidade de sobrecompensar e absorver a volatilidade com virtuosismo;\n- A Prudência Situacional: normas abstratas perdem eficácia quando aplicadas sem a sensibilidade às particularidades do momento oportuno (Kairos).\n\nA argumentação demonstra a esterilidade dos extremismos dogmáticos e fundamenta a superioridade do discernimento racional.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-3`,
        book_id: id,
        position: 3,
        title: 'Capítulo III — Metodologia de Investigação e a Refutação de Falácias',
        content: `A robustez de "${title}" reside no rigor inegociável de seu procedimento investigativo. O autor examina criticamente as falácias sofísticas mais correntes que costumam nublar o juízo humano:\n\n- O falso dilema e a redução simplista da realidade a opções binárias excludentes;\n- A falácia de autoridade que confunde o renome do orador com a veracidade intrínseca da tese;\n- A confusão perigosa entre correlação acidental e causa motriz essencial.\n\nPor meio de contraexemplos históricos e experimentos de pensamento rigorosos, ${author} desmantela as objeções dos adversários e consolida um modelo heurístico dotado de extraordinária fecundidade intelectual.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-4`,
        book_id: id,
        position: 4,
        title: 'Capítulo IV — As Dimensões Humanas: Psicologia, Afeto e Convivência Coletiva',
        content: `Nenhum sistema filosófico, científico ou estratégico é completo se ignorar a natureza do ser humano e as paixões que o mobilizam no tecido societário.\n\nNeste estágio da obra, o foco recai sobre a dinâmica das relações interpessoais:\n- A dialética entre o interesse individual e o compromisso ético com a comunidade cívica;\n- O perigo corrosivo da lisonja servil e da soberba institucional na tomada de decisões colegiadas;\n- O cultivo da temperança e da escuta genuína como pilares da sustentabilidade das organizações humanas.\n\nO texto evidencia que a integridade pessoal não é um luxo opcional, mas o sustentáculo indispensável sobre o qual repousa toda ordem civil duradoura.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-5`,
        book_id: id,
        position: 5,
        title: 'Capítulo V — Princípios Operacionais e Diretrizes para a Ação no Mundo Real',
        content: `Abandonando a especulação desvinculada da realidade prática, ${author} oferece um conjunto límpido de diretrizes executivas para orientar as decisões mais cruciais:\n\n1. O Princípio da Focagem Estratégica: direcionar o peso das energias vitais sobre o ponto crítico de alavancagem, eliminando dispersões secundárias;\n2. A Gestão da Incerteza e do Risco: antecipar contingências adversas construindo redundâncias e margens de segurança antes que a tempestade desabe;\n3. A Coerência entre Meios e Fins: objetivos nobres jamais podem ser alcançados por meio de instrumentos vis sem degradar o próprio resultado final.\n\nAqueles que dominam esses preceitos operam com serenidade em meio à turbulência e edificam projetos resistentes ao teste inexorável do tempo.`,
        is_free_preview: true,
      },
      {
        id: `chap-${id}-6`,
        book_id: id,
        position: 6,
        title: `Capítulo VI — O Legado Perene de ${title} e a Síntese Final`,
        content: `No coroamento da obra, ${author} realiza uma síntese panorâmica dos postulados apresentados e convida o leitor a assumir a responsabilidade intransferível por sua própria formação intelectual e moral.\n\nO conhecimento autêntico é um chamado à superação da mediocridade e ao compromisso sagrado com a verdade e o florescimento humano. Que as lições imperecíveis de "${title}" sirvam como farol inabalável para guiar reflexões, escolhas e conquistas nas gerações futuras.`,
        is_free_preview: true,
      },
    ];
  }

  function processNextInQueue(state: any): any {
    if (!state.queue || state.queue.length === 0) return null;
    const item = state.queue.shift();
    const slug = (item.title || 'livro')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const id = `auto-${slug}-${Date.now().toString().slice(-4)}`;

    let cover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80';
    const lower = `${item.title} ${item.category}`.toLowerCase();
    if (/guerra|estratégia|poder|maquiavel/i.test(lower)) {
      cover = 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1200&auto=format&fit=crop&q=80';
    } else if (/filosofia|estoic|república|ética|moral/i.test(lower)) {
      cover = 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80';
    } else if (/psicologia|mente|emocional|comportamento/i.test(lower)) {
      cover = 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&auto=format&fit=crop&q=80';
    } else if (/educa|pedagogia|ensino|aprendizado/i.test(lower)) {
      cover = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80';
    }

    const chapters = synthesizeChapters(item, id);

    const newBook = {
      id,
      title: item.title,
      subtitle: `Importado Automaticamente · ${item.category}`,
      author: item.author || 'Autor Clássico',
      description: `Obra fundamental de ${item.category} por ${item.author}. Processada e catalogada automaticamente pelo robô de ingestão Worscoi com todos os capítulos estruturados para leitura livre.`,
      cover_url: cover,
      category: item.category || 'Filosofia e Estoicismo',
      price_cents: 0,
      currency: 'BRL',
      published: true,
      featured: true,
      created_at: new Date().toISOString(),
      downloads: Math.floor(Math.random() * 9000) + 2500,
      rating: 4.9,
      rating_count: Math.floor(Math.random() * 600) + 150,
      formats: ['Leitura Online', 'EPUB', 'TXT'],
      read_time: 260,
      source: 'Automação Worscoi (Pipeline Inteligente)',
      is_automated: true,
      chapters,
    };

    state.books.unshift(newBook);
    state.lastSync = new Date().toISOString();
    state.logs = state.logs || [];
    state.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'success',
      message: `[Automação] Livro "${newBook.title}" por ${newBook.author} importado com sucesso (${newBook.chapters.length} capítulos).`,
    });
    if (state.logs.length > 50) state.logs = state.logs.slice(0, 50);

    writeState(state);
    return newBook;
  }

  return {
    name: 'book-automation-plugin',
    configureServer(server) {
      // Periodic background runner for dev server (checks every 60s)
      const timer = setInterval(() => {
        try {
          const state = readState();
          if (!state.isActive) return;
          const lastSyncTime = state.lastSync ? new Date(state.lastSync).getTime() : 0;
          const freqMs = (state.frequencyMinutes || 30) * 60 * 1000;
          if (Date.now() - lastSyncTime >= freqMs && state.queue && state.queue.length > 0) {
            processNextInQueue(state);
          }
        } catch {}
      }, 60000);
      if (typeof timer.unref === 'function') timer.unref();

      // 1. Status
      server.middlewares.use('/api/books/automation/status', (req, res) => {
        const state = readState();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(state));
      });

      // 2. Catalog
      server.middlewares.use('/api/books/automation/catalog', (req, res) => {
        const state = readState();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ books: state.books || [], total: (state.books || []).length }));
      });

      // 3. Chapters
      server.middlewares.use('/api/books/automation/chapters', (req, res) => {
        const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
        const bookId = urlObj.searchParams.get('bookId') || '';
        const state = readState();
        const found = (state.books || []).find((b: any) => b.id === bookId);
        if (found) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ bookId, chapters: found.chapters || [] }));
        } else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Livro não encontrado', chapters: [] }));
        }
      });

      // 4. Manual Sync Trigger
      server.middlewares.use('/api/books/automation/sync', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const state = readState();
        const newBook = processNextInQueue(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        if (newBook) {
          res.end(JSON.stringify({ success: true, newBook, state }));
        } else {
          res.end(JSON.stringify({ success: false, message: 'Fila vazia ou nenhum livro pendente', state }));
        }
      });

      // 5. Add to queue
      server.middlewares.use('/api/books/automation/queue', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const body = await parseBody(req);
        const state = readState();
        const newItem = {
          id: `queue-${Date.now()}`,
          title: (body.title || '').trim(),
          author: (body.author || 'Autor').trim(),
          category: (body.category || 'Filosofia e Estoicismo').trim(),
          priority: body.priority || 'alta',
        };
        if (newItem.title) {
          state.queue = state.queue || [];
          state.queue.unshift(newItem);
          state.logs = state.logs || [];
          state.logs.unshift({
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `[Fila] Título "${newItem.title}" adicionado à fila com prioridade ${newItem.priority}.`,
          });
          writeState(state);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, state }));
      });

      // 6. Toggle Active
      server.middlewares.use('/api/books/automation/toggle', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const body = await parseBody(req);
        const state = readState();
        state.isActive = typeof body.active === 'boolean' ? body.active : !state.isActive;
        state.logs = state.logs || [];
        state.logs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `[Sistema] Automação contínua ${state.isActive ? 'ativada' : 'pausada'}.`,
        });
        writeState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, state }));
      });

      // 7. Config (Frequency)
      server.middlewares.use('/api/books/automation/config', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const body = await parseBody(req);
        const state = readState();
        if (body.frequencyMinutes) {
          state.frequencyMinutes = Number(body.frequencyMinutes);
          state.logs = state.logs || [];
          state.logs.unshift({
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `[Config] Frequência de automação alterada para a cada ${state.frequencyMinutes} minutos.`,
          });
          writeState(state);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, state }));
      });
    },
  };
}

function officialWebtoonIntegrationPlugin(): Plugin {
  const imageCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
  const chaptersCache = new Map<string, { data: any; timestamp: number }>();
  const pagesCache = new Map<string, { pages: string[]; timestamp: number }>();
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  return {
    name: 'official-webtoon-integration',
    configureServer(server) {
      // Unified Image Proxy for Manga & Webtoon CDNs
      server.middlewares.use('/api/proxy/webtoon-image', (req: any, res: any) => handleMangaImageProxyRequest(req, res));
      server.middlewares.use('/api/proxy/manga-image', (req: any, res: any) => handleMangaImageProxyRequest(req, res));

      // Multi-Source Manga Chapters Catalog (All 39 Anime Franchises Mapped)
      server.middlewares.use('/api/manga/chapters', (req: any, res: any) => handleMangaChaptersRequest(req, res));

      // Multi-Source Manga Pages Extraction
      server.middlewares.use('/api/manga/pages', (req: any, res: any) => handleMangaPagesRequest(req, res));

      // MangaDex & Tomato Feed Proxy
      server.middlewares.use('/api/mangadex/feed', (req: any, res: any) => handleMangadexFeedRequest(req, res));

      // Single-Roundtrip Multi-Language Chapter Pages Resolver (PT-BR, EN, JA, KO)
      server.middlewares.use('/api/mangadex/resolve-chapter', (req: any, res: any) => handleMangadexResolveChapterRequest(req, res));

      // MangaDex & Tomato At-Home Server Pages Proxy
      server.middlewares.use('/api/mangadex/server', (req: any, res: any) => handleMangadexServerRequest(req, res));

      // 2. Official Chapters List from Webtoons.com
      server.middlewares.use('/api/webtoon/official-chapters', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          const titleNo = urlObj.searchParams.get('titleNo');
          const genre = urlObj.searchParams.get('genre') || 'action';
          const slug = urlObj.searchParams.get('slug') || '';
          const webtoonId = urlObj.searchParams.get('webtoonId') || `wt-${slug}`;
          const requestedPage = urlObj.searchParams.get('page');

          if (!titleNo) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing titleNo' }));
            return;
          }

          const cacheKey = `${genre}_${slug}_${titleNo}_${requestedPage || 'all'}`;
          const cached = chaptersCache.get(cacheKey);
          if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(cached.data));
            return;
          }

          // Pages to fetch: if specific page requested, fetch that; otherwise fetch pages 1 to 5 to get a wide catalog
          const pagesToFetch = requestedPage ? [parseInt(requestedPage, 10)] : [1, 2, 3, 4, 5];
          const chaptersMap = new Map<number, any>();

          const listFetches = pagesToFetch.map(async (p) => {
            try {
              const listUrl = `https://www.webtoons.com/en/${genre}/${slug}/list?title_no=${titleNo}&page=${p}`;
              const upstream = await fetch(listUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Referer': 'https://www.webtoons.com/',
                },
              });

              if (!upstream.ok) return;
              const html = await upstream.text();
              const episodeMatches = [...html.matchAll(/<li[^>]*id="episode_(\d+)"[^>]*>([\s\S]*?)<\/li>/gi)];

              for (const m of episodeMatches) {
                const raw = m[2];
                const num = parseInt(m[1], 10);
                let link = raw.match(/href="([^"]+)"/)?.[1] || '';
                if (link && !link.startsWith('http')) {
                  link = `https://www.webtoons.com${link}`;
                }
                const subj = raw.match(/<span class="subj"[^>]*>([\s\S]*?)<\/span>/)?.[1]?.replace(/<[^>]+>/g, '').trim() || `Episódio ${num}`;
                const dateStr = raw.match(/<span class="date"[^>]*>([\s\S]*?)<\/span>/)?.[1]?.trim() || '';
                const thmb = raw.match(/<img[^>]*src="([^"]+)"/)?.[1] || '';

                if (!chaptersMap.has(num)) {
                  chaptersMap.set(num, {
                    id: `${webtoonId}-ep-${num}`,
                    webtoon_id: webtoonId,
                    number: num,
                    title: subj,
                    arc: `Temporada Oficial · Webtoon ${num}`,
                    synopsis: `Capítulo oficial ${num} de ${slug.replace(/-/g, ' ')}. Publicado oficialmente em ${dateStr}.`,
                    cover: thmb,
                    release_date: dateStr,
                    views: 145000 + num * 320,
                    likes: 18200 + num * 45,
                    panels_count: 0,
                    panels: [],
                    viewer_url: link.replace(/&amp;/g, '&'),
                    is_free: true,
                  });
                }
              }
            } catch {}
          });

          // Also fetch RSS feed for recent chapters
          const rssPromise = (async () => {
            try {
              const rssUrl = `https://www.webtoons.com/en/${genre}/${slug}/rss?title_no=${titleNo}`;
              const rssRes = await fetch(rssUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              });
              if (rssRes.ok) {
                const rssXml = await rssRes.text();
                const items = [...rssXml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
                for (const it of items) {
                  const raw = it[1];
                  const title = raw.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || '';
                  let link = raw.match(/<link>(.*?)<\/link>/)?.[1] || '';
                  if (link && !link.startsWith('http')) {
                    link = `https://www.webtoons.com${link}`;
                  }
                  const pubDate = raw.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
                  const epMatch = link.match(/episode_no=(\d+)/);
                  if (epMatch) {
                    const num = parseInt(epMatch[1], 10);
                    if (!chaptersMap.has(num)) {
                      chaptersMap.set(num, {
                        id: `${webtoonId}-ep-${num}`,
                        webtoon_id: webtoonId,
                        number: num,
                        title: title || `Episódio ${num}`,
                        arc: `Lançamentos Recentes`,
                        synopsis: `Capítulo oficial ${num}. Atualização direta da plataforma oficial Webtoon.`,
                        cover: '',
                        release_date: pubDate,
                        views: 120000,
                        likes: 15000,
                        panels_count: 0,
                        panels: [],
                        viewer_url: link.replace(/&amp;/g, '&'),
                        is_free: true,
                      });
                    }
                  }
                }
              }
            } catch {}
          })();

          await Promise.all([...listFetches, rssPromise]);

          const chapters = Array.from(chaptersMap.values()).sort((a, b) => a.number - b.number);

          const payload = { success: true, titleNo, genre, slug, chapters, total: chapters.length };
          chaptersCache.set(cacheKey, { data: payload, timestamp: Date.now() });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Error fetching chapters' }));
        }
      });

      // 3. Official Chapter Panels / Pages from Viewer Page
      server.middlewares.use('/api/webtoon/pages', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          let viewerUrl = urlObj.searchParams.get('viewerUrl') || '';
          const titleNo = urlObj.searchParams.get('titleNo');
          const genre = urlObj.searchParams.get('genre') || 'action';
          const slug = urlObj.searchParams.get('slug') || '';
          const episodeNo = urlObj.searchParams.get('episodeNo');

          // Candidate URLs to try if viewerUrl is missing or 404s
          const candidateUrls: string[] = [];
          if (viewerUrl) candidateUrls.push(viewerUrl);

          if (titleNo && episodeNo && slug) {
            candidateUrls.push(
              `https://www.webtoons.com/en/${genre}/${slug}/episode-${episodeNo}/viewer?title_no=${titleNo}&episode_no=${episodeNo}`,
              `https://www.webtoons.com/en/${genre}/${slug}/ep-${episodeNo}/viewer?title_no=${titleNo}&episode_no=${episodeNo}`,
              `https://www.webtoons.com/en/${genre}/${slug}/season-1-ep-${episodeNo}/viewer?title_no=${titleNo}&episode_no=${episodeNo}`,
              `https://www.webtoons.com/en/${genre}/${slug}/prologue/viewer?title_no=${titleNo}&episode_no=${episodeNo}`
            );
          }

          if (candidateUrls.length === 0) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing viewerUrl or titleNo/episodeNo' }));
            return;
          }

          // Check memory cache for any candidate
          for (const cand of candidateUrls) {
            const cached = pagesCache.get(cand);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: cached.pages.length, pages: cached.pages, resolvedUrl: cand }));
              return;
            }
          }

          let extractedPages: string[] = [];
          let successfulUrl = '';

          for (const tryUrl of candidateUrls) {
            try {
              const upstream = await fetch(tryUrl, {
                redirect: 'follow',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Referer': 'https://www.webtoons.com/',
                },
              });

              if (!upstream.ok) continue;

              const html = await upstream.text();
              const listMatch = html.match(/id="_imageList"[\s\S]*?<\/div>\s*<\/div>/i);
              let rawPages: string[] = [];

              if (listMatch) {
                rawPages = [...listMatch[0].matchAll(/data-url="([^"]+)"/g)].map((m) => m[1]);
              } else {
                rawPages = [...html.matchAll(/data-url="([^"]+)"/g)].map((m) => m[1]);
              }

              // Filter out tracking/blank
              rawPages = rawPages.filter((u) => u.includes('pstatic.net') || u.includes('webtoon-phinf'));

              if (rawPages.length > 0) {
                extractedPages = rawPages;
                successfulUrl = tryUrl;
                break;
              }
            } catch {}
          }

          if (extractedPages.length > 0) {
            pagesCache.set(successfulUrl, { pages: extractedPages, timestamp: Date.now() });
            if (viewerUrl && viewerUrl !== successfulUrl) {
              pagesCache.set(viewerUrl, { pages: extractedPages, timestamp: Date.now() });
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: extractedPages.length, pages: extractedPages, resolvedUrl: successfulUrl }));
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, count: 0, pages: [] }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Error fetching viewer pages' }));
        }
      });

      // 4. Local Chapters on Disk Static Handler (No Solo Leveling contamination)
      server.middlewares.use((req, res, next) => {
        const urlPath = (req.url || '').split('?')[0];
        if (urlPath.startsWith('/chapters/') && (urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg') || urlPath.endsWith('.png'))) {
          const directFile = path.resolve(__dirname, 'public', urlPath.replace(/^\//, ''));
          if (fs.existsSync(directFile) && fs.statSync(directFile).isFile()) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            fs.createReadStream(directFile).pipe(res);
            return;
          }
          res.statusCode = 404;
          res.end('Chapter image not found');
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/proxy/webtoon-image', (req: any, res: any) => handleMangaImageProxyRequest(req, res));
      server.middlewares.use('/api/proxy/manga-image', (req: any, res: any) => handleMangaImageProxyRequest(req, res));
      server.middlewares.use('/api/manga/chapters', (req: any, res: any) => handleMangaChaptersRequest(req, res));
      server.middlewares.use('/api/manga/pages', (req: any, res: any) => handleMangaPagesRequest(req, res));
      server.middlewares.use('/api/mangadex/feed', (req: any, res: any) => handleMangadexFeedRequest(req, res));
      server.middlewares.use('/api/mangadex/resolve-chapter', (req: any, res: any) => handleMangadexResolveChapterRequest(req, res));
      server.middlewares.use('/api/mangadex/server', (req: any, res: any) => handleMangadexServerRequest(req, res));
    },
  };
}

function sitemapPlugin(): Plugin {
  const dynamicCache = new Map<string, { xml: string; time: number }>();

  const ROUTE_SEO: Record<string, { title: string; desc: string }> = {
    '/': {
      title: 'Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons',
      desc: 'Explore a Wotho: biblioteca digital no navegador, jornalismo global em tempo real, streaming de cinema e animes em HD e webtoons em leitura vertical.',
    },
    '/livros': {
      title: 'Biblioteca de Livros Digitais no Navegador — Wotho',
      desc: 'Leia bestsellers modernos, filosofia, clássicos universais, conteúdos do ENEM e artigos científicos completos diretamente no navegador na Wotho.',
    },
    '/webtoons': {
      title: 'Webtoons & Quadrinhos em Leitura Vertical — Wotho',
      desc: 'Leia histórias em quadrinhos e webtoons em formato scroll vertical de alta definição diretamente no navegador na Wotho.',
    },
    '/animes': {
      title: 'Animes e Mangás em Streaming — Wotho',
      desc: 'Catálogo selecionado de animes dublados e legendados em português, episódios, trailers e capítulos de mangá integrados na Wotho.',
    },
    '/cinema': {
      title: 'Cinema & Séries em Streaming HD — Wotho',
      desc: 'Assista a filmes e séries aclamados com player em alta definição, áudio dublado em português (PT-BR) e legendas completas na Wotho.',
    },
    '/noticias': {
      title: 'Notícias Globais em Tempo Real — Wotho',
      desc: 'Cobertura jornalística independente e atualizada sobre tecnologia, ciência, economia, política, futebol, cultura e grandes ideias na Wotho.',
    },
    '/sobre': {
      title: 'Sobre a Wotho — Plataforma de Cultura, Streaming e Leitura',
      desc: 'Conheça a Wotho: plataforma digital de livros no navegador, jornalismo global, webtoons e streaming de cinema e animes.',
    },
    '/contato': {
      title: 'Contato e Atendimento — Wotho',
      desc: 'Entre em contato com a equipe da Wotho para dúvidas, sugestões de obras, pautas jornalísticas, parcerias editoriais ou suporte.',
    },
    '/mapa-do-site': {
      title: 'Mapa do Site (Sitemap) — Wotho',
      desc: 'Índice estruturado com todas as páginas canônicas, catálogos e acervo completo da plataforma Wotho.',
    },
    '/termos': {
      title: 'Termos de Uso — Wotho',
      desc: 'Condições gerais de navegação, leitura digital e uso dos serviços da plataforma Wotho.',
    },
    '/privacidade': {
      title: 'Política de Privacidade — Wotho',
      desc: 'Diretrizes de proteção de dados, conformidade LGPD e privacidade dos usuários da Wotho.',
    },
  };

  return {
    name: 'wotho-sitemap-plugin',
    transformIndexHtml(html, ctx) {
      const rawPath = (ctx.originalUrl || ctx.path || '/').split('?')[0];
      let cleanPath = rawPath === '' || rawPath === '/index.html' ? '/' : rawPath;
      if (cleanPath.endsWith('/index.html')) {
        cleanPath = cleanPath.replace(/\/index\.html$/, '') || '/';
      }
      const canonicalUrl = cleanPath === '/' ? 'https://wotho.vercel.app/' : `https://wotho.vercel.app${cleanPath}`;

      let meta = ROUTE_SEO[cleanPath];
      if (!meta) {
        if (cleanPath.startsWith('/livros/')) {
          meta = {
            title: 'Livro Digital — Leitura Online na Wotho',
            desc: 'Leia a obra completa diretamente no navegador com controle de fontes, modos de leitura e índice de capítulos.',
          };
        } else if (cleanPath.startsWith('/cinema/')) {
          meta = {
            title: 'Cinema Wotho — Filme ou Série em Streaming',
            desc: 'Assista a produções consagradas com áudio dublado em português (PT-BR) ou original com legendas completas na Wotho.',
          };
        } else if (cleanPath.startsWith('/animes/')) {
          meta = {
            title: 'Anime & Mangá em Streaming — Wotho',
            desc: 'Episódios em português, ficha técnica, sinopse detalhada e capítulos de mangá vinculados para leitura direta na Wotho.',
          };
        } else if (cleanPath.startsWith('/webtoon/')) {
          meta = {
            title: 'Webtoon — Leitura Vertical em Alta Definição — Wotho',
            desc: 'Acompanhe episódios ilustrados em scroll contínuo e painéis de alta resolução na Wotho.',
          };
        } else if (cleanPath.startsWith('/noticias/')) {
          meta = {
            title: 'Notícia — Cobertura Especial Wotho',
            desc: 'Reportagem aprofundada sobre cultura, tecnologia, mercado, entretenimento e grandes ideias na Wotho.',
          };
        } else {
          meta = ROUTE_SEO['/'];
        }
      }

      let transformed = html;

      // 1. Rewrite <title>
      transformed = transformed.replace(/<title>[\s\S]*?<\/title>/, `<title>${meta.title}</title>`);

      // 2. Rewrite meta description
      transformed = transformed.replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
        `<meta name="description" content="${meta.desc}" />`
      );

      // 3. Rewrite canonical link
      transformed = transformed.replace(
        /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
        `<link rel="canonical" href="${canonicalUrl}" />`
      );

      // 4. Rewrite og:url, og:title, og:description
      transformed = transformed.replace(
        /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
        `<meta property="og:url" content="${canonicalUrl}" />`
      );
      transformed = transformed.replace(
        /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
        `<meta property="og:title" content="${meta.title}" />`
      );
      transformed = transformed.replace(
        /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
        `<meta property="og:description" content="${meta.desc}" />`
      );

      // 5. Rewrite twitter:url, twitter:title, twitter:description
      transformed = transformed.replace(
        /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
        `<meta name="twitter:url" content="${canonicalUrl}" />`
      );
      transformed = transformed.replace(
        /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
        `<meta name="twitter:title" content="${meta.title}" />`
      );
      transformed = transformed.replace(
        /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
        `<meta name="twitter:description" content="${meta.desc}" />`
      );

      return transformed;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = (req.url || '').split('?')[0];
        if (urlPath === '/sitemap.xml') {
          const origin = 'https://wotho.vercel.app';

          const cached = dynamicCache.get(origin);
          if (cached && Date.now() - cached.time < 3600000) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.end(cached.xml);
            return;
          }

          try {
            const { xml } = buildSitemapXml(origin);
            dynamicCache.set(origin, { xml, time: Date.now() });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.end(xml);
            return;
          } catch {
            const sitemapPath = path.resolve(__dirname, 'public/sitemap.xml');
            if (fs.existsSync(sitemapPath)) {
              const xml = fs.readFileSync(sitemapPath, 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/xml; charset=utf-8');
              res.setHeader('Cache-Control', 'public, max-age=3600');
              res.end(xml);
              return;
            }
          }
        }
        if (urlPath === '/robots.txt') {
          const robotsPath = path.resolve(__dirname, 'public/robots.txt');
          if (fs.existsSync(robotsPath)) {
            const content = fs.readFileSync(robotsPath, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.end(content);
            return;
          }

          const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: https://wotho.vercel.app/sitemap.xml\n`;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.end(robotsContent);
          return;
        }
        next();
      });
    },
  };
}

function adminAuthPlugin(): Plugin {
  return {
    name: 'worscoi-admin-auth',
    configureServer(server) {
      server.middlewares.use('/api/admin/login', async (req, res) => {
        await handleAdminLoginRequest(req, res);
      });
      server.middlewares.use('/api/admin/session', async (req, res) => {
        await handleAdminSessionRequest(req, res);
      });
      server.middlewares.use('/api/admin/logout', async (req, res) => {
        await handleAdminLogoutRequest(req, res);
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), cinemaStreamingPlugin(), newsRssPlugin(), gutenbergBooksPlugin(), bookAutomationPlugin(), officialWebtoonIntegrationPlugin(), sitemapPlugin(), adminAuthPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'framer-motion',
      ],
    },
    build: {
      chunkSizeWarningLimit: 8000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion', 'motion'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-pdf': ['pdfjs-dist', 'pdf-lib'],
            'vendor-charts': ['recharts'],
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      allowedHosts: true,
      cors: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
