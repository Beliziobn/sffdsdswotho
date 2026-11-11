import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Book } from "./useCatalog";
import { isExcludedItem, filterExcludedItems } from "@/lib/excludedItems";
import { getAllOriginalPdfBooks } from "@/lib/originalPdfRegistry";
import { CURATED_WEBTOONS, getWebtoonById } from "@/lib/webtoons";
import { getFullWebtoonChapters } from "@/lib/webtoonSyncEngine";
import { syncOfficialWebtoonChapters, buildOfficialViewerUrl } from "@/lib/webtoonOfficialSync";
import { generateDynamicManhwaStoryPanels } from "@/lib/webtoonStoryGenerator";

export type ContentType = "book" | "webtoon" | "news" | "academic";

export type Content = {
  id: string;
  type: ContentType;
  title: string;
  subtitle: string | null;
  description: string;
  body?: string;
  author: string;
  tags: string[];
  category: string;
  slug: string | null;
  cover: string | null;
  rating: number;
  rating_count: number;
  formats: string[];
  language: string;
  year: number | null;
  size: string | null;
  views: number;
  read_time: number | null;
  episode_count: number;
  price_cents: number;
  currency: string;
  published: boolean;
  featured: boolean;
  collection: string | null;
  created_at: string;
  /** Extra fields returned by the recommendation endpoints */
  similarity?: number;
  reason?: string;
  progress?: number;
  last_read_at?: string;
};

export type Episode = {
  id: string;
  content_id: string;
  number: number;
  title: string;
  body: string;
  images: string[];
  story_beats?: any[];
  is_free: boolean;
  published_at: string;
  viewer_url?: string;
};

export const CONTENT_LABELS: Record<ContentType, string> = {
  book: "Livro",
  webtoon: "Webtoon",
  news: "Notícia",
  academic: "Acadêmico",
};

/** Route for a given content item. */
export const contentHref = (item: Content) => {
  if (item.type === "book" || item.id.startsWith("guten-")) {
    return `/livros/${item.id}`;
  }
  if (item.type === "webtoon") {
    return `/webtoon/${item.id}`;
  }
  if (item.type === "news") {
    return `/noticias/${item.slug ?? item.id}`;
  }
  return `/conteudo/${item.id}`;
};

/** Adapter so the existing BookCard renders any content type unchanged. */
export const contentToBook = (item: Content): Book => ({
  id: item.id,
  title: item.title,
  author: item.author,
  description: item.description,
  cover_url: item.cover,
  price_cents: item.price_cents,
  currency: item.currency,
  category: item.category,
  published: item.published,
  featured: item.featured,
  created_at: item.created_at,
});

export const CONTENT_SELECT =
  "id,type,title,subtitle,description,author,tags,category,slug,cover,rating,rating_count,formats,language,year,size,views,read_time,episode_count,price_cents,currency,published,featured,collection,created_at";

const SELECT = CONTENT_SELECT;

