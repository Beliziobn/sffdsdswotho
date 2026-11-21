import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function getStorageCandidates() {
  const durableDir = path.join(process.cwd(), '.cache', 'wotho_editorial');
  return {
    pdfDirs: [path.join(durableDir, 'wotho_uploaded_pdfs'), path.join('/tmp', 'wotho_uploaded_pdfs')],
    storePaths: [
      path.join(durableDir, 'wotho_editorial_cloud_store_v1.json'),
      path.join('/tmp', 'wotho_editorial_cloud_store_v1.json'),
    ],
  };
}

let cachedFirebaseCfg = null;
function loadFirebaseAppletConfig() {
  if (cachedFirebaseCfg !== null) return cachedFirebaseCfg;
  try {
    const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      cachedFirebaseCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      return cachedFirebaseCfg;
    }
  } catch {}
  cachedFirebaseCfg = {};
  return cachedFirebaseCfg;
}

function decodeFsVal(v) {
  if (!v || typeof v !== 'object') return v;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  return undefined;
}

async function queryFirestoreRestChaptersByBookId(bookId) {
  const cfg = loadFirebaseAppletConfig();
  if (!cfg?.projectId || !cfg?.firestoreDatabaseId || !cfg?.apiKey) return [];
  try {
    const dbPath = `projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}`;
    const url = `https://firestore.googleapis.com/v1/${dbPath}/documents:runQuery?key=${encodeURIComponent(cfg.apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'chapters' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'book_id' },
              op: 'EQUAL',
              value: { stringValue: String(bookId).slice(0, 128) },
            },
          },
        },
      }),
      signal: AbortSignal.timeout(6500),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    const out = [];
    for (const row of rows) {
      if (!row?.document?.fields) continue;
      const obj = {};
      for (const [k, v] of Object.entries(row.document.fields)) {
        obj[k] = decodeFsVal(v);
      }
      out.push(obj);
    }
    return out.sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
  } catch {
    return [];
  }
}

async function fetchFirestorePdfBufferById(bookId) {
  if (!bookId) return null;
  const binBookId = `pdfbin-${bookId}`.slice(0, 128);
  const chunks = await queryFirestoreRestChaptersByBookId(binBookId);
  if (!chunks || chunks.length === 0) return null;
  const joinedBase64 = chunks.map((c) => String(c.content || '').trim()).join('');
  if (joinedBase64.length < 100) return null;
  try {
    const buf = Buffer.from(joinedBase64, 'base64');
    if (buf.length > 100 && buf.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
      const { pdfDirs } = getStorageCandidates();
      const safeId = String(bookId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
      for (const dir of pdfDirs) {
        try {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, `${safeId}.pdf`), buf);
        } catch {}
      }
      return buf;
    }
  } catch {}
  return null;
}

function sanitizeBookFileId(bookId) {
  return String(bookId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 128);
}

function getUploadedPdfBufferById(bookId) {
  if (!bookId) return null;
  const { pdfDirs } = getStorageCandidates();
  const safeId = sanitizeBookFileId(bookId);
  if (!safeId) return null;
  for (const dir of pdfDirs) {
    try {
      const resolvedDir = path.resolve(dir);
      const pdfPath = path.resolve(resolvedDir, `${safeId}.pdf`);
      if (!pdfPath.startsWith(resolvedDir + path.sep)) continue;
      if (fs.existsSync(pdfPath)) {
        const buf = fs.readFileSync(pdfPath);
        if (buf.length > 100 && buf.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
          return buf;
        }
      }
    } catch {}
  }
  return null;
}

function getEditorialStoredBookAndChapters(bookId) {
  if (!bookId) return { book: null, chapters: [], pdfBuffer: null };
  const { storePaths, pdfDirs } = getStorageCandidates();
  for (const storePath of storePaths) {
    try {
      if (fs.existsSync(storePath)) {
        const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        const books = parsed?.books || {};
        const chaptersMap = parsed?.chapters || {};
        const safeId = String(bookId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
        const book = books[bookId] || books[safeId] || Object.values(books).find((b) => b && b.id === bookId) || null;
        const chapters = Object.values(chaptersMap)
          .filter((c) => c && c.book_id === bookId && Number(c.position) > 0)
          .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));

        const binChunks = Object.values(chaptersMap)
          .filter((c) => c && c.book_id === `pdfbin-${bookId}`)
          .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
        if (binChunks.length > 0) {
          const joinedBase64 = binChunks.map((c) => String(c.content || '').trim()).join('');
          if (joinedBase64) {
            const buf = Buffer.from(joinedBase64, 'base64');
            if (buf.length > 100 && buf.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
              try {
                const dir = pdfDirs[0];
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(path.join(dir, `${safeId}.pdf`), buf);
              } catch {}
              return { book, chapters, pdfBuffer: buf };
            }
          }
        }

        if (book || chapters.length > 0) {
          return { book, chapters, pdfBuffer: null };
        }
      }
    } catch {}
  }
  return { book: null, chapters: [], pdfBuffer: null };
}

function sanitizePdfWinAnsiText(input) {
  return String(input || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x0A\x0D\x20-\x7E\xA0-\xFF]/g, ' ');
}

async function synthesizeCleanBookPdf(meta) {
  const pdfDoc = await PDFDocument.create();
  const serifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const serifRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.97, 0.94),
  });

  page.drawText('WOTHO - BIBLIOTECA DIGITAL', {
    x: 60,
    y: height - 90,
    size: 11,
    font: serifBold,
    color: rgb(0.55, 0.42, 0.15),
  });

  const cleanTitle = sanitizePdfWinAnsiText(meta.title || 'Livro Digital').slice(0, 65);
  page.drawText(cleanTitle, {
    x: 60,
    y: height - 160,
    size: 22,
    font: serifBold,
    color: rgb(0.1, 0.1, 0.12),
  });

  page.drawText(sanitizePdfWinAnsiText(`Por ${meta.author || 'Acervo Wotho'}`).slice(0, 75), {
    x: 60,
    y: height - 200,
    size: 15,
    font: serifRegular,
    color: rgb(0.3, 0.3, 0.35),
  });

  page.drawText(sanitizePdfWinAnsiText(`Categoria: ${meta.category || 'Literatura'}`).slice(0, 75), {
    x: 60,
    y: height - 235,
    size: 12,
    font: serifRegular,
    color: rgb(0.45, 0.45, 0.5),
  });

  const desc = sanitizePdfWinAnsiText(
    meta.description || 'Edicao digital integral disponibilizada pela plataforma Wotho.'
  );
  const words = desc.split(/\s+/);
  let line = '';
  let y = height - 300;
  for (const w of words) {
    if ((line + ' ' + w).length > 72) {
      page.drawText(line.trim(), {
        x: 60,
        y,
        size: 12,
        font: serifRegular,
        color: rgb(0.18, 0.18, 0.2),
      });
      line = w;
      y -= 20;
      if (y < 100) break;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim() && y >= 100) {
    page.drawText(line.trim(), {
      x: 60,
      y,
      size: 12,
      font: serifRegular,
      color: rgb(0.18, 0.18, 0.2),
    });
  }

  // Render full chapters across subsequent pages if available
  const chapters = Array.isArray(meta.chapters) ? meta.chapters : [];
  for (const ch of chapters) {
    let curPage = pdfDoc.addPage([595.28, 841.89]);
    let curY = height - 70;

    curPage.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.99, 0.985, 0.965),
    });

    const chTitle = sanitizePdfWinAnsiText(ch.title || `Capitulo ${ch.position || 1}`).slice(0, 75);
    curPage.drawText(chTitle, {
      x: 56,
      y: curY,
      size: 15,
      font: serifBold,
      color: rgb(0.12, 0.12, 0.15),
    });
    curY -= 32;

    const paragraphs = sanitizePdfWinAnsiText(ch.content || '')
      .replace(/^###\s+/gm, '')
      .split(/\n+/);

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) {
        curY -= 10;
        continue;
      }
      const pWords = trimmedPara.split(/\s+/);
      let pLine = '';
      for (const pw of pWords) {
        if ((pLine + ' ' + pw).length > 78) {
          if (curY < 65) {
            curPage = pdfDoc.addPage([595.28, 841.89]);
            curPage.drawRectangle({
              x: 0,
              y: 0,
              width,
              height,
              color: rgb(0.99, 0.985, 0.965),
            });
            curY = height - 65;
          }
          curPage.drawText(pLine.trim(), {
            x: 56,
            y: curY,
            size: 11.5,
            font: serifRegular,
            color: rgb(0.16, 0.16, 0.18),
          });
          pLine = pw;
          curY -= 17;
        } else {
          pLine += (pLine ? ' ' : '') + pw;
        }
      }
      if (pLine.trim()) {
        if (curY < 65) {
          curPage = pdfDoc.addPage([595.28, 841.89]);
          curPage.drawRectangle({
            x: 0,
            y: 0,
            width,
            height,
            color: rgb(0.99, 0.985, 0.965),
          });
          curY = height - 65;
        }
        curPage.drawText(pLine.trim(), {
          x: 56,
          y: curY,
          size: 11.5,
          font: serifRegular,
          color: rgb(0.16, 0.16, 0.18),
        });
        curY -= 21;
      }
    }
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export async function handlePdfProxyRequest(req, res) {
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

    const urlObj = new URL(req.url || '', `http://${req.headers?.host || 'localhost:3000'}`);
    let bookId = (urlObj.searchParams.get('id') || '').trim();
    const targetPdf = (urlObj.searchParams.get('url') || '').trim();
    const requestedFilename = urlObj.searchParams.get('filename') || '';
    const isDownload = urlObj.searchParams.get('download') === 'true';

    // Extract bookId if targetPdf is idb://<id> or /api/books/pdf-proxy?id=<id>
    if (!bookId && targetPdf.startsWith('idb://')) {
      bookId = targetPdf.slice('idb://'.length).trim();
    } else if (!bookId && targetPdf.includes('id=')) {
      try {
        const inner = new URL(targetPdf, 'http://localhost:3000');
        bookId = (inner.searchParams.get('id') || '').trim();
      } catch {}
    }

    const storedData = bookId ? getEditorialStoredBookAndChapters(bookId) : { book: null, chapters: [], pdfBuffer: null };

    const finalTitle = urlObj.searchParams.get('title') || storedData.book?.title || 'Livro Digital';
    const finalAuthor = urlObj.searchParams.get('author') || storedData.book?.author || 'Acervo Wotho';
    const finalCategory = urlObj.searchParams.get('category') || storedData.book?.category || 'Literatura';
    const finalDesc = urlObj.searchParams.get('description') || storedData.book?.description || '';

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

    let pdfBuffer = null;
    let pdfSource = 'synthesized';

    // 1. Check uploaded PDF binary on server disk, editorial store chunks, or Firestore REST chunks
    if (bookId) {
      const uploadedBuf =
        getUploadedPdfBufferById(bookId) ||
        storedData.pdfBuffer ||
        (await fetchFirestorePdfBufferById(bookId)) ||
        null;
      if (uploadedBuf) {
        pdfBuffer = uploadedBuf;
        pdfSource = 'uploaded-editorial';
      }
    }

    // 2. Check if targetPdf is an inline data:application/pdf;base64,... URL
    if (!pdfBuffer && targetPdf.startsWith('data:application/pdf;base64,')) {
      try {
        const b64 = targetPdf.slice('data:application/pdf;base64,'.length);
        const buf = Buffer.from(b64, 'base64');
        if (buf.length > 100 && buf.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
          pdfBuffer = buf;
          pdfSource = 'inline';
        }
      } catch {}
    }

    // 3. Check external http(s) PDF URL
    if (!pdfBuffer && targetPdf && targetPdf.startsWith('http')) {
      try {
        const upstreamRes = await fetch(targetPdf, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 WothoPDF/3.0',
            Accept: 'application/pdf, application/octet-stream, */*',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(9000),
        });

        if (upstreamRes.ok) {
          const arrayBuffer = await upstreamRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (buffer.length > 500 && buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
            pdfBuffer = buffer;
            pdfSource = 'upstream';
          }
        }
      } catch {}
    }

    // 4. Fallback: synthesize clean multi-page PDF from book metadata + chapters (including Firestore chapters)
    if (!pdfBuffer) {
      let chaptersForPdf = storedData.chapters;
      if (bookId && (!chaptersForPdf || chaptersForPdf.length === 0)) {
        const fsChapters = await queryFirestoreRestChaptersByBookId(bookId);
        chaptersForPdf = fsChapters.filter((c) => Number(c.position) > 0);
      }
      pdfBuffer = await synthesizeCleanBookPdf({
        title: finalTitle,
        author: finalAuthor,
        category: finalCategory,
        description: finalDesc,
        chapters: chaptersForPdf,
      });
      pdfSource = 'synthesized';
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Pdf-Source', pdfSource);
    if (pdfSource === 'synthesized') {
      res.setHeader('X-Pdf-Fallback', 'synthesized');
    }
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${cleanAsciiFilename}"; filename*=UTF-8''${encodeURIComponent(cleanUtf8Filename)}`
    );
    res.setHeader('Cache-Control', bookId ? 'no-cache, no-store, must-revalidate' : 'public, max-age=604800, stale-while-revalidate=2592000');
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(pdfBuffer);
  } catch {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Erro ao processar stream do PDF');
  }
}

