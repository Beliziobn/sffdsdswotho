import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = process.env.VITE_APP_URL || 'https://wotho.vercel.app';
const TODAY = new Date().toISOString().split('T')[0];

// Only primary, stable public routes (excludes user-private/utility pages and search query routes)
const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/livros', changefreq: 'daily', priority: '0.9' },
  { path: '/noticias', changefreq: 'hourly', priority: '0.9' },
  { path: '/cinema', changefreq: 'daily', priority: '0.9' },
  { path: '/animes', changefreq: 'daily', priority: '0.9' },
  { path: '/webtoons', changefreq: 'daily', priority: '0.9' },
  { path: '/sobre', changefreq: 'monthly', priority: '0.7' },
  { path: '/contato', changefreq: 'monthly', priority: '0.7' },
  { path: '/mapa-do-site', changefreq: 'weekly', priority: '0.6' },
  { path: '/termos', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacidade', changefreq: 'monthly', priority: '0.4' },
];

const CANONICAL_MODERN_BOOK_IDS = [
  'mod-habitos-atomicos',
  'mod-psicologia-financeira',
  'mod-pai-rico-pai-pobre',
  'mod-1984-orwell',
  'mod-homem-mais-rico-babilonia',
  'mod-antifragil',
  'mod-comece-pelo-porque',
  'mod-em-busca-de-sentido',
  'mod-essencialismo',
  'mod-as-48-leis-do-poder',
  'mod-manual-de-epicteto',
  'mod-meditacoes-marco-aurelio',
  'mod-os-segredos-da-mente-milionaria',
  'mod-mindset',
  'mod-pedagogia-da-autonomia',
  'mod-o-poder-do-habito',
  'mod-rapido-e-devagar',
  'mod-roube-como-um-artista',
  'mod-sobre-a-brevidade-da-vida',
];

const CANONICAL_CURRICULAR_IDS = [
  'cur-matematica-enem',
  'cur-fisica-enem',
  'cur-quimica-enem',
  'cur-biologia-enem',
  'cur-historia-enem',
  'cur-redacao-enem',
];

const CANONICAL_SCIENTIFIC_IDS = [
  'sci-astrofisica-jwst',
  'sci-quantica-computacao',
  'sci-crispr-cas9',
  'sci-neurociencia-plasticidade',
];

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractIds(filePath, regex) {
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
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
    return [];
  }
}

export function buildSitemapXml(customOrigin = BASE_URL) {
  const origin = (customOrigin || BASE_URL).replace(/\/+$/, '');
  const seenLocs = new Set();
  const urlEntries = [];

  const addEntry = (entry) => {
    if (!entry.loc || seenLocs.has(entry.loc)) return;
    if (/test|draft|preview|undefined|null/i.test(entry.loc)) return;
    seenLocs.add(entry.loc);
    urlEntries.push(entry);
  };

  // 1. Core Static Public Landing Pages
  for (const route of STATIC_ROUTES) {
    addEntry({
      loc: `${origin}${route.path}`,
      lastmod: TODAY,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  }

  // 2. Canonical Modern Bestsellers
  for (const id of CANONICAL_MODERN_BOOK_IDS) {
    addEntry({
      loc: `${origin}/livros/${id}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // 3. Curricular Educational Textbooks
  for (const id of CANONICAL_CURRICULAR_IDS) {
    addEntry({
      loc: `${origin}/livros/${id}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // 4. Scientific Research Articles
  for (const id of CANONICAL_SCIENTIFIC_IDS) {
    addEntry({
      loc: `${origin}/livros/${id}`,
      lastmod: TODAY,
      changefreq: 'monthly',
      priority: '0.8',
    });
  }

  // 5. Canonical Webtoons
  const webtoonIds = extractIds('src/lib/webtoons.ts', /id:\s*"(wt-[a-z0-9-]+)"/g)
    .filter((id) => !id.includes('-ep-') && !id.includes('/'));
  for (const id of webtoonIds) {
    addEntry({
      loc: `${origin}/webtoon/${id}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // 6. Verified Animes
  const animeIds = extractIds('src/lib/animes.ts', /id:\s*"([a-z0-9-]+)"/g)
    .filter((id) => !id.includes('/'));
  for (const id of animeIds) {
    addEntry({
      loc: `${origin}/animes/${id}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // 7. Stable Cinema & Series Catalog
  const baseCinemaIds = extractIds('src/lib/cinema.ts', /"?id"?:\s*"([a-z0-9-]+)"/g);
  const expandedCinemaIds = extractIds('src/lib/cinemaExpandedCatalog.ts', /"?id"?:\s*"([a-z0-9-]+)"/g);
  const cinemaIds = Array.from(new Set([...baseCinemaIds, ...expandedCinemaIds]))
    .filter((id) => !id.includes('/') && !id.startsWith('ep-') && id !== 'pt' && id !== 'en' && id !== 'native' && id !== 'vidsrc' && id !== 'trailer');
  for (const id of cinemaIds) {
    addEntry({
      loc: `${origin}/cinema/${id}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const item of urlEntries) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(item.loc)}</loc>\n`;
    xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    xml += `    <priority>${item.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';
  return { xml, count: urlEntries.length };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('generate_sitemap.js');
if (isDirectRun) {
  const result = buildSitemapXml();
  const outputPath = path.resolve(rootDir, 'public/sitemap.xml');
  fs.writeFileSync(outputPath, result.xml, 'utf8');
  console.log(`[Sitemap] Generated ${result.count} clean canonical URLs in ${outputPath}`);
}
