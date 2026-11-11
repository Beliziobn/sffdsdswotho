import type { NewsItem } from "@/hooks/useCatalog";

/** Average reading speed used for the "X MIN READ" metadata. */
const WORDS_PER_MINUTE = 220;

export const readingTime = (item: Pick<NewsItem, "content" | "excerpt">) => {
  const words = `${item.content ?? ""} ${item.excerpt ?? ""}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
};

/** Newsroom byline — falls back to the house name when no author is stored. */
export const byline = (item: Partial<NewsItem> & { author?: string | null }) =>
  item.author?.trim() || "Redação Worscoi";

/** Photo credit line, kept optional in the data model. */
export const photoCredit = (item: Partial<NewsItem> & { cover_credit?: string | null }) =>
  item.cover_credit?.trim() || "Foto: Acervo Worscoi";

export const NEWS_CATEGORIES = [
  "Animes",
  "Mangás",
  "Webtoons",
  "Livros",
  "Tecnologias",
  "Games",
  "Cultura",
  "Futebol",
  "Basquete",
  "Mercado",
  "Virais",
  "Listas",
  "Política",
  "Geografia",
  "Ciência",
];

export interface CategoryMeta {
  name: string;
  label: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  iconName: string;
}

export const CATEGORY_METADATA: Record<string, CategoryMeta> = {
  Animes: {
    name: "Animes",
    label: "Animes",
    description: "Lançamentos, temporadas e produções da animação japonesa",
    accentColor: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20",
    iconName: "Tv",
  },
  "Mangás": {
    name: "Mangás",
    label: "Mangás",
    description: "Publicações, capítulos e novidades das editoras e mangakás",
    accentColor: "text-indigo-600 dark:text-indigo-400",
    badgeBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20",
    iconName: "BookOpen",
  },
  Webtoons: {
    name: "Webtoons",
    label: "Webtoons",
    description: "Quadrinhos verticais digitais, manhwas e adaptações globais",
    accentColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
    iconName: "Smartphone",
  },
  Livros: {
    name: "Livros",
    label: "Livros",
    description: "Literatura clássica, contemporânea, autores e lançamentos editoriais",
    accentColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20",
    iconName: "Library",
  },
  Tecnologias: {
    name: "Tecnologias",
    label: "Tecnologia",
    description: "Inteligência artificial, software, hardware e o futuro digital",
    accentColor: "text-cyan-600 dark:text-cyan-400",
    badgeBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/20",
    iconName: "Cpu",
  },
  Games: {
    name: "Games",
    label: "Games",
    description: "Jogos eletrônicos, consoles, indústria e títulos independentes",
    accentColor: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20",
    iconName: "Gamepad2",
  },
  Cultura: {
    name: "Cultura",
    label: "Cultura & Arte",
    description: "Cinema, séries, patrimônio, artes visuais e manifestações culturais",
    accentColor: "text-pink-600 dark:text-pink-400",
    badgeBg: "bg-pink-500/10 text-pink-600 dark:text-pink-300 border-pink-500/20",
    iconName: "Sparkles",
  },
  Futebol: {
    name: "Futebol",
    label: "Futebol Europeu",
    description: "Real Madrid, Barcelona (La Liga), Man City, Liverpool, Arsenal, Chelsea (Premier League), Bayern München, Dortmund (Bundesliga), Milan, Inter (Serie A), PSG (Ligue 1), Liga Portugal e UEFA Champions League",
    accentColor: "text-emerald-700 dark:text-emerald-400",
    badgeBg: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20",
    iconName: "Trophy",
  },
  Basquete: {
    name: "Basquete",
    label: "Basquetebol & NBA",
    description: "Resultados da rodada, tabelas, trocas bombásticas e as maiores polêmicas da NBA",
    accentColor: "text-amber-500 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20",
    iconName: "Dribbble",
  },
  Mercado: {
    name: "Mercado",
    label: "Mercado & Finanças",
    description: "Economia, mercado de capitais, investimentos, startups e negócios",
    accentColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20",
    iconName: "TrendingUp",
  },
  Virais: {
    name: "Virais",
    label: "Virais & Trends",
    description: "Fenômenos da internet, criadores de conteúdo e tendências em alta",
    accentColor: "text-orange-600 dark:text-orange-400",
    badgeBg: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20",
    iconName: "Flame",
  },
  Listas: {
    name: "Listas",
    label: "Listas & Rankings",
    description: "Top 10s, seleções temáticas, guias definitivos e recomendações de obras",
    accentColor: "text-teal-600 dark:text-teal-400",
    badgeBg: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20",
    iconName: "ListOrdered",
  },
  "Política": {
    name: "Política",
    label: "Política",
    description: "Cenários institucionais, geopolítica, políticas públicas e relações internacionais",
    accentColor: "text-slate-700 dark:text-slate-300",
    badgeBg: "bg-slate-500/10 text-slate-700 dark:text-slate-200 border-slate-500/20",
    iconName: "Landmark",
  },
  Geografia: {
    name: "Geografia",
    label: "Geografia & Meio Ambiente",
    description: "Territórios, clima, geopolítica global, mapas e expedições científicas",
    accentColor: "text-lime-700 dark:text-lime-400",
    badgeBg: "bg-lime-500/10 text-lime-700 dark:text-lime-300 border-lime-500/20",
    iconName: "Globe",
  },
  "Ciência": {
    name: "Ciência",
    label: "Ciência",
    description: "Astronomia, física, biomedicina, descobertas espaciais e pesquisas de ponta",
    accentColor: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20",
    iconName: "Atom",
  },
};

/**
 * Curation logic for the hero slot.
 * Priority: explicit "Top Story" flag/tag → highest daily engagement → most recent.
 * The engagement metric is optional so the API can start feeding it later.
 */
export type CuratedNews = NewsItem & {
  top_story?: boolean | null;
  engagement_score?: number | null;
  author?: string | null;
  cover_credit?: string | null;
};

export const pickFeatured = (items: CuratedNews[]): CuratedNews | null => {
  if (items.length === 0) return null;
  const flagged = items.filter((i) => i.top_story || /top\s*story/i.test(i.category ?? ""));
  const pool = flagged.length > 0 ? flagged : items;
  const today = new Date().toDateString();
  const scored = [...pool].sort((a, b) => {
    const score = (i: CuratedNews) =>
      (i.engagement_score ?? 0) +
      (new Date(i.published_at).toDateString() === today ? 1000 : 0) +
      new Date(i.published_at).getTime() / 1e13;
    return score(b) - score(a);
  });
  return scored[0] ?? null;
};