const booksCatalogCache = new Map();
const booksChapterCache = new Map();

export async function handleBooksCatalogRequest(req, res) {
  try {
    const urlObj = new URL(req.url || '', `http://${req.headers?.host || 'localhost:3000'}`);
    const search = urlObj.searchParams.get('search') || '';
    const cacheKey = search.toLowerCase().trim();

    if (booksCatalogCache.has(cacheKey)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      res.end(JSON.stringify(booksCatalogCache.get(cacheKey)));
      return;
    }

    const targetUrl = search
      ? `https://gutendex.com/books/?languages=pt&search=${encodeURIComponent(search)}`
      : `https://gutendex.com/books/?languages=pt&sort=popular`;

    const gRes = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorscoiBookReader/2.0)' },
      signal: AbortSignal.timeout(7000),
    });

    if (!gRes.ok) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ books: [], total: 0 }));
      return;
    }

    const gData = await gRes.json();
    const books = (gData.results || []).map((b) => {
      const author = b.authors?.[0]?.name
        ? b.authors[0].name.split(',').reverse().join(' ').trim()
        : 'Autor Clássico';
      const title = (b.title || 'Obra Clássica').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
      const subjects = (b.subjects || []).join(' ').toLowerCase();
      const titleLower = title.toLowerCase();

      let category = 'Romance';
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
    booksCatalogCache.set(cacheKey, result);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.end(JSON.stringify(result));
  } catch {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ books: [], total: 0 }));
  }
}

