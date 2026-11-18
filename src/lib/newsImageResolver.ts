/**
 * News Image Resolver & Contextual Visual Engine
 * Guarantees every news article receives an authentic, topic-accurate, high-resolution cover.
 */

export const THEMATIC_IMAGE_POOLS: Record<string, string[]> = {
  Futebol: [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&auto=format&fit=crop&q=80",
  ],
  Basquete: [
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=1200&auto=format&fit=crop&q=80",
  ],
  Desportos: [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1200&auto=format&fit=crop&q=80",
  ],
  "Geopolítica": [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1575320181282-9afab399332c?w=1200&auto=format&fit=crop&q=80",
  ],
  Moda: [
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=80",
  ],
  Mercado: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80",
  ],
  Virais: [
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
  ],
  Listas: [
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507842229450-799042b314a5?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80",
  ],
  "Política": [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1575320181282-9afab399332c?w=1200&auto=format&fit=crop&q=80",
  ],
  Geografia: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1511497584788-87676104235f?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&auto=format&fit=crop&q=80",
  ],
  "Ciência": [
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
  ],
  Animes: [
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
  ],
  "Mangás": [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
  ],
  Webtoons: [
    "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg",
    "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119257-Pi21aq3ey9GG.jpg",
    "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx120980-RZ9WLd0o9hyo.jpg",
    "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85143-23oup3ETbFJk.jpg",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
  ],
  Livros: [
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80",
  ],
  Tecnologias: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
  ],
  Games: [
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&auto=format&fit=crop&q=80",
  ],
  Cultura: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200&auto=format&fit=crop&q=80",
  ],
};

export function isValidCoverUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.length < 10) return false;
  if (/^data:image\/(png|jpe?g|webp|avif|gif|bmp|svg\+xml);base64,/i.test(trimmed)) {
    return trimmed.length > 32;
  }
  if (trimmed === "/placeholder.svg" || trimmed.includes("placeholder.svg")) return false;
  if (/gravatar\.com|1x1|spacer|tracking|pixel|feedburner|emoji|favicon/i.test(trimmed)) return false;
  if (/\.gif(\?.*)?$/i.test(trimmed)) return false;
  return true;
}

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getSmartNewsCover(
  title: string,
  category: string = "Cultura",
  existingCover?: string | null
): string {
  const lowerTitle = (title || "").toLowerCase();
  const lowerCat = (category || "").toLowerCase();

  const isCorruptedAiImage =
    existingCover?.includes("photo-1677442136019-21780ecad995") &&
    (lowerCat.includes("futebol") ||
      lowerCat.includes("desporto") ||
      lowerCat.includes("moda") ||
      lowerCat.includes("mercado") ||
      lowerCat.includes("livro") ||
      lowerCat.includes("cultura") ||
      /palmeiras|flamengo|corinthians|cruzeiro|bahia|brasileirao|campeonato/i.test(lowerTitle));

  if (isValidCoverUrl(existingCover) && !isCorruptedAiImage) {
    return existingCover!;
  }

  if (
    lowerCat.includes("moda") ||
    /vogue|elle\b|nike|adidas|moda|fashion|passarela|alta-costura|streetwear|sneaker/i.test(lowerTitle)
  ) {
    const pool = THEMATIC_IMAGE_POOLS.Moda;
    return pool[stringHash(title) % pool.length];
  }

  if (
    lowerCat.includes("geopol") ||
    lowerCat.includes("política") ||
    lowerCat.includes("politica") ||
    /geopol[ií]tica|pol[ií]tica|congresso|senado|deputad|governo|stf|ministr|diplomacia|embaixad|onu\b|otan\b|elei[cç][aã]o/i.test(
      lowerTitle
    )
  ) {
    const pool = THEMATIC_IMAGE_POOLS["Geopolítica"];
    return pool[stringHash(title) % pool.length];
  }

  if (
    lowerCat.includes("basquete") ||
    /basquete|basquetebol|nba\b|lakers|warriors|celtics|nuggets|bucks|suns|clippers|sixers|knicks|heat\b|mavericks|lebron|curry|doncic|giannis|tatum|jokic|wembanyama|durant|playoffs nba|triplo-duplo/i.test(
      lowerTitle
    )
  ) {
    const pool = THEMATIC_IMAGE_POOLS.Basquete;
    return pool[stringHash(title) % pool.length];
  }

  if (
    lowerCat.includes("desporto") ||
    /\b(f1|fórmula 1|formula 1|tênis|tenis|vôlei|volei|ufc|mma|olimpíadas|olimpiadas|atletismo|natação|motogp)\b/i.test(
      lowerTitle
    )
  ) {
    const pool = THEMATIC_IMAGE_POOLS.Desportos;
    return pool[stringHash(title) % pool.length];
  }

  if (
    lowerCat.includes("futebol") ||
    /futebol|besoccer|365scores|tnt sports|premier league|la liga|serie a|bundesliga|ligue 1|champions league|uefa|real madrid|barcelona|manchester city|manchester united|liverpool|arsenal|chelsea|tottenham|bayern|borussia|psg|inter de mil[aã]o|juventus|milan|napoli|libertadores|brasileir[aã]o|copa do mundo/i.test(
      lowerTitle
    )
  ) {
    const pool = THEMATIC_IMAGE_POOLS.Futebol;
    return pool[stringHash(title) % pool.length];
  }

  if (/\b(ia|i\.a\.)\b|intelig[eê]ncia artificial|chatgpt|openai|gemini|deepseek|tecmundo|canaltech/i.test(lowerTitle)) {
    const pool = THEMATIC_IMAGE_POOLS.Tecnologias;
    return pool[stringHash(title) % pool.length];
  }

  if (/mmorpg|playstation|sony|ps5|xbox|nintendo|zelda|mario|switch|steam/i.test(lowerTitle)) {
    const pool = THEMATIC_IMAGE_POOLS.Games;
    return pool[stringHash(title) % pool.length];
  }

  if (/webtoon|manhwa|solo leveling|tower of god|omniscient reader/i.test(lowerTitle)) {
    const pool = THEMATIC_IMAGE_POOLS.Webtoons;
    return pool[stringHash(title) % pool.length];
  }

  if (/naruto|one piece|dragon ball|demon slayer|bleach|jujutsu|shonen|crunchyroll|anime news network/i.test(lowerTitle)) {
    const pool = THEMATIC_IMAGE_POOLS.Animes;
    return pool[stringHash(title) % pool.length];
  }

  const matchedCatKey = Object.keys(THEMATIC_IMAGE_POOLS).find(
    (k) => k.toLowerCase() === lowerCat || lowerCat.includes(k.toLowerCase())
  );

  const targetPool = matchedCatKey
    ? THEMATIC_IMAGE_POOLS[matchedCatKey]
    : THEMATIC_IMAGE_POOLS.Cultura;

  return targetPool[stringHash(title) % targetPool.length];
}