export const useContents = (options?: { type?: ContentType; category?: string; limit?: number }) =>
  useQuery({
    queryKey: ["contents", options?.type ?? "all", options?.category ?? "all", options?.limit ?? 0],
    queryFn: async () => {
      let dbData: Content[] = [];
      try {
        let q = supabase.from("contents").select(SELECT).eq("published", true);
        if (options?.type) q = q.eq("type", options.type);
        if (options?.category && options.category !== "all") q = q.eq("category", options.category);
        q = q.order("created_at", { ascending: false });
        if (options?.limit) q = q.limit(options.limit);
        const { data, error } = await q;
        if (!error && data) dbData = filterExcludedItems(data as unknown as Content[]);
      } catch {}

      // If requested type is "book", "academic" or all, merge Scientific, Curricular, Modern bestsellers and Gutenberg books
      if (!options?.type || options.type === "book" || options.type === "academic") {
        try {
          const { SCIENTIFIC_ARTICLES } = await import("@/data/scientificArticles");
          const { CURRICULAR_BOOKS } = await import("@/data/curricularBooks");
          const { MODERN_BOOKS } = await import("@/lib/modernBooks");
          const { fetchGutenbergCatalog } = await import("@/lib/gutenbergBooks");
          const { getAutoImportedBooks } = await import("@/lib/bookAutomation");

          const gutenList = await fetchGutenbergCatalog();
          const autoList = await getAutoImportedBooks();

          const sciMapped: Content[] = SCIENTIFIC_ARTICLES
            .filter((s) => (options?.category && options.category !== "all" ? s.field === options.category || options.category === "Artigos Científicos" : true))
            .map((s) => ({
              id: s.id,
              type: "academic" as ContentType,
              title: s.title,
              subtitle: s.subtitle,
              description: s.description,
              body: s.description,
              author: s.author,
              tags: ["Artigo Científico", "Peer-Reviewed", s.field, "Pesquisa Acadêmica"],
              category: "Artigos Científicos",
              slug: s.id,
              cover: s.cover_url,
              rating: s.rating,
              rating_count: s.rating_count,
              formats: ["Leitura Integral", "Estrutura Acadêmica", "DOI"],
              language: "pt",
              year: 2026,
              size: `${s.chapters.length} Seções Acadêmicas`,
              views: s.downloads * 2,
              read_time: s.read_time,
              episode_count: s.chapters.length,
              price_cents: 0,
              currency: "BRL",
              published: true,
              featured: true,
              collection: "Artigos Científicos",
              created_at: s.published_at,
            }));

          const currMapped: Content[] = CURRICULAR_BOOKS
            .filter((c) => (options?.category && options.category !== "all" ? c.discipline === options.category || c.grade_level === options.category || options.category === "Disciplinas Curriculares" : true))
            .map((c) => ({
              id: c.id,
              type: "book" as ContentType,
              title: c.title,
              subtitle: c.subtitle,
              description: c.description,
              body: c.description,
              author: c.author,
              tags: ["Disciplina Curricular", c.discipline, c.grade_level, "Didático"],
              category: "Disciplinas Curriculares",
              slug: c.id,
              cover: c.cover_url,
              rating: c.rating,
              rating_count: c.rating_count,
              formats: ["Teoria Completa", "Exercícios Resolvidos", "ENEM"],
              language: "pt",
              year: c.year,
              size: `${c.chapters.length} Unidades Didáticas`,
              views: c.downloads * 2,
              read_time: c.read_time,
              episode_count: c.chapters.length,
              price_cents: 0,
              currency: "BRL",
              published: true,
              featured: true,
              collection: "Disciplinas Curriculares",
              created_at: new Date(c.year, 0, 1).toISOString(),
            }));

          const autoMapped: Content[] = autoList
            .filter((b) => (options?.category && options.category !== "all" ? b.category === options.category : true))
            .map((b) => ({
              id: b.id,
              type: "book",
              title: b.title,
              subtitle: b.subtitle || "Automação Contínua · Leitura Integral",
              description: b.description,
              author: b.author,
              tags: ["Automático", "Novo", b.category, "Obras Completas"],
              category: b.category,
              slug: b.id,
              cover: b.cover_url,
              rating: b.rating,
              rating_count: b.rating_count,
              formats: b.formats,
              language: "pt",
              year: b.year,
              size: `${b.chapters.length} Capítulos Completos`,
              views: b.downloads * 2,
              read_time: b.read_time,
              episode_count: b.chapters.length,
              price_cents: b.price_cents,
              currency: b.currency,
              published: b.published,
              featured: b.featured,
              collection: "Automação Contínua",
              created_at: b.created_at,
            }));

          const modernMapped: Content[] = MODERN_BOOKS
            .filter((b) => (options?.category && options.category !== "all" ? b.category === options.category : true))
            .map((b) => ({
              id: b.id,
              type: "book",
              title: b.title,
              subtitle: b.subtitle,
              description: b.description,
              author: b.author,
              tags: ["Bestseller", "Moderno", b.category, "Mais Influentes"],
              category: b.category,
              slug: b.id,
              cover: b.cover_url,
              rating: b.rating,
              rating_count: b.rating_count,
              formats: b.formats,
              language: "pt",
              year: b.year,
              size: "Guia Completo & Capítulos",
              views: b.downloads * 2,
              read_time: b.read_time,
              episode_count: b.chapters.length,
              price_cents: b.price_cents,
              currency: b.currency,
              published: b.published,
              featured: b.featured,
              collection: "Bestsellers Modernos",
              created_at: b.created_at,
            }));

          const gutenMapped: Content[] = gutenList
            .filter((b) => (options?.category && options.category !== "all" ? b.category === options.category : true))
            .map((b) => ({
              id: b.id,
              type: "book",
              title: b.title,
              subtitle: "Domínio Público · Leitura Completa",
              description: b.description,
              author: b.author,
              tags: ["Clássico", b.category, "Domínio Público", "Gutenberg"],
              category: b.category,
              slug: b.id,
              cover: b.cover_url,
              rating: 4.9,
              rating_count: b.downloads || 1200,
              formats: ["Leitura Online", "EPUB", "TXT"],
              language: "pt",
              year: b.year ?? 1890,
              size: "Texto Integral",
              views: b.downloads ? b.downloads * 3 : 5000,
              read_time: b.read_time ?? 300,
              episode_count: 1,
              price_cents: 0,
              currency: "BRL",
              published: true,
              featured: b.featured,
              collection: "Clássicos da Literatura",
              created_at: b.created_at,
            }));

          // Original PDF books across diverse styles
          let pdfMapped: Content[] = [];
          try {
            pdfMapped = getAllOriginalPdfBooks()
              .filter((p) => (options?.category && options.category !== "all" ? p.category === options.category : true))
              .map((p) => ({
                id: p.id,
                type: "book" as ContentType,
                title: p.title,
                subtitle: `Edição em PDF Original · ${p.originalPagesCount} págs. (${p.fileSizeFormatted})`,
                description: p.description || p.editionNotes,
                body: p.description || p.editionNotes,
                author: p.author,
                tags: ["PDF Original", p.category, p.isPublicDomain ? "Domínio Público" : "Bestseller", "Obra Completa"],
                category: p.category,
                slug: p.id,
                cover: p.coverUrl,
                rating: 4.96,
                rating_count: 3840,
                formats: ["PDF Original", "Leitura Online", "Download Direto"],
                language: "pt",
                year: p.year > 0 ? p.year : null,
                size: `${p.originalPagesCount} páginas (${p.fileSizeFormatted})`,
                views: 24000,
                read_time: Math.round(p.originalPagesCount * 1.5),
                episode_count: 1,
                price_cents: 0,
                currency: "BRL",
                published: true,
                featured: true,
                collection: "Acervo em PDF",
                created_at: new Date(p.year > 0 ? p.year : 2024, 0, 1).toISOString(),
              }));
          } catch {}

          const map = new Map<string, Content>();
          // Scientific articles & Curricular textbooks first, then Automated books, then modern bestsellers, then classics, then original PDFs, then db
          for (const item of [...sciMapped, ...currMapped, ...autoMapped, ...modernMapped, ...gutenMapped, ...pdfMapped, ...dbData]) {
            if (!map.has(item.id)) map.set(item.id, item);
          }
          const combined = filterExcludedItems(Array.from(map.values()));
          return options?.limit ? combined.slice(0, options.limit) : combined;
        } catch {}
      }

      // If requested type is "webtoon" or all, merge Curated Webtoons
      if (!options?.type || options.type === "webtoon") {
        try {
          const webtoonMapped: Content[] = CURATED_WEBTOONS
            .filter((w) =>
              options?.category && options.category !== "all" && options.category !== "Todos"
                ? w.genres.includes(options.category) || w.release_day === options.category
                : true
            )
            .map((w) => ({
              id: w.id,
              type: "webtoon" as ContentType,
              title: w.title,
              subtitle: `${w.status} · ${w.release_day}`,
              description: w.description,
              author: `${w.author} / ${w.artist}`,
              tags: Array.from(new Set([...w.genres, w.release_day, w.status])).filter(Boolean),
              category: w.genres[0] || "Ação",
              slug: w.slug,
              cover: w.cover,
              rating: w.rating,
              rating_count: w.rating_count,
              formats: ["Tira Vertical", "Webtoon"],
              language: "pt",
              year: 2026,
              size: `${w.episodes_count} Episódios`,
              views: w.views,
              read_time: 15,
              episode_count: w.episodes_count,
              price_cents: 0,
              currency: "BRL",
              published: true,
              featured: !!w.featured,
              collection: w.collection || "Webtoons em Destaque",
              created_at: new Date().toISOString(),
            }));

          const map = new Map<string, Content>();
          for (const item of [...webtoonMapped, ...dbData]) {
            if (!map.has(item.id)) map.set(item.id, item);
          }
          const combined = filterExcludedItems(Array.from(map.values()));
          if (options?.type === "webtoon") {
            return options?.limit ? combined.slice(0, options.limit) : combined;
          }
          dbData = combined;
        } catch {}
      }

      return filterExcludedItems(dbData);
    },
  });

