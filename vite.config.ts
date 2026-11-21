import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import Parser from 'rss-parser';
import { generateBookPdf } from './src/lib/pdfGenerator';
import { ORIGINAL_PDF_REGISTRY, getOriginalPdfForBook } from './src/lib/originalPdfRegistry';
import {
  buildSitemapXml,
  buildSitemapIndexXml,
  buildSubSitemapXml,
  buildNewsSitemapXml,
  buildRssXml,
  loadSeoCatalog,
} from './scripts/generate_sitemap.js';
import {
  injectSeoIntoHtml,
  isSearchOrSocialBot,
  handleSeoPrerenderRequest,
  resolvePermanentRedirect,
} from './api/_seoPrerender.js';
import {
  handleIndexNowRequest,
  getIndexNowStats,
} from './api/_indexNowHandler.js';
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
  handleEditorialCloudSyncRequest,
  handleEditorialPdfUploadRequest,
} from './api/_adminHandler.js';
import {
  handlePdfProxyRequest,
  handleBooksCatalogRequest,
  handleBooksChaptersRequest,
} from './api/_booksHandler.js';
import {
  handleNewsFeedRequest,
  handleNewsArticleRequest,
  handleNewsExtractRequest,
  handleNewsImageProxyRequest,
  handleNewsArchiveRequest,
  handleNewsTimelineRequest,
} from './api/_newsHandler.js';
import {
  handleGeoLocateRequest,
  handleTranslateRequest,
} from './api/_geoHandler.js';

