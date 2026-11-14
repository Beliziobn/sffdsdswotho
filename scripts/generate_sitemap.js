import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = (process.env.VITE_APP_URL || 'https://wotho.vercel.app').replace(/\/+$/, '');

export const STATIC_ROUTES = [
  { path: '/', title: 'Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons', changefreq: 'daily', priority: '1.0' },
  { path: '/livros', title: 'Biblioteca de Livros Digitais no Navegador — Wotho', changefreq: 'daily', priority: '0.9' },
  { path: '/noticias', title: 'Notícias Globais em Tempo Real — Wotho', changefreq: 'hourly', priority: '0.9' },
  { path: '/cinema', title: 'Cinema & Séries em Streaming HD — Wotho', changefreq: 'daily', priority: '0.9' },
  { path: '/animes', title: 'Animes e Mangás em Streaming — Wotho', changefreq: 'daily', priority: '0.9' },
  { path: '/webtoons', title: 'Webtoons & Quadrinhos em Leitura Vertical — Wotho', changefreq: 'daily', priority: '0.9' },
  { path: '/sobre', title: 'Sobre a Wotho — Plataforma de Cultura, Streaming e Leitura', changefreq: 'monthly', priority: '0.7' },
  { path: '/contato', title: 'Contato e Atendimento — Wotho', changefreq: 'monthly', priority: '0.7' },
  { path: '/mapa-do-site', title: 'Mapa do Site (Sitemap) — Wotho', changefreq: 'weekly', priority: '0.6' },
  { path: '/termos', title: 'Termos de Uso — Wotho', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacidade', title: 'Política de Privacidade — Wotho', changefreq: 'monthly', priority: '0.4' },
];

function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAbsoluteImageUrl(img, origin = BASE_URL) {
  if (!img || typeof img !== 'string') return `${origin}/og-image.jpg`;
  const trimmed = img.trim();
  if (!trimmed) return `${origin}/og-image.jpg`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${origin}${trimmed}`;
  return `${origin}/${trimmed}`;
}

function toIsoDate(value, fallbackIso) {
  if (!value) return fallbackIso;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackIso;
  return parsed.toISOString();
}

function truncateText(text, max = 180) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function extractIdsFallback(filePath, regex) {
  try {
    const fullPath = path.resolve(rootDir, filePath);
    if (!fs.existsSync(fullPath)) return [];
    const content = fs.readFileSync(fullPath, 'utf8');
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1] && !matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  } catch {
    return [];
  }
}

async function bundleAndLoadTsCatalog() {
  let esbuild;
  try {
    esbuild = await import('esbuild');
  } catch {
    return null;
  }

  const entrySource = `
    import { MODERN_BOOKS } from './src/lib/modernBooks';
    import { CURRICULAR_BOOKS } from './src/data/curricularBooks';
    import { SCIENTIFIC_ARTICLES } from './src/data/scientificArticles';
    import { CINEMA_CATALOG } from './src/lib/cinema';
    import { ANIMES_DATA } from './src/lib/animes';
    import { BASE_CURATED_WEBTOONS } from './src/lib/webtoons';
    import { EXPANDED_WEBTOONS } from './src/data/expandedWebtoons';

    export const catalogBundle = {
      modernBooks: MODERN_BOOKS.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || '',
        author: b.author || 'Wotho Editorial',
        category: b.category || 'Literatura',
        description: b.description || '',
        cover_url: b.cover_url || '',
        published_at: b.created_at || '',
        year: b.year || 2024,
        read_time: b.read_time || 60,
        rating: b.rating || 4.8,
        rating_count: b.rating_count || 120,
        kind: 'book',
      })),
      curricularBooks: CURRICULAR_BOOKS.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || '',
        author: b.author || 'Wotho Educação',
        category: b.discipline || 'Educação & ENEM',
        description: b.description || '',
        cover_url: b.cover_url || '',
        published_at: b.year ? String(b.year) + '-01-01T00:00:00Z' : '',
        year: b.year || 2026,
        read_time: b.read_time || 180,
        rating: b.rating || 4.9,
        rating_count: b.rating_count || 300,
        kind: 'curricular',
      })),
      scientificArticles: SCIENTIFIC_ARTICLES.map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: a.subtitle || '',
        author: a.author || 'Pesquisadores Wotho',
        category: a.field || 'Ciência',
        description: a.description || '',
        cover_url: a.cover_url || '',
        published_at: a.published_at || '',
        year: 2026,
        read_time: a.read_time || 45,
        rating: a.rating || 4.9,
        rating_count: a.rating_count || 200,
        doi: a.doi || '',
        institution: a.institution || '',
        kind: 'scientific',
      })),
      cinema: CINEMA_CATALOG.map((c) => ({
        id: c.id,
        title: c.title,
        originalTitle: c.originalTitle || '',
        type: c.type || 'filme',
        director: c.director || '',
        cast: Array.isArray(c.cast) ? c.cast.slice(0, 6) : [],
        synopsis: c.synopsis || '',
        genres: Array.isArray(c.genres) ? c.genres : [],
        year: c.year || 2024,
        duration: c.duration || '',
        rating: c.rating || 8.0,
        ratingCount: c.ratingCount || 1000,
        posterUrl: c.posterUrl || '',
        backdropUrl: c.backdropUrl || '',
        seasonsCount: Array.isArray(c.seasons) ? c.seasons.length : 0,
      })),
      animes: ANIMES_DATA.map((a) => ({
        id: a.id,
        title: a.title,
        japaneseTitle: a.japaneseTitle || '',
        synopsis: a.synopsis || '',
        genres: Array.isArray(a.genres) ? a.genres : [],
        year: a.year || 2024,
        studio: a.studio || '',
        cover: a.cover || '',
        banner: a.banner || '',
        episodesCount: a.episodesCount || 12,
        rating: a.rating || 8.8,
        ratingCount: a.ratingCount || 2000,
        author: a.manga?.author || a.studio || '',
      })),
      webtoons: [...BASE_CURATED_WEBTOONS, ...EXPANDED_WEBTOONS].map((w) => ({
        id: w.id,
        title: w.title,
        author: w.author || '',
        artist: w.artist || '',
        description: w.description || '',
        genres: Array.isArray(w.genres) ? w.genres : [],
        cover: w.cover || '',
        banner: w.banner || '',
        status: w.status || 'Em lançamento',
        episodesCount: w.episodes_count || 10,
        rating: w.rating || 9.0,
        ratingCount: w.rating_count || 500,
      })),
    };
  `;

  const result = await esbuild.build({
    stdin: {
      contents: entrySource,
      resolveDir: rootDir,
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    logLevel: 'silent',
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  });

  const code = result.outputFiles[0]?.text;
  if (!code) return null;

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require: (id) => {
      // Minimal stub in case browser-only modules leak
      if (id.startsWith('.') || id.startsWith('@/')) return {};
      return {};
    },
    process,
    console,
    Buffer,
    URL,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    window: {},
    document: {},
  };
  vm.runInNewContext(code, sandbox);
  return moduleObj.exports.catalogBundle || null;
}

export async function generateCatalogSnapshot() {
  const bundled = await bundleAndLoadTsCatalog();
  const nowIso = new Date().toISOString();

  // AutoBooks JSON
  let autoBooks = [];
  try {
    const autoPath = path.resolve(rootDir, 'src/data/autoBooks.json');
    if (fs.existsSync(autoPath)) {
      const parsed = JSON.parse(fs.readFileSync(autoPath, 'utf8'));
      autoBooks = (parsed.books || [])
        .filter((b) => b && b.id && b.published !== false)
        .map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle || '',
          author: b.author || 'Wotho Acervo',
          category: b.category || 'Literatura',
          description: truncateText(b.description || '', 320),
          cover_url: b.cover_url || '',
          published_at: b.created_at || nowIso,
          year: 2026,
          read_time: b.read_time || 60,
          rating: b.rating || 4.8,
          rating_count: b.rating_count || 100,
          kind: 'auto',
        }));
    }
  } catch (err) {
    console.warn('[SEO Catalog] Failed loading autoBooks.json:', err?.message);
  }

  // News Archive JSON
  let news = [];
  try {
    const newsPath = path.resolve(rootDir, 'src/data/newsArchive.json');
    if (fs.existsSync(newsPath)) {
      const parsed = JSON.parse(fs.readFileSync(newsPath, 'utf8'));
      const seenSlugs = new Set();
      news = (parsed.articles || [])
        .filter((a) => a && a.slug && a.published !== false && !a.deleted_at)
        .filter((a) => {
          if (seenSlugs.has(a.slug)) return false;
          seenSlugs.add(a.slug);
          return true;
        })
        .map((a) => ({
          id: a.id || a.slug,
          slug: a.slug,
          title: String(a.title || '').trim(),
          excerpt: truncateText(a.excerpt || a.content || '', 280),
          category: a.category || 'Notícias',
          author: a.author || a.source_name || 'Redação Wotho',
          source_name: a.source_name || 'Wotho Notícias',
          cover_url: a.cover_url || '',
          published_at: toIsoDate(a.published_at || a.created_at, nowIso),
        }));
    }
  } catch (err) {
    console.warn('[SEO Catalog] Failed loading newsArchive.json:', err?.message);
  }

  // Deduplicate books by id
  const rawBooks = bundled
    ? [...bundled.modernBooks, ...bundled.curricularBooks, ...bundled.scientificArticles, ...autoBooks]
    : autoBooks;
  const bookMap = new Map();
  for (const b of rawBooks) {
    if (!b?.id || b.id.includes('/')) continue;
    const prev = bookMap.get(b.id);
    if (!prev || (b.description && b.description.length > (prev.description || '').length)) {
      bookMap.set(b.id, {
        ...b,
        description: truncateText(b.description || '', 340),
      });
    }
  }

  // Deduplicate cinema by id
  const cinemaMap = new Map();
  for (const c of bundled?.cinema || []) {
    if (!c?.id || c.id.includes('/')) continue;
    if (!cinemaMap.has(c.id)) {
      cinemaMap.set(c.id, {
        ...c,
        synopsis: truncateText(c.synopsis || '', 340),
      });
    }
  }

  // Deduplicate animes by id
  const animeMap = new Map();
  for (const a of bundled?.animes || []) {
    if (!a?.id || a.id.includes('/')) continue;
    if (!animeMap.has(a.id)) {
      animeMap.set(a.id, {
        ...a,
        synopsis: truncateText(a.synopsis || '', 340),
      });
    }
  }

  // Deduplicate webtoons by id
  const webtoonMap = new Map();
  for (const w of bundled?.webtoons || []) {
    if (!w?.id || w.id.includes('/')) continue;
    if (!webtoonMap.has(w.id)) {
      webtoonMap.set(w.id, {
        ...w,
        description: truncateText(w.description || '', 340),
      });
    }
  }

  const catalog = {
    generatedAt: nowIso,
    books: Array.from(bookMap.values()),
    cinema: Array.from(cinemaMap.values()),
    animes: Array.from(animeMap.values()),
    webtoons: Array.from(webtoonMap.values()),
    news,
  };

  return catalog;
}

export function loadSeoCatalog() {
  const catalogPath = path.resolve(rootDir, 'api/_seoCatalog.json');
  if (fs.existsSync(catalogPath)) {
    try {
      return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    } catch {
      // Fallback below
    }
  }

  // Fallback lightweight extraction if _seoCatalog.json does not exist yet
  const nowIso = new Date().toISOString();
  const modernIds = extractIdsFallback('src/lib/modernBooks.ts', /id:\s*"(mod-[a-z0-9-]+)"/g);
  const curricularIds = extractIdsFallback('src/data/curricularBooks.ts', /id:\s*"(curr-[a-z0-9-]+)"/g);
  const sciIds = extractIdsFallback('src/data/scientificArticles.ts', /id:\s*"(sci-[a-z0-9-]+)"/g);
  const wtIds = Array.from(new Set([
    ...extractIdsFallback('src/lib/webtoons.ts', /id:\s*"(wt-[a-z0-9-]+)"/g),
    ...extractIdsFallback('src/data/expandedWebtoons.ts', /"id":\s*"(wt-[a-z0-9-]+)"/g),
  ])).filter((id) => !id.includes('-ep-'));
  const animeIds = extractIdsFallback('src/lib/animes.ts', /id:\s*"([a-z0-9-]+)"/g);
  const cinemaIds = Array.from(new Set([
    ...extractIdsFallback('src/lib/cinema.ts', /"?id"?:\s*"([a-z0-9-]+)"/g),
    ...extractIdsFallback('src/lib/cinemaExpandedCatalog.ts', /"?id"?:\s*"([a-z0-9-]+)"/g),
  ])).filter((id) => !id.startsWith('ep-') && !['pt', 'en', 'native', 'vidsrc', 'trailer'].includes(id));

  let autoBooks = [];
  try {
    const autoPath = path.resolve(rootDir, 'src/data/autoBooks.json');
    if (fs.existsSync(autoPath)) {
      const parsed = JSON.parse(fs.readFileSync(autoPath, 'utf8'));
      autoBooks = (parsed.books || []).filter((b) => b?.id && b.published !== false);
    }
  } catch {}

  let news = [];
  try {
    const newsPath = path.resolve(rootDir, 'src/data/newsArchive.json');
    if (fs.existsSync(newsPath)) {
      const parsed = JSON.parse(fs.readFileSync(newsPath, 'utf8'));
      news = (parsed.articles || []).filter((a) => a?.slug && a.published !== false && !a.deleted_at);
    }
  } catch {}

  return {
    generatedAt: nowIso,
    books: [
      ...modernIds.map((id) => ({ id, title: id, kind: 'book' })),
      ...curricularIds.map((id) => ({ id, title: id, kind: 'curricular' })),
      ...sciIds.map((id) => ({ id, title: id, kind: 'scientific' })),
      ...autoBooks,
    ],
    cinema: cinemaIds.map((id) => ({ id, title: id, type: 'filme' })),
    animes: animeIds.map((id) => ({ id, title: id })),
    webtoons: wtIds.map((id) => ({ id, title: id })),
    news,
  };
}

function formatUrlEntry(entry, origin) {
  let out = '  <url>\n';
  out += `    <loc>${escapeXml(entry.loc)}</loc>\n`;
  if (entry.lastmod) out += `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n`;
  if (entry.changefreq) out += `    <changefreq>${entry.changefreq}</changefreq>\n`;
  if (entry.priority) out += `    <priority>${entry.priority}</priority>\n`;
  if (entry.image) {
    const absImg = toAbsoluteImageUrl(entry.image, origin);
    out += '    <image:image>\n';
    out += `      <image:loc>${escapeXml(absImg)}</image:loc>\n`;
    if (entry.imageTitle) {
      out += `      <image:title>${escapeXml(entry.imageTitle)}</image:title>\n`;
    }
    out += '    </image:image>\n';
  }
  out += '  </url>\n';
  return out;
}

function wrapUrlset(entries, origin) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
  for (const entry of entries) {
    xml += formatUrlEntry(entry, origin);
  }
  xml += '</urlset>\n';
  return xml;
}

function buildSectionEntries(catalog, customOrigin = BASE_URL) {
  const origin = (customOrigin || BASE_URL).replace(/\/+$/, '');
  const todayDate = new Date().toISOString().split('T')[0];

  const pages = STATIC_ROUTES.map((route) => ({
    loc: route.path === '/' ? `${origin}/` : `${origin}${route.path}`,
    lastmod: todayDate,
    changefreq: route.changefreq,
    priority: route.priority,
    image: `${origin}/og-image.jpg`,
    imageTitle: route.title,
  }));

  const books = (catalog.books || []).map((b) => ({
    loc: `${origin}/livros/${encodeURIComponent(b.id)}`,
    lastmod: b.published_at ? toIsoDate(b.published_at, todayDate).split('T')[0] : todayDate,
    changefreq: b.kind === 'scientific' ? 'monthly' : 'weekly',
    priority: '0.8',
    image: b.cover_url || `${origin}/og-image.jpg`,
    imageTitle: b.title || b.id,
  }));

  const cinema = (catalog.cinema || []).map((c) => ({
    loc: `${origin}/cinema/${encodeURIComponent(c.id)}`,
    lastmod: todayDate,
    changefreq: 'weekly',
    priority: '0.8',
    image: c.posterUrl || c.backdropUrl || `${origin}/og-image.jpg`,
    imageTitle: c.title || c.id,
  }));

  const animes = (catalog.animes || []).map((a) => ({
    loc: `${origin}/animes/${encodeURIComponent(a.id)}`,
    lastmod: todayDate,
    changefreq: 'weekly',
    priority: '0.8',
    image: a.cover || a.banner || `${origin}/og-image.jpg`,
    imageTitle: a.title || a.id,
  }));

  const webtoons = (catalog.webtoons || []).map((w) => ({
    loc: `${origin}/webtoon/${encodeURIComponent(w.id)}`,
    lastmod: todayDate,
    changefreq: 'weekly',
    priority: '0.8',
    image: w.cover || w.banner || `${origin}/og-image.jpg`,
    imageTitle: w.title || w.id,
  }));

  const news = (catalog.news || []).slice(0, 1500).map((n) => ({
    loc: `${origin}/noticias/${encodeURIComponent(n.slug)}`,
    lastmod: toIsoDate(n.published_at, todayDate).split('T')[0],
    changefreq: 'daily',
    priority: '0.7',
    image: n.cover_url || `${origin}/og-image.jpg`,
    imageTitle: n.title || n.slug,
  }));

  return { pages, books, cinema, animes, webtoons, news };
}

export function buildSitemapXml(customOrigin = BASE_URL, catalogOverride = null) {
  const origin = (customOrigin || BASE_URL).replace(/\/+$/, '');
  const catalog = catalogOverride || loadSeoCatalog();
  const sections = buildSectionEntries(catalog, origin);

  const seenLocs = new Set();
  const allEntries = [];
  const pushAll = (arr) => {
    for (const entry of arr) {
      if (!entry.loc || seenLocs.has(entry.loc)) continue;
      if (/test|draft|preview|undefined|null/i.test(entry.loc)) continue;
      seenLocs.add(entry.loc);
      allEntries.push(entry);
    }
  };

  pushAll(sections.pages);
  pushAll(sections.books);
  pushAll(sections.cinema);
  pushAll(sections.animes);
  pushAll(sections.webtoons);
  pushAll(sections.news);

  return {
    xml: wrapUrlset(allEntries, origin),
    count: allEntries.length,
    sections,
  };
}

export function buildSubSitemapXml(sectionName, customOrigin = BASE_URL, catalogOverride = null) {
  const origin = (customOrigin || BASE_URL).replace(/\/+$/, '');
  const catalog = catalogOverride || loadSeoCatalog();
  const sections = buildSectionEntries(catalog, origin);
  const key = sectionName.replace(/^sitemap-/, '').replace(/\.xml$/, '');
  const entries = sections[key] || sections.pages;
  return {
    xml: wrapUrlset(entries, origin),
    count: entries.length,
  };
}

export function buildSitemapIndexXml(customOrigin = BASE_URL) {
  const origin = (customOrigin || BASE_URL).replace(/\/+$/, '');
  const lastmod = new Date().toISOString();
  const sitemaps = [
    `${origin}/sitemap-pages.xml`,
    `${origin}/sitemap-books.xml`,
    `${origin}/sitemap-cinema.xml`,
    `${origin}/sitemap-animes.xml`,
    `${origin}/sitemap-webtoons.xml`,
    `${origin}/sitemap-news.xml`,
    `${origin}/news-sitemap.xml`,
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const loc of sitemaps) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${escapeXml(loc)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }
  xml += '</sitemapindex>\n';
  return { xml, count: sitemaps.length };
}

export function buildNewsSitemapXml(customOrigin = BASE_URL, catalogOverride = null) {
  const origin = (customOrigin || BASE_URL).replace(/\/+$/, '');
  const catalog = catalogOverride || loadSeoCatalog();
  const articles = (catalog.news || []).slice(0, 250);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  for (const art of articles) {
    if (!art?.slug || !art?.title) continue;
    const pubDate = toIsoDate(art.published_at, new Date().toISOString());
    const loc = `${origin}/noticias/${encodeURIComponent(art.slug)}`;
    const img = toAbsoluteImageUrl(art.cover_url, origin);

    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(loc)}</loc>\n`;
    xml += '    <news:news>\n';
    xml += '      <news:publication>\n';
    xml += '        <news:name>Wotho</news:name>\n';
    xml += '        <news:language>pt</news:language>\n';
    xml += '      </news:publication>\n';
    xml += `      <news:publication_date>${escapeXml(pubDate)}</news:publication_date>\n`;
    xml += `      <news:title>${escapeXml(art.title)}</news:title>\n`;
    xml += '    </news:news>\n';
    xml += '    <image:image>\n';
    xml += `      <image:loc>${escapeXml(img)}</image:loc>\n`;
    xml += `      <image:title>${escapeXml(art.title)}</image:title>\n`;
    xml += '    </image:image>\n';
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';
  return { xml, count: articles.length };
}

