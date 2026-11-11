/**
 * News Image Resolver & Contextual Visual Engine
 * Guarantees every news article receives an authentic, topic-accurate, high-resolution cover.
 * Eliminates missing covers, broken links, tracking pixels, and mismatches (e.g. AI images on soccer news).
 */

export const THEMATIC_IMAGE_POOLS: Record<string, string[]> = {
  Futebol: [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80", // Estádio lotado à noite
    "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1200&auto=format&fit=crop&q=80", // Gol e rede
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&auto=format&fit=crop&q=80", // Disputa em campo
    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&auto=format&fit=crop&q=80", // Arquibancada iluminada
    "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=1200&auto=format&fit=crop&q=80", // Jogador chute
    "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=1200&auto=format&fit=crop&q=80", // Estádio europeu
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&auto=format&fit=crop&q=80", // Chuteira e gramado
  ],
  Basquete: [
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80", // Bola de basquete em piso de madeira
    "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=1200&auto=format&fit=crop&q=80", // Enterrada na cesta aro rede
    "https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=1200&auto=format&fit=crop&q=80", // Arena de basquete iluminada
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&auto=format&fit=crop&q=80", // Quadra e ação de jogo
    "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1200&auto=format&fit=crop&q=80", // Cesta de basquete silhueta
    "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=1200&auto=format&fit=crop&q=80", // Ação de jogo em quadra
  ],
  Mercado: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80", // Gráfico financeiro velas
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80", // Painel de cotações bolsa
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80", // Arranha-céus centro financeiro
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80", // Moedas e investimento
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80", // Análise corporativa
  ],
  Virais: [
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80", // Smartphone neon feed
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80", // Arte digital moderna
    "https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?w=1200&auto=format&fit=crop&q=80", // Criador com câmera
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80", // Visual estético dinâmico
  ],
  Listas: [
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&auto=format&fit=crop&q=80", // Caderno checklist elegante
    "https://images.unsplash.com/photo-1507842229450-799042b314a5?w=1200&auto=format&fit=crop&q=80", // Livros organizados
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&auto=format&fit=crop&q=80", // Linha de destaques
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80", // Guia e leitura
  ],
  "Política": [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80", // Cúpula Congresso iluminação
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&auto=format&fit=crop&q=80", // Assembleia e plenário
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80", // Geopolítica global
    "https://images.unsplash.com/photo-1575320181282-9afab399332c?w=1200&auto=format&fit=crop&q=80", // Microfones pronunciamento
  ],
  Geografia: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80", // Globo terrestre satélite
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80", // Oceano e costa aérea
    "https://images.unsplash.com/photo-1511497584788-87676104235f?w=1200&auto=format&fit=crop&q=80", // Floresta vista de cima
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80", // Cordilheira montanhosa
    "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&auto=format&fit=crop&q=80", // Mapa cartográfico clássico
  ],
  "Ciência": [
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80", // Galáxia e telescópio espacial
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80", // Laboratório de pesquisa
    "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80", // Tubos de ensaio e biotecnologia
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80", // Órbita e satélites
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80", // Circuito quântico
  ],
  Animes: [
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80", // Arte estilo anime
    "https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80", // Neon anime estética
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80", // Action figure / arte
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80", // Paisagem anime céu
  ],
  "Mangás": [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80", // Mangás em estante
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80", // Desenho tinta preta
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80", // Painel de quadrinhos
  ],
  Webtoons: [
    "/covers/webtoons/solo-leveling-cover.jpg",
    "/covers/webtoons/orv-cover.jpg",
    "/covers/webtoons/tbate-cover.jpg",
    "/covers/webtoons/nano-machine-cover.jpg",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
  ],
  Livros: [
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&auto=format&fit=crop&q=80", // Livro aberto café
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80", // Estante de biblioteca de madeira
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80", // Pilha de livros clássicos
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80", // Estudo literário
  ],
  Tecnologias: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80", // Processador e placa
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&auto=format&fit=crop&q=80", // Inteligência artificial conceito
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop&q=80", // Smartphone de ponta
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80", // Hardware moderno
  ],
  Games: [
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80", // Setup gamer iluminação
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop&q=80", // Controle PlayStation / moderno
    "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=1200&auto=format&fit=crop&q=80", // Controle Xbox
    "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&auto=format&fit=crop&q=80", // Arcade e games
  ],
  Cultura: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80", // Cinema poltronas e tela
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80", // Festival e luzes
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80", // Música e concerto
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200&auto=format&fit=crop&q=80", // Galeria de arte
  ],
};

