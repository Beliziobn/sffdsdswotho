import {
  handleCinemaResolveRequest,
  handleCinemaVttRequest,
  handleCinemaMp4ProxyRequest,
  handleCinemaHlsProxyRequest,
} from './_cinemaHandler.js';
import {
  handleMangaChaptersRequest,
  handleMangaPagesRequest,
  handleMangadexResolveChapterRequest,
  handleMangadexFeedRequest,
  handleMangadexServerRequest,
  handleMangaImageProxyRequest,
} from './_mangaHandler.js';
import {
  handleNewsFeedRequest,
  handleNewsExtractRequest,
  handleNewsImageProxyRequest,
} from './_newsHandler.js';
import {
  handlePdfProxyRequest,
  handleBooksCatalogRequest,
  handleBooksChaptersRequest,
} from './_booksHandler.js';
import {
  handleAdminLoginRequest,
  handleAdminSessionRequest,
  handleAdminLogoutRequest,
} from './_adminHandler.js';

export default async function handler(req: any, res: any) {
  // Global CORS & preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const host = req.headers?.host || 'localhost';
  const parsedUrl = new URL(req.url || '/', `http://${host}`);
  let pathname = parsedUrl.pathname.replace(/\/+$/, '').toLowerCase();

  // If invoked via dynamic routing catch-all or vercel rewrites
  const routeParam = req.query?.route || parsedUrl.searchParams.get('route');
  if (
    pathname === '/api/[...route]' ||
    pathname === '/api' ||
    pathname === '' ||
    pathname.startsWith('/api/[')
  ) {
    if (routeParam) {
      const subpath = Array.isArray(routeParam) ? routeParam.join('/') : String(routeParam);
      pathname = '/api/' + subpath.replace(/^\/+/, '').toLowerCase();
    }
  }

  switch (pathname) {
    // Cinema & Video
    case '/api/cinema/resolve':
      return handleCinemaResolveRequest(req, res);
    case '/api/cinema/vtt':
      return handleCinemaVttRequest(req, res);
    case '/api/cinema/mp4-proxy':
      return handleCinemaMp4ProxyRequest(req, res);
    case '/api/cinema/hls-proxy':
      return handleCinemaHlsProxyRequest(req, res);
    case '/api/anime/hls-manifest':
    case '/api/anime/proxy':
      return handleCinemaHlsProxyRequest(req, res);

    // Manga & Mangadex
    case '/api/manga/chapters':
      return handleMangaChaptersRequest(req, res);
    case '/api/manga/pages':
      return handleMangaPagesRequest(req, res);
    case '/api/mangadex/feed':
      return handleMangadexFeedRequest(req, res);
    case '/api/mangadex/resolve-chapter':
      return handleMangadexResolveChapterRequest(req, res);
    case '/api/mangadex/server':
      return handleMangadexServerRequest(req, res);
    case '/api/proxy/manga-image':
    case '/api/proxy/webtoon-image':
      return handleMangaImageProxyRequest(req, res);

    // News
    case '/api/news/feed':
      return handleNewsFeedRequest(req, res);
    case '/api/news/extract':
      return handleNewsExtractRequest(req, res);
    case '/api/news/image-proxy':
      return handleNewsImageProxyRequest(req, res);
    case '/api/news/archive':
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      res.end(JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }));
      return;
    case '/api/news/timeline':
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      res.end(JSON.stringify({ timeline: [] }));
      return;

    // Books
    case '/api/books/pdf-proxy':
      return handlePdfProxyRequest(req, res);
    case '/api/books/catalog':
      return handleBooksCatalogRequest(req, res);
    case '/api/books/chapters':
      return handleBooksChaptersRequest(req, res);

    // Sitemaps & Feeds
    case '/api/sitemap.xml':
    case '/sitemap.xml': {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      try {
        const { buildSitemapXml } = await import('../scripts/generate_sitemap.js');
        const { xml } = buildSitemapXml('https://wotho.vercel.app');
        res.end(xml);
      } catch {
        res.end('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://wotho.vercel.app/</loc></url>\n</urlset>');
      }
      return;
    }

    // Admin Authentication
    case '/api/admin/login':
      return handleAdminLoginRequest(req, res);
    case '/api/admin/session':
      return handleAdminSessionRequest(req, res);
    case '/api/admin/logout':
      return handleAdminLogoutRequest(req, res);

    // Health check
    case '/api/health':
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok', unified: true, functions: 1 }));
      return;

    default:
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Rota API não encontrada: ${pathname}` }));
      return;
  }
}