export function buildRssXml(customOrigin = BASE_URL, catalogOverride = null) {
  const origin = (customOrigin || BASE_URL).replace(/\/+$/, '');
  const catalog = catalogOverride || loadSeoCatalog();
  const articles = (catalog.news || []).slice(0, 60);
  const nowRfc = new Date().toUTCString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">\n';
  xml += '  <channel>\n';
  xml += '    <title>Wotho — Notícias Globais, Livros, Cinema e Webtoons</title>\n';
  xml += `    <link>${origin}/</link>\n`;
  xml += `    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />\n`;
  xml += '    <description>Cobertura jornalística independente, biblioteca digital, cinema, animes e webtoons na Wotho.</description>\n';
  xml += '    <language>pt-BR</language>\n';
  xml += `    <lastBuildDate>${nowRfc}</lastBuildDate>\n`;

  for (const art of articles) {
    if (!art?.slug || !art?.title) continue;
    const link = `${origin}/noticias/${encodeURIComponent(art.slug)}`;
    const pubDate = new Date(art.published_at || Date.now()).toUTCString();
    const img = toAbsoluteImageUrl(art.cover_url, origin);
    xml += '    <item>\n';
    xml += `      <title>${escapeXml(art.title)}</title>\n`;
    xml += `      <link>${escapeXml(link)}</link>\n`;
    xml += `      <guid isPermaLink="true">${escapeXml(link)}</guid>\n`;
    xml += `      <pubDate>${pubDate}</pubDate>\n`;
    xml += `      <category>${escapeXml(art.category || 'Notícias')}</category>\n`;
    xml += `      <description>${escapeXml(art.excerpt || art.title)}</description>\n`;
    xml += `      <media:content url="${escapeXml(img)}" medium="image" />\n`;
    xml += '    </item>\n';
  }

  xml += '  </channel>\n';
  xml += '</rss>\n';
  return { xml, count: articles.length };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('generate_sitemap.js');
if (isDirectRun) {
  (async () => {
    const catalog = await generateCatalogSnapshot();
    const catalogOutputPath = path.resolve(rootDir, 'api/_seoCatalog.json');
    fs.writeFileSync(catalogOutputPath, JSON.stringify(catalog), 'utf8');

    const { xml: mainXml, count: totalCount } = buildSitemapXml(BASE_URL, catalog);
    fs.writeFileSync(path.resolve(rootDir, 'public/sitemap.xml'), mainXml, 'utf8');

    const { xml: indexXml } = buildSitemapIndexXml(BASE_URL);
    fs.writeFileSync(path.resolve(rootDir, 'public/sitemap-index.xml'), indexXml, 'utf8');

    const { xml: newsSitemapXml } = buildNewsSitemapXml(BASE_URL, catalog);
    fs.writeFileSync(path.resolve(rootDir, 'public/news-sitemap.xml'), newsSitemapXml, 'utf8');

    const { xml: rssXml } = buildRssXml(BASE_URL, catalog);
    fs.writeFileSync(path.resolve(rootDir, 'public/rss.xml'), rssXml, 'utf8');

    const subNames = ['pages', 'books', 'cinema', 'animes', 'webtoons', 'news'];
    for (const name of subNames) {
      const { xml: subXml } = buildSubSitemapXml(name, BASE_URL, catalog);
      fs.writeFileSync(path.resolve(rootDir, `public/sitemap-${name}.xml`), subXml, 'utf8');
    }

    console.log(
      `[SEO Generator] Wrote api/_seoCatalog.json & ${totalCount} canonical URLs across sitemap.xml, sitemap-index.xml, news-sitemap.xml, rss.xml, and 6 sub-sitemaps.`
    );
  })();
}
