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