export const useTrending = (period: "today" | "week" | "month" = "week", limit = 8) =>
  useQuery({
    queryKey: ["contents", "trending", period, limit],
    queryFn: async () => {
      const days = period === "today" ? 1 : period === "week" ? 7 : 30;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      try {
        const { data, error } = await supabase
          .from("contents")
          .select(SELECT)
          .eq("published", true)
          .gte("created_at", since)
          .order("views", { ascending: false })
          .limit(limit);
        if (!error && (data ?? []).length > 0) return filterExcludedItems(data as unknown as Content[]);
        const { data: fallback, error: err2 } = await supabase
          .from("contents")
          .select(SELECT)
          .eq("published", true)
          .order("views", { ascending: false })
          .limit(limit);
        if (!err2 && (fallback ?? []).length > 0) return filterExcludedItems((fallback ?? []) as unknown as Content[]);
      } catch {}

      try {
        const { MODERN_BOOKS } = await import("@/lib/modernBooks");
        return MODERN_BOOKS.slice(0, limit).map((b) => ({
          id: b.id,
          type: "book" as ContentType,
          title: b.title,
          subtitle: b.subtitle,
          description: b.description,
          author: b.author,
          tags: ["Bestseller", "Moderno", b.category],
          category: b.category,
          slug: b.id,
          cover: b.cover_url,
          rating: b.rating,
          rating_count: b.rating_count,
          formats: b.formats,
          language: "pt",
          year: b.year,
          size: "Guia Completo & Capítulos",
          views: b.downloads * 2,
          read_time: b.read_time,
          episode_count: b.chapters.length,
          price_cents: b.price_cents,
          currency: b.currency,
          published: b.published,
          featured: b.featured,
          collection: "Bestsellers Modernos",
          created_at: b.created_at,
        }));
      } catch {
        return [];
      }
    },
  });

