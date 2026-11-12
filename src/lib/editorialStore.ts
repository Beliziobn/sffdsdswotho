import type { Book, Chapter, NewsItem } from "@/hooks/useCatalog";
import { getSmartNewsCover } from "@/lib/newsImageResolver";
import {
  publishNewsToCloud,
  deleteNewsFromCloud,
  publishBookToCloud,
  deleteBookFromCloud,
  publishChapterToCloud,
  publishAnimeOverrideToCloud,
  fetchCloudNews,
  fetchCloudBooks,
  fetchCloudAnimeOverrides,
} from "./cloudEditorialService";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { isExcludedItem, filterExcludedItems, EXCLUDED_IDS, EXCLUDED_SLUGS } from "./excludedItems";

export const SPECIAL_ADMIN_EMAIL = "miguelworscoi@gmail.com";
export const SPECIAL_ADMIN_PASS = "004116";

const ADMIN_SESSION_KEY = "worscoi_special_admin_session_v1";
const NEWS_OVERRIDES_KEY = "worscoi_editorial_news_overrides_v1";
const CUSTOM_NEWS_KEY = "worscoi_editorial_custom_news_v1";
const DELETED_NEWS_KEY = "worscoi_editorial_deleted_news_v1";

const BOOK_OVERRIDES_KEY = "worscoi_editorial_book_overrides_v1";
const CUSTOM_BOOKS_KEY = "worscoi_editorial_custom_books_v1";
const CUSTOM_CHAPTERS_KEY = "worscoi_editorial_custom_chapters_v1";
const DELETED_BOOKS_KEY = "worscoi_editorial_deleted_books_v1";

const ANIME_OVERRIDES_KEY = "worscoi_editorial_anime_overrides_v1";

let isCloudSyncing = false;
export async function initCloudEditorialSync(): Promise<void> {
  if (typeof window === "undefined" || isCloudSyncing) return;
  isCloudSyncing = true;
  try {
    const [cloudNews, cloudBooks, cloudAnimes] = await Promise.all([
      fetchCloudNews(),
      fetchCloudBooks(),
      fetchCloudAnimeOverrides(),
    ]);

    let changed = false;

    if (cloudNews && cloudNews.length > 0) {
      const customList = getCustomNewsPublications();
      const overrides = getNewsOverrides();
      for (const cn of cloudNews) {
        overrides[cn.id] = cn;
        if (cn.slug) overrides[cn.slug] = cn;
        const idx = customList.findIndex((c) => c.id === cn.id || c.slug === cn.slug);
        if (idx >= 0) {
          customList[idx] = cn;
        } else {
          customList.unshift(cn);
        }
      }
      safeWriteJson(NEWS_OVERRIDES_KEY, overrides);
      safeWriteJson(CUSTOM_NEWS_KEY, customList);
      changed = true;
    }

    if (cloudBooks && cloudBooks.length > 0) {
      const customBooks = getCustomBooks();
      const overrides = getBookOverrides();
      for (const cb of cloudBooks) {
        overrides[cb.id] = cb;
        const idx = customBooks.findIndex((b) => b.id === cb.id);
        if (idx >= 0) {
          customBooks[idx] = cb;
        } else {
          customBooks.unshift(cb);
        }
      }
      safeWriteJson(BOOK_OVERRIDES_KEY, overrides);
      safeWriteJson(CUSTOM_BOOKS_KEY, customBooks);
      changed = true;
    }

    if (cloudAnimes && Object.keys(cloudAnimes).length > 0) {
      const overrides = getAnimeOverrides();
      for (const aId of Object.keys(cloudAnimes)) {
        overrides[aId] = { ...(overrides[aId] || {}), ...cloudAnimes[aId] };
      }
      safeWriteJson(ANIME_OVERRIDES_KEY, overrides);
      changed = true;
    }

    if (changed) {
      window.dispatchEvent(new Event("worscoi_editorial_updated"));
    }
  } catch (err) {
    console.warn("[EditorialStore] Cloud initial sync warning:", err);
  } finally {
    isCloudSyncing = false;
  }
}

if (typeof window !== "undefined") {
  // Sync immediately on app load for all visitors
  setTimeout(() => {
    void initCloudEditorialSync();
  }, 200);

  onAuthStateChanged(auth, () => {
    void initCloudEditorialSync();
  });
}

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("worscoi_editorial_updated"));
  } catch {
    // Ignore storage quota errors
  }
}

export function slugifyEditorial(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

// ============================================================================
// 1. SPECIAL MASTER LOGIN (miguelworscoi@gmail.com / 004116)
// ============================================================================

export function verifySpecialAdminCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === SPECIAL_ADMIN_EMAIL &&
    password.trim() === SPECIAL_ADMIN_PASS
  );
}

export function loginSpecialAdmin(): void {
  if (typeof window === "undefined") return;
  const payload = {
    id: "master-admin-miguel-worscoi",
    email: SPECIAL_ADMIN_EMAIL,
    role: "admin",
    displayName: "Miguel Worscoi (Editor-Chefe)",
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event("worscoi_auth_updated"));
}

export function logoutSpecialAdmin(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event("worscoi_auth_updated"));
}

export function isSpecialAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.email === SPECIAL_ADMIN_EMAIL;
  } catch {
    return false;
  }
}

export function getSpecialAdminUser() {
  if (!isSpecialAdminLoggedIn()) return null;
  return {
    id: "master-admin-miguel-worscoi",
    email: SPECIAL_ADMIN_EMAIL,
    app_metadata: { provider: "email", role: "admin" },
    user_metadata: {
      display_name: "Miguel Worscoi",
      role: "Editor-Chefe & Administrador Mestre",
    },
    aud: "authenticated",
    created_at: "2025-01-01T00:00:00.000Z",
  };
}

// ============================================================================
// 2. NEWS PUBLICATIONS & EDITORIAL OVERRIDES
// ============================================================================