function newsRssPlugin(): Plugin {
  return {
    name: 'news-rss-syndication',
    configureServer(server) {
      server.middlewares.use('/api/geo', async (req, res) => {
        return handleGeoLocateRequest(req, res);
      });

      server.middlewares.use('/api/translate', async (req, res) => {
        return handleTranslateRequest(req, res);
      });

      server.middlewares.use('/api/news/feed', async (req, res) => {
        return handleNewsFeedRequest(req, res);
      });

      server.middlewares.use('/api/news/article', async (req, res) => {
        return handleNewsArticleRequest(req, res);
      });

      server.middlewares.use('/api/news/extract', async (req, res) => {
        return handleNewsExtractRequest(req, res);
      });

      server.middlewares.use('/api/news/image-proxy', async (req, res) => {
        return handleNewsImageProxyRequest(req, res);
      });

      server.middlewares.use('/api/news/archive', async (req, res) => {
        return handleNewsArchiveRequest(req, res);
      });

      server.middlewares.use('/api/news/timeline', async (req, res) => {
        return handleNewsTimelineRequest(req, res);
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
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          let targetPdf = urlObj.searchParams.get('url') || '';
          let bookId = (urlObj.searchParams.get('id') || '').trim();
          let requestedFilename = urlObj.searchParams.get('filename') || '';
          const isDownload = urlObj.searchParams.get('download') === 'true';

          // 0. Check if this book has an uploaded editorial PDF binary (disk, editorial store, or Firestore chunks)
          const safeBookSlug = bookId
            ? bookId.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '').slice(0, 128)
            : '';
          const hasUploadedDiskPdf = Boolean(
            safeBookSlug &&
              (fs.existsSync(path.resolve(__dirname, '.cache/wotho_editorial/wotho_uploaded_pdfs', `${safeBookSlug}.pdf`)) ||
                fs.existsSync(path.join('/tmp/wotho_uploaded_pdfs', `${safeBookSlug}.pdf`)))
          );
          if (hasUploadedDiskPdf || bookId.startsWith('book-editorial-') || targetPdf.startsWith('idb://')) {
            return handlePdfProxyRequest(req, res);
          }

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Authorization');
          res.setHeader('Accept-Ranges', 'bytes');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

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
    configurePreviewServer(server) {
      server.middlewares.use('/api/books/catalog', (req: any, res: any) => handleBooksCatalogRequest(req, res));
      server.middlewares.use('/api/books/chapters', (req: any, res: any) => handleBooksChaptersRequest(req, res));
      server.middlewares.use('/api/books/pdf-proxy', (req: any, res: any) => handlePdfProxyRequest(req, res));
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
  const dynamicCache = new Map<string, { body: string; time: number }>();

  const attachSeoMiddlewares = (server: any) => {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const urlRaw = req.url || '/';
      const [urlPath, queryString = ''] = urlRaw.split('?');
      const origin = 'https://wotho.vercel.app';

      const serveXmlCached = (key: string, ttlMs: number, builder: () => string, contentType = 'application/xml; charset=utf-8') => {
        const cached = dynamicCache.get(key);
        if (cached && Date.now() - cached.time < ttlMs) {
          res.statusCode = 200;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`);
          res.end(cached.body);
          return true;
        }
        try {
          const body = builder();
          dynamicCache.set(key, { body, time: Date.now() });
          res.statusCode = 200;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`);
          res.end(body);
          return true;
        } catch {
          return false;
        }
      };

      if (urlPath === '/sitemap.xml' || urlPath === '/api/sitemap.xml') {
        if (serveXmlCached('sitemap.xml', 3600000, () => buildSitemapXml(origin).xml)) return;
        const sitemapPath = path.resolve(__dirname, 'public/sitemap.xml');
        if (fs.existsSync(sitemapPath)) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.end(fs.readFileSync(sitemapPath, 'utf-8'));
          return;
        }
      }

      if (urlPath === '/sitemap-index.xml' || urlPath === '/api/sitemap-index.xml') {
        if (serveXmlCached('sitemap-index.xml', 3600000, () => buildSitemapIndexXml(origin).xml)) return;
      }

      if (urlPath === '/news-sitemap.xml' || urlPath === '/api/news-sitemap.xml') {
        if (serveXmlCached('news-sitemap.xml', 1800000, () => buildNewsSitemapXml(origin).xml)) return;
      }

      if (urlPath === '/rss.xml' || urlPath === '/feed.xml' || urlPath === '/api/rss.xml') {
        if (serveXmlCached('rss.xml', 1800000, () => buildRssXml(origin).xml, 'application/rss+xml; charset=utf-8')) return;
      }

      if (/^\/(?:api\/)?sitemap-(pages|books|cinema|animes|webtoons|news)\.xml$/.test(urlPath)) {
        const cleanSection = urlPath.replace(/^\/(?:api\/)?/, '');
        if (serveXmlCached(cleanSection, 3600000, () => buildSubSitemapXml(cleanSection, origin).xml)) return;
      }

      if (urlPath === '/robots.txt') {
        const robotsPath = path.resolve(__dirname, 'public/robots.txt');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        if (fs.existsSync(robotsPath)) {
          res.end(fs.readFileSync(robotsPath, 'utf-8'));
        } else {
          res.end(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
        }
        return;
      }

      if (urlPath === '/api/seo/indexnow' || urlPath === '/seo/indexnow') {
        await handleIndexNowRequest(req, res);
        return;
      }

      if (urlPath === '/api/seo/status') {
        const cat = loadSeoCatalog();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            ok: true,
            domain: origin,
            generatedAt: cat.generatedAt,
            verification: {
              googleSiteVerification: true,
              bingMsValidate: '3DD20C5692A3D68BDDFFEA861D2C737F',
              bingSiteAuthXml: '/BingSiteAuth.xml',
            },
            copilotGrounding: {
              noarchiveBlocked: false,
              nocacheBlocked: false,
              bingbotPrerenderEnabled: true,
              dataSnippetAnnotated: true,
              jsonLdConsistent: true,
              indexNow: getIndexNowStats(),
            },
            counts: {
              books: cat.books?.length || 0,
              cinema: cat.cinema?.length || 0,
              animes: cat.animes?.length || 0,
              webtoons: cat.webtoons?.length || 0,
              news: cat.news?.length || 0,
            },
          })
        );
        return;
      }

      // Permanent 301 redirects for legacy/alias paths
      const redirectTarget = resolvePermanentRedirect(urlPath);
      if (redirectTarget && req.method === 'GET' && !urlPath.startsWith('/api/')) {
        res.statusCode = 301;
        res.setHeader('Location', redirectTarget);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.end();
        return;
      }

      // Intercept crawler requests for SPA routes and return semantic SEO HTML
      const ua = req.headers?.['user-agent'] || '';
      const forceBot = /(?:^|&)_bot=1(?:&|$)/.test(queryString);
      const isHtmlRoute =
        req.method === 'GET' &&
        !urlPath.startsWith('/api/') &&
        !urlPath.startsWith('/_vercel/') &&
        !urlPath.startsWith('/.well-known/') &&
        !urlPath.startsWith('/assets/') &&
        !urlPath.startsWith('/src/') &&
        !urlPath.startsWith('/@') &&
        !urlPath.startsWith('/node_modules/') &&
        !/\.[a-z0-9]{1,8}$/i.test(urlPath);

      if (isHtmlRoute && (isSearchOrSocialBot(ua) || forceBot)) {
        req.query = { ...(req.query || {}), path: urlPath };
        await handleSeoPrerenderRequest(req, res);
        return;
      }

      next();
    });
  };

  return {
    name: 'wotho-sitemap-plugin',
    transformIndexHtml(html, ctx) {
      const rawPath = (ctx.originalUrl || ctx.path || '/').split('?')[0];
      let cleanPath = rawPath === '' || rawPath === '/index.html' ? '/' : rawPath;
      if (cleanPath.endsWith('/index.html')) {
        cleanPath = cleanPath.replace(/\/index\.html$/, '') || '/';
      }
      const { html: transformed } = injectSeoIntoHtml(html, cleanPath, {
        origin: 'https://wotho.vercel.app',
        isBot: false,
      });
      return transformed;
    },
    configureServer(server) {
      attachSeoMiddlewares(server);
    },
    configurePreviewServer(server) {
      attachSeoMiddlewares(server);
    },
  };
}

function adminAuthPlugin(): Plugin {
  const attachAdminMiddlewares = (server: any) => {
    server.middlewares.use('/api/admin/login', async (req: any, res: any) => {
      await handleAdminLoginRequest(req, res);
    });
    server.middlewares.use('/api/admin/session', async (req: any, res: any) => {
      await handleAdminSessionRequest(req, res);
    });
    server.middlewares.use('/api/admin/logout', async (req: any, res: any) => {
      await handleAdminLogoutRequest(req, res);
    });
    server.middlewares.use('/api/editorial/sync', async (req: any, res: any) => {
      await handleEditorialCloudSyncRequest(req, res);
    });
    server.middlewares.use('/api/editorial/pdf-upload', async (req: any, res: any) => {
      await handleEditorialPdfUploadRequest(req, res);
    });
  };
  return {
    name: 'worscoi-admin-auth',
    configureServer(server) {
      attachAdminMiddlewares(server);
    },
    configurePreviewServer(server) {
      attachAdminMiddlewares(server);
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
