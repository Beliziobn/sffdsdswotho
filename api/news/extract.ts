export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  const host = req.headers?.host || "localhost";
  const urlObj = new URL(req.url || "/", `http://${host}`);
  const targetUrl = urlObj.searchParams.get("url") || "";

  if (!targetUrl || !targetUrl.startsWith("http")) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Parâmetro url é obrigatório" }));
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const resp = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      res.statusCode = 200;
      res.end(JSON.stringify({ error: "Não foi possível carregar o artigo remoto" }));
      return;
    }

    const html = await resp.text();

    // 1. High-res cover image from page meta
    const ogImg =
      html.match(/<meta[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/i) ||
      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    const coverUrl = ogImg ? ogImg[1].replace(/&amp;/g, "&") : undefined;

    // 2. Extract paragraphs
    let paras: string[] = [];

    if (targetUrl.includes("globo.com")) {
      const pMatches = [...html.matchAll(/<p[^>]*class=["'][^"']*content-text__container[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi)];
      paras = pMatches.map((m) => m[1]);
    }

    if (paras.length === 0) {
      const containerMatch = html.match(
        /<(?:article|div|section|main)[^>]*class=["'][^"']*(?:entry-content|article-body|post-content|article__content|article-text|c-news__body|story-body|noticia__conteudo|materia-conteudo|corpo-texto|content-area|post_content|noticia-texto|elementor-widget-theme-post-content)[^"']*["'][\s\S]*?<\/(?:article|div|section|main)>/i
      );
      const scope = containerMatch ? containerMatch[0] : html;
      const pMatches = [...scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
      paras = pMatches.map((m) => m[1]);
    }

    if (paras.length < 3) {
      const cleanHtml = html
        .replace(/<script\b[\s\S]*?<\/script>/gi, "")
        .replace(/<style\b[\s\S]*?<\/style>/gi, "")
        .replace(/<header\b[\s\S]*?<\/header>/gi, "")
        .replace(/<footer\b[\s\S]*?<\/footer>/gi, "")
        .replace(/<nav\b[\s\S]*?<\/nav>/gi, "")
        .replace(/<aside\b[\s\S]*?<\/aside>/gi, "");
      const pMatches = [...cleanHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
      paras = pMatches.map((m) => m[1]);
    }

    const cleanParas = paras
      .map((p) =>
        p
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#8217;/g, "'")
          .replace(/&#8216;/g, "'")
          .replace(/&#8220;/g, "“")
          .replace(/&#8221;/g, "”")
          .replace(/&#8211;/g, "–")
          .replace(/&#8212;/g, "—")
          .replace(/&ccedil;/g, "ç")
          .replace(/&Ccedil;/g, "Ç")
          .replace(/&atilde;/g, "ã")
          .replace(/&Atilde;/g, "Ã")
          .replace(/&eacute;/g, "é")
          .replace(/&Eacute;/g, "É")
          .replace(/&iacute;/g, "í")
          .replace(/&oacute;/g, "ó")
          .replace(/&uacute;/g, "ú")
          .replace(/&aacute;/g, "á")
          .replace(/&ecirc;/g, "ê")
          .replace(/&ocirc;/g, "ô")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter((p) => {
        if (p.length < 35) return false;
        if (/^(the post|o post|fonte:|saiba mais|confira também|leia também|assine|compartilhe|inscreva-se)/i.test(p))
          return false;
        if (/apareceu primeiro em|todos os direitos reservados|política de privacidade/i.test(p)) return false;
        return true;
      });

    if (cleanParas.length >= 2) {
      const fullText = cleanParas.join("\n\n");
      const wordCount = fullText.split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.round(wordCount / 180));
      res.statusCode = 200;
      res.end(JSON.stringify({ content: fullText, coverUrl, readTime }));
      return;
    } else if (coverUrl) {
      res.statusCode = 200;
      res.end(JSON.stringify({ coverUrl }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ error: "Conteúdo mínimo não detectado" }));
  } catch (err: any) {
    res.statusCode = 200;
    res.end(JSON.stringify({ error: err.message }));
  }
}