export type EditorialNewsPatch = Partial<NewsItem> & {
  author?: string;
  source_name?: string;
  updated_at?: string;
  improved_count?: number;
};

export function getNewsOverrides(): Record<string, EditorialNewsPatch> {
  return safeReadJson<Record<string, EditorialNewsPatch>>(NEWS_OVERRIDES_KEY, {});
}

export function getCustomNewsPublications(): NewsItem[] {
  return safeReadJson<NewsItem[]>(CUSTOM_NEWS_KEY, []);
}

export function getDeletedNewsIds(): string[] {
  const local = safeReadJson<string[]>(DELETED_NEWS_KEY, []);
  return Array.from(new Set([...local, ...Array.from(EXCLUDED_IDS), ...Array.from(EXCLUDED_SLUGS)]));
}

export function applyNewsEditorialOverrides(items: NewsItem[]): NewsItem[] {
  const overrides = getNewsOverrides();
  const customList = getCustomNewsPublications();
  const deletedSet = new Set(getDeletedNewsIds().map((k) => k.toLowerCase()));

  const result: NewsItem[] = [];
  const seenKeys = new Set<string>();

  // 1. Include custom editorial publications first
  for (const custom of customList) {
    const idKey = (custom.id || "").toLowerCase();
    const slugKey = (custom.slug || "").toLowerCase();
    if (deletedSet.has(idKey) || (slugKey && deletedSet.has(slugKey))) continue;

    const patch = overrides[custom.id] || (custom.slug ? overrides[custom.slug] : undefined);
    const merged = patch ? { ...custom, ...patch } : custom;
    if (merged.published === false) continue;

    seenKeys.add(idKey || slugKey);
    if (slugKey) seenKeys.add(slugKey);
    result.push(merged);
  }

  // 2. Apply overrides to existing site publications
  for (const item of items) {
    const idKey = (item.id || "").toLowerCase();
    const slugKey = (item.slug || "").toLowerCase();
    if (deletedSet.has(idKey) || (slugKey && deletedSet.has(slugKey))) continue;
    if (seenKeys.has(idKey) || (slugKey && seenKeys.has(slugKey))) continue;

    const patch = overrides[item.id] || (item.slug ? overrides[item.slug] : undefined);
    const merged = patch ? { ...item, ...patch } : item;
    if (merged.published === false) continue;

    if (idKey) seenKeys.add(idKey);
    if (slugKey) seenKeys.add(slugKey);
    result.push(merged);
  }

  return filterExcludedItems(result);
}

export function getSingleNewsWithOverrides(
  slugOrId: string,
  baseItem: NewsItem | null
): NewsItem | null {
  const cleanKey = slugOrId.trim().toLowerCase();
  if (isExcludedItem({ id: cleanKey, slug: cleanKey }) || (baseItem && isExcludedItem(baseItem))) {
    return null;
  }
  const deletedSet = new Set(getDeletedNewsIds().map((k) => k.toLowerCase()));
  if (deletedSet.has(cleanKey)) return null;

  const overrides = getNewsOverrides();
  const customList = getCustomNewsPublications();

  const customMatch = customList.find(
    (c) =>
      c.slug?.toLowerCase() === cleanKey ||
      c.id?.toLowerCase() === cleanKey
  );

  const target = customMatch || baseItem;
  if (!target) {
    // Check if an override itself holds a full article object
    const directPatch = overrides[slugOrId] || overrides[cleanKey];
    if (directPatch && directPatch.title && directPatch.content) {
      return {
        id: directPatch.id || slugOrId,
        slug: directPatch.slug || slugOrId,
        title: directPatch.title,
        excerpt: directPatch.excerpt || "",
        content: directPatch.content,
        cover_url:
          directPatch.cover_url ||
          getSmartNewsCover(directPatch.title, directPatch.category || "Geral"),
        category: directPatch.category || "Geral",
        published: directPatch.published ?? true,
        published_at: directPatch.published_at || new Date().toISOString(),
        ...directPatch,
      } as NewsItem;
    }
    return null;
  }

  const patch =
    overrides[target.id] ||
    overrides[target.slug] ||
    overrides[slugOrId] ||
    overrides[cleanKey];

  return patch ? ({ ...target, ...patch } as NewsItem) : target;
}

