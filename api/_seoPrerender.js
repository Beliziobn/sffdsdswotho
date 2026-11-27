import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadSeoCatalog } from '../scripts/generate_sitemap.js';
import { notifyIndexNowUrl } from './_indexNowHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DEFAULT_ORIGIN = (process.env.VITE_APP_URL || 'https://wotho.vercel.app').replace(/\/+$/, '');
const DEFAULT_OG_IMAGE_PATH = '/og-wotho-home.jpg';
const BOOKS_OG_IMAGE_PATH = '/og-livros.jpg';

const BOT_USER_AGENT_RE =
  /(googlebot|googlebot-video|googlebot-image|googlebot-news|google-inspectiontool|adsbot-google|mediapartners-google|storebot-google|googleother|googleproducer|google-read-aloud|bingbot|bingpreview|msnbot|adidxbot|slurp|duckduckbot|applebot|applebot-extended|oai-searchbot|chatgpt-user|gptbot|claudebot|perplexitybot|yandex|baiduspider|sogou|exabot|facebookexternalhit|facebot|meta-external|instagram|threads|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|discordbot|pinterest|redditbot|viber|line\/|snapchat|skypeuripreview|vkshare|embedly|iframely|cardyb|bluesky|mastodon|tumblr|flipboard|tiktok|bytespider|bitlybot|outbrain|quora|w3c_validator|screaming frog|ahrefsbot|semrushbot|mj12bot|petalbot|curl\/)/i;

export function resolvePermanentRedirect(rawPathname) {
  let pathname = String(rawPathname || '/').split('?')[0];
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  const clean = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const lower = clean.toLowerCase();

  if (lower === '/contacto' || lower === '/contact' || lower === '/fale-conosco') return '/contato';
  if (lower === '/sitemap' || lower === '/mapa') return '/mapa-do-site';
  if (lower === '/meu-perfil' || lower === '/profile') return '/perfil';
  if (lower === '/index.html' || lower === '/home' || lower === '/inicio' || lower === '/index') return '/';
  if (lower === '/livro' || lower === '/books') return '/livros';
  if (lower === '/noticia' || lower === '/news') return '/noticias';
  if (lower === '/anime' || lower === '/manga' || lower === '/mangas') return '/animes';
  if (lower === '/filme' || lower === '/filmes' || lower === '/serie' || lower === '/series' || lower === '/dorama' || lower === '/doramas' || lower === '/movies') return '/cinema';
  if (lower === '/webtoon') return '/webtoons';
  if (lower === '/about' || lower === '/quem-somos') return '/sobre';
  if (lower === '/terms' || lower === '/termos-de-uso') return '/termos';
  if (lower === '/privacy' || lower === '/politica-de-privacidade') return '/privacidade';
  if (lower === '/login' || lower === '/entrar' || lower === '/cadastro') return '/auth';
  if (lower === '/search' || lower === '/pesquisa' || lower === '/pesquisar') return '/buscar';

  if (lower.startsWith('/webtoons/')) {
    const slug = clean.slice('/webtoons/'.length);
    if (slug) return `/webtoon/${slug}`;
  }
  if (lower.startsWith('/livro/') || lower.startsWith('/conteudo/')) {
    const prefixLen = lower.startsWith('/conteudo/') ? '/conteudo/'.length : '/livro/'.length;
    const slug = clean.slice(prefixLen);
    if (slug) return `/livros/${slug}`;
  }
  if (lower.startsWith('/noticia/') || lower.startsWith('/news/')) {
    const prefixLen = lower.startsWith('/noticia/') ? '/noticia/'.length : '/news/'.length;
    const slug = clean.slice(prefixLen);
    if (slug) return `/noticias/${slug}`;
  }
  if (lower.startsWith('/anime/')) {
    const slug = clean.slice('/anime/'.length);
    if (slug) return `/animes/${slug}`;
  }
  if (
    lower.startsWith('/filme/') ||
    lower.startsWith('/filmes/') ||
    lower.startsWith('/serie/') ||
    lower.startsWith('/series/')
  ) {
    const slug = clean.replace(/^\/(filmes?|series?)\//i, '');
    if (slug) return `/cinema/${slug}`;
  }
  if (lower === '/cinema/a-caminho-do-ceu') return '/cinema/move-to-heaven';
  if (lower === '/cinema/extraordinary-attorney-woo') return '/cinema/uma-advogada-extraordinaria';
  return null;
}

const PRIVATE_NOINDEX_PREFIXES = [
  '/auth',
  '/admin',
  '/perfil',
  '/meu-perfil',
  '/redefinir-senha',
  '/compra',
  '/biblioteca',
  '/continuar-lendo',
  '/para-voce',
  '/buscar',
];

let cachedCatalog = null;
let cachedCatalogTime = 0;
let cachedEditorialStore = null;
let cachedEditorialTime = 0;
let cachedNewsArchive = null;
let cachedNewsArchiveTime = 0;

function getCatalog() {
  if (cachedCatalog && Date.now() - cachedCatalogTime < 60_000) {
    return cachedCatalog;
  }
  cachedCatalog = loadSeoCatalog();
  cachedCatalogTime = Date.now();
  return cachedCatalog;
}

function getEditorialStoreForSeo() {
  if (cachedEditorialStore && Date.now() - cachedEditorialTime < 10_000) {
    return cachedEditorialStore;
  }
  const empty = { books: {}, news: {} };
  const candidates = [
    path.join(process.cwd(), '.cache', 'wotho_editorial', 'wotho_editorial_cloud_store_v1.json'),
    path.join('/tmp', 'wotho_editorial_cloud_store_v1.json'),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (parsed && typeof parsed === 'object') {
          cachedEditorialStore = {
            books: parsed.books && typeof parsed.books === 'object' ? parsed.books : {},
            news: parsed.news && typeof parsed.news === 'object' ? parsed.news : {},
          };
          cachedEditorialTime = Date.now();
          return cachedEditorialStore;
        }
      }
    } catch {
      // Try next path
    }
  }
  cachedEditorialStore = empty;
  cachedEditorialTime = Date.now();
  return empty;
}

function getNewsArchiveForSeo() {
  if (cachedNewsArchive && Date.now() - cachedNewsArchiveTime < 60_000) {
    return cachedNewsArchive;
  }
  try {
    const archivePath = path.resolve(rootDir, 'src/data/newsArchive.json');
    if (fs.existsSync(archivePath)) {
      const parsed = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.articles) ? parsed.articles : [];
      cachedNewsArchive = list;
      cachedNewsArchiveTime = Date.now();
      return list;
    }
  } catch {
    // Ignore archive read failure
  }
  cachedNewsArchive = [];
  cachedNewsArchiveTime = Date.now();
  return [];
}

function resolveRequestOrigin(req) {
  const rawHost = String(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '').split(',')[0].trim();
  if (!rawHost || /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(rawHost)) {
    return DEFAULT_ORIGIN;
  }
  const rawProto = String(req?.headers?.['x-forwarded-proto'] || 'https').split(',')[0].trim().toLowerCase();
  const proto = rawProto === 'http' ? 'http' : 'https';
  return `${proto}://${rawHost}`.replace(/\/+$/, '');
}