export const useContent = (id?: string) =>
  useQuery({
    queryKey: ["content", id],
    enabled: !!id && !isExcludedItem({ id }),
    queryFn: async () => {
      if (!id || isExcludedItem({ id })) return null;
      // Check Scientific Articles
      if (id.startsWith("sci-")) {
        const { SCIENTIFIC_ARTICLES } = await import("@/data/scientificArticles");
        const found = SCIENTIFIC_ARTICLES.find((s) => s.id === id);
        if (found) {
          return {
            id: found.id,
            type: "academic" as ContentType,
            title: found.title,
            subtitle: found.subtitle,
            description: found.description,
            body: found.description,
            author: found.author,
            tags: ["Artigo Científico", "Peer-Reviewed", found.field, "Pesquisa Acadêmica"],
            category: "Artigos Científicos",
            slug: found.id,
            cover: found.cover_url,
            rating: found.rating,
            rating_count: found.rating_count,
            formats: ["Leitura Integral", "Estrutura Acadêmica", "DOI"],
            language: "pt",
            year: 2026,
            size: `${found.chapters.length} Seções Acadêmicas`,
            views: found.downloads * 2,
            read_time: found.read_time,
            episode_count: found.chapters.length,
            price_cents: 0,
            currency: "BRL",
            published: true,
            featured: true,
            collection: "Artigos Científicos",
            created_at: found.published_at,
          } as Content;
        }
      }

      // Check Curricular Textbooks
      if (id.startsWith("curr-")) {
        const { CURRICULAR_BOOKS } = await import("@/data/curricularBooks");
        const found = CURRICULAR_BOOKS.find((c) => c.id === id);
        if (found) {
          return {
            id: found.id,
            type: "book" as ContentType,
            title: found.title,
            subtitle: found.subtitle,
            description: found.description,
            body: found.description,
            author: found.author,
            tags: ["Disciplina Curricular", found.discipline, found.grade_level, "Didático"],
            category: "Disciplinas Curriculares",
            slug: found.id,
            cover: found.cover_url,
            rating: found.rating,
            rating_count: found.rating_count,
            formats: ["Teoria Completa", "Exercícios Resolvidos", "ENEM"],
            language: "pt",
            year: found.year,
            size: `${found.chapters.length} Unidades Didáticas`,
            views: found.downloads * 2,
            read_time: found.read_time,
            episode_count: found.chapters.length,
            price_cents: 0,
            currency: "BRL",
            published: true,
            featured: true,
            collection: "Disciplinas Curriculares",
            created_at: new Date(found.year, 0, 1).toISOString(),
          } as Content;
        }
      }

      // Check Modern Bestsellers
      if (id.startsWith("mod-")) {
        const { MODERN_BOOKS } = await import("@/lib/modernBooks");
        const found = MODERN_BOOKS.find((b) => b.id === id);
        if (found) {
          return {
            id: found.id,
            type: "book" as ContentType,
            title: found.title,
            subtitle: found.subtitle,
            description: found.description,
            body: found.description,
            author: found.author,
            tags: ["Bestseller", "Moderno", found.category, "Mais Influentes"],
            category: found.category,
            slug: found.id,
            cover: found.cover_url,
            rating: found.rating,
            rating_count: found.rating_count,
            formats: found.formats,
            language: "pt",
            year: found.year,
            size: "Guia Completo & Capítulos",
            views: found.downloads * 2,
            read_time: found.read_time,
            episode_count: found.chapters.length,
            price_cents: found.price_cents,
            currency: found.currency,
            published: found.published,
            featured: found.featured,
            collection: "Bestsellers Modernos",
            created_at: found.created_at,
          } as Content;
        }
      }

      // Check Gutenberg
      if (id.startsWith("guten-") || /^\d+$/.test(id)) {
        const { CURATED_GUTENBERG_BOOKS, fetchGutenbergCatalog } = await import("@/lib/gutenbergBooks");
        const cleanId = id.startsWith("guten-") ? id : `guten-${id}`;
        let found = CURATED_GUTENBERG_BOOKS.find((b) => b.id === cleanId);
        if (!found) {
          const list = await fetchGutenbergCatalog();
          found = list.find((b) => b.id === cleanId);
        }
        if (found) {
          return {
            id: found.id,
            type: "book" as ContentType,
            title: found.title,
            subtitle: "Domínio Público · Leitura Completa",
            description: found.description,
            body: found.description,
            author: found.author,
            tags: ["Clássico", found.category, "Domínio Público", "Gutenberg"],
            category: found.category,
            slug: found.id,
            cover: found.cover_url,
            rating: 4.9,
            rating_count: found.downloads || 1500,
            formats: ["Leitura Online", "EPUB", "TXT"],
            language: "pt",
            year: found.year ?? 1890,
            size: "Texto Integral",
            views: found.downloads ? found.downloads * 3 : 5000,
            read_time: found.read_time ?? 300,
            episode_count: 1,
            price_cents: 0,
            currency: "BRL",
            published: true,
            featured: found.featured,
            collection: "Clássicos da Literatura",
            created_at: found.created_at,
          } as Content;
        }
      }

      // Check Curated Webtoons
      try {
        const found = getWebtoonById(id);
        if (found) {
          return {
            id: found.id,
            type: "webtoon" as ContentType,
            title: found.title,
            subtitle: `${found.status} · ${found.release_day}`,
            description: found.description,
            body: found.description,
            author: `${found.author} / ${found.artist}`,
            tags: Array.from(new Set([...found.genres, found.release_day, found.status])).filter(Boolean),
            category: found.genres[0] || "Ação",
            slug: found.slug,
            cover: found.cover,
            rating: found.rating,
            rating_count: found.rating_count,
            formats: ["Tira Vertical", "Webtoon"],
            language: "pt",
            year: 2026,
            size: `${found.episodes_count} Episódios`,
            views: found.views,
            read_time: 15,
            episode_count: found.episodes_count,
            price_cents: 0,
            currency: "BRL",
            published: true,
            featured: !!found.featured,
            collection: found.collection || "Webtoons em Destaque",
            created_at: new Date().toISOString(),
          } as Content;
        }
      } catch {}

      try {
        const { data, error } = await supabase
          .from("contents")
          .select(`${SELECT},body`)
          .eq("id", id!)
          .maybeSingle();
        if (!error && data && !isExcludedItem(data as any)) return data as unknown as Content | null;
      } catch {}

      return null;
    },
  });