export function saveNewsPublication(
  input: Partial<NewsItem> & {
    id?: string;
    slug?: string;
    author?: string;
    source_name?: string;
    isNew?: boolean;
  }
): NewsItem {
  const title = (input.title || "Nova Publicação Editorial").trim();
  const category = (input.category || "Geral").trim();
  const slug = (input.slug || slugifyEditorial(title) || `editorial-${Date.now()}`).trim();
  const id = (input.id || `editorial-${slug}`).trim();
  const cover_url =
    input.cover_url?.trim() || getSmartNewsCover(title, category);
  const content = (input.content || "").trim();
  const excerpt =
    (input.excerpt || "").trim() ||
    content.replace(/###\s*/g, "").slice(0, 200).trim() + "...";
  const published_at = input.published_at || new Date().toISOString();

  const fullItem: NewsItem & { author?: string; source_name?: string; updated_at?: string } = {
    id,
    slug,
    title,
    excerpt,
    content,
    cover_url,
    category,
    published: input.published ?? true,
    published_at,
    author: input.author || "Miguel Worscoi (Redação Editorial)",
    source_name: input.source_name || "Worscoi Editorial",
    updated_at: new Date().toISOString(),
  };

  // Save in overrides keyed by both id and slug so any existing article on the site is updated immediately
  const overrides = getNewsOverrides();
  overrides[id] = fullItem;
  overrides[slug] = fullItem;
  safeWriteJson(NEWS_OVERRIDES_KEY, overrides);

  // If it's a newly created or imported publication, also store in custom news list
  const customList = getCustomNewsPublications();
  const existingIdx = customList.findIndex(
    (c) => c.id === id || c.slug === slug
  );
  if (existingIdx >= 0) {
    customList[existingIdx] = fullItem;
    safeWriteJson(CUSTOM_NEWS_KEY, customList);
  } else if (input.isNew) {
    customList.unshift(fullItem);
    safeWriteJson(CUSTOM_NEWS_KEY, customList);
  }

  // Ensure it's not in deleted list
  const deleted = getDeletedNewsIds().filter(
    (k) => k.toLowerCase() !== id.toLowerCase() && k.toLowerCase() !== slug.toLowerCase()
  );
  safeWriteJson(DELETED_NEWS_KEY, deleted);

  // Sync with Firestore Cloud immediately so all users receive the publication
  void publishNewsToCloud(fullItem);

  return fullItem;
}

export function deleteNewsPublication(idOrSlug: string): void {
  const clean = idOrSlug.trim();
  if (!clean) return;
  const deleted = getDeletedNewsIds();
  if (!deleted.includes(clean)) {
    deleted.push(clean);
    safeWriteJson(DELETED_NEWS_KEY, deleted);
  }
  const customList = getCustomNewsPublications().filter(
    (c) => c.id !== clean && c.slug !== clean
  );
  safeWriteJson(CUSTOM_NEWS_KEY, customList);

  // Mark deleted/unpublished in Firestore Cloud
  void deleteNewsFromCloud(clean);
}

// ============================================================================
// 3. EDITORIAL OPTIMIZER ("MELHORAR PUBLICAÇÃO")
// ============================================================================

export function improveNewsPublication(input: {
  title: string;
  excerpt: string;
  content: string;
  category: string;
}): {
  title: string;
  excerpt: string;
  content: string;
  improvements: string[];
} {
  const improvements: string[] = [];
  let title = input.title.trim();
  const category = (input.category || "Geral").trim();
  let excerpt = input.excerpt.trim();
  let rawContent = input.content.trim();

  // 1. Clean up title formatting
  if (title.endsWith(".")) {
    title = title.slice(0, -1);
    improvements.push("Título refinado segundo padrão jornalístico");
  }

  // 2. Split into paragraphs and clean HTML/entities if any
  const paragraphs = rawContent
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // 3. Ensure strong Lead / Excerpt
  if (!excerpt || excerpt.length < 70) {
    const firstText = paragraphs.find((p) => !p.startsWith("###") && !p.startsWith(">")) || title;
    excerpt =
      firstText.length > 210
        ? firstText.slice(0, 205).replace(/\s+\S*$/, "") + "..."
        : `${firstText} Confira a análise editorial detalhada, bastidores e desdobramentos completos sobre ${category.toLowerCase()}.`;
    improvements.push("Resumo editorial (Lead) ampliado e otimizado para leitura rápida");
  }

  // 4. Add structured subheadings if missing
  const hasHeadings = paragraphs.some((p) => p.startsWith("### "));
  const hasQuote = paragraphs.some((p) => p.startsWith("> "));
  const hasBullets = paragraphs.some((p) => p.includes("• "));

  const enrichedBlocks: string[] = [];

  if (paragraphs.length === 0) {
    enrichedBlocks.push(
      `${title} marca um momento decisivo no cenário atual de ${category}. A movimentação mobiliza especialistas, analistas e o público acompanhando os desdobramentos diretos desta semana.`
    );
  } else {
    paragraphs.forEach((p, idx) => {
      enrichedBlocks.push(p);
      if (!hasHeadings && idx === 1 && paragraphs.length >= 3) {
        enrichedBlocks.push("### Contexto e Bastidores da Movimentação");
        improvements.push("Subtítulos editoriais (H3) inseridos para escaneabilidade");
      }
      if (!hasHeadings && idx === 3 && paragraphs.length >= 5) {
        enrichedBlocks.push("### Impacto Direto e Projeções");
      }
    });
  }

  // 5. Enrich depth if content is short (< 1100 chars)
  const currentLength = enrichedBlocks.join("\n\n").length;
  if (currentLength < 1100) {
    const catLower = category.toLowerCase();
    if (catLower.includes("esporte") || catLower.includes("futebol")) {
      enrichedBlocks.push(
        "### Análise Tática e Cenário nas Grandes Ligas Europeias",
        `No panorama competitivo das grandes ligas europeias — abrangendo clubes de elite como Real Madrid, Barcelona, Manchester City, Bayern München, Arsenal, Liverpool e Inter de Milão —, decisões técnicas e gestão de elenco definem a corrida pelos títulos continentais da UEFA Champions League e dos campeonatos nacionais.`,
        `> "No futebol europeu de altíssimo rendimento, a consistência tática entre as janelas decisivas da temporada separa os elencos históricos dos demais competidores."`,
        `• Monitoramento de desempenho físico e intensidade de pressão alta nos 90 minutos\n• Planejamento estratégico da comissão técnica para o calendário europeu\n• Repercussão imediata na tabela de classificação e nas próximas rodadas`
      );
    } else if (catLower.includes("tecnologia") || catLower.includes("ciência") || catLower.includes("ciencia")) {
      enrichedBlocks.push(
        "### Inovação Técnica e Impacto Global",
        `O avanço consolida uma nova etapa para a infraestrutura tecnológica e científica internacional. Centros de pesquisa e líderes da indústria destacam que a adoção prática dessas soluções acelera a eficiência operacional e redefine os padrões de segurança e escalabilidade.`,
        `> "A convergência entre pesquisa aplicada e engenharia de ponta transforma descobertas teóricas em impacto real para milhões de usuários."`,
        `• Arquitetura otimizada com foco em desempenho, segurança e sustentabilidade\n• Integração com ecossistemas globais de pesquisa e desenvolvimento\n• Cronograma de implementação e novos marcos previstos para os próximos trimestres`
      );
    } else {
      enrichedBlocks.push(
        "### Panorama Completo e Desdobramentos",
        `A repercussão do tema em ${category} evidencia uma transformação consistente no setor. Especialistas apontam que os próximos capítulos dependerão da capacidade de adaptação das instituições envolvidas e da resposta do público internacional.`,
        `> "A profundidade na análise dos fatos permite compreender não apenas o evento imediato, mas as tendências estruturais que moldam o cenário atual."`,
        `• Consolidação dos principais indicadores e dados verificados pela reportagem\n• Acompanhamento contínuo das atualizações oficiais e fontes primárias\n• Impacto cultural, econômico e institucional a médio prazo`
      );
    }
    improvements.push("Profundidade jornalística expandida com análise, citação em destaque e tópicos-chave");
  } else {
    if (!hasQuote) {
      enrichedBlocks.splice(
        Math.min(2, enrichedBlocks.length),
        0,
        `> "${excerpt.replace(/\.{3}$/, "")}"`
      );
      improvements.push("Citação editorial em destaque adicionada ao corpo do artigo");
    }
    if (!hasBullets) {
      enrichedBlocks.push(
        "### Pontos-Chave da Reportagem",
        `• Tema central: ${title}\n• Editoria: ${category} com cobertura atualizada\n• Verificação editorial concluída pela equipe Worscoi`
      );
      improvements.push("Bloco de resumo em tópicos adicionado ao final da matéria");
    }
  }

  return {
    title,
    excerpt,
    content: enrichedBlocks.join("\n\n"),
    improvements:
      improvements.length > 0
        ? improvements
        : ["Estrutura revisada e parágrafos padronizados com sucesso"],
  };
}

// ============================================================================
// 4. DIVERSE PUBLICATIONS GENERATOR & IMPORTER ("CONSEGUIR PUBLICAÇÕES DIVERSAS")
// ============================================================================

export interface DiverseTopicOption {
  id: string;
  label: string;
  category: string;
  description: string;
}

export const DIVERSE_PUBLICATION_TOPICS: DiverseTopicOption[] = [
  {
    id: "futebol-europeu",
    label: "Futebol Europeu & Champions League",
    category: "Esporte",
    description: "Real Madrid, Barcelona, Man City, Bayern München, Premier League, LaLiga e Champions.",
  },
  {
    id: "tecnologia-ia",
    label: "Tecnologia, Chips & Cibersegurança",
    category: "Tecnologia",
    description: "Semicondutores, computação em nuvem, engenharia de software e lançamentos globais.",
  },
  {
    id: "ciencia-espaco",
    label: "Ciência, Astronomia & Medicina",
    category: "Ciência",
    description: "Telescópio James Webb, missões da ESA/NASA, física quântica e biotecnologia.",
  },
  {
    id: "animes-mangas",
    label: "Animes, Mangás & Cultura Otaku",
    category: "Cultura",
    description: "Bastidores de estúdios japoneses, estreias da temporada, Shonen Jump e adaptações.",
  },
  {
    id: "literatura-filosofia",
    label: "Literatura, Livros & Filosofia",
    category: "Cultura",
    description: "Grandes obras clássicas, ensaios filosóficos, mercado editorial e crítica literária.",
  },
  {
    id: "economia-mercados",
    label: "Economia Global & Geopolítica",
    category: "Economia",
    description: "Bancos centrais, União Europeia, comércio internacional e transição energética.",
  },
  {
    id: "cinema-series",
    label: "Cinema, Streaming & Premiações",
    category: "Entretenimento",
    description: "Festivais internacionais, grandes produções, direção de fotografia e roteiro.",
  },
];

const CURATED_DIVERSE_TEMPLATES: Record<string, Array<Omit<NewsItem, "id" | "published_at">>> = {
  "futebol-europeu": [
    {
      title: "Real Madrid, Manchester City e Bayern München redefinem o padrão tático das quartas da Champions League",
      slug: "real-madrid-man-city-bayern-padrao-tatico-champions-league",
      category: "Esporte",
      published: true,
      cover_url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&auto=format&fit=crop&q=80",
      excerpt: "Análise profunda mostra como a intensidade de transição do Real Madrid, o controle posicional do Manchester City e a pressão vertical do Bayern München dominam o futebol europeu.",
      content: `A temporada europeia atingiu seu ápice técnico nos confrontos decisivos entre os gigantes do continente. Real Madrid, Manchester City, Barcelona e Bayern München demonstram que a evolução tática do futebol moderno passa pelo domínio dos meios-espaços e pela capacidade de alternar blocos de pressão em frações de segundo.

### O Meio-Campo Híbrido de Real Madrid e Barcelona na LaLiga

Na Espanha, a disputa pelo topo da LaLiga reflete duas escolas que se reinventaram. No Santiago Bernabéu, o Real Madrid combina a força física e infiltração de Jude Bellingham com a velocidade letal de Vinícius Júnior e Kylian Mbappé nas transições curtas. Já o Barcelona sob o comando de Hansi Flick aposta em uma linha defensiva alta e na criatividade de Pedri e Lamine Yamal para quebrar defesas fechadas.

> "A diferença na elite europeia hoje está na velocidade mental com que os meio-campistas leem o espaço vazio antes mesmo de a bola chegar aos atacantes."

### Premier League e Bundesliga: A Máquina de Guardiola e a Força Bávara

Na Inglaterra, o Manchester City mantém sua assinatura de posse progressiva no Etihad Stadium, enquanto Arsenal e Liverpool exigem precisão máxima a cada rodada da Premier League. Na Alemanha, o Bayern München na Allianz Arena alia o faro artilheiro de Harry Kane à genialidade de Jamal Musiala no um contra um.

• Real Madrid e Barcelona lideram os índices de criação de grandes chances na LaLiga espanhola
• Manchester City, Liverpool e Arsenal protagonizam a disputa mais equilibrada da Premier League na década
• Bayern München e Bayer Leverkusen elevam o nível técnico e de intensidade física na Bundesliga alemã`,
    },
    {
      title: "Barcelona e Arsenal apostam na nova geração de talentos formados na base para dominar a Europa",
      slug: "barcelona-arsenal-nova-geracao-talentos-base-europa",
      category: "Esporte",
      published: true,
      cover_url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80",
      excerpt: "De La Masia na Catalunha a Hale End em Londres, os gigantes europeus colhem os frutos de projetos de formação integrados ao elenco profissional.",
      content: `O equilíbrio financeiro imposto pelo Fair Play da UEFA transformou as categorias de base no ativo mais valioso dos clubes europeus. Barcelona e Arsenal lideram essa revolução ao integrarem jovens de 17 a 21 anos diretamente na espinha dorsal de suas equipes titulares em jogos de LaLiga, Premier League e UEFA Champions League.

### La Masia e a Identidade Tática Catalã

No Barcelona, talentos lapidados em La Masia já assumem a responsabilidade em clássicos contra o Real Madrid e noites europeias decisivas. O domínio técnico sob pressão, a orientação corporal antes do passe e a leitura coletiva permitem que os jovens atuem com maturidade de veteranos.

> "Formar jogadores em casa não é apenas uma decisão econômica; é a garantia de que a identidade tática do clube será preservada dentro de campo."

### O Modelo Inglês e Alemão de Desenvolvimento

Em Londres, o Arsenal consolidou sua competitividade na Premier League ao redor de atletas formados no clube combinados a contratações cirúrgicas. O mesmo fenômeno ocorre no Bayern München e no Paris Saint-Germain, que reformularam suas academias para reter os maiores prodígios de suas regiões metropolitanas.

• Redução de custos em transferências inflacionadas no mercado de verão europeu
• Identificação imediata entre a torcida e os atletas formados na própria academia
• Valorização patrimonial recorde nos elencos de LaLiga, Premier League e Serie A Italiana`,
    },
  ],
  "tecnologia-ia": [
    {
      title: "Nova arquitetura de processadores fotônicos promete reduzir em 70% o consumo energético de data centers",
      slug: "arquitetura-processadores-fotonicos-reducao-energia-data-centers",
      category: "Tecnologia",
      published: true,
      cover_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
      excerpt: "Substituição de trilhas elétricas de cobre por feixes de luz em silício marca o maior salto na engenharia de semicondutores da década.",
      content: `Engenheiros de semicondutores na Europa e na Ásia apresentaram a primeira geração comercial de interconexões ópticas integradas diretamente no pacote de processadores de alto desempenho. A tecnologia utiliza pulsos de laser modulados em guias de onda de silício para transmitir terabits de dados por segundo sem a dissipação térmica tradicional dos fios de cobre.

### O Fim do Gargalo Térmico na Computação de Alta Escala

Nos últimos cinco anos, a densidade dos transistores esbarrou no limite físico do aquecimento e do custo energético para movimentar dados entre memórias HBM e núcleos de processamento. Com a fotônica integrada em silício, a latência cai drasticamente enquanto a eficiência por watt atinge patamares inéditos.

> "Estamos substituindo elétrons por fótons nas vias críticas de comunicação do chip, eliminando o principal fator de desperdício térmico dos servidores modernos."

### Impacto na Infraestrutura Global de Nuvem

Grandes operadores de nuvem e centros de supercomputação científica já iniciaram a transição para racks híbridos óptico-eletrônicos, permitindo instalações mais compactas e sustentáveis.

• Transferência de dados até 10 vezes mais rápida entre clusters de servidores
• Queda expressiva na necessidade de sistemas de refrigeração líquida complexos
• Produção em escala prevista para as próximas gerações de litografia abaixo de 2 nanômetros`,
    },
  ],
  "ciencia-espaco": [
    {
      title: "Observatório Europeu do Sul e James Webb confirmam moléculas orgânicas complexas em disco protoplanetário",
      slug: "observatorio-europeu-james-webb-moleculas-organicas-disco-protoplanetario",
      category: "Ciência",
      published: true,
      cover_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
      excerpt: "Espectroscopia de infravermelho médio revela que os ingredientes químicos prebióticos sobrevivem à formação de estrelas jovens.",
      content: `Uma colaboração internacional de astrofísicos utilizando o Telescópio Espacial James Webb (JWST) e os radiotelescópios do ALMA no Deserto do Atacama identificou assinaturas espectrais inequívocas de moléculas orgânicas complexas na zona de formação de planetas rochosos ao redor de uma estrela jovem a 400 anos-luz da Terra.

### A Química da Vida Antes do Nascimento dos Planetas

A descoberta responde a uma das questões mais antigas da astrobiologia: se os compostos prebióticos precisam ser sintetizados do zero na superfície de um planeta recém-formado ou se já são herdados diretamente da nuvem molecular original. Os dados confirmam que gelos ricos em carbono e nitrogênio resistem à radiação estelar intensa.

> "Os blocos químicos fundamentais da vida não são uma raridade local do Sistema Solar, mas parte intrínseca da receita cósmica de formação planetária."

### Próximos Passos da Exploração Espacial

Com a entrada em operação do Extremely Large Telescope (ELT) da Agência Espacial Europeia nos próximos anos, os cientistas poderão mapear diretamente a atmosfera de exoplanetas terrestres na zona habitável.

• Detecção realizada através do instrumento MIRI de alta resolução espectral
• Presença confirmada de precursores de aminoácidos e hidrocarbonetos estáveis
• Novo modelo teórico para a origem da água e compostos voláteis na Terra primitiva`,
    },
  ],
  "animes-mangas": [
    {
      title: "A revolução da animação japonesa: como estúdios como MAPPA, Madhouse e David Production elevaram o padrão global",
      slug: "revolucao-animacao-japonesa-mappa-madhouse-david-production",
      category: "Cultura",
      published: true,
      cover_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
      excerpt: "De JoJo: Steel Ball Run e Frieren a Solo Leveling e One Piece, a indústria de animes vive sua era de maior excelência visual e alcance internacional.",
      content: `A indústria de animação japonesa atravessa um momento histórico de expansão artística e técnica. Obras aguardadas como JoJo's Bizarre Adventure: Steel Ball Run, Frieren e a Jornada Para o Além, Solo Leveling, Dandadan e a fase final de One Piece demonstram como a direção cinematográfica transformou cada episódio semanal em um evento global.

### Direção de Fotografia e Sakuga Contemporâneo

Diferente do modelo televisivo rígido das décadas passadas, as produções atuais adotam composição digital avançada, iluminação volumétrica e storyboards assinados por diretores convidados de elite. Em Steel Ball Run, a David Production combina a estética marcante dos traços de Hirohiko Araki com dinamismo de câmera nas corridas a cavalo pelos Estados Unidos de 1890.

> "O público global hoje exige fidelidade absoluta ao espírito do mangá original aliada a uma direção de arte que surpreenda até mesmo quem já leu cada capítulo."

### A Sinergia entre Mangá e Anime Digital

A disponibilização simultânea de capítulos de mangá e episódios em alta definição criou um ecossistema onde o espectador transita imediatamente da tela de vídeo para as páginas originais da obra.

• Crescimento expressivo da audiência de obras Seinen e Shonen na Europa e América Latina
• Adoção de temporadas divididas em cours planejados para preservar a qualidade de animação
• Valorização histórica dos autores originais (mangakás) nas decisões criativas de adaptação`,
    },
  ],
  "literatura-filosofia": [
    {
      title: "O renascimento da leitura profunda: por que clássicos da filosofia e edições fac-similares voltaram ao centro do debate",
      slug: "renascimento-leitura-profunda-classicos-filosofia-edicoes-integrais",
      category: "Cultura",
      published: true,
      cover_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&auto=format&fit=crop&q=80",
      excerpt: "Em meio à velocidade das redes digitais, leitores buscam edições integrais de Maquiavel, Marco Aurélio, Dostoiévski e tratados científicos históricos.",
      content: `Contrariando as previsões de que a leitura longa perderia espaço no século XXI, bibliotecas digitais e acervos acadêmicos registram um interesse recorde por edições integrais e fac-similares de grandes obras da história humana. De "Meditações" de Marco Aurélio e "O Príncipe" de Maquiavel aos romances psicológicos de Fiódor Dostoiévski e Machado de Assis, o leitor contemporâneo busca densidade intelectual.

### A Experiência do Texto Integral Sem Cortes

Especialistas em cognição e crítica literária destacam que a leitura de obras completas — preservando a arquitetura original de capítulos e notas históricas — desenvolve a capacidade de atenção sustentada e pensamento crítico, funcionando como um antídoto contra a fragmentação informacional.

> "Ler uma obra clássica em sua integridade é dialogar diretamente com as mentes mais brilhantes da história sem intermediários ou simplificações."

### Preservação Digital e Acesso Universal

Projetos de digitalização de alta resolução permitem hoje que estudantes, pesquisadores e entusiastas folheiem tanto o PDF fac-similar da edição histórica quanto o texto adaptado para leitura contínua em qualquer dispositivo.

• Aumento na procura por obras de filosofia estoica, ciência política e literatura clássica
• Integração entre acervos históricos digitalizados e plataformas modernas de leitura
• Valorização da fidelidade editorial e traduções comentadas`,
    },
  ],
  "economia-mercados": [
    {
      title: "União Europeia acelera investimentos em corredores ferroviários de alta velocidade e transição energética limpa",
      slug: "uniao-europeia-investimentos-ferrovias-alta-velocidade-energia-limpa",
      category: "Economia",
      published: true,
      cover_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
      excerpt: "Plano continental conecta capitais como Madri, Lisboa, Paris, Berlim e Milão com foco em descarbonização industrial e integração logística.",
      content: `O bloco europeu aprovou uma nova rodada de investimentos estruturais voltada à modernização da malha ferroviária transfronteiriça e à expansão de parques eólicos offshore no Mar do Norte e no Atlântico. A estratégia busca reduzir custos logísticos entre os principais polos industriais da Alemanha, França, Espanha, Itália e Portugal.

### Integração de Capitais e Competitividade Industrial

A conexão direta por trens de alta velocidade entre centros financeiros e tecnológicos europeus já substituiu milhões de viagens aéreas de curta distância. Paralelamente, corredores dedicados ao transporte de carga elétrica reduzem o tempo de escoamento entre os portos do Mediterrâneo e o coração industrial europeu.

> "A infraestrutura integrada de transporte e energia limpa é o alicerce da soberania econômica europeia para as próximas três décadas."

### Indicadores Macroeconômicos e Sustentabilidade

Analistas do Banco Central Europeu ressaltam que o investimento em infraestrutura física gera efeito multiplicador sobre a cadeia de engenharia, metalurgia verde e tecnologia embarcada.

• Expansão das linhas de alta velocidade conectando a Península Ibérica ao restante da Europa
• Ampliação da capacidade de armazenamento energético em baterias de escala industrial
• Estímulo direto à geração de empregos qualificados em engenharia e tecnologia`,
    },
  ],
  "cinema-series": [
    {
      title: "O retorno da fotografia em película 65mm e 35mm nos grandes lançamentos do cinema autoral internacional",
      slug: "retorno-fotografia-pelicula-65mm-35mm-cinema-autoral-internacional",
      category: "Entretenimento",
      published: true,
      cover_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80",
      excerpt: "Diretores contemporâneos resgatam câmeras analógicas e lentes anamórficas clássicas para criar texturas visuais impossíveis de replicar digitalmente.",
      content: `Nos principais festivais de cinema da Europa e nas grandes estreias mundiais, a película fotográfica voltou a ocupar lugar de honra. Cineastas e diretores de fotografia têm optado pelo uso de negativos 35mm e 65mm para conferir profundidade orgânica de cor, granulação natural e latitude dinâmica às imagens projetadas nas salas de cinema.

### A Estética Tátil da Luz sobre o Celuloide

Enquanto os sensores digitais oferecem nitidez clínica imediata, a emulsão química da película reage à luz de maneira não linear, suavizando as altas luzes e criando uma atmosfera imersiva que transforma a experiência na sala escura.

> "O cinema em película exige disciplina no set: cada tomada tem peso físico, e toda a equipe trabalha com um nível de concentração artística extraordinário."

### O Novo Público das Salas Especiais

Cinematecas e salas equipadas com projetores tradicionais em Londres, Paris, Madri, São Paulo e Tóquio registram sessões esgotadas, impulsionadas principalmente por espectadores jovens em busca de experiências cinematográficas autênticas.

• Aumento na produção de laboratórios de revelação fotoquímica na Europa e América do Norte
• Combinação de captação analógica com masterização 4K de altíssima fidelidade
• Valorização do trabalho artesanal de direção de arte e iluminação prática em set`,
    },
  ],
};

export async function acquireDiversePublications(
  topicId: string
): Promise<NewsItem[]> {
  const results: NewsItem[] = [];
  const seenSlugs = new Set<string>();

  // 1. Include curated high-depth templates for the chosen topic (or all topics if "all")
  const targetTopics =
    topicId === "all"
      ? Object.keys(CURATED_DIVERSE_TEMPLATES)
      : [topicId];

  for (const tId of targetTopics) {
    const list = CURATED_DIVERSE_TEMPLATES[tId] || [];
    for (const tpl of list) {
      if (!seenSlugs.has(tpl.slug)) {
        seenSlugs.add(tpl.slug);
        results.push({
          ...tpl,
          id: `diverse-${tpl.slug}`,
          published_at: new Date().toISOString(),
        });
      }
    }
  }

  // 2. Also query live `/api/news/feed` for fresh real-world articles
  try {
    const apiTopicMap: Record<string, string> = {
      "futebol-europeu": "esporte",
      "tecnologia-ia": "tecnologia",
      "ciencia-espaco": "ciencia",
      "animes-mangas": "cultura",
      "literatura-filosofia": "cultura",
      "economia-mercados": "economia",
      "cinema-series": "entretenimento",
      all: "all",
    };
    const apiTopic = apiTopicMap[topicId] || "all";
    const res = await fetch(`/api/news/feed?topic=${encodeURIComponent(apiTopic)}&limit=12`);
    if (res.ok) {
      const data = await res.json();
      const liveItems: any[] = data?.items || [];
      for (const item of liveItems.slice(0, 8)) {
        const slug = item.slug || slugifyEditorial(item.title || "");
        if (!slug || seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);
        const improved = improveNewsPublication({
          title: item.title || " Artigo Internacional",
          excerpt: item.excerpt || "",
          content: item.content || item.excerpt || "",
          category: item.category || "Geral",
        });
        results.push({
          id: item.id || `live-${slug}`,
          slug,
          title: improved.title,
          excerpt: improved.excerpt,
          content: improved.content,
          cover_url:
            item.cover_url ||
            getSmartNewsCover(improved.title, item.category || "Geral"),
          category: item.category || "Geral",
          published: true,
          published_at: item.published_at || new Date().toISOString(),
        });
      }
    }
  } catch {
    // Fallback gracefully to curated templates if offline
  }

  return results;
}

// ============================================================================
// 5. BOOKS & CHAPTERS EDITORIAL OVERRIDES
// ============================================================================

export function getBookOverrides(): Record<string, Partial<Book>> {
  return safeReadJson<Record<string, Partial<Book>>>(BOOK_OVERRIDES_KEY, {});
}

export function getCustomBooks(): Book[] {
  return safeReadJson<Book[]>(CUSTOM_BOOKS_KEY, []);
}

export function getDeletedBookIds(): string[] {
  const local = safeReadJson<string[]>(DELETED_BOOKS_KEY, []);
  return Array.from(new Set([...local, ...Array.from(EXCLUDED_IDS)]));
}

export function applyBookEditorialOverrides(books: Book[], search = ""): Book[] {
  const overrides = getBookOverrides();
  const customBooks = getCustomBooks();
  const deletedSet = new Set(getDeletedBookIds());

  const result: Book[] = [];
  const seenIds = new Set<string>();
  const q = search.trim().toLowerCase();

  for (const cb of customBooks) {
    if (deletedSet.has(cb.id)) continue;
    const merged = overrides[cb.id] ? { ...cb, ...overrides[cb.id] } : cb;
    if (merged.published === false) continue;
    if (
      q &&
      !merged.title.toLowerCase().includes(q) &&
      !merged.author.toLowerCase().includes(q) &&
      !merged.category.toLowerCase().includes(q) &&
      !merged.description.toLowerCase().includes(q)
    ) {
      continue;
    }
    seenIds.add(merged.id);
    result.push(merged);
  }

  for (const b of books) {
    if (deletedSet.has(b.id) || seenIds.has(b.id)) continue;
    const merged = overrides[b.id] ? { ...b, ...overrides[b.id] } : b;
    if (merged.published === false) continue;
    seenIds.add(merged.id);
    result.push(merged);
  }

  return filterExcludedItems(result);
}

export function getSingleBookWithOverrides(id: string, baseBook: Book | null): Book | null {
  if (isExcludedItem({ id }) || (baseBook && isExcludedItem(baseBook))) {
    return null;
  }
  const deletedSet = new Set(getDeletedBookIds());
  if (deletedSet.has(id)) return null;

  const overrides = getBookOverrides();
  const customBooks = getCustomBooks();
  const customMatch = customBooks.find((b) => b.id === id);
  const target = customMatch || baseBook;

  if (!target) {
    const patch = overrides[id];
    if (patch && patch.title) {
      return {
        id,
        title: patch.title,
        author: patch.author || "Autor Editorial",
        description: patch.description || "",
        cover_url: patch.cover_url || "/placeholder.svg",
        price_cents: patch.price_cents ?? 0,
        currency: patch.currency || "BRL",
        category: patch.category || "Literatura",
        published: patch.published ?? true,
        featured: patch.featured ?? true,
        created_at: patch.created_at || new Date().toISOString(),
      };
    }
    return null;
  }

  return overrides[id] ? ({ ...target, ...overrides[id] } as Book) : target;
}

export function saveBookPublication(
  input: Partial<Book> & {
    id?: string;
    isNew?: boolean;
    pdf_url?: string;
    download_url?: string;
    original_pages_count?: number;
    file_size_formatted?: string;
    edition_notes?: string;
    source_repository?: string;
  }
): Book {
  const title = (input.title || "Nova Obra Literária").trim();
  const id = (input.id || `book-editorial-${slugifyEditorial(title)}-${Date.now().toString().slice(-4)}`).trim();
  const fullBook: Book & {
    pdf_url?: string;
    download_url?: string;
    original_pages_count?: number;
    file_size_formatted?: string;
    edition_notes?: string;
    source_repository?: string;
  } = {
    id,
    title,
    author: (input.author || "Miguel Worscoi").trim(),
    description: (input.description || "").trim(),
    cover_url: input.cover_url?.trim() || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80",
    price_cents: input.price_cents ?? 0,
    currency: input.currency || "BRL",
    category: (input.category || "Literatura").trim(),
    published: input.published ?? true,
    featured: input.featured ?? true,
    created_at: input.created_at || new Date().toISOString(),
    ...(input.pdf_url ? { pdf_url: input.pdf_url } : {}),
    ...(input.download_url ? { download_url: input.download_url } : {}),
    ...(input.original_pages_count ? { original_pages_count: input.original_pages_count } : {}),
    ...(input.file_size_formatted ? { file_size_formatted: input.file_size_formatted } : {}),
    ...(input.edition_notes ? { edition_notes: input.edition_notes } : {}),
    ...(input.source_repository ? { source_repository: input.source_repository } : {}),
  };

  const overrides = getBookOverrides();
  overrides[id] = fullBook;
  safeWriteJson(BOOK_OVERRIDES_KEY, overrides);

  const customBooks = getCustomBooks();
  const idx = customBooks.findIndex((b) => b.id === id);
  if (idx >= 0) {
    customBooks[idx] = fullBook;
    safeWriteJson(CUSTOM_BOOKS_KEY, customBooks);
  } else if (input.isNew) {
    customBooks.unshift(fullBook);
    safeWriteJson(CUSTOM_BOOKS_KEY, customBooks);
  }

  const deleted = getDeletedBookIds().filter((d) => d !== id);
  safeWriteJson(DELETED_BOOKS_KEY, deleted);

  // Sync book to Firestore Cloud so all users see it immediately
  void publishBookToCloud(fullBook);

  return fullBook;
}

export function deleteBookPublication(id: string): void {
  const deleted = getDeletedBookIds();
  if (!deleted.includes(id)) {
    deleted.push(id);
    safeWriteJson(DELETED_BOOKS_KEY, deleted);
  }
  const customBooks = getCustomBooks().filter((b) => b.id !== id);
  safeWriteJson(CUSTOM_BOOKS_KEY, customBooks);

  // Mark book deleted in Firestore Cloud
  void deleteBookFromCloud(id);
}

export function getCustomBookChapters(bookId: string): Chapter[] {
  const all = safeReadJson<Record<string, Chapter[]>>(CUSTOM_CHAPTERS_KEY, {});
  return all[bookId] || [];
}

export function saveCustomBookChapter(input: {
  id?: string;
  book_id: string;
  title: string;
  content: string;
  position?: number;
  is_free_preview?: boolean;
}): Chapter {
  const all = safeReadJson<Record<string, Chapter[]>>(CUSTOM_CHAPTERS_KEY, {});
  const list = all[input.book_id] || [];
  const position = input.position ?? list.length + 1;
  const id = input.id || `${input.book_id}-cap-${position}-${Date.now().toString().slice(-4)}`;

  const chapter: Chapter = {
    id,
    book_id: input.book_id,
    title: input.title.trim(),
    content: input.content.trim(),
    position,
    is_free_preview: input.is_free_preview ?? true,
  };

  const existingIdx = list.findIndex((c) => c.id === id || c.position === position);
  if (existingIdx >= 0) {
    list[existingIdx] = chapter;
  } else {
    list.push(chapter);
  }
  list.sort((a, b) => a.position - b.position);
  all[input.book_id] = list;
  safeWriteJson(CUSTOM_CHAPTERS_KEY, all);

  // Sync chapter to Firestore Cloud
  void publishChapterToCloud(chapter);

  return chapter;
}

// ============================================================================
// 6. ANIMES EDITORIAL OVERRIDES
// ============================================================================

export function getAnimeOverrides(): Record<string, Record<string, any>> {
  return safeReadJson<Record<string, Record<string, any>>>(ANIME_OVERRIDES_KEY, {});
}

export function saveAnimeEditorialOverride(animeId: string, patch: Record<string, any>): void {
  const overrides = getAnimeOverrides();
  overrides[animeId] = {
    ...(overrides[animeId] || {}),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  safeWriteJson(ANIME_OVERRIDES_KEY, overrides);

  // Sync anime override to Firestore Cloud
  void publishAnimeOverrideToCloud(animeId, patch);
}

export function getAnimeWithEditorialOverride<T extends { id: string }>(anime: T): T {
  const overrides = getAnimeOverrides();
  const patch = overrides[anime.id];
  if (!patch) return anime;
  return Object.assign(Object.create(Object.getPrototypeOf(anime)), anime, patch);
}