export function isSearchOrSocialBot(userAgent = '') {
  return BOT_USER_AGENT_RE.test(String(userAgent || ''));
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clampHeading(str, maxLength = 150) {
  const clean = String(str || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const sliced = clean.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const base = lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced;
  return `${base.trim()}…`;
}

function optimizeExternalSocialImage(url) {
  let out = String(url || '').replace(/^http:\/\//i, 'https://');
  // Optimize TMDB original (often 3-5MB) to w1280 (~150KB) so WhatsApp/Telegram always render it
  if (/^https:\/\/image\.tmdb\.org\/t\/p\/original\//i.test(out)) {
    out = out.replace(/^https:\/\/image\.tmdb\.org\/t\/p\/original\//i, 'https://image.tmdb.org/t/p/w1280/');
  }
  // Never mutate URLs with HMAC signatures (e.g., i.guim.co.uk ?s=...) — mutating breaks the signature with 401
  const isSignedUrl = /[?&](s|sig|signature|token|hash|hmac)=/i.test(out) || /i\.guim\.co\.uk/i.test(out);
  if (!isSignedUrl && /([?&])width=(?:[1-4]\d{2}|[1-9]\d)(?=&|$)/i.test(out)) {
    out = out.replace(/([?&])width=\d+/i, '$1width=1200');
  }
  return out;
}

function toAbsoluteUrl(urlOrPath, origin = DEFAULT_ORIGIN, coverContext = null) {
  const fallback = `${origin}${DEFAULT_OG_IMAGE_PATH}`;
  if (!urlOrPath || typeof urlOrPath !== 'string') return fallback;
  const trimmed = urlOrPath.trim();
  if (!trimmed) return fallback;
  // Convert inline base64 covers (e.g. Master Admin uploaded PDF covers) into crawlable binary image URLs
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(trimmed)) {
    if (coverContext?.collection && coverContext?.id) {
      return `${origin}/api/og-cover?collection=${encodeURIComponent(coverContext.collection)}&id=${encodeURIComponent(coverContext.id)}`;
    }
    return fallback;
  }
  if (trimmed.startsWith('/covers/') || trimmed.startsWith('/assets/hero-') || trimmed === '/og-image.jpg') {
    return fallback;
  }
  if (/^https?:\/\//i.test(trimmed)) return optimizeExternalSocialImage(trimmed);
  if (trimmed.startsWith('/')) return `${origin}${trimmed}`;
  return `${origin}/${trimmed}`;
}

export async function handleOgCoverRequest(req, res) {
  const host = req.headers?.host || 'wotho.vercel.app';
  const parsedUrl = new URL(req.url || '/', `https://${host}`);
  const collection = (parsedUrl.searchParams.get('collection') || '').trim().toLowerCase();
  const id = (parsedUrl.searchParams.get('id') || '').trim();

  let dataUrl = '';
  if ((collection === 'books' || collection === 'news') && id) {
    const store = getEditorialStoreForSeo();
    const bucket = store[collection] || {};
    const record =
      bucket[id] ||
      Object.values(bucket).find((item) => item && (item.id === id || item.slug === id)) ||
      null;
    const candidate = record?.cover_url || record?.cover || record?.image || '';
    if (typeof candidate === 'string' && /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(candidate.trim())) {
      dataUrl = candidate.trim();
    }
  }

  if (dataUrl) {
    const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/i);
    if (match) {
      const mime = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
      const buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
      if (buffer.length > 64) {
        res.statusCode = 200;
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Length', String(buffer.length));
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.end(req.method === 'HEAD' ? undefined : buffer);
        return;
      }
    }
  }

  // Fallback to Wotho default OG image
  const fallbackCandidates = [
    path.resolve(rootDir, 'dist/og-wotho-home.jpg'),
    path.resolve(rootDir, 'public/og-wotho-home.jpg'),
    path.resolve(rootDir, 'public/og-image.jpg'),
  ];
  for (const fp of fallbackCandidates) {
    if (fs.existsSync(fp)) {
      const buf = fs.readFileSync(fp);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', String(buf.length));
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      res.end(req.method === 'HEAD' ? undefined : buf);
      return;
    }
  }
  res.statusCode = 404;
  res.end();
}

function humanizeSlug(slug) {
  return decodeURIComponent(String(slug || ''))
    .replace(/-\d{6,}$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function buildBreadcrumbJsonLd(items, origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${origin}${item.url}`,
    })),
  };
}

function parseIsoDuration(durationStr, fallbackIso = 'PT2M30S') {
  if (!durationStr || typeof durationStr !== 'string') return fallbackIso;
  const hMatch = durationStr.match(/(\d+)\s*h/i);
  const mMatch = durationStr.match(/(\d+)\s*m/i);
  const sMatch = durationStr.match(/(\d+)\s*s/i);
  const h = hMatch ? parseInt(hMatch[1], 10) : 0;
  const m = mMatch ? parseInt(mMatch[1], 10) : 0;
  const s = sMatch ? parseInt(sMatch[1], 10) : 0;
  if (h === 0 && m === 0 && s === 0) return fallbackIso;
  return `PT${h > 0 ? `${h}H` : ''}${m > 0 ? `${m}M` : ''}${s > 0 ? `${s}S` : ''}`;
}

function toValidUploadDateIso(yearVal) {
  const y = Number(yearVal) || 0;
  const nowYear = new Date().getUTCFullYear();
  if (y >= 1970 && y <= nowYear) {
    const monthDay = y === nowYear ? '01-15' : '06-15';
    return `${y}-${monthDay}T12:00:00Z`;
  }
  return '2025-01-15T12:00:00Z';
}

function buildVideoWatchMeta({
  ytId,
  name,
  description,
  thumbnailUrl,
  uploadDate,
  durationIso,
  canonicalUrl,
  isFamilyFriendly = true,
  origin = DEFAULT_ORIGIN,
}) {
  const cleanYt = typeof ytId === 'string' && /^[A-Za-z0-9_-]{6,20}$/.test(ytId.trim()) ? ytId.trim() : '';
  if (!cleanYt) return null;
  const embedUrl = `https://www.youtube.com/embed/${cleanYt}`;
  const contentUrl = `https://www.youtube.com/watch?v=${cleanYt}`;
  const ytThumb = `https://i.ytimg.com/vi/${cleanYt}/hqdefault.jpg`;
  const thumbnails = Array.from(new Set([thumbnailUrl, ytThumb].filter(Boolean)));
  const videoId = `${canonicalUrl}#video`;

  const videoJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': videoId,
    name,
    description,
    thumbnailUrl: thumbnails,
    uploadDate,
    duration: durationIso,
    embedUrl,
    contentUrl,
    inLanguage: 'pt-BR',
    isFamilyFriendly: Boolean(isFamilyFriendly),
    publisher: {
      '@type': 'Organization',
      name: 'Wotho',
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/favicon-512x512.png`,
        width: 512,
        height: 512,
      },
    },
    potentialAction: {
      '@type': 'WatchAction',
      target: canonicalUrl,
    },
  };

  return {
    ytId: cleanYt,
    videoId,
    name,
    description,
    thumbnailUrl: thumbnails[0] || ytThumb,
    uploadDate,
    durationIso,
    embedUrl,
    contentUrl,
    videoJsonLd,
  };
}

/**
 * Builds a strongly-connected internal link neighborhood around an item in the catalog
 * (next 6 + prev 2 in the catalog ring + up to 8 same-genre neighbors) so ZERO pages
 * are orphaned from the HTML crawl graph.
 */
function buildConnectedRelatedLinks(list, currentId, getHref, getLabel, getGenres, maxTotal = 16) {
  if (!Array.isArray(list) || list.length <= 1) return [];
  const idx = list.findIndex((x) => x && (x.id === currentId || x.slug === currentId));
  const current = idx >= 0 ? list[idx] : null;
  const curGenres = new Set(
    ((current && getGenres ? getGenres(current) : []) || []).map((g) => String(g).toLowerCase())
  );

  const picked = [];
  const seen = new Set([currentId]);
  const add = (entry) => {
    if (!entry) return;
    const key = entry.id || entry.slug;
    if (!key || seen.has(key)) return;
    seen.add(key);
    picked.push({ href: getHref(entry), label: getLabel(entry) });
  };

  const n = list.length;
  const base = idx >= 0 ? idx : 0;
  // Ring neighbors: guarantees every item in the catalog has incoming links!
  for (let offset = 1; offset <= 6; offset++) add(list[(base + offset) % n]);
  for (let offset = 1; offset <= 2; offset++) add(list[(base - offset + n) % n]);

  // Same-genre thematic neighbors
  if (curGenres.size > 0) {
    for (let i = 0; i < n && picked.length < maxTotal; i++) {
      const candidate = list[(base + 7 + i) % n];
      if (!candidate) continue;
      const gList = (getGenres ? getGenres(candidate) : []) || [];
      if (gList.some((g) => curGenres.has(String(g).toLowerCase()))) {
        add(candidate);
      }
    }
  }

  for (let i = 0; i < n && picked.length < maxTotal; i++) {
    add(list[(base + 7 + i) % n]);
  }
  return picked.slice(0, maxTotal);
}

const STATIC_PAGE_META = {
  '/': {
    title: 'Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons',
    description:
      'Explore a Wotho: biblioteca digital no navegador, jornalismo global em tempo real, streaming de cinema e animes em HD e webtoons em leitura vertical.',
    h1: 'Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Início',
    bodyParagraphs: [
      'A Wotho é uma plataforma editorial e cultural em língua portuguesa dedicada à leitura integral de livros digitais diretamente no navegador, cobertura jornalística global verificada, guias preparatórios para o ENEM, artigos científicos comentados e curadoria de cinema, animes e webtoons. Todo o acervo público está disponível gratuitamente e sem bloqueio de login obrigatório.',
      'Nosso compromisso editorial prioriza profundidade textual, originalidade crítica e acessibilidade universal. Cada obra do catálogo literário e científico conta com ficha catalográfica completa, contextualização histórica, análise temática, resumo estruturado por capítulos e leitor HTML5/PDF nativo otimizado para estudo acadêmico e formação leitora.',
      'Na editoria de jornalismo global, a redação da Wotho acompanha diariamente os desdobramentos em ciência, tecnologia, inteligência artificial, segurança cibernética, macroeconomia, geopolítica e cultura, apresentando reportagens contextualizadas com dados verificados e fontes primárias.',
    ],
  },
  '/livros': {
    title: 'Biblioteca de Livros Digitais no Navegador — Wotho',
    description:
      'Leia bestsellers modernos, filosofia, clássicos universais, conteúdos do ENEM e artigos científicos completos diretamente no navegador na Wotho.',
    h1: 'Biblioteca de Livros Digitais, ENEM & Artigos Científicos',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Livros',
    bodyParagraphs: [
      'A Biblioteca Digital da Wotho reúne clássicos consagrados da literatura brasileira e universal em domínio público, tratados de filosofia e estratégia, apostilas preparatórias completas para o Exame Nacional do Ensino Médio (ENEM) e sínteses de artigos científicos revisados por pares.',
      'Todas as obras podem ser lidas integralmente no navegador por meio do leitor digital HTML5 e visualizador de PDF original, acompanhadas de análise crítica, contexto histórico, estudo de personagens e repertório sociocultural aplicável a exames e pesquisas acadêmicas.',
    ],
  },
  '/noticias': {
    title: 'Notícias Globais em Tempo Real — Wotho',
    description:
      'Cobertura jornalística independente e atualizada sobre tecnologia, ciência, economia, política, futebol, cultura e grandes ideias na Wotho.',
    h1: 'Portal de Notícias Globais em Tempo Real',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Notícias',
    bodyParagraphs: [
      'O Portal de Notícias Globais da Wotho oferece cobertura jornalística diária, análises aprofundadas e reportagens especiais sobre tecnologia, ciência, economia, geopolítica, esportes e cultura internacional.',
      'Nossa equipe editorial prioriza a verificação rigorosa de fatos, a contextualização histórica e a clareza analítica para leitores de língua portuguesa que buscam informação confiável e livre de sensacionalismo.',
    ],
  },
  '/cinema': {
    title: 'Cinema & Séries em Streaming HD — Wotho',
    description:
      'Assista a filmes e séries aclamados com player em alta definição, áudio dublado em português (PT-BR) e legendas completas na Wotho.',
    h1: 'Cinema & Séries em Streaming HD',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Cinema & Séries',
    bodyParagraphs: [
      'A seção de Cinema & Séries da Wotho apresenta curadoria audiovisual com fichas técnicas completas, sinopses detalhadas, análises de direção e roteiro, elenco principal, ano de lançamento e classificação indicativa.',
      'Explore clássicos do cinema mundial, documentários históricos e produções contemporâneas organizadas por gênero e relevância cultural.',
    ],
  },
  '/animes': {
    title: 'Animes e Mangás em Streaming — Wotho',
    description:
      'Catálogo selecionado de animes dublados e legendados em português, episódios, trailers e capítulos de mangá integrados na Wotho.',
    h1: 'Portal de Animes & Mangás',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Animes',
    bodyParagraphs: [
      'O Portal de Animes & Mangás da Wotho reúne informações catalográficas completas sobre as principais séries da animação japonesa, incluindo estúdios de produção, ano de estreia, guia de episódios, sinopses detalhadas e integração com capítulos de mangá.',
    ],
  },
  '/webtoons': {
    title: 'Webtoons & Quadrinhos em Leitura Vertical — Wotho',
    description:
      'Leia histórias em quadrinhos e webtoons em formato scroll vertical de alta definição diretamente no navegador na Wotho.',
    h1: 'Webtoons & Quadrinhos em Leitura Vertical',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Webtoons',
    bodyParagraphs: [
      'O catálogo de Webtoons da Wotho disponibiliza narrativas gráficas e quadrinhos digitais formatados para leitura vertical contínua no computador e em dispositivos móveis, com fichas de autoria, gêneros literários e índice de capítulos.',
    ],
  },
  '/sobre': {
    title: 'Sobre a Wotho — Plataforma de Cultura, Streaming e Leitura',
    description:
      'Conheça a Wotho: plataforma digital de livros no navegador, jornalismo global, webtoons e streaming de cinema e animes.',
    h1: 'Sobre a Wotho',
    schemaType: 'AboutPage',
    breadcrumbName: 'Sobre',
    bodyParagraphs: [
      'A Wotho nasceu com a missão de democratizar o acesso à leitura literária, ao conhecimento científico, à preparação educacional para o ENEM e ao jornalismo internacional em língua portuguesa.',
      'Reunimos em um único ecossistema editorial uma biblioteca digital de obras clássicas e acadêmicas, um portal de notícias com cobertura analítica diária e guias culturais de cinema, animes e quadrinhos digitais.',
      'Todo o conteúdo informativo e literário público pode ser consultado gratuitamente, respeitando os direitos autorais, a Lei Geral de Proteção de Dados (LGPD), o Regulamento Geral sobre a Proteção de Dados (RGPD) e os padrões internacionais de qualidade editorial.',
    ],
  },
  '/contato': {
    title: 'Contato e Atendimento — Wotho',
    description:
      'Entre em contato com a equipe da Wotho para dúvidas, sugestões de obras, pautas jornalísticas, parcerias editoriais ou suporte.',
    h1: 'Contato e Atendimento',
    schemaType: 'ContactPage',
    breadcrumbName: 'Contato',
    bodyParagraphs: [
      'A equipe editorial e de suporte técnico da Wotho está à disposição para atender leitores, autores, pesquisadores, instituições de ensino e parceiros comerciais.',
      'Canais oficiais de atendimento: envie sua mensagem pelo formulário de contato em nossa página ou diretamente pelo e-mail institucional contato@wotho.vercel.app. Nosso horário de atendimento é de segunda a sexta-feira, das 9h às 18h (horário de Brasília), com prazo médio de resposta de até 24 horas úteis.',
    ],
  },
  '/mapa-do-site': {
    title: 'Mapa do Site (Sitemap) — Wotho',
    description:
      'Índice estruturado com todas as páginas canônicas, catálogos de livros, cinema, animes, webtoons e notícias da plataforma Wotho.',
    h1: 'Mapa do Site — Índice Completo Wotho',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Mapa do Site',
    bodyParagraphs: [
      'Consulte abaixo o índice estruturado completo de todas as seções institucionais, páginas legais (Política de Privacidade e Termos de Uso), obras literárias, guias do ENEM, artigos científicos, reportagens jornalísticas e catálogos culturais da Wotho.',
    ],
  },
  '/termos': {
    title: 'Termos e Condições de Uso — Wotho',
    description:
      'Condições gerais de navegação, direitos autorais, política de acesso público gratuito e regras de uso da plataforma Wotho.',
    h1: 'Termos e Condições de Uso da Wotho',
    schemaType: 'WebPage',
    breadcrumbName: 'Termos de Uso',
    bodyParagraphs: [
      'Estes Termos e Condições de Uso regulam o acesso e a utilização da plataforma Wotho (https://wotho.vercel.app/). Ao navegar em nosso portal, o utilizador concorda integralmente com as normas editoriais, legais e de segurança aqui estabelecidas.',
      'Acesso Público e Gratuito: O catálogo editorial, literário, jornalístico e educacional da Wotho é disponibilizado de forma aberta e gratuita para consulta e leitura diretamente no navegador, sem exigência de cadastro ou login obrigatório.',
      'Propriedade Intelectual e Direitos Autorais: O acervo literário da Wotho compreende obras em domínio público nos termos da Lei nº 9.610/1998, conteúdos educacionais originais preparatórios para o ENEM, resenhas críticas autorais e artigos científicos sob licenças abertas. Eventuais solicitações de revisão de direitos autorais (DMCA) são atendidas prioritariamente pelo e-mail contato@wotho.vercel.app.',
      'Conformidade Publicitária (Google AdSense): Para manter a gratuidade da plataforma, a Wotho exibe anúncios geridos pelo Google AdSense em conformidade com as Better Ads Standards. É estritamente proibido gerar cliques artificiais, utilizar robôs de tráfego ou manipular impressões publicitárias.',
    ],
  },
  '/privacidade': {
    title: 'Política de Privacidade e Cookies — Wotho',
    description:
      'Diretrizes de proteção de dados (LGPD e RGPD), uso de cookies do Google AdSense (DoubleClick DART) e direitos de privacidade dos utilizadores da Wotho.',
    h1: 'Política de Privacidade e Cookies',
    schemaType: 'WebPage',
    breadcrumbName: 'Política de Privacidade',
    bodyParagraphs: [
      'A Wotho (https://wotho.vercel.app/) preza pela transparência, segurança e proteção dos dados pessoais de todos os seus leitores e visitantes, atuando em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais do Brasil (LGPD — Lei nº 13.709/2018), o Regulamento Geral sobre a Proteção de Dados da União Europeia (RGPD — Regulamento UE 2016/679) e as Políticas do Programa Google AdSense.',
      'Publicidade Google AdSense e Cookie DoubleClick DART: O Google, como fornecedor terceirizado, utiliza cookies para exibir anúncios na Wotho. Com o cookie DART e identificadores equivalentes, o Google e os seus parceiros podem exibir anúncios personalizados com base nas visitas realizadas pelo utilizador à Wotho e a outros sites na Internet.',
      'Como Desativar Cookies de Publicidade Personalizada (Opt-Out): Os utilizadores podem desativar o uso do cookie DART e a personalização de anúncios a qualquer momento acedendo às Configurações de Anúncios do Google (https://adssettings.google.com), à página de políticas de publicidade do Google (https://policies.google.com/technologies/ads) ou ao portal YourAdChoices (https://www.aboutads.info/choices/).',
      'Direitos do Titular e Contato do Encarregado (DPO): O utilizador tem direito de solicitar confirmação de tratamento, acesso, correção, anonimização ou eliminação de dados pessoais, bem como revogar o consentimento de cookies a qualquer momento. Para exercer seus direitos, entre em contato pelo e-mail contato@wotho.vercel.app.',
    ],
  },
};

export function resolveRouteSeo(rawPathname, customOrigin = DEFAULT_ORIGIN) {
  const origin = (customOrigin || DEFAULT_ORIGIN).replace(/\/+$/, '');
  let pathname = String(rawPathname || '/').split('?')[0];
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  pathname = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  // Alias normalizations for canonical consistency (case-insensitive)
  const redirected = resolvePermanentRedirect(pathname);
  let canonicalPath = redirected || pathname;
  const lowerPath = canonicalPath.toLowerCase();
  if (STATIC_PAGE_META[lowerPath]) {
    canonicalPath = lowerPath;
  }

  const catalog = getCatalog();
  const editorial = getEditorialStoreForSeo();
  const editorialBooks = Object.values(editorial.books || {}).filter((b) => b && b.published !== false);
  const editorialNews = Object.values(editorial.news || {}).filter((n) => n && n.published !== false);

  // Check private/utility routes (valid 200, but noindex)
  const isPrivate = PRIVATE_NOINDEX_PREFIXES.some(
    (prefix) => lowerPath === prefix || lowerPath.startsWith(`${prefix}/`)
  );

  // Check reader routes that canonicalize back to the detail page
  if (canonicalPath.startsWith('/ler/') || canonicalPath.startsWith('/leitura/')) {
    const prefix = canonicalPath.startsWith('/leitura/') ? '/leitura/' : '/ler/';
    const id = decodeURIComponent(canonicalPath.slice(prefix.length).split('/')[0] || '').trim();
    const normId = id.toLowerCase();
    const book =
      editorialBooks.find((b) => b.id === id || String(b.id || '').toLowerCase() === normId) ||
      catalog.books.find((b) => b.id === id || String(b.id || '').toLowerCase() === normId);
    const isDynamicEditorialBook = /^(book-editorial-|gut-|guten-|mod-|curr-|sci-|auto-)/i.test(id);
    const exists = Boolean(book) || isDynamicEditorialBook;
    const resolvedId = book?.id || id;
    const title = book ? `${book.title} — Leitura Online | Wotho` : 'Leitor Digital — Wotho';
    const desc = book?.description || 'Leia a obra diretamente no navegador na plataforma Wotho.';
    return {
      statusCode: exists ? 200 : 404,
      indexable: Boolean(book),
      robots: exists
        ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        : 'noindex, nofollow',
      canonicalUrl: exists ? `${origin}/livros/${encodeURIComponent(resolvedId)}` : null,
      title: exists ? title : 'Livro não encontrado | Wotho',
      description: desc,
      ogType: 'book',
      ogImage: toAbsoluteUrl(book?.cover_url, origin, { collection: 'books', id: resolvedId }),
      h1: book?.title || 'Leitor Digital Wotho',
      subtitle: book?.author || '',
      links: [
        ...(exists ? [{ href: `/livros/${encodeURIComponent(resolvedId)}`, label: `Voltar para ficha do livro` }] : []),
        { href: '/livros', label: 'Catálogo de Livros' },
      ],
      jsonLd: [],
    };
  }

  if (isPrivate) {
    const robots = canonicalPath.startsWith('/admin') ? 'noindex, nofollow' : 'noindex, follow';
    const titles = {
      '/auth': 'Entrar ou Criar Conta — Wotho',
      '/admin': 'Studio Editorial — Wotho',
      '/perfil': 'Meu Perfil & Downloads — Wotho',
      '/biblioteca': 'Minha Estante Pessoal — Wotho',
      '/buscar': 'Busca Global no Acervo — Wotho',
      '/para-voce': 'Recomendações Para Você — Wotho',
      '/continuar-lendo': 'Continuar Leitura — Wotho',
    };
    return {
      statusCode: 200,
      indexable: false,
      robots,
      canonicalUrl: `${origin}${canonicalPath}`,
      title: titles[canonicalPath] || 'Área do Usuário — Wotho',
      description: 'Acesse sua conta, histórico de leitura e downloads pessoais na plataforma Wotho.',
      ogType: 'website',
      ogImage: `${origin}${DEFAULT_OG_IMAGE_PATH}`,
      h1: titles[canonicalPath] || 'Wotho',
      links: [
        { href: '/', label: 'Página Inicial' },
        { href: '/livros', label: 'Livros' },
        { href: '/cinema', label: 'Cinema & Séries' },
      ],
      jsonLd: [],
    };
  }

  // Static public pages
  if (STATIC_PAGE_META[canonicalPath]) {
    const meta = STATIC_PAGE_META[canonicalPath];
    const canonicalUrl = canonicalPath === '/' ? `${origin}/` : `${origin}${canonicalPath}`;

    // Build rich crawlable links & ItemList schema depending on section
    let links = [];
    let itemListElements = [];

    if (canonicalPath === '/') {
      links = [
        ...catalog.books.slice(0, 12).map((b) => ({ href: `/livros/${b.id}`, label: `${b.title} — ${b.author}` })),
        ...catalog.cinema.slice(0, 10).map((c) => ({ href: `/cinema/${c.id}`, label: `${c.title} (${c.year})` })),
        ...catalog.animes.slice(0, 10).map((a) => ({ href: `/animes/${a.id}`, label: a.title })),
        ...catalog.webtoons.slice(0, 10).map((w) => ({ href: `/webtoon/${w.id}`, label: w.title })),
        ...catalog.news.slice(0, 10).map((n) => ({ href: `/noticias/${n.slug}`, label: n.title })),
      ];
      itemListElements = links.slice(0, 15).map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${origin}${l.href}`,
        name: l.label,
      }));
    } else if (canonicalPath === '/livros') {
      links = catalog.books.map((b) => ({ href: `/livros/${b.id}`, label: `${b.title} — ${b.author}` }));
      itemListElements = catalog.books.slice(0, 20).map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${origin}/livros/${encodeURIComponent(b.id)}`,
        name: b.title,
      }));
    } else if (canonicalPath === '/cinema') {
      links = catalog.cinema.map((c) => ({ href: `/cinema/${c.id}`, label: `${c.title} (${c.year})` }));
      itemListElements = catalog.cinema.slice(0, 20).map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${origin}/cinema/${encodeURIComponent(c.id)}`,
        name: c.title,
      }));
    } else if (canonicalPath === '/animes') {
      links = catalog.animes.map((a) => ({ href: `/animes/${a.id}`, label: a.title }));
      itemListElements = catalog.animes.slice(0, 20).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${origin}/animes/${encodeURIComponent(a.id)}`,
        name: a.title,
      }));
    } else if (canonicalPath === '/webtoons') {
      links = catalog.webtoons.map((w) => ({ href: `/webtoon/${w.id}`, label: w.title }));
      itemListElements = catalog.webtoons.slice(0, 20).map((w, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${origin}/webtoon/${encodeURIComponent(w.id)}`,
        name: w.title,
      }));
    } else if (canonicalPath === '/noticias') {
      links = catalog.news.slice(0, 1200).map((n) => ({ href: `/noticias/${n.slug}`, label: n.title }));
      itemListElements = catalog.news.slice(0, 20).map((n, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${origin}/noticias/${encodeURIComponent(n.slug)}`,
        name: n.title,
      }));
    } else if (canonicalPath === '/mapa-do-site') {
      links = [
        ...catalog.books.map((b) => ({ href: `/livros/${b.id}`, label: `${b.title} — ${b.author}` })),
        ...catalog.cinema.map((c) => ({ href: `/cinema/${c.id}`, label: `${c.title} (${c.year})` })),
        ...catalog.animes.map((a) => ({ href: `/animes/${a.id}`, label: a.title })),
        ...catalog.webtoons.map((w) => ({ href: `/webtoon/${w.id}`, label: w.title })),
        ...catalog.news.slice(0, 1200).map((n) => ({ href: `/noticias/${n.slug}`, label: n.title })),
      ];
    }

    const breadcrumbItems =
      canonicalPath === '/'
        ? [{ name: 'Wotho', url: '/' }]
        : [
            { name: 'Wotho', url: '/' },
            { name: meta.breadcrumbName, url: canonicalPath },
          ];

    const pageJsonLd = {
      '@context': 'https://schema.org',
      '@type': meta.schemaType,
      name: meta.title,
      description: meta.description,
      url: canonicalUrl,
      inLanguage: 'pt-BR',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Wotho',
        url: `${origin}/`,
      },
      ...(itemListElements.length > 0
        ? {
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: itemListElements.length,
              itemListElement: itemListElements,
            },
          }
        : {}),
    };

    // Dynamic per-section OpenGraph preview image (never fixed across distinct sections!)
    let sectionOgImage = `${origin}${DEFAULT_OG_IMAGE_PATH}`;
    if (canonicalPath === '/livros') {
      sectionOgImage = `${origin}${BOOKS_OG_IMAGE_PATH}`;
    } else if (canonicalPath === '/cinema') {
      const leadCinema = catalog.cinema.find((c) => c?.backdropUrl || c?.posterUrl);
      if (leadCinema) {
        sectionOgImage = toAbsoluteUrl(leadCinema.backdropUrl || leadCinema.posterUrl, origin);
      }
    } else if (canonicalPath === '/animes') {
      const leadAnime = catalog.animes.find((a) => a?.banner || a?.cover);
      if (leadAnime) {
        sectionOgImage = toAbsoluteUrl(leadAnime.banner || leadAnime.cover, origin);
      }
    } else if (canonicalPath === '/webtoons') {
      const leadWt = catalog.webtoons.find((w) => w?.banner || w?.cover);
      if (leadWt) {
        sectionOgImage = toAbsoluteUrl(leadWt.banner || leadWt.cover, origin);
      }
    } else if (canonicalPath === '/noticias') {
      const leadNews =
        editorialNews.find((n) => n?.cover_url) ||
        catalog.news.find(
          (n) =>
            n?.cover_url &&
            /^https?:\/\//i.test(n.cover_url) &&
            !/([?&])width=(?:[1-3]\d{2}|[1-9]\d)(?=&|$)/i.test(n.cover_url)
        ) ||
        catalog.news.find((n) => n?.cover_url && /^https?:\/\//i.test(n.cover_url));
      if (leadNews) {
        sectionOgImage = toAbsoluteUrl(leadNews.cover_url, origin, {
          collection: 'news',
          id: leadNews.slug || leadNews.id,
        });
      }
    }

    return {
      statusCode: 200,
      indexable: true,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      canonicalUrl,
      title: meta.title,
      description: meta.description,
      ogType: 'website',
      ogImage: sectionOgImage,
      ogImageAlt: meta.title,
      h1: meta.h1,
      bodyParagraphs: meta.bodyParagraphs || [meta.description],
      links,
      jsonLd: [pageJsonLd, buildBreadcrumbJsonLd(breadcrumbItems, origin)],
    };
  }

  // Dynamic Detail: /livros/:id or /conteudo/:id
  if (lowerPath.startsWith('/livros/') || lowerPath.startsWith('/conteudo/')) {
    const isContent = lowerPath.startsWith('/conteudo/');
    const prefix = isContent ? '/conteudo/' : '/livros/';
    const id = decodeURIComponent(canonicalPath.slice(prefix.length).split('/')[0] || '').trim();
    const normId = id.toLowerCase();
    const allBooks = [...editorialBooks, ...catalog.books];
    const book = allBooks.find((b) => b.id === id || String(b.id || '').toLowerCase() === normId);
    const isDynamicEditorialBook = /^(book-editorial-|gut-|guten-|mod-|curr-|sci-|auto-)/i.test(id);

    if (id.length >= 1) {
      const resolvedId = book?.id || id;
      const bookTitle = book?.title || humanizeSlug(id.replace(/^(gut|mod|curr|sci|auto|book-editorial)-/i, ''));
      const authorName = book?.author || 'Acervo Wotho';
      const pageTitle = `${bookTitle} — ${authorName} | Wotho Livros`;
      const desc =
        book?.description ||
        `Leia "${bookTitle}" por ${authorName} online diretamente no navegador com índice de capítulos na Wotho.`;
      const cover = toAbsoluteUrl(book?.cover_url, origin, { collection: 'books', id: resolvedId });
      const canonicalUrl = `${origin}${prefix}${encodeURIComponent(resolvedId)}`;

      const bookJsonLd = {
        '@context': 'https://schema.org',
        '@type': book?.kind === 'scientific' ? 'ScholarlyArticle' : 'Book',
        name: bookTitle,
        headline: bookTitle,
        author: { '@type': 'Person', name: authorName },
        description: desc,
        image: cover,
        inLanguage: 'pt-BR',
        url: canonicalUrl,
        ...(book?.category ? { genre: book.category } : {}),
        ...(book?.year ? { datePublished: String(book.year) } : {}),
        publisher: { '@type': 'Organization', name: 'Wotho' },
        ...(book?.rating
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: book.rating,
                bestRating: 5,
                ratingCount: book.rating_count || 100,
              },
            }
          : {}),
      };

      const relatedLinks = buildConnectedRelatedLinks(
        catalog.books,
        resolvedId,
        (b) => `/livros/${b.id}`,
        (b) => `${b.title} — ${b.author}`,
        (b) => [b.category].filter(Boolean),
        14
      );

      const bookEditorialParagraphs = [
        desc,
        `"${bookTitle}", escrito por ${authorName}${book?.year ? ` (${book.year})` : ''}, integra o acervo digital da Wotho na editoria de ${book?.category || 'Literatura e Conhecimento'}. A edição online oferece leitura contínua diretamente no navegador (HTML5 e PDF nativo), sem necessidade de aplicativos externos, com navegação rápida por capítulos, ajuste tipográfico e acompanhamento de progresso.`,
        book?.kind === 'scientific'
          ? `Classificado como artigo científico comentado${book?.institution ? ` vinculado a ${book.institution}` : ''}${book?.doi ? ` (DOI: ${book.doi})` : ''}, o texto apresenta síntese metodológica, resultados principais e contexto acadêmico para estudantes e pesquisadores de língua portuguesa.`
          : `Além da leitura integral gratuita na plataforma, esta ficha catalográfica disponibiliza dados bibliográficos verificados, tempo estimado de leitura (${book?.read_time || 60} minutos) e recomendações correlatas para aprofundamento literário e educacional.`,
      ];

      const existsOrDynamic = Boolean(book) || isDynamicEditorialBook;
      return {
        statusCode: existsOrDynamic ? 200 : 404,
        indexable: Boolean(book),
        robots: book
          ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
          : isDynamicEditorialBook
          ? 'noindex, follow'
          : 'noindex, nofollow',
        canonicalUrl: existsOrDynamic ? canonicalUrl : null,
        title: existsOrDynamic ? pageTitle : 'Livro não encontrado | Wotho',
        description: existsOrDynamic
          ? desc
          : 'O livro solicitado não foi encontrado na biblioteca digital Wotho.',
        ogType: 'book',
        ogImage: cover,
        ogImageAlt: `${bookTitle} — ${authorName}`,
        h1: existsOrDynamic ? bookTitle : 'Livro não encontrado',
        subtitle: existsOrDynamic ? `Por ${authorName}${book?.category ? ` · ${book.category}` : ''}` : 'Biblioteca Digital Wotho',
        bodyParagraphs: existsOrDynamic
          ? bookEditorialParagraphs
          : ['O livro solicitado não foi encontrado. Explore outras obras gratuitas na biblioteca digital Wotho.'],
        bodyText: desc,
        coverImage: cover,
        facts: existsOrDynamic
          ? [
              { label: 'Obra', value: bookTitle },
              { label: 'Autor(a)', value: authorName },
              ...(book?.category ? [{ label: 'Categoria', value: book.category }] : []),
              ...(book?.year ? [{ label: 'Ano', value: String(book.year) }] : []),
              { label: 'Tempo de Leitura', value: `${book?.read_time || 60} min` },
              { label: 'Formato', value: 'Livro Digital no Navegador (HTML5 / PDF)' },
              { label: 'Plataforma', value: 'Wotho Biblioteca Digital' },
              { label: 'Idioma', value: 'Português (Brasil)' },
            ]
          : [],
        links: relatedLinks,
        jsonLd: book
          ? [
              bookJsonLd,
              buildBreadcrumbJsonLd(
                [
                  { name: 'Wotho', url: '/' },
                  { name: 'Livros', url: '/livros' },
                  { name: bookTitle, url: canonicalUrl },
                ],
                origin
              ),
            ]
          : [],
      };
    }
  }

  // Dynamic Detail / Dedicated Video Watch Page: /cinema/:id
  if (lowerPath.startsWith('/cinema/')) {
    const id = decodeURIComponent(canonicalPath.slice('/cinema/'.length).split('/')[0] || '').trim();
    const normId = id.toLowerCase();
    const item = catalog.cinema.find((c) => c.id === id || c.id.toLowerCase() === normId);

    if (id.length >= 1) {
      const resolvedItem = item || {
        id: normId,
        title: humanizeSlug(normId),
        originalTitle: '',
        type: 'filme',
        year: 2024,
        director: 'Cinema Wotho',
        genres: ['Drama', 'Ação'],
        synopsis: `Assista ${humanizeSlug(normId)} em alta definição com áudio dublado em português (PT-BR) e legendas completas na plataforma Wotho.`,
        posterUrl: `${origin}${DEFAULT_OG_IMAGE_PATH}`,
      };
      const isSeries = resolvedItem.type === 'serie';
      const pageTitle = `Assistir ${resolvedItem.title} (${resolvedItem.year}) — ${isSeries ? 'Série' : 'Filme'} HD | Wotho`;
      const desc =
        resolvedItem.synopsis ||
        `Assista ${resolvedItem.title} (${resolvedItem.year}) em alta definição com áudio dublado PT-BR e legendas na Wotho.`;
      const cover = toAbsoluteUrl(resolvedItem.backdropUrl || resolvedItem.posterUrl, origin);
      const canonicalUrl = `${origin}/cinema/${encodeURIComponent(resolvedItem.id)}`;
      const isFamilyFriendly = !String(resolvedItem.ageRating || '').includes('18');
      const uploadDateIso = toValidUploadDateIso(resolvedItem.year);
      const durationIso = parseIsoDuration(resolvedItem.duration, isSeries ? 'PT48M' : 'PT2H');
      // Never leak Dune: Part Two's fallback trailer ID onto unrelated titles
      const authenticTrailerYt =
        resolvedItem.trailerYoutubeId === 'Way9Dexny3w' && resolvedItem.id !== 'duna-parte-2'
          ? ''
          : resolvedItem.trailerYoutubeId;

      const videoWatch = item
        ? buildVideoWatchMeta({
            ytId: authenticTrailerYt,
            name: `${resolvedItem.title} (${resolvedItem.year}) — ${isSeries ? 'Série Completa' : 'Filme'} em Português`,
            description: desc,
            thumbnailUrl: cover,
            uploadDate: uploadDateIso,
            durationIso,
            canonicalUrl,
            isFamilyFriendly,
            origin,
          })
        : null;

      const cinemaJsonLd = {
        '@context': 'https://schema.org',
        '@type': isSeries ? 'TVSeries' : 'Movie',
        name: resolvedItem.title,
        alternateName: resolvedItem.originalTitle || undefined,
        description: desc,
        image: cover,
        datePublished: String(resolvedItem.year),
        inLanguage: 'pt-BR',
        url: canonicalUrl,
        genre: resolvedItem.genres,
        ...(resolvedItem.director ? { director: { '@type': 'Person', name: resolvedItem.director } } : {}),
        ...(Array.isArray(resolvedItem.cast) && resolvedItem.cast.length > 0
          ? { actor: resolvedItem.cast.map((name) => ({ '@type': 'Person', name })) }
          : {}),
        ...(isSeries && resolvedItem.seasonsCount ? { numberOfSeasons: resolvedItem.seasonsCount } : {}),
        ...(isSeries && resolvedItem.episodesCount ? { numberOfEpisodes: resolvedItem.episodesCount } : {}),
        ...(videoWatch ? { trailer: { '@id': videoWatch.videoId } } : {}),
        ...(resolvedItem.rating
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: resolvedItem.rating,
                bestRating: 10,
                ratingCount: resolvedItem.ratingCount || 500,
              },
            }
          : {}),
        publisher: { '@type': 'Organization', name: 'Wotho' },
      };

      const relatedLinks = buildConnectedRelatedLinks(
        catalog.cinema,
        resolvedItem.id,
        (c) => `/cinema/${c.id}`,
        (c) => `${c.title} (${c.year}) — ${c.type === 'serie' ? 'Série' : 'Filme'}`,
        (c) => c.genres,
        16
      );

      const castText =
        Array.isArray(resolvedItem.cast) && resolvedItem.cast.length > 0
          ? ` O elenco reúne ${resolvedItem.cast.join(', ')}.`
          : '';
      const seasonText =
        isSeries && resolvedItem.seasonsCount
          ? ` Esta página de visualização disponibiliza ${resolvedItem.seasonsCount} ${resolvedItem.seasonsCount === 1 ? 'temporada' : 'temporadas'}${resolvedItem.episodesCount ? ` e ${resolvedItem.episodesCount} episódios organizados` : ''} com troca direta no player principal.`
          : resolvedItem.duration
          ? ` A produção possui duração aproximada de ${resolvedItem.duration} e classificação indicativa ${resolvedItem.ageRating || '14'}.`
          : '';

      const cinemaParagraphs = [
        desc,
        `${resolvedItem.title}${resolvedItem.originalTitle && resolvedItem.originalTitle !== resolvedItem.title ? ` (título original: ${resolvedItem.originalTitle})` : ''} é ${isSeries ? 'uma série' : 'um filme'} de ${(resolvedItem.genres || ['Drama']).join(', ')} lançado em ${resolvedItem.year}${resolvedItem.director ? `, com direção de ${resolvedItem.director}` : ''}.${castText}${seasonText}`,
        `Na página oficial de visualização da Wotho Cinema & Séries, o vídeo é exibido em destaque no topo em resolução ${resolvedItem.quality || '1080p FHD'}, com suporte a áudio dublado em português (PT-BR), áudio original e legendas sincronizadas, além de ficha técnica verificada e recomendações do mesmo gênero.`,
      ];

      return {
        statusCode: item ? 200 : 404,
        indexable: Boolean(item),
        robots: item
          ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
          : 'noindex, nofollow',
        canonicalUrl: item ? canonicalUrl : null,
        title: pageTitle,
        description: desc,
        ogType: isSeries ? 'video.tv_show' : 'video.movie',
        ogImage: cover,
        ogImageAlt: `${resolvedItem.title} (${resolvedItem.year})`,
        videoWatch,
        h1: `${resolvedItem.title} (${resolvedItem.year})`,
        subtitle: `Página de Visualização · ${isSeries ? 'Série' : 'Filme'} · ${resolvedItem.director || 'Cinema Wotho'} · ${(resolvedItem.genres || []).join(', ')}`,
        bodyParagraphs: cinemaParagraphs,
        bodyText: desc,
        coverImage: cover,
        facts: [
          { label: 'Título', value: resolvedItem.title },
          ...(resolvedItem.originalTitle ? [{ label: 'Título Original', value: resolvedItem.originalTitle }] : []),
          { label: 'Formato', value: isSeries ? 'Série Completa (Streaming)' : 'Filme Completo (Streaming)' },
          { label: 'Ano de Lançamento', value: String(resolvedItem.year) },
          ...(resolvedItem.duration ? [{ label: 'Duração', value: resolvedItem.duration }] : []),
          ...(isSeries && resolvedItem.seasonsCount
            ? [{ label: 'Temporadas', value: `${resolvedItem.seasonsCount} (${resolvedItem.episodesCount || 0} episódios)` }]
            : []),
          ...(resolvedItem.director ? [{ label: 'Direção', value: resolvedItem.director }] : []),
          ...(Array.isArray(resolvedItem.cast) && resolvedItem.cast.length > 0
            ? [{ label: 'Elenco Principal', value: resolvedItem.cast.join(', ') }]
            : []),
          ...(resolvedItem.genres?.length ? [{ label: 'Gêneros', value: resolvedItem.genres.join(', ') }] : []),
          { label: 'Qualidade & Áudio', value: `${resolvedItem.quality || '1080p FHD'} · Dublado PT-BR & Legendado` },
          ...(resolvedItem.rating ? [{ label: 'Avaliação Média', value: `${resolvedItem.rating} / 10` }] : []),
        ],
        links: relatedLinks,
        jsonLd: item
          ? [
              ...(videoWatch ? [videoWatch.videoJsonLd] : []),
              cinemaJsonLd,
              buildBreadcrumbJsonLd(
                [
                  { name: 'Wotho', url: '/' },
                  { name: 'Cinema & Séries', url: '/cinema' },
                  { name: resolvedItem.title, url: canonicalUrl },
                ],
                origin
              ),
            ]
          : [],
      };
    }
  }

  // Dynamic Detail / Dedicated Video Watch Page: /animes/:id (and /animes/:id/manga)
  if (lowerPath.startsWith('/animes/')) {
    const parts = canonicalPath.slice('/animes/'.length).split('/');
    const id = decodeURIComponent(parts[0] || '').trim();
    const normId = id.toLowerCase();
    const isMangaReader = (parts[1] || '').toLowerCase() === 'manga';
    const anime = catalog.animes.find(
      (a) => a.id === id || a.id.toLowerCase() === normId || (a.slug && a.slug.toLowerCase() === normId)
    );

    if (id.length >= 1) {
      const resolvedAnime = anime || {
        id: normId,
        title: humanizeSlug(normId),
        japaneseTitle: '',
        studio: 'Animes Wotho',
        year: 2024,
        genres: ['Ação', 'Aventura'],
        episodesCount: 24,
        synopsis: `Assista episódios de ${humanizeSlug(normId)} dublados e legendados em português e leia capítulos de mangá integrados na Wotho.`,
        cover: `${origin}${DEFAULT_OG_IMAGE_PATH}`,
      };
      const pageTitle = isMangaReader
        ? `${resolvedAnime.title} — Ler Mangá Online | Wotho Animes`
        : `Assistir ${resolvedAnime.title} — Anime HD & Mangá Completo | Wotho`;
      const desc =
        resolvedAnime.synopsis ||
        `Assista episódios de ${resolvedAnime.title} e leia capítulos de mangá integrados na plataforma Wotho.`;
      const cover = toAbsoluteUrl(resolvedAnime.banner || resolvedAnime.cover, origin);
      const canonicalUrl = `${origin}/animes/${encodeURIComponent(resolvedAnime.id)}`;
      const uploadDateIso = toValidUploadDateIso(resolvedAnime.year);

      const videoWatch =
        anime && !isMangaReader
          ? buildVideoWatchMeta({
              ytId: resolvedAnime.trailerYoutubeId,
              name: `${resolvedAnime.title} — Assistir Episódios em Português (PT-BR)`,
              description: desc,
              thumbnailUrl: cover,
              uploadDate: uploadDateIso,
              durationIso: 'PT24M',
              canonicalUrl,
              isFamilyFriendly: true,
              origin,
            })
          : null;

      const animeJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TVSeries',
        name: resolvedAnime.title,
        alternateName: resolvedAnime.japaneseTitle || undefined,
        description: desc,
        image: cover,
        inLanguage: 'pt-BR',
        url: canonicalUrl,
        genre: resolvedAnime.genres,
        numberOfSeasons: resolvedAnime.seasonsCount || 1,
        numberOfEpisodes: resolvedAnime.episodesCount || undefined,
        productionCompany: resolvedAnime.studio ? { '@type': 'Organization', name: resolvedAnime.studio } : undefined,
        ...(videoWatch ? { trailer: { '@id': videoWatch.videoId } } : {}),
        ...(resolvedAnime.rating
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: resolvedAnime.rating,
                bestRating: 10,
                ratingCount: resolvedAnime.ratingCount || 1000,
              },
            }
          : {}),
        publisher: { '@type': 'Organization', name: 'Wotho' },
      };

      const relatedLinks = buildConnectedRelatedLinks(
        catalog.animes,
        resolvedAnime.id,
        (a) => `/animes/${a.id}`,
        (a) => `${a.title} (${a.year}) — Anime & Mangá`,
        (a) => a.genres,
        16
      );

      const mangaSummary =
        resolvedAnime.mangaChaptersCount > 0
          ? ` Além dos episódios em vídeo, a página integra o mangá completo "${resolvedAnime.mangaTitle || resolvedAnime.title}"${resolvedAnime.author ? ` de ${resolvedAnime.author}` : ''}, com ${resolvedAnime.mangaChaptersCount} capítulos catalogados e sincronização episódio-capítulo via CanonBridge.`
          : ` Obra de animação produzida pelo estúdio ${resolvedAnime.studio || 'Wotho Animes'} com guia completo de temporadas e episódios.`;

      const animeParagraphs = [
        desc,
        `${resolvedAnime.title}${resolvedAnime.japaneseTitle ? ` (${resolvedAnime.japaneseTitle})` : ''} estreou em ${resolvedAnime.year || 2024} com animação de ${resolvedAnime.studio || 'estúdio japonês'}, reunindo os gêneros ${(resolvedAnime.genres || ['Ação']).join(', ')} ao longo de ${resolvedAnime.seasonsCount || 1} ${(resolvedAnime.seasonsCount || 1) === 1 ? 'temporada' : 'temporadas'} e ${resolvedAnime.episodesCount || 12} episódios verificados.${mangaSummary}`,
        `Nesta página dedicada de visualização da Wotho Animes, o player unificado 1080p FHD oferece opções de áudio Dublado PT-BR, Legendado PT-BR, Japonês Original, Inglês, Espanhol e Francês, além de navegação direta entre episódios e capítulos do mangá.`,
      ];

      return {
        statusCode: anime ? 200 : 404,
        indexable: Boolean(anime),
        robots: anime
          ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
          : 'noindex, nofollow',
        canonicalUrl: anime ? canonicalUrl : null,
        title: pageTitle,
        description: desc,
        ogType: 'video.tv_show',
        ogImage: cover,
        ogImageAlt: resolvedAnime.title,
        videoWatch,
        h1: resolvedAnime.title,
        subtitle: `Página de Visualização · ${resolvedAnime.studio || 'Anime'} · ${resolvedAnime.year || ''} · ${(resolvedAnime.genres || []).join(', ')}`,
        bodyParagraphs: animeParagraphs,
        bodyText: desc,
        coverImage: cover,
        facts: [
          { label: 'Título', value: resolvedAnime.title },
          ...(resolvedAnime.japaneseTitle ? [{ label: 'Título em Japonês', value: resolvedAnime.japaneseTitle }] : []),
          ...(resolvedAnime.studio ? [{ label: 'Estúdio', value: resolvedAnime.studio }] : []),
          ...(resolvedAnime.year ? [{ label: 'Ano de Estreia', value: String(resolvedAnime.year) }] : []),
          { label: 'Temporadas & Episódios', value: `${resolvedAnime.seasonsCount || 1} temp. · ${resolvedAnime.episodesCount || 12} episódios` },
          ...(resolvedAnime.mangaChaptersCount
            ? [{ label: 'Mangá Integrado', value: `${resolvedAnime.mangaTitle || resolvedAnime.title} (${resolvedAnime.mangaChaptersCount} caps)` }]
            : []),
          ...(resolvedAnime.author ? [{ label: 'Autor(a) Original', value: resolvedAnime.author }] : []),
          ...(resolvedAnime.genres?.length ? [{ label: 'Gêneros', value: resolvedAnime.genres.join(', ') }] : []),
          { label: 'Áudio e Legendas', value: 'Dublado PT-BR, Legendado PT-BR, Japonês Original, EN, ES e FR' },
        ],
        links: relatedLinks,
        jsonLd:
          !anime || isMangaReader
            ? []
            : [
                ...(videoWatch ? [videoWatch.videoJsonLd] : []),
                animeJsonLd,
                buildBreadcrumbJsonLd(
                  [
                    { name: 'Wotho', url: '/' },
                    { name: 'Animes', url: '/animes' },
                    { name: resolvedAnime.title, url: canonicalUrl },
                  ],
                  origin
                ),
              ],
      };
    }
  }

  // Dynamic Detail: /webtoon/:id (and /ep/... or /ler/...)
  if (lowerPath.startsWith('/webtoon/')) {
    const parts = canonicalPath.slice('/webtoon/'.length).split('/');
    const id = decodeURIComponent(parts[0] || '').trim();
    const normId = id.toLowerCase();
    const isEpisodeReader = parts.length > 1;
    const wt = catalog.webtoons.find(
      (w) =>
        w.id === id ||
        w.id.toLowerCase() === normId ||
        w.id.toLowerCase() === `wt-${normId}` ||
        w.id.toLowerCase() === `wt-auto-${normId}`
    );

    if (id.length >= 1) {
      const resolvedWt = wt || {
        id: normId.startsWith('wt-') ? normId : `wt-${normId}`,
        title: humanizeSlug(normId.replace(/^wt-(auto-)?/, '')),
        author: 'Wotho Webtoons',
        genres: ['Fantasia', 'Ação'],
        description: `Leia o webtoon "${humanizeSlug(normId.replace(/^wt-(auto-)?/, ''))}" em formato scroll vertical de alta resolução na Wotho.`,
        cover: `${origin}${DEFAULT_OG_IMAGE_PATH}`,
      };
      const pageTitle = isEpisodeReader
        ? `${resolvedWt.title} — Leitura de Episódio | Wotho Webtoons`
        : `${resolvedWt.title} — Webtoon Online em Português | Wotho`;
      const desc =
        resolvedWt.description ||
        `Leia o webtoon "${resolvedWt.title}" em formato scroll vertical de alta resolução na Wotho.`;
      // Prefer widescreen banner for social link previews
      const cover = toAbsoluteUrl(resolvedWt.banner || resolvedWt.cover, origin);
      const canonicalUrl = `${origin}/webtoon/${encodeURIComponent(resolvedWt.id)}`;

      const wtJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWorkSeries',
        name: resolvedWt.title,
        author: resolvedWt.author ? { '@type': 'Person', name: resolvedWt.author } : undefined,
        description: desc,
        image: cover,
        inLanguage: 'pt-BR',
        url: canonicalUrl,
        genre: resolvedWt.genres,
        ...(resolvedWt.rating
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: resolvedWt.rating,
                bestRating: 10,
                ratingCount: resolvedWt.ratingCount || 500,
              },
            }
          : {}),
        publisher: { '@type': 'Organization', name: 'Wotho' },
      };

      const relatedLinks = buildConnectedRelatedLinks(
        catalog.webtoons,
        resolvedWt.id,
        (w) => `/webtoon/${w.id}`,
        (w) => `${w.title} — Webtoon Online`,
        (w) => w.genres,
        16
      );

      const wtParagraphs = [
        desc,
        `"${resolvedWt.title}" é uma série ilustrada criada por ${resolvedWt.author || 'Wotho Webtoons'}, catalogada nos gêneros ${(resolvedWt.genres || ['Fantasia', 'Ação']).join(', ')} e otimizada para leitura contínua em formato scroll vertical de alta resolução diretamente no navegador.`,
        `Na Wotho Webtoons, os leitores acompanham todos os episódios com carregamento rápido, navegação contínua entre capítulos e acesso imediato a obras semelhantes da mesma curadoria editorial.`,
      ];

      return {
        statusCode: wt ? 200 : 404,
        indexable: Boolean(wt),
        robots: wt
          ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
          : 'noindex, nofollow',
        canonicalUrl: wt ? canonicalUrl : null,
        title: pageTitle,
        description: desc,
        ogType: 'article',
        ogImage: cover,
        ogImageAlt: resolvedWt.title,
        h1: resolvedWt.title,
        subtitle: `${resolvedWt.author || 'Webtoon'}${resolvedWt.genres?.length ? ` · ${resolvedWt.genres.join(', ')}` : ''}`,
        bodyParagraphs: wtParagraphs,
        bodyText: desc,
        coverImage: cover,
        facts: [
          { label: 'Título', value: resolvedWt.title },
          { label: 'Autor / Criador', value: resolvedWt.author || 'Wotho Webtoons' },
          ...(resolvedWt.genres?.length ? [{ label: 'Gêneros', value: resolvedWt.genres.join(', ') }] : []),
          { label: 'Formato', value: 'Webtoon Scroll Vertical em Alta Definição' },
          { label: 'Idioma', value: 'Português (Brasil)' },
          { label: 'Plataforma', value: 'Wotho Webtoons & Comics' },
        ],
        links: relatedLinks,
        jsonLd:
          !wt || isEpisodeReader
            ? []
            : [
                wtJsonLd,
                buildBreadcrumbJsonLd(
                  [
                    { name: 'Wotho', url: '/' },
                    { name: 'Webtoons', url: '/webtoons' },
                    { name: resolvedWt.title, url: canonicalUrl },
                  ],
                  origin
                ),
              ],
      };
    }
  }

  // Dynamic Detail: /noticias/:slug
  if (lowerPath.startsWith('/noticias/')) {
    const slug = decodeURIComponent(canonicalPath.slice('/noticias/'.length).split('/')[0] || '').trim();
    if (slug) {
      const normSlug = slug.toLowerCase();
      const archiveNews = getNewsArchiveForSeo();
      const allNews = [...editorialNews, ...catalog.news, ...archiveNews];
      const article = allNews.find(
        (n) =>
          n &&
          (n.slug === slug ||
            n.id === slug ||
            (n.slug && String(n.slug).toLowerCase() === normSlug) ||
            (n.id && String(n.id).toLowerCase() === normSlug))
      );

      const resolvedSlug = article?.slug || slug;
      const headline = article?.title || humanizeSlug(slug);
      const pageTitle = `${headline} — Wotho Notícias`;
      const desc =
        article?.excerpt ||
        article?.subtitle ||
        `Leia a reportagem completa "${headline}" com análise aprofundada no portal de notícias Wotho.`;
      const cover = toAbsoluteUrl(article?.cover_url || article?.image, origin, {
        collection: 'news',
        id: resolvedSlug,
      });
      const canonicalUrl = `${origin}/noticias/${encodeURIComponent(resolvedSlug)}`;
      const pubDate = article?.published_at || new Date().toISOString();

      const newsJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline,
        image: [cover],
        datePublished: pubDate,
        dateModified: pubDate,
        articleSection: article?.category || 'Notícias',
        author: [{ '@type': 'Organization', name: article?.author || 'Redação Wotho' }],
        publisher: {
          '@type': 'Organization',
          name: 'Wotho',
          logo: {
            '@type': 'ImageObject',
            url: `${origin}/favicon-512x512.png`,
          },
        },
        description: desc,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
      };

      const relatedLinks = buildConnectedRelatedLinks(
        catalog.news.map((n) => ({ ...n, id: n.slug || n.id })),
        resolvedSlug,
        (n) => `/noticias/${n.slug || n.id}`,
        (n) => n.title,
        (n) => (n.category ? [n.category] : []),
        14
      );

      const articleBodyText =
        typeof article?.content === 'string' && article.content.trim().length > 80
          ? article.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200)
          : '';

      const newsParagraphs = [
        desc,
        ...(articleBodyText && articleBodyText !== desc ? [articleBodyText] : []),
        `Cobertura publicada na editoria ${article?.category || 'Notícias Globais'} pela equipe editorial da Wotho Notícias (${article?.source_name || 'Redação Wotho'}), com contextualização contínua e arquivos relacionados.`,
      ];

      return {
        statusCode: article ? 200 : 404,
        indexable: Boolean(article),
        robots: article
          ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
          : 'noindex, nofollow',
        canonicalUrl: article ? canonicalUrl : null,
        title: pageTitle,
        description: desc,
        ogType: 'article',
        ogImage: cover,
        ogImageAlt: headline,
        h1: headline,
        subtitle: `${article?.category || 'Reportagem Especial'} · ${article?.source_name || 'Wotho Notícias'}`,
        bodyParagraphs: newsParagraphs,
        bodyText: desc,
        coverImage: cover,
        facts: [
          { label: 'Manchete', value: headline },
          { label: 'Editoria', value: article?.category || 'Notícias Globais' },
          { label: 'Publicação / Fonte', value: article?.source_name || 'Redação Wotho' },
          { label: 'Data de Publicação', value: pubDate },
          { label: 'Veículo', value: 'Wotho Jornalismo Independente' },
        ],
        links: relatedLinks,
        jsonLd: article
          ? [
              newsJsonLd,
              buildBreadcrumbJsonLd(
                [
                  { name: 'Wotho', url: '/' },
                  { name: 'Notícias', url: '/noticias' },
                  { name: headline, url: canonicalUrl },
                ],
                origin
              ),
            ]
          : [],
      };
    }
  }

  // Fallback for unrecognized paths: return true HTTP 404 (prevents Google Soft 404 & crawl budget waste)
  const fallbackTitle = humanizeSlug(canonicalPath.replace(/^\/+/, '')) || 'Página Não Encontrada';
  return {
    statusCode: 404,
    indexable: false,
    robots: 'noindex, nofollow',
    canonicalUrl: null,
    title: `${fallbackTitle} — Página não encontrada | Wotho`,
    description: 'A página solicitada não foi encontrada. Explore livros digitais, notícias globais, cinema, animes e webtoons na plataforma Wotho.',
    ogType: 'website',
    ogImage: `${origin}${DEFAULT_OG_IMAGE_PATH}`,
    ogImageAlt: 'Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons',
    h1: 'Página não encontrada',
    bodyText: `O endereço solicitado não corresponde a uma página ativa da Wotho. Explore nossas seções principais abaixo.`,
    links: [
      { href: '/', label: 'Página Inicial' },
      { href: '/livros', label: 'Livros Digitais' },
      { href: '/noticias', label: 'Notícias Globais' },
      { href: '/cinema', label: 'Cinema & Séries' },
      { href: '/animes', label: 'Animes & Mangás' },
      { href: '/webtoons', label: 'Webtoons' },
      { href: '/mapa-do-site', label: 'Mapa do Site' },
    ],
    jsonLd: [],
  };
}

function renderSemanticBotShell(seo, origin = DEFAULT_ORIGIN) {
  const navLinks = [
    { href: '/livros', label: 'Livros' },
    { href: '/webtoons', label: 'Webtoons' },
    { href: '/animes', label: 'Animes' },
    { href: '/cinema', label: 'Cinema' },
    { href: '/noticias', label: 'Notícias' },
  ];

  const paragraphs = Array.isArray(seo.bodyParagraphs) && seo.bodyParagraphs.length > 0
    ? seo.bodyParagraphs
    : [seo.bodyText || seo.description];

  const paragraphsHtml = paragraphs
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px 0;color:#d4d4d8;font-size:15px;">${escapeHtml(p)}</p>`)
    .join('\n        ');

  // Preserve full internal link graph on directory/hub pages (eliminates orphan pages across all 2,400+ items)
  const linksHtml = (seo.links || [])
    .slice(0, 2600)
    .map(
      (item) =>
        `<li style="margin:6px 0;"><a href="${escapeHtml(item.href)}" style="color:#ffffff;text-decoration:underline;">${escapeHtml(item.label)}</a></li>`
    )
    .join('\n          ');

  const coverHtml = seo.coverImage && !seo.videoWatch
    ? `<figure style="margin:20px 0;"><img src="${escapeHtml(seo.coverImage)}" alt="${escapeHtml(
        seo.ogImageAlt || seo.h1 || seo.title
      )}" width="640" style="max-width:100%;height:auto;border-radius:12px;" /><figcaption style="font-size:12px;color:#a1a1aa;margin-top:6px;">${escapeHtml(
        seo.ogImageAlt || seo.h1 || seo.title
      )} — Wotho</figcaption></figure>`
    : '';

  const factsHtml =
    Array.isArray(seo.facts) && seo.facts.length > 0
      ? `<section aria-label="Ficha Técnica e Fatos Verificados" data-snippet="true" style="margin:20px 0;padding:18px 22px;border:1px solid rgba(255,255,255,0.1);border-radius:12px;background:rgba(255,255,255,0.02);">
        <h2 style="font-size:16px;color:#ffffff;margin:0 0 10px 0;">Dados Verificados</h2>
        <dl style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 16px;margin:0;">
          ${seo.facts
            .map(
              (f) =>
                `<div><dt style="font-size:12px;color:#a1a1aa;font-weight:600;">${escapeHtml(
                  f.label
                )}</dt><dd style="margin:2px 0 0 0;font-size:14px;color:#fafafa;">${escapeHtml(f.value)}</dd></div>`
            )
            .join('\n          ')}
        </dl>
      </section>`
      : '';

  // Dedicated Video Watch Page above-the-fold layout for /cinema/:id and /animes/:id
  // Satisfies Google Video Indexing "Video must be the main content on a dedicated watch page"
  const topStageHtml = seo.videoWatch
    ? `<section aria-label="Player de Vídeo Principal" itemscope itemtype="https://schema.org/VideoObject" style="max-width:1120px;margin:0 auto;padding:88px 24px 24px 24px;">
      <meta itemprop="name" content="${escapeHtml(seo.videoWatch.name)}" />
      <meta itemprop="description" content="${escapeHtml(seo.videoWatch.description)}" />
      <meta itemprop="thumbnailUrl" content="${escapeHtml(seo.videoWatch.thumbnailUrl)}" />
      <meta itemprop="uploadDate" content="${escapeHtml(seo.videoWatch.uploadDate)}" />
      <meta itemprop="duration" content="${escapeHtml(seo.videoWatch.durationIso)}" />
      <meta itemprop="embedUrl" content="${escapeHtml(seo.videoWatch.embedUrl)}" />
      <meta itemprop="contentUrl" content="${escapeHtml(seo.videoWatch.contentUrl)}" />
      <div style="margin-bottom:16px;">
        <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.16em;color:rgba(255,255,255,0.7);margin-bottom:6px;">
          ${escapeHtml(seo.subtitle || 'Página de Visualização de Vídeo')}
        </span>
        <h1 id="wotho-boot-heading" style="font-size:32px;font-weight:600;line-height:1.25;letter-spacing:-0.01em;color:#ffffff;margin:0;">
          ${escapeHtml(clampHeading(seo.h1 || seo.title, 150))}
        </h1>
      </div>
      <div style="position:relative;width:100%;aspect-ratio:16/9;min-height:420px;background:#000000;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.12);">
        <iframe
          src="${escapeHtml(seo.videoWatch.embedUrl)}?rel=0"
          title="${escapeHtml(seo.videoWatch.name)}"
          width="1280"
          height="720"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowfullscreen
          style="position:absolute;inset:0;width:100%;height:100%;border:0;"
        ></iframe>
      </div>
    </section>`
    : `<section style="position:relative;min-height:360px;max-height:520px;width:100%;overflow:hidden;background:#09090b;">
      <img
        src="${escapeHtml(seo.ogImage || DEFAULT_OG_IMAGE_PATH)}"
        alt="${escapeHtml(seo.ogImageAlt || seo.title || 'Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons')}"
        width="1200"
        height="630"
        style="width:100%;height:420px;object-fit:cover;display:block;"
      />
      <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.42), rgba(0,0,0,0.25));"></div>
      <div style="position:absolute;bottom:40px;left:24px;right:24px;max-width:1120px;margin:0 auto;z-index:10;">
        <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.75);margin-bottom:8px;">
          ${escapeHtml(seo.subtitle || 'Plataforma Editorial & Streaming')}
        </span>
        <h1 id="wotho-boot-heading" style="font-size:28px;font-weight:400;line-height:1.35;letter-spacing:-0.01em;color:#ffffff;max-width:760px;margin:0;">
          ${escapeHtml(clampHeading(seo.h1 || seo.title, 150))}
        </h1>
      </div>
    </section>`;

  return `<div id="wotho-ssr-seo" style="min-height:100vh;width:100%;background:#09090b;color:#fafafa;font-family:'DM Sans',system-ui,sans-serif;line-height:1.7;margin:0;padding:0;overflow-x:hidden;">
  <header data-nosnippet style="position:fixed;top:0;left:0;right:0;z-index:100;padding:16px 24px;background:rgba(9,9,11,0.92);border-bottom:1px solid rgba(255,255,255,0.08);">
    <div style="max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;">
      <a href="/" style="display:flex;align-items:center;gap:6px;text-decoration:none;color:#ffffff;">
        <img src="/favicon.svg" alt="Wotho" width="28" height="28" style="width:28px;height:28px;object-fit:contain;filter:brightness(0) invert(1);" />
        <span style="font-size:16px;font-weight:400;letter-spacing:0.025em;color:#ffffff;">otho</span>
      </a>
      <nav aria-label="Navegação Principal" style="display:flex;flex-wrap:wrap;align-items:center;gap:24px;">
        ${navLinks.map((n) => `<a href="${escapeHtml(n.href)}" style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#ffffff;text-decoration:none;">${escapeHtml(n.label)}</a>`).join('\n        ')}
      </nav>
    </div>
  </header>
  <main>
    ${topStageHtml}
    <article style="max-width:1120px;margin:0 auto;padding:32px 24px 56px 24px;">
      <section data-snippet="true" aria-label="Conteúdo Editorial Principal">
        ${paragraphsHtml}
      </section>
      ${factsHtml}
      ${coverHtml}
      ${
        linksHtml
          ? `<section aria-label="Catálogo e Links Relacionados" style="margin-top:32px;">
          <h2 style="font-size:20px;font-weight:400;color:#ffffff;">Explorar na Wotho</h2>
          <ul style="color:#d4d4d8;columns:2;column-gap:28px;">
            ${linksHtml}
          </ul>
        </section>`
          : ''
      }
    </article>
  </main>
  <footer data-nosnippet style="border-top:1px solid rgba(255,255,255,0.12);padding:40px 24px;font-size:12px;color:rgba(250,250,250,0.6);">
    <div style="max-width:1120px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;">
      <p style="margin:0;">&copy; 2026 Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons. Todos os direitos reservados.</p>
      <nav aria-label="Links Institucionais e Legais" style="display:flex;flex-wrap:wrap;gap:14px;">
        <a href="/sobre" style="color:rgba(250,250,250,0.75);text-decoration:none;">Sobre a Wotho</a>
        <a href="/contato" style="color:rgba(250,250,250,0.75);text-decoration:none;">Contato</a>
        <a href="/privacidade" style="color:rgba(250,250,250,0.75);text-decoration:none;">Política de Privacidade</a>
        <a href="/termos" style="color:rgba(250,250,250,0.75);text-decoration:none;">Termos de Uso</a>
        <a href="/mapa-do-site" style="color:rgba(250,250,250,0.75);text-decoration:none;">Mapa do Site</a>
        <a href="/sitemap-index.xml" style="color:rgba(250,250,250,0.75);text-decoration:none;">Sitemap Index</a>
        <a href="/video-sitemap.xml" style="color:rgba(250,250,250,0.75);text-decoration:none;">Video Sitemap</a>
        <a href="/rss.xml" style="color:rgba(250,250,250,0.75);text-decoration:none;">RSS Feed</a>
      </nav>
    </div>
  </footer>
</div>`;
}

export function injectSeoIntoHtml(html, rawPathname, options = {}) {
  const origin = (options.origin || DEFAULT_ORIGIN).replace(/\/+$/, '');
  const isBot = Boolean(options.isBot);
  const seo = resolveRouteSeo(rawPathname, origin);

  let out = html;

  // 1. Title
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);

  // 2. Meta description
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`
  );

  // 3. Robots, Googlebot & Bingbot directives (never emit noarchive/nocache on indexable pages for Copilot Grounding)
  out = out.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${escapeHtml(seo.robots)}" />`
  );
  out = out.replace(
    /<meta\s+name="googlebot"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="googlebot" content="${escapeHtml(seo.robots)}" />`
  );
  if (/<meta\s+name="bingbot"/i.test(out)) {
    out = out.replace(
      /<meta\s+name="bingbot"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="bingbot" content="${escapeHtml(seo.robots)}" />`
    );
  } else {
    out = out.replace(
      '</head>',
      `    <meta name="bingbot" content="${escapeHtml(seo.robots)}" />\n  </head>`
    );
  }

  // 4. Canonical link (remove on 404 to prevent Soft 404 clustering)
  if (seo.canonicalUrl) {
    if (/<link\s+rel="canonical"/i.test(out)) {
      out = out.replace(
        /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
        `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />`
      );
    } else {
      out = out.replace('</head>', `  <link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />\n  </head>`);
    }
    // Synchronize hreflang alternates if present
    out = out.replace(
      /<link\s+rel="alternate"\s+hreflang="pt-BR"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="alternate" hreflang="pt-BR" href="${escapeHtml(seo.canonicalUrl)}" />`
    );
    out = out.replace(
      /<link\s+rel="alternate"\s+hreflang="x-default"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="alternate" hreflang="x-default" href="${escapeHtml(seo.canonicalUrl)}" />`
    );
  } else {
    out = out.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>\s*/i, '');
    out = out.replace(/<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>\s*/gi, '');
  }

  // 5. OpenGraph & Twitter tags
  const ogUrl = seo.canonicalUrl || `${origin}${rawPathname || '/'}`;
  out = out.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${escapeHtml(seo.ogType || 'website')}" />`
  );
  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeHtml(ogUrl)}" />`
  );
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`
  );
  out = out.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${escapeHtml(seo.ogImage)}" />`
  );
  out = out.replace(
    /<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:secure_url" content="${escapeHtml(seo.ogImage)}" />`
  );
  const isKnown1200x630 =
    typeof seo.ogImage === 'string' &&
    /\/(og-wotho-home|og-livros|og-image)\.jpg(\?.*)?$/i.test(seo.ogImage);
  const inferredImageType = /\.png(\?|$)/i.test(seo.ogImage || '')
    ? 'image/png'
    : /\.webp(\?|$)/i.test(seo.ogImage || '')
      ? 'image/webp'
      : 'image/jpeg';
  if (isKnown1200x630) {
    out = out.replace(
      /<meta\s+property="og:image:type"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image:type" content="image/jpeg" />`
    );
    out = out.replace(
      /<meta\s+property="og:image:width"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image:width" content="1200" />`
    );
    out = out.replace(
      /<meta\s+property="og:image:height"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image:height" content="630" />`
    );
  } else {
    // Let social platforms auto-detect natural dimensions for dynamic covers/banners so they never distort or reject
    out = out.replace(
      /<meta\s+property="og:image:type"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image:type" content="${inferredImageType}" />`
    );
    out = out.replace(/<meta\s+property="og:image:width"\s+content="[^"]*"\s*\/?>\s*/i, '');
    out = out.replace(/<meta\s+property="og:image:height"\s+content="[^"]*"\s*\/?>\s*/i, '');
  }
  out = out.replace(
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:alt" content="${escapeHtml(seo.ogImageAlt || seo.title)}" />`
  );

  out = out.replace(
    /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:url" content="${escapeHtml(ogUrl)}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${escapeHtml(seo.ogImage)}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image:alt" content="${escapeHtml(seo.ogImageAlt || seo.title)}" />`
  );

  // 5b. OpenGraph Video tags exclusively on Dedicated Video Watch Pages (/cinema/:id, /animes/:id)
  out = out.replace(/<meta\s+property="og:video(?::[a-z_]+)?"\s+content="[^"]*"\s*\/?>\s*/gi, '');
  if (seo.videoWatch && seo.videoWatch.embedUrl) {
    const ogVideoTags = [
      `<meta property="og:video" content="${escapeHtml(seo.videoWatch.embedUrl)}" />`,
      `<meta property="og:video:url" content="${escapeHtml(seo.videoWatch.embedUrl)}" />`,
      `<meta property="og:video:secure_url" content="${escapeHtml(seo.videoWatch.embedUrl)}" />`,
      `<meta property="og:video:type" content="text/html" />`,
      `<meta property="og:video:width" content="1280" />`,
      `<meta property="og:video:height" content="720" />`,
    ].join('\n    ');
    out = out.replace('</head>', `    ${ogVideoTags}\n  </head>`);
  }

  // 6. Strip any pre-existing SSR JSON-LD (e.g. from built dist/index.html) and inject route-specific JSON-LD Schema.org
  out = out.replace(/<script\s+type="application\/ld\+json"\s+data-ssr-seo="true">[\s\S]*?<\/script>\s*/gi, '');
  if (Array.isArray(seo.jsonLd) && seo.jsonLd.length > 0) {
    const jsonLdScripts = seo.jsonLd
      .map(
        (schema) =>
          `<script type="application/ld+json" data-ssr-seo="true">${JSON.stringify(schema)}</script>`
      )
      .join('\n    ');
    out = out.replace('</head>', `    ${jsonLdScripts}\n  </head>`);
  }

  // 6b. Guarantee Google AdSense script and Webmaster verification tags are present in <head> on every prerendered page
  if (!out.includes('ca-pub-8089523516720577')) {
    const adsenseSnippet = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8089523516720577"\n     crossorigin="anonymous"></script>\n    <meta name="google-adsense-account" content="ca-pub-8089523516720577" />`;
    out = out.replace('<head>', `<head>\n    ${adsenseSnippet}`);
  }
  if (!out.includes('n_nVQKGN9hqwtcg5XjGbYyX8xzfR0aaTIEiLNZuZgwk')) {
    out = out.replace(
      '</head>',
      `    <meta name="google-site-verification" content="n_nVQKGN9hqwtcg5XjGbYyX8xzfR0aaTIEiLNZuZgwk" />\n  </head>`
    );
  }
  if (!out.includes('3DD20C5692A3D68BDDFFEA861D2C737F')) {
    out = out.replace(
      '</head>',
      `    <meta name="msvalidate.01" content="3DD20C5692A3D68BDDFFEA861D2C737F" />\n  </head>`
    );
  }

  // 7. Only inject the crawler-specific semantic HTML shell (#wotho-ssr-seo) for verified search/AdSense bots.
  //    Human browsers always receive the clean visual page-content skeleton (#wotho-boot-skeleton) from index.html
  //    so users never see unstyled SSR link lists or duplicate hero banners while React boots.
  if (isBot) {
    const safeH1 = clampHeading(seo.h1 || seo.title, 150);
    const botBody = renderSemanticBotShell({ ...seo, h1: safeH1 }, origin);
    const ssrMarkerMatch = /<!--WOTHO_SSR_START-->[\s\S]*?<!--WOTHO_SSR_END-->/i;
    if (ssrMarkerMatch.test(out)) {
      out = out.replace(ssrMarkerMatch, `<!--WOTHO_SSR_START-->\n      ${botBody}\n    <!--WOTHO_SSR_END-->`);
    } else {
      out = out.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">\n      ${botBody}\n    </div>`);
    }
  }

  return { html: out, seo };
}