export const useEpisodes = (contentId?: string) =>
  useQuery({
    queryKey: ["episodes", contentId],
    enabled: !!contentId && !isExcludedItem({ id: contentId }),
    queryFn: async () => {
      if (!contentId || isExcludedItem({ id: contentId })) return [];

      // Check Scientific Articles chapters
      if (contentId.startsWith("sci-")) {
        try {
          const { SCIENTIFIC_ARTICLES } = await import("@/data/scientificArticles");
          const found = SCIENTIFIC_ARTICLES.find((s) => s.id === contentId);
          if (found && found.chapters) {
            return found.chapters.map((ch) => ({
              id: ch.id,
              content_id: contentId,
              number: ch.position,
              title: ch.title,
              body: ch.content,
              images: [],
              is_free: true,
              published_at: found.published_at,
            })) as Episode[];
          }
        } catch {}
      }

      // Check Curricular Textbooks chapters
      if (contentId.startsWith("curr-")) {
        try {
          const { CURRICULAR_BOOKS } = await import("@/data/curricularBooks");
          const found = CURRICULAR_BOOKS.find((c) => c.id === contentId);
          if (found && found.chapters) {
            return found.chapters.map((ch) => ({
              id: ch.id,
              content_id: contentId,
              number: ch.position,
              title: ch.title,
              body: ch.content,
              images: [],
              is_free: true,
              published_at: new Date(found.year, 0, 1).toISOString(),
            })) as Episode[];
          }
        } catch {}
      }

      // Check Curated Webtoon episodes, full backlog engine & live WEBTOON official synchronization
      try {
        const found = getWebtoonById(contentId);
        const baseEpisodes = found?.episodes || [];
        const fullBacklog = getFullWebtoonChapters(contentId);
        const liveChapters = await syncOfficialWebtoonChapters(contentId);

        const mergedMap = new Map<number, Episode>();

        // 1. Populate comprehensive catalog backlog (ensures 50 to 500+ real chapters exist)
        for (const ep of fullBacklog) {
          const panels =
            ep.panels && ep.panels.length > 0
              ? ep.panels
              : generateDynamicManhwaStoryPanels(contentId, ep.number, ep.title, found?.cover || ep.cover, found?.title);

          mergedMap.set(ep.number, {
            id: ep.id,
            content_id: contentId,
            number: ep.number,
            title: ep.title,
            body: ep.synopsis,
            images: panels,
            is_free: ep.is_free,
            published_at: ep.release_date,
            viewer_url: ep.viewer_url || buildOfficialViewerUrl(contentId, ep.number),
          });
        }

        // 2. Base local physical scans take precedence for local multi-page chapters
        for (const ep of baseEpisodes) {
          const existing = mergedMap.get(ep.number);
          const panels =
            ep.panels && ep.panels.length > 0
              ? ep.panels
              : existing?.images && existing.images.length > 0
              ? existing.images
              : generateDynamicManhwaStoryPanels(contentId, ep.number, ep.title, found?.cover || ep.cover, found?.title);

          mergedMap.set(ep.number, {
            id: existing?.id || ep.id || `${contentId}-ep-${ep.number}`,
            content_id: contentId,
            number: ep.number,
            title: ep.title || existing?.title || `Capítulo ${ep.number}`,
            body: ep.synopsis || existing?.body || "",
            images: panels,
            is_free: ep.is_free,
            published_at: ep.release_date || existing?.published_at || new Date().toISOString(),
            viewer_url: (ep as any).viewer_url || existing?.viewer_url || buildOfficialViewerUrl(contentId, ep.number),
          });
        }

        // 3. Official WEBTOON live scraped chapters override with live titles and exact platform links
        for (const ch of liveChapters) {
          const existing = mergedMap.get(ch.number);
          const livePanels =
            ch.panels && ch.panels.length > 1
              ? ch.panels
              : existing?.images && existing.images.length > 0
              ? existing.images
              : generateDynamicManhwaStoryPanels(contentId, ch.number, ch.title, found?.cover, found?.title);

          mergedMap.set(ch.number, {
            id: existing?.id || ch.id || `${contentId}-ep-${ch.number}`,
            content_id: contentId,
            number: ch.number,
            title: ch.title || existing?.title || `Capítulo ${ch.number}`,
            body: ch.synopsis || existing?.body || "",
            images: livePanels,
            is_free: ch.is_free,
            published_at: ch.release_date || existing?.published_at || new Date().toISOString(),
            viewer_url: ch.viewer_url || existing?.viewer_url || buildOfficialViewerUrl(contentId, ch.number),
          });
        }

        if (mergedMap.size > 0) {
          return Array.from(mergedMap.values()).sort((a, b) => a.number - b.number);
        }
      } catch (err) {
        console.warn("[useEpisodes] Webtoon sync issue:", err);
      }

      if (contentId.startsWith("guten-") || /^\d+$/.test(contentId)) {
        const { fetchGutenbergChapters } = await import("@/lib/gutenbergBooks");
        const chapters = await fetchGutenbergChapters(contentId);
        return chapters.map((ch) => ({
          id: ch.id,
          content_id: contentId,
          number: ch.position,
          title: ch.title,
          body: ch.content,
          images: [],
          is_free: true,
          published_at: new Date().toISOString(),
        })) as Episode[];
      }

      try {
        const { data, error } = await supabase
          .from("content_episodes")
          .select("*")
          .eq("content_id", contentId!)
          .order("number", { ascending: true });
        if (!error && data) return (data ?? []) as Episode[];
      } catch {}

      return [] as Episode[];
    },
  });

/** Records a user interaction (view, read, download, like, rate, progress). */
export const useTrackInteraction = () => {
  const { user } = useAuth();
  return async (contentId: string, action: string, progress = 0) => {
    if (!user) return;
    await supabase.from("user_interactions").insert({
      user_id: user.id,
      content_id: contentId,
      action,
      progress,
    });
  };
};

export const useProgress = (contentId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["progress", user?.id, contentId],
    enabled: !!user && !!contentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("content_id", contentId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

export const useSaveProgress = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contentId: string; percentage: number; episodeId?: string | null }) => {
      if (!user) return null;
      const { error } = await supabase.from("user_progress").upsert(
        {
          user_id: user.id,
          content_id: input.contentId,
          episode_id: input.episodeId ?? null,
          progress_percentage: Math.max(0, Math.min(100, Math.round(input.percentage))),
          last_read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,content_id" },
      );
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["recommendations", "continue-reading"] });
    },
  });
};
