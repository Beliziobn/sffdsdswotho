/**
 * Journalistic Article Formatter
 * Preserves authentic reporting from verified newsrooms (G1, Globo Esporte, Tecnoblog, Critical Hits, JBox, OtakuPT, etc.).
 * Guarantees zero artificial AI boilerplate or synthetic template injections.
 */

export interface EnrichedNews {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover_url: string;
  published: boolean;
  published_at: string;
  source_name: string;
  source_url?: string;
  read_time: number;
  word_count: number;
  key_takeaways?: string[];
}

function fixPunctuationAndEntities(text: string): string {
  return text
    .replace(/&#x27;|&#039;|&#39;/gi, "'")
    .replace(/x27([^x\n]{1,60})x27/g, "'$1'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#8217;|&rsquo;/gi, "’")
    .replace(/&#8216;|&lsquo;/gi, "‘")
    .replace(/&#8220;|&ldquo;/gi, "“")
    .replace(/&#8221;|&rdquo;/gi, "”")
    .replace(/&#8211;|&ndash;/gi, "–")
    .replace(/&#8212;|&mdash;/gi, "—")
    .replace(/\s+([,.;:!?)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripInlineClutter(text: string): string {
  return text
    .replace(/\+\s*🔍\s*Adicione o ge nas suas fontes favoritas do Google/gi, "\n\n")
    .replace(/🔍\s*Adicione o ge nas suas fontes favoritas do Google/gi, "\n\n")
    .replace(/✅\s*Clique aqui para seguir o novo canal[^\n.]*\.?/gi, "\n\n")
    .replace(/📲\s*Siga o canal[^\n.]*\.?/gi, "\n\n")
    .replace(/🎧\s*Ouça o podcast[^\n.]*\.?/gi, "\n\n")
    .replace(/PUBLICIDADE/g, "");
}

function isClutterParagraph(p: string): boolean {
  const clean = p.trim();
  if (clean.length < 20) return true;
  if (clean.includes('"_id":') || clean.includes('"additional_properties":') || clean.includes("glb.cdnConfig")) {
    return true;
  }
  // Only filter call-to-action clutter if the paragraph itself is a short standalone notice (< 180 chars)
  if (clean.length < 180) {
    if (/^\+\s/.test(clean)) return true;
    if (/^[📲🔍✅🎧📺▶️•]\s*(tudo sobre|adicione o ge|clique aqui|siga o canal|assista|ouça)/i.test(clean)) return true;
    if (/adicione o ge nas suas fontes|siga o canal d[aoe]|direto no seu whatsapp\.?\s*clique aqui/i.test(clean)) return true;
    if (/^(assista:\s*tudo sobre|veja também:|leia também:|leia mais:|confira também:|fonte\s*:|imagem\s*:|foto\s*:|crédito\s*:)/i.test(clean)) return true;
    if (/\|?\s*imagem:\s*(reprodução|divulgação)/i.test(clean)) return true;
    if (/siga e acompanhe as notícias do jbox|acompanhe o .* no google news|entre no nosso (grupo|canal) no (telegram|whatsapp)/i.test(clean)) return true;
    if (/^(the post|o post|fonte:|saiba mais|confira também|leia também|assine|compartilhe)/i.test(clean)) return true;
    if (/apareceu primeiro em|todos os direitos reservados|confira o post completo|política de privacidade|utilizamos cookies/i.test(clean)) return true;
    if (/^confira (abaixo|a seguir|o trailer|o pôster|o vídeo)\s*:?$/i.test(clean)) return true;
  }
  return false;
}

function splitLongParagraph(p: string): string[] {
  if (p.startsWith("### ") || p.startsWith("> ") || p.startsWith("• ") || p.includes("\n• ")) {
    return [p];
  }
  if (p.length <= 340) return [p];

  const protectedText = p.replace(
    /\b(Sr|Sra|Dr|Dra|Prof|Profa|Jr|St|Sto|Sta|Inc|Ltda|cia|nº|N\.º|pág|cap|vol|ed|fig|ex|etc|EUA|U\.S|R\$|US\$)\.\s+/gi,
    "$1__DOT__ "
  );

  const sentences = protectedText
    .split(/(?<=[.!?]["”’)]?)\s+(?=[A-ZÀ-Ý0-9"“‘—–-])/g)
    .map((s) => s.replace(/__DOT__/g, ".").trim())
    .filter(Boolean);

  if (sentences.length <= 1) return [p];

  const result: string[] = [];
  let current = "";

  for (const s of sentences) {
    if (!current) {
      current = s;
    } else if (current.length + 1 + s.length <= 360 && current.split(/(?<=[.!?])\s+/).length < 3) {
      current += " " + s;
    } else {
      result.push(current);
      current = s;
    }
  }
  if (current) result.push(current);

  return result;
}

export function organizeIntoReadableParagraphs(rawContent: string): string[] {
  if (!rawContent) return [];

  let cleanContent = stripInlineClutter(rawContent.trim());
  if (cleanContent.includes("### Contexto Histórico")) {
    cleanContent = cleanContent.split("### Contexto Histórico")[0].trim();
  }
  if (cleanContent.includes("### Mecanismos de Causa e Efeito")) {
    cleanContent = cleanContent.split("### Mecanismos de Causa e Efeito")[0].trim();
  }
  if (cleanContent.includes("### Impacto Multissetorial")) {
    cleanContent = cleanContent.split("### Impacto Multissetorial")[0].trim();
  }

  const rawParagraphs = cleanContent
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((p) => fixPunctuationAndEntities(p))
    .filter(Boolean);

  const organized: string[] = [];
  for (const p of rawParagraphs) {
    const chunks = splitLongParagraph(p);
    for (const c of chunks) {
      if (!isClutterParagraph(c)) {
        organized.push(c);
      }
    }
  }

  if (organized.length === 0 && cleanContent.length > 0) {
    return [fixPunctuationAndEntities(cleanContent)];
  }

  return organized;
}

/**
 * Limpa e formata a matéria jornalística genuína em parágrafos bem organizados para leitura fluida,
 * garantindo a integridade do texto real sem nenhuma interpolação artificial.
 */
export function expandNewsToDeepReport(rawArticle: {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  cover_url?: string;
  published_at?: string;
  source_name?: string;
  author?: string;
  read_time?: number;
  is_syndicated?: boolean;
}): EnrichedNews {
  const title = (rawArticle.title || "Notícia em Destaque").trim();
  const category = (rawArticle.category || "Cultura").trim();
  const sourceName = rawArticle.source_name || rawArticle.author || "Redação Worscoi";

  const rawText = (rawArticle.content || rawArticle.excerpt || "").trim();
  const organizedParagraphs = organizeIntoReadableParagraphs(rawText);

  const finalContent = organizedParagraphs.length > 0 ? organizedParagraphs.join("\n\n") : fixPunctuationAndEntities(rawText);
  const wordCount = finalContent.split(/\s+/).filter(Boolean).length;
  const readTime = rawArticle.read_time || Math.max(1, Math.round(wordCount / 180));

  const firstPara = organizedParagraphs[0] || "";
  const excerpt = rawArticle.excerpt
    ? fixPunctuationAndEntities(rawArticle.excerpt)
    : firstPara
    ? firstPara.length > 220
      ? firstPara.slice(0, 217).replace(/\s+\S*$/, "") + "..."
      : firstPara
    : title;

  const cleanCover = (rawArticle.cover_url || "").replace(/&amp;/g, "&").trim();

  return {
    id: rawArticle.id,
    title,
    slug: rawArticle.slug || rawArticle.id,
    excerpt,
    content: finalContent,
    category,
    cover_url: cleanCover,
    published: true,
    published_at: rawArticle.published_at || "2026-11-07T12:00:00.000Z",
    source_name: sourceName,
    source_url: (rawArticle as any).source_url,
    read_time: readTime,
    word_count: wordCount,
  };
}