export async function handleBooksChaptersRequest(req, res) {
  try {
    const urlObj = new URL(req.url || '', `http://${req.headers?.host || 'localhost:3000'}`);
    const rawId = urlObj.searchParams.get('bookId') || '';
    const bookId = rawId.replace(/^guten-/, '').trim();

    if (!bookId || !/^\d+$/.test(bookId)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ bookId: rawId, chapters: [], totalChapters: 0 }));
      return;
    }

    if (booksChapterCache.has(bookId)) {
      const cached = booksChapterCache.get(bookId) || [];
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
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
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ bookId: `guten-${bookId}`, chapters: [], totalChapters: 0 }));
      return;
    }

    const startMatch = fullText.match(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^\*]*\*\*\*/i);
    if (startMatch && startMatch.index !== undefined) {
      fullText = fullText.substring(startMatch.index + startMatch[0].length);
    }
    const endMatch = fullText.match(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK/i);
    if (endMatch && endMatch.index !== undefined) {
      fullText = fullText.substring(0, endMatch.index);
    }

    const lines = fullText.split('\n');
    const markers = [];
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

    const chapters = [];
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

    if (chapters.length === 0) {
      const paragraphs = fullText
        .split(/\r?\n\r?\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      const chunkSize = 35;
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

    booksChapterCache.set(bookId, chapters);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.end(JSON.stringify({ bookId: `guten-${bookId}`, chapters, totalChapters: chapters.length }));
  } catch {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ chapters: [], totalChapters: 0 }));
  }
}
