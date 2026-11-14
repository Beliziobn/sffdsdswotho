import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadSeoCatalog } from '../scripts/generate_sitemap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DEFAULT_ORIGIN = (process.env.VITE_APP_URL || 'https://wotho.vercel.app').replace(/\/+$/, '');

const BOT_USER_AGENT_RE =
  /(googlebot|google-inspectiontool|adsbot-google|mediapartners-google|storebot-google|googleother|bingbot|slurp|duckduckbot|applebot|yandex|baiduspider|sogou|exabot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|discordbot|pinterest|screaming frog|ahrefsbot|semrushbot|mj12bot|petalbot)/i;

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
  '/ler',
  '/leitura',
];

let cachedCatalog = null;
let cachedCatalogTime = 0;

function getCatalog() {
  if (cachedCatalog && Date.now() - cachedCatalogTime < 60_000) {
    return cachedCatalog;
  }
  cachedCatalog = loadSeoCatalog();
  cachedCatalogTime = Date.now();
  return cachedCatalog;
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

function toAbsoluteUrl(urlOrPath, origin = DEFAULT_ORIGIN) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return `${origin}/og-image.jpg`;
  const trimmed = urlOrPath.trim();
  if (!trimmed) return `${origin}/og-image.jpg`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${origin}${trimmed}`;
  return `${origin}/${trimmed}`;
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

const STATIC_PAGE_META = {
  '/': {
    title: 'Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons',
    description:
      'Explore a Wotho: biblioteca digital no navegador, jornalismo global em tempo real, streaming de cinema e animes em HD e webtoons em leitura vertical.',
    h1: 'Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Início',
  },
  '/livros': {
    title: 'Biblioteca de Livros Digitais no Navegador — Wotho',
    description:
      'Leia bestsellers modernos, filosofia, clássicos universais, conteúdos do ENEM e artigos científicos completos diretamente no navegador na Wotho.',
    h1: 'Biblioteca de Livros Digitais, ENEM & Artigos Científicos',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Livros',
  },
  '/noticias': {
    title: 'Notícias Globais em Tempo Real — Wotho',
    description:
      'Cobertura jornalística independente e atualizada sobre tecnologia, ciência, economia, política, futebol, cultura e grandes ideias na Wotho.',
    h1: 'Portal de Notícias Globais em Tempo Real',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Notícias',
  },
  '/cinema': {
    title: 'Cinema & Séries em Streaming HD — Wotho',
    description:
      'Assista a filmes e séries aclamados com player em alta definição, áudio dublado em português (PT-BR) e legendas completas na Wotho.',
    h1: 'Cinema & Séries em Streaming HD',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Cinema & Séries',
  },
  '/animes': {
    title: 'Animes e Mangás em Streaming — Wotho',
    description:
      'Catálogo selecionado de animes dublados e legendados em português, episódios, trailers e capítulos de mangá integrados na Wotho.',
    h1: 'Portal de Animes & Mangás',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Animes',
  },
  '/webtoons': {
    title: 'Webtoons & Quadrinhos em Leitura Vertical — Wotho',
    description:
      'Leia histórias em quadrinhos e webtoons em formato scroll vertical de alta definição diretamente no navegador na Wotho.',
    h1: 'Webtoons & Quadrinhos em Leitura Vertical',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Webtoons',
  },
  '/sobre': {
    title: 'Sobre a Wotho — Plataforma de Cultura, Streaming e Leitura',
    description:
      'Conheça a Wotho: plataforma digital de livros no navegador, jornalismo global, webtoons e streaming de cinema e animes.',
    h1: 'Sobre a Wotho',
    schemaType: 'AboutPage',
    breadcrumbName: 'Sobre',
  },
  '/contato': {
    title: 'Contato e Atendimento — Wotho',
    description:
      'Entre em contato com a equipe da Wotho para dúvidas, sugestões de obras, pautas jornalísticas, parcerias editoriais ou suporte.',
    h1: 'Contato e Atendimento',
    schemaType: 'ContactPage',
    breadcrumbName: 'Contato',
  },
  '/mapa-do-site': {
    title: 'Mapa do Site (Sitemap) — Wotho',
    description:
      'Índice estruturado com todas as páginas canônicas, catálogos de livros, cinema, animes, webtoons e notícias da plataforma Wotho.',
    h1: 'Mapa do Site — Índice Completo Wotho',
    schemaType: 'CollectionPage',
    breadcrumbName: 'Mapa do Site',
  },
  '/termos': {
    title: 'Termos de Uso — Wotho',
    description:
      'Condições gerais de navegação, leitura digital e uso dos serviços da plataforma Wotho.',
    h1: 'Termos de Uso da Wotho',
    schemaType: 'WebPage',
    breadcrumbName: 'Termos de Uso',
  },
  '/privacidade': {
    title: 'Política de Privacidade — Wotho',
    description:
      'Diretrizes de proteção de dados, conformidade LGPD e privacidade dos usuários da Wotho.',
    h1: 'Política de Privacidade',
    schemaType: 'WebPage',
    breadcrumbName: 'Privacidade',
  },
};

export function resolveRouteSeo(rawPathname, customOrigin = DEFAULT_ORIGIN) {
  const origin = (customOrigin || DEFAULT_ORIGIN).replace(/\/+$/, '');
  let pathname = String(rawPathname || '/').split('?')[0];
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  pathname = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  // Alias normalizations for canonical consistency
  let canonicalPath = pathname;
  if (canonicalPath === '/contacto') canonicalPath = '/contato';
  if (canonicalPath === '/sitemap') canonicalPath = '/mapa-do-site';
  if (canonicalPath === '/meu-perfil') canonicalPath = '/perfil';
  if (canonicalPath === '/index.html') canonicalPath = '/';

  const catalog = getCatalog();

  // Check private/utility routes (valid 200, but noindex)
  const isPrivate = PRIVATE_NOINDEX_PREFIXES.some(
    (prefix) => canonicalPath === prefix || canonicalPath.startsWith(`${prefix}/`)
  );

  // Check reader routes that canonicalize back to the detail page
  if (canonicalPath.startsWith('/ler/')) {
    const id = decodeURIComponent(canonicalPath.slice('/ler/'.length).split('/')[0] || '');
    const book = catalog.books.find((b) => b.id === id);
    const title = book ? `${book.title} — Leitura Online | Wotho` : 'Leitor Digital — Wotho';
    const desc = book?.description || 'Leia a obra diretamente no navegador na plataforma Wotho.';
    return {
      statusCode: 200,
      indexable: false,
      robots: 'noindex, follow',
      canonicalUrl: `${origin}/livros/${encodeURIComponent(id)}`,
      title,
      description: desc,
      ogType: 'book',
      ogImage: toAbsoluteUrl(book?.cover_url, origin),
      h1: book?.title || 'Leitor Digital Wotho',
      subtitle: book?.author || '',
      links: [
        { href: `/livros/${encodeURIComponent(id)}`, label: `Voltar para ficha do livro` },
        { href: '/livros', label: 'Catálogo de Livros' },
      ],
      jsonLd: [],
    };
  }

  if (canonicalPath.startsWith('/leitura/')) {
    const id = decodeURIComponent(canonicalPath.slice('/leitura/'.length).split('/')[0] || '');
    return {
      statusCode: 200,
      indexable: false,
      robots: 'noindex, follow',
      canonicalUrl: `${origin}/conteudo/${encodeURIComponent(id)}`,
      title: 'Leitor Digital — Wotho',
      description: 'Leitura online de conteúdos digitais na plataforma Wotho.',
      ogType: 'website',
      ogImage: `${origin}/og-image.jpg`,
      h1: 'Leitor Digital Wotho',
      links: [{ href: '/livros', label: 'Explorar Livros' }],
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
      ogImage: `${origin}/og-image.jpg`,
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
      links = catalog.webtoons.slice(0, 120).map((w) => ({ href: `/webtoon/${w.id}`, label: w.title }));
      itemListElements = catalog.webtoons.slice(0, 20).map((w, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${origin}/webtoon/${encodeURIComponent(w.id)}`,
        name: w.title,
      }));
    } else if (canonicalPath === '/noticias') {
      links = catalog.news.slice(0, 80).map((n) => ({ href: `/noticias/${n.slug}`, label: n.title }));
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
        ...catalog.webtoons.slice(0, 120).map((w) => ({ href: `/webtoon/${w.id}`, label: w.title })),
        ...catalog.news.slice(0, 60).map((n) => ({ href: `/noticias/${n.slug}`, label: n.title })),
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

    return {
      statusCode: 200,
      indexable: true,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      canonicalUrl,
      title: meta.title,
      description: meta.description,
      ogType: 'website',
      ogImage: `${origin}/og-image.jpg`,
      ogImageAlt: meta.title,
      h1: meta.h1,
      links,
      jsonLd: [pageJsonLd, buildBreadcrumbJsonLd(breadcrumbItems, origin)],
    };
  }

  // Dynamic Detail: /livros/:id or /conteudo/:id
  if (canonicalPath.startsWith('/livros/') || canonicalPath.startsWith('/conteudo/')) {
    const isContent = canonicalPath.startsWith('/conteudo/');
    const prefix = isContent ? '/conteudo/' : '/livros/';
    const id = decodeURIComponent(canonicalPath.slice(prefix.length).split('/')[0] || '');
    const book = catalog.books.find((b) => b.id === id);

    if (book || id.startsWith('gut-') || id.startsWith('mod-') || id.startsWith('curr-') || id.startsWith('sci-') || id.startsWith('auto-')) {
      const bookTitle = book?.title || humanizeSlug(id.replace(/^(gut|mod|curr|sci|auto)-/, ''));
      const authorName = book?.author || 'Acervo Wotho';
      const pageTitle = `${bookTitle} — ${authorName} | Wotho Livros`;
      const desc =
        book?.description ||
        `Leia "${bookTitle}" por ${authorName} online diretamente no navegador com índice de capítulos na Wotho.`;
      const cover = toAbsoluteUrl(book?.cover_url, origin);
      const canonicalUrl = `${origin}${prefix}${encodeURIComponent(id)}`;

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

      const relatedLinks = catalog.books
        .filter((b) => b.id !== id)
        .slice(0, 12)
        .map((b) => ({ href: `/livros/${b.id}`, label: `${b.title} — ${b.author}` }));

      return {
        statusCode: 200,
        indexable: true,
        robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        canonicalUrl,
        title: pageTitle,
        description: desc,
        ogType: 'book',
        ogImage: cover,
        ogImageAlt: `${bookTitle} — ${authorName}`,
        h1: bookTitle,
        subtitle: `Por ${authorName}${book?.category ? ` · ${book.category}` : ''}`,
        bodyText: desc,
        coverImage: cover,
        links: [
          { href: `/ler/${encodeURIComponent(id)}`, label: `Ler "${bookTitle}" online no navegador` },
          ...relatedLinks,
        ],
        jsonLd: [
          bookJsonLd,
          buildBreadcrumbJsonLd(
            [
              { name: 'Wotho', url: '/' },
              { name: 'Livros', url: '/livros' },
              { name: bookTitle, url: canonicalUrl },
            ],
            origin
          ),
        ],
      };
    }
  }

  // Dynamic Detail: /cinema/:id
  if (canonicalPath.startsWith('/cinema/')) {
    const id = decodeURIComponent(canonicalPath.slice('/cinema/'.length).split('/')[0] || '');
    const item = catalog.cinema.find((c) => c.id === id);
    if (item) {
      const pageTitle = `${item.title} (${item.year}) — Cinema & Séries Wotho`;
      const desc =
        item.synopsis ||
        `Assista ${item.title} (${item.year}) em alta definição com áudio dublado PT-BR e legendas na Wotho.`;
      const cover = toAbsoluteUrl(item.posterUrl || item.backdropUrl, origin);
      const canonicalUrl = `${origin}/cinema/${encodeURIComponent(item.id)}`;
      const isSeries = item.type === 'serie';

      const cinemaJsonLd = {
        '@context': 'https://schema.org',
        '@type': isSeries ? 'TVSeries' : 'Movie',
        name: item.title,
        alternateName: item.originalTitle || undefined,
        description: desc,
        image: cover,
        datePublished: String(item.year),
        inLanguage: 'pt-BR',
        url: canonicalUrl,
        genre: item.genres,
        ...(item.director ? { director: { '@type': 'Person', name: item.director } } : {}),
        ...(Array.isArray(item.cast) && item.cast.length > 0
          ? { actor: item.cast.map((name) => ({ '@type': 'Person', name })) }
          : {}),
        ...(item.rating
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: item.rating,
                bestRating: 10,
                ratingCount: item.ratingCount || 500,
              },
            }
          : {}),
        publisher: { '@type': 'Organization', name: 'Wotho' },
      };

      const relatedLinks = catalog.cinema
        .filter((c) => c.id !== id)
        .slice(0, 12)
        .map((c) => ({ href: `/cinema/${c.id}`, label: `${c.title} (${c.year})` }));

      return {
        statusCode: 200,
        indexable: true,
        robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        canonicalUrl,
        title: pageTitle,
        description: desc,
        ogType: isSeries ? 'video.tv_show' : 'video.movie',
        ogImage: cover,
        ogImageAlt: `${item.title} (${item.year})`,
        h1: `${item.title} (${item.year})`,
        subtitle: `${isSeries ? 'Série' : 'Filme'} · ${item.director || 'Cinema Wotho'} · ${(item.genres || []).join(', ')}`,
        bodyText: desc,
        coverImage: cover,
        links: relatedLinks,
        jsonLd: [
          cinemaJsonLd,
          buildBreadcrumbJsonLd(
            [
              { name: 'Wotho', url: '/' },
              { name: 'Cinema & Séries', url: '/cinema' },
              { name: item.title, url: canonicalUrl },
            ],
            origin
          ),
        ],
      };
    }
  }

  // Dynamic Detail: /animes/:id (and /animes/:id/manga)
  if (canonicalPath.startsWith('/animes/')) {
    const parts = canonicalPath.slice('/animes/'.length).split('/');
    const id = decodeURIComponent(parts[0] || '');
    const isMangaReader = parts[1] === 'manga';
    const anime = catalog.animes.find((a) => a.id === id);

    if (anime) {
      const pageTitle = isMangaReader
        ? `${anime.title} — Ler Mangá Online | Wotho Animes`
        : `${anime.title} — Streaming de Anime & Mangá | Wotho`;
      const desc =
        anime.synopsis ||
        `Assista episódios de ${anime.title} e leia capítulos de mangá integrados na plataforma Wotho.`;
      const cover = toAbsoluteUrl(anime.cover || anime.banner, origin);
      const canonicalUrl = `${origin}/animes/${encodeURIComponent(anime.id)}`;

      const animeJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TVSeries',
        name: anime.title,
        alternateName: anime.japaneseTitle || undefined,
        description: desc,
        image: cover,
        inLanguage: 'pt-BR',
        url: canonicalUrl,
        genre: anime.genres,
        numberOfEpisodes: anime.episodesCount || undefined,
        productionCompany: anime.studio ? { '@type': 'Organization', name: anime.studio } : undefined,
        ...(anime.rating
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: anime.rating,
                bestRating: 10,
                ratingCount: anime.ratingCount || 1000,
              },
            }
          : {}),
        publisher: { '@type': 'Organization', name: 'Wotho' },
      };

      const relatedLinks = catalog.animes
        .filter((a) => a.id !== id)
        .slice(0, 12)
        .map((a) => ({ href: `/animes/${a.id}`, label: a.title }));

      return {
        statusCode: 200,
        indexable: !isMangaReader,
        robots: isMangaReader
          ? 'noindex, follow'
          : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        canonicalUrl,
        title: pageTitle,
        description: desc,
        ogType: 'video.tv_show',
        ogImage: cover,
        ogImageAlt: anime.title,
        h1: anime.title,
        subtitle: `${anime.studio || 'Anime'} · ${anime.year || ''} · ${(anime.genres || []).join(', ')}`,
        bodyText: desc,
        coverImage: cover,
        links: [{ href: `/animes/${anime.id}/manga`, label: `Ler mangá de ${anime.title}` }, ...relatedLinks],
        jsonLd: isMangaReader
          ? []
          : [
              animeJsonLd,
              buildBreadcrumbJsonLd(
                [
                  { name: 'Wotho', url: '/' },
                  { name: 'Animes', url: '/animes' },
                  { name: anime.title, url: canonicalUrl },
                ],
                origin
              ),
            ],
      };
    }
  }

  // Dynamic Detail: /webtoon/:id (and /ep/... or /ler/...)
  if (canonicalPath.startsWith('/webtoon/')) {
    const parts = canonicalPath.slice('/webtoon/'.length).split('/');
    const id = decodeURIComponent(parts[0] || '');
    const isEpisodeReader = parts.length > 1;
    const wt = catalog.webtoons.find((w) => w.id === id);

    if (wt) {
      const pageTitle = isEpisodeReader
        ? `${wt.title} — Leitura de Episódio | Wotho Webtoons`
        : `${wt.title} — Webtoon Online em Português | Wotho`;
      const desc =
        wt.description ||
        `Leia o webtoon "${wt.title}" em formato scroll vertical de alta resolução na Wotho.`;
      const cover = toAbsoluteUrl(wt.cover || wt.banner, origin);
      const canonicalUrl = `${origin}/webtoon/${encodeURIComponent(wt.id)}`;

      const wtJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWorkSeries',
        name: wt.title,
        author: wt.author ? { '@type': 'Person', name: wt.author } : undefined,
        description: desc,
        image: cover,
        inLanguage: 'pt-BR',
        url: canonicalUrl,
        genre: wt.genres,
        ...(wt.rating
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: wt.rating,
                bestRating: 10,
                ratingCount: wt.ratingCount || 500,
              },
            }
          : {}),
        publisher: { '@type': 'Organization', name: 'Wotho' },
      };

      const relatedLinks = catalog.webtoons
        .filter((w) => w.id !== id)
        .slice(0, 12)
        .map((w) => ({ href: `/webtoon/${w.id}`, label: w.title }));

      return {
        statusCode: 200,
        indexable: !isEpisodeReader,
        robots: isEpisodeReader
          ? 'noindex, follow'
          : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        canonicalUrl,
        title: pageTitle,
        description: desc,
        ogType: 'article',
        ogImage: cover,
        ogImageAlt: wt.title,
        h1: wt.title,
        subtitle: `${wt.author || 'Webtoon'}${wt.genres?.length ? ` · ${wt.genres.join(', ')}` : ''}`,
        bodyText: desc,
        coverImage: cover,
        links: [{ href: `/webtoon/${wt.id}/ler`, label: `Ler "${wt.title}" online` }, ...relatedLinks],
        jsonLd: isEpisodeReader
          ? []
          : [
              wtJsonLd,
              buildBreadcrumbJsonLd(
                [
                  { name: 'Wotho', url: '/' },
                  { name: 'Webtoons', url: '/webtoons' },
                  { name: wt.title, url: canonicalUrl },
                ],
                origin
              ),
            ],
      };
    }
  }

  // Dynamic Detail: /noticias/:slug
  if (canonicalPath.startsWith('/noticias/')) {
    const slug = decodeURIComponent(canonicalPath.slice('/noticias/'.length).split('/')[0] || '');
    if (slug) {
      const article = catalog.news.find((n) => n.slug === slug || n.id === slug);
      const headline = article?.title || humanizeSlug(slug);
      const pageTitle = `${headline} — Wotho Notícias`;
      const desc =
        article?.excerpt ||
        `Leia a reportagem completa "${headline}" com análise aprofundada no portal de notícias Wotho.`;
      const cover = toAbsoluteUrl(article?.cover_url, origin);
      const canonicalUrl = `${origin}/noticias/${encodeURIComponent(slug)}`;
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

      const relatedLinks = catalog.news
        .filter((n) => n.slug !== slug)
        .slice(0, 12)
        .map((n) => ({ href: `/noticias/${n.slug}`, label: n.title }));

      return {
        statusCode: 200,
        indexable: true,
        robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        canonicalUrl,
        title: pageTitle,
        description: desc,
        ogType: 'article',
        ogImage: cover,
        ogImageAlt: headline,
        h1: headline,
        subtitle: `${article?.category || 'Reportagem Especial'} · ${article?.source_name || 'Wotho Notícias'}`,
        bodyText: desc,
        coverImage: cover,
        links: relatedLinks,
        jsonLd: [
          newsJsonLd,
          buildBreadcrumbJsonLd(
            [
              { name: 'Wotho', url: '/' },
              { name: 'Notícias', url: '/noticias' },
              { name: headline, url: canonicalUrl },
            ],
            origin
          ),
        ],
      };
    }
  }

  // Fallback 404 (prevents Soft 404 in Google Search Console)
  return {
    statusCode: 404,
    indexable: false,
    robots: 'noindex, nofollow',
    canonicalUrl: null,
    title: '404 — Página não encontrada | Wotho',
    description: 'O endereço solicitado não existe ou foi movido na plataforma Wotho.',
    ogType: 'website',
    ogImage: `${origin}/og-image.jpg`,
    ogImageAlt: 'Wotho',
    h1: '404 — Página não encontrada',
    bodyText: `A URL "${canonicalPath}" não foi encontrada na Wotho. Explore nossos catálogos principais abaixo.`,
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
    { href: '/', label: 'Início' },
    { href: '/livros', label: 'Livros' },
    { href: '/noticias', label: 'Notícias' },
    { href: '/cinema', label: 'Cinema & Séries' },
    { href: '/animes', label: 'Animes' },
    { href: '/webtoons', label: 'Webtoons' },
    { href: '/sobre', label: 'Sobre' },
    { href: '/contato', label: 'Contato' },
    { href: '/mapa-do-site', label: 'Mapa do Site' },
  ];

  const linksHtml = (seo.links || [])
    .slice(0, 150)
    .map(
      (item) =>
        `<li style="margin:6px 0;"><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`
    )
    .join('\n          ');

  const coverHtml = seo.coverImage
    ? `<figure style="margin:16px 0;"><img src="${escapeHtml(seo.coverImage)}" alt="${escapeHtml(
        seo.ogImageAlt || seo.h1 || seo.title
      )}" width="320" style="max-width:100%;height:auto;border-radius:8px;" /></figure>`
    : '';

  return `<div id="wotho-ssr-seo" style="max-width:960px;margin:0 auto;padding:24px;font-family:'DM Sans',system-ui,sans-serif;line-height:1.6;">
  <header style="border-bottom:1px solid #e4e4e7;padding-bottom:16px;margin-bottom:24px;">
    <a href="/" style="font-weight:600;font-size:20px;text-decoration:none;color:inherit;">Wotho</a>
    <nav aria-label="Navegação Principal" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:14px;">
      ${navLinks.map((n) => `<a href="${escapeHtml(n.href)}">${escapeHtml(n.label)}</a>`).join('\n      ')}
    </nav>
  </header>
  <main>
    <article>
      <h1>${escapeHtml(seo.h1 || seo.title)}</h1>
      ${seo.subtitle ? `<p><strong>${escapeHtml(seo.subtitle)}</strong></p>` : ''}
      ${coverHtml}
      <p>${escapeHtml(seo.bodyText || seo.description)}</p>
    </article>
    ${
      linksHtml
        ? `<section aria-label="Catálogo e Links Relacionados" style="margin-top:32px;">
        <h2>Explorar na Wotho</h2>
        <ul>
          ${linksHtml}
        </ul>
      </section>`
        : ''
    }
  </main>
  <footer style="border-top:1px solid #e4e4e7;margin-top:40px;padding-top:16px;font-size:13px;">
    <p>&copy; 2026 Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons.</p>
    <nav aria-label="Links Institucionais" style="display:flex;flex-wrap:wrap;gap:12px;">
      <a href="/sobre">Sobre</a>
      <a href="/contato">Contato</a>
      <a href="/termos">Termos de Uso</a>
      <a href="/privacidade">Privacidade</a>
      <a href="/mapa-do-site">Mapa do Site</a>
      <a href="/sitemap.xml">Sitemap XML</a>
      <a href="/sitemap-index.xml">Sitemap Index</a>
      <a href="/news-sitemap.xml">Google News Sitemap</a>
      <a href="/rss.xml">RSS Feed</a>
      <a href="${escapeHtml(origin)}/llms.txt">LLMs Index</a>
    </nav>
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

  // 3. Robots & Googlebot directives
  out = out.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${escapeHtml(seo.robots)}" />`
  );
  out = out.replace(
    /<meta\s+name="googlebot"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="googlebot" content="${escapeHtml(seo.robots)}" />`
  );

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

  // 7. For search engine bots & social link previewers, replace the loading spinner with rich semantic HTML5
  if (isBot) {
    const botBody = renderSemanticBotShell(seo, origin);
    const ssrMarkerMatch = /<!--WOTHO_SSR_START-->[\s\S]*?<!--WOTHO_SSR_END-->/i;
    const bootShellMatch = /<div\s+id="wotho-boot-shell"[\s\S]*?<\/div>\s*(?=<\/div>\s*<noscript>)/i;
    if (ssrMarkerMatch.test(out)) {
      out = out.replace(ssrMarkerMatch, `\n      ${botBody}\n    `);
    } else if (bootShellMatch.test(out)) {
      out = out.replace(bootShellMatch, `${botBody}\n    `);
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
  <meta charset="UTF-8" />
  <title>Wotho</title>
  <meta name="description" content="Wotho" />
  <meta name="robots" content="index, follow" />
  <meta name="googlebot" content="index, follow" />
  <link rel="canonical" href="${DEFAULT_ORIGIN}/" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${DEFAULT_ORIGIN}/" />
  <meta property="og:title" content="Wotho" />
  <meta property="og:description" content="Wotho" />
  <meta property="og:image" content="${DEFAULT_ORIGIN}/og-image.jpg" />
  <meta property="og:image:secure_url" content="${DEFAULT_ORIGIN}/og-image.jpg" />
  <meta property="og:image:alt" content="Wotho" />
  <meta name="twitter:url" content="${DEFAULT_ORIGIN}/" />
  <meta name="twitter:title" content="Wotho" />
  <meta name="twitter:description" content="Wotho" />
  <meta name="twitter:image" content="${DEFAULT_ORIGIN}/og-image.jpg" />
  <meta name="twitter:image:alt" content="Wotho" />
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
}

export async function handleSeoPrerenderRequest(req, res) {
  const host = req.headers?.host || 'wotho.vercel.app';
  const parsedUrl = new URL(req.url || '/', `https://${host}`);
  const targetPath =
    req.query?.path ||
    parsedUrl.searchParams.get('path') ||
    parsedUrl.pathname ||
    '/';
  const normalizedPath = String(targetPath).startsWith('/') ? String(targetPath) : `/${targetPath}`;
  const ua = req.headers?.['user-agent'] || '';
  const isBot = isSearchOrSocialBot(ua) || parsedUrl.searchParams.get('_bot') === '1';

  const template = findIndexHtmlTemplate();
  const { html, seo } = injectSeoIntoHtml(template, normalizedPath, {
    origin: DEFAULT_ORIGIN,
    isBot: true,
  });

  res.statusCode = seo.statusCode || 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', seo.robots);
  if (seo.canonicalUrl) {
    res.setHeader('Link', `<${seo.canonicalUrl}>; rel="canonical"`);
  }
  res.setHeader('Vary', 'User-Agent');
  res.setHeader('Cache-Control', isBot ? 'public, s-maxage=1800, stale-while-revalidate=3600' : 'public, max-age=0, must-revalidate');
  res.end(html);
}
