import { ORIGINAL_PDF_REGISTRY } from '../../src/lib/originalPdfRegistry';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
    let targetPdf = urlObj.searchParams.get('url') || '';
    const bookId = urlObj.searchParams.get('id') || '';
    const isDownload = urlObj.searchParams.get('download') === 'true';

    if (!targetPdf && bookId && ORIGINAL_PDF_REGISTRY[bookId]) {
      targetPdf = ORIGINAL_PDF_REGISTRY[bookId].pdfUrl;
    }

    if (!targetPdf || !targetPdf.startsWith('http')) {
      res.statusCode = 400;
      res.end('Missing or invalid PDF URL');
      return;
    }

    const upstream = await fetch(targetPdf, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/pdf, application/octet-stream, */*',
      },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      res.redirect?.(302, targetPdf);
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    if (isDownload) {
      const filename = (urlObj.searchParams.get('filename') || 'livro-wotho.pdf').replace(/[^a-zA-Z0-9._-]/g, '-');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    res.end(buf);
  } catch {
    res.statusCode = 502;
    res.end('PDF proxy error');
  }
}