function findIndexHtmlTemplate() {
  const candidates = [
    path.resolve(rootDir, 'dist/index.html'),
    path.resolve(rootDir, 'index.html'),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  }
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8089523516720577"
     crossorigin="anonymous"></script>
  <meta name="google-adsense-account" content="ca-pub-8089523516720577" />
  <meta name="google-site-verification" content="n_nVQKGN9hqwtcg5XjGbYyX8xzfR0aaTIEiLNZuZgwk" />
  <meta name="msvalidate.01" content="3DD20C5692A3D68BDDFFEA861D2C737F" />
  <meta charset="UTF-8" />
  <title>Wotho</title>
  <meta name="description" content="Wotho" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${DEFAULT_ORIGIN}/" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${DEFAULT_ORIGIN}/" />
  <meta property="og:title" content="Wotho" />
  <meta property="og:description" content="Wotho" />
  <meta property="og:image" content="${DEFAULT_ORIGIN}${DEFAULT_OG_IMAGE_PATH}" />
  <meta property="og:image:secure_url" content="${DEFAULT_ORIGIN}${DEFAULT_OG_IMAGE_PATH}" />
  <meta property="og:image:alt" content="Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons" />
  <meta name="twitter:url" content="${DEFAULT_ORIGIN}/" />
  <meta name="twitter:title" content="Wotho" />
  <meta name="twitter:description" content="Wotho" />
  <meta name="twitter:image" content="${DEFAULT_ORIGIN}${DEFAULT_OG_IMAGE_PATH}" />
  <meta name="twitter:image:alt" content="Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons" />
</head>
<body>
  <div id="root"><h1 id="wotho-boot-heading">Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons</h1></div>
</body>
</html>`;
}

export async function handleSeoPrerenderRequest(req, res) {
  const requestOrigin = resolveRequestOrigin(req);
  const host = req.headers?.host || 'wotho.vercel.app';
  const parsedUrl = new URL(req.url || '/', `https://${host}`);
  let targetPath =
    req.query?.path ||
    parsedUrl.searchParams.get('path') ||
    parsedUrl.pathname ||
    '/';
  if (Array.isArray(targetPath)) targetPath = targetPath[0] || '/';
  targetPath = String(targetPath || '/');
  if (
    targetPath === '/api/[...route]' ||
    targetPath === '/api/seo-prerender' ||
    targetPath === '/seo-prerender'
  ) {
    targetPath = parsedUrl.searchParams.get('path') || '/';
  }
  const normalizedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const ua = req.headers?.['user-agent'] || '';
  const isBot = isSearchOrSocialBot(ua) || parsedUrl.searchParams.get('_bot') === '1';

  // Permanent 301 Redirects for legacy/alias/typo paths
  const redirectTarget = resolvePermanentRedirect(normalizedPath);
  if (redirectTarget) {
    const destUrl = redirectTarget === '/' ? `${requestOrigin}/` : `${requestOrigin}${redirectTarget}`;
    res.statusCode = 301;
    res.setHeader('Location', destUrl);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end();
    return;
  }

  const template = findIndexHtmlTemplate();
  const { html, seo } = injectSeoIntoHtml(template, normalizedPath, {
    origin: requestOrigin,
    isBot,
  });

  res.statusCode = seo.statusCode || 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', seo.robots);
  if (seo.canonicalUrl) {
    res.setHeader('Link', `<${seo.canonicalUrl}>; rel="canonical"`);
  }
  res.setHeader('Vary', 'User-Agent');
  res.setHeader(
    'Cache-Control',
    res.statusCode === 404
      ? 'public, max-age=60, s-maxage=300'
      : isBot
        ? 'public, s-maxage=900, stale-while-revalidate=3600'
        : 'public, max-age=0, must-revalidate'
  );
  res.end(html);
}