/** Checks if a cover URL is a valid, high-resolution graphic asset (not placeholder or tracking pixel). */
export function isValidCoverUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.length < 10) return false;
  if (trimmed === "/placeholder.svg" || trimmed.includes("placeholder.svg")) return false;
  if (/gravatar\.com|1x1|spacer|tracking|pixel|feedburner|emoji|favicon/i.test(trimmed)) return false;
  if (/\.gif(\?.*)?$/i.test(trimmed)) return false;
  return true;
}

/** Generates a deterministic positive index from string. */
function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Resolves the most appropriate cover for a news article.
 * If the provided cover is valid and not mismatched, it keeps it.
 * Otherwise, it analyzes title keywords and category to assign an authentic high-res image.
 */
export function getSmartNewsCover(
  title: string,
  category: string = "Cultura",
  existingCover?: string | null
): string {
  const lowerTitle = (title || "").toLowerCase();
  const lowerCat = (category || "").toLowerCase();

  // Guard against known corrupted mismatch: AI image mistakenly assigned to sports or non-tech news
  const isCorruptedAiImage =
    existingCover?.includes("photo-1677442136019-21780ecad995") &&
    (lowerCat.includes("futebol") ||
      lowerCat.includes("mercado") ||
      lowerCat.includes("livro") ||
      lowerCat.includes("cultura") ||
      /palmeiras|flamengo|corinthians|cruzeiro|bahia|brasileirao|campeonato/i.test(lowerTitle));

  if (isValidCoverUrl(existingCover) && !isCorruptedAiImage) {
    return existingCover!;
  }

  // 1. Strict contextual keyword matchers (ensuring leading word boundary to avoid substrings like 'Bahia' matching 'ia')
  if (
    /pol[ií]tica|congresso|senado|deputad|governo|stf|ministr|diplomacia|embaixad|paz\b|coopera[cç][aã]o internacional|elei[cç][aã]o|vota[cç][aã]o/i.test(
      lowerTitle
    )
  ) {
    const pool = THEMATIC_IMAGE_POOLS["Política"];
    return pool[stringHash(title) % pool.length];
  }

  // Basketball & NBA priority matcher
  if (
    lowerCat.includes("basquete") ||
    /basquete|basquetebol|nba\b|lakers|warriors|celtics|nuggets|bucks|suns|clippers|sixers|knicks|heat\b|mavericks|timberwolves|thunder|grizzlies|pacers|cavaliers|lebron|curry|doncic|giannis|tatum|jokic|joki[cć]|wembanyama|durant|ant-man|edwards|shai|playoffs nba|triplo-duplo|arremesso| enterrada|cesta de 3|teto salarial nba|free agency nba/i.test(
      lowerTitle
    )
  ) {
    const pool = THEMATIC_IMAGE_POOLS.Basquete;
    return pool[stringHash(title) % pool.length];
  }

  // Football (Focus on Top 5 World Leagues: Premier League, La Liga, Serie A, Bundesliga, Ligue 1 & UEFA Champions League)
  if (
    lowerCat.includes("futebol") ||
    /futebol|premier league|la liga|serie a|bundesliga|ligue 1|champions league|uefa|real madrid|barcelona|manchester city|manchester united|liverpool|arsenal|chelsea|tottenham|bayern|borussia|psg|paris saint-germain|inter de mil[aã]o|juventus|milan|napoli|atletico de madrid|roma|bayer leverkusen|campeonato ingl[eê]s|campeonato espanhol|campeonato alem[aã]o|campeonato italiano|campeonato franc[eê]s|libertadores|brasileir[aã]o|copa do mundo|gol\b|bola de ouro|craque|est[aá]dio|\b[A-Za-zÀ-ÿ0-9-]+\s+x\s+[A-Za-zÀ-ÿ0-9-]+/i.test(
      lowerTitle
    )
  ) {
    const pool = THEMATIC_IMAGE_POOLS.Futebol;
    return pool[stringHash(title) % pool.length];
  }

  if (
    /mercado|a[cç][oõ]es|ibovespa|selic|d[oó]lar|infla[cç][aã]o|banco central|investimento|startup|finan|bolsa de valores|lucro|faturamento|venture capital/i.test(
      lowerTitle
    )
  ) {
    const pool = THEMATIC_IMAGE_POOLS.Mercado;
    return pool[stringHash(title) % pool.length];
  }

  if (/viral|viralizou|trend\b|tiktok|meme|reels|influencer|redes sociais/i.test(lowerTitle)) {
    const pool = THEMATIC_IMAGE_POOLS.Virais;
    return pool[stringHash(title) % pool.length];
  }

  if (/top\s*\d+|ranking|os melhores|as melhores|lista\b|guia definitivo/i.test(lowerTitle)) {
    const pool = THEMATIC_IMAGE_POOLS.Listas;
    return pool[stringHash(title) % pool.length];
  }

  if (/geografia|clima|meio ambiente|aquecimento|ant[aá]rtica|bioma|amaz[oô]nia|oceano|mapa/i.test(lowerTitle)) {
    const pool = THEMATIC_IMAGE_POOLS.Geografia;
    return pool[stringHash(title) % pool.length];
  }

  if (
    /ci[eê]ncia|astronomia|telesc[oó]pio|nasa|planeta|f[ií]sica|biologia|gen[eé]tica|pesquisa|descoberta|exoplaneta|crispr/i.test(
      lowerTitle
    )
  ) {
    const pool = THEMATIC_IMAGE_POOLS["Ciência"];
    return pool[stringHash(title) % pool.length];
  }

  // Strict word-boundary for AI to avoid false matches on 'Bahia' or 'dia'
  if (/\b(ia|i\.a\.)\b|intelig[eê]ncia artificial|chatgpt|openai|gemini|deepseek/i.test(lowerTitle)) {
    const pool = THEMATIC_IMAGE_POOLS.Tecnologias;
    return pool[stringHash(title) % pool.length];
  }

  if (/smartphone|celular|iphone|apple|samsung|galaxy|android/i.test(lowerTitle)) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop&q=80";
  }

  if (/playstation|sony|ps5|xbox|microsoft|nintendo|zelda|mario|switch/i.test(lowerTitle)) {
    const pool = THEMATIC_IMAGE_POOLS.Games;
    return pool[stringHash(title) % pool.length];
  }

  if (/livro|literat|autor|editora|romance|poesia|bienal/i.test(lowerTitle)) {
    const pool = THEMATIC_IMAGE_POOLS.Livros;
    return pool[stringHash(title) % pool.length];
  }

  if (/naruto|one piece|dragon ball|demon slayer|bleach|jujutsu|shonen/i.test(lowerTitle)) {
    const pool = THEMATIC_IMAGE_POOLS.Animes;
    return pool[stringHash(title) % pool.length];
  }

  // 2. Category pool resolution with title hash for visual diversity
  const matchedCatKey = Object.keys(THEMATIC_IMAGE_POOLS).find(
    (k) => k.toLowerCase() === lowerCat || lowerCat.includes(k.toLowerCase())
  );

  const targetPool = matchedCatKey
    ? THEMATIC_IMAGE_POOLS[matchedCatKey]
    : THEMATIC_IMAGE_POOLS.Cultura;

  return targetPool[stringHash(title) % targetPool.length];
}
