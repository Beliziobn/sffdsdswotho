import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

  page.drawText('WOTHO — BIBLIOTECA DIGITAL', {
    x: 60,
    y: height - 90,
    size: 11,
    font: serifBold,
    color: rgb(0.55, 0.42, 0.15),
  });

  page.drawText((meta.title || 'Livro Digital').slice(0, 65), {
    x: 60,
    y: height - 160,
    size: 24,
    font: serifBold,
    color: rgb(0.1, 0.1, 0.12),
  });

  page.drawText(`Por ${meta.author || 'Acervo Wotho'}`, {
    x: 60,
    y: height - 200,
    size: 15,
    font: serifRegular,
    color: rgb(0.3, 0.3, 0.35),
  });

  page.drawText(`Categoria: ${meta.category || 'Literatura'}`, {
    x: 60,
    y: height - 235,
    size: 12,
    font: serifRegular,
    color: rgb(0.45, 0.45, 0.5),
  });

  const desc = (meta.description || 'Edição digital integral disponibilizada pela plataforma Wotho.').replace(
    /[^\x20-\x7E\xA0-\xFF]/g,
    ' '
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
    const targetPdf = urlObj.searchParams.get('url') || '';
    const requestedFilename = urlObj.searchParams.get('filename') || '';
    const isDownload = urlObj.searchParams.get('download') === 'true';

    const finalTitle = urlObj.searchParams.get('title') || 'Livro Digital';
    const finalAuthor = urlObj.searchParams.get('author') || 'Acervo Wotho';
    const finalCategory = urlObj.searchParams.get('category') || 'Literatura';
    const finalDesc = urlObj.searchParams.get('description') || '';

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

    if (targetPdf && targetPdf.startsWith('http')) {
      try {
        const upstreamRes = await fetch(targetPdf, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 WothoPDF/3.0',
            Accept: 'application/pdf, application/octet-stream, */*',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(7000),
        });

        if (upstreamRes.ok) {
          const arrayBuffer = await upstreamRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (buffer.length > 2500 && buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
            pdfBuffer = buffer;
          }
        }
      } catch {}
    }

    if (!pdfBuffer) {
      pdfBuffer = await synthesizeCleanBookPdf({
        title: finalTitle,
        author: finalAuthor,
        category: finalCategory,
        description: finalDesc,
      });
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
