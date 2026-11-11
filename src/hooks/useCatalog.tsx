import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  applyBookEditorialOverrides,
  applyNewsEditorialOverrides,
  getCustomBookChapters,
  getSingleBookWithOverrides,
  getSingleNewsWithOverrides,
} from "@/lib/editorialStore";
import { isExcludedItem, filterExcludedItems } from "@/lib/excludedItems";
import { fetchCloudBooks, fetchCloudChapters, fetchCloudNews } from "@/lib/cloudEditorialService";
import { getAllOriginalPdfBooks, getOriginalPdfForBook } from "@/lib/originalPdfRegistry";
import { expandNewsToDeepReport } from "@/lib/newsExpander";
import { syncDailyNews, getCachedNews } from "@/lib/newsSyndication";
import { queryNewsArchive, fetchPermanentArticle } from "@/lib/newsArchiveEngine";

export type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_url: string | null;
  price_cents: number;
  currency: string;
  category: string;
  published: boolean;
  featured: boolean;
  created_at: string;
};

export type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string | null;
  category: string;
  published: boolean;
  published_at: string;
};

export type Chapter = {
  id: string;
  book_id: string;
  title: string;
  content: string;
  position: number;
  is_free_preview: boolean;
};

export type Purchase = {
  id: string;
  user_id: string;
  book_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
};

export const useBooks = (search = "") =>
  useQuery({
    queryKey: ["books", search],
    queryFn: async () => {
      let dbBooks: Book[] = [];
      try {
        let q = supabase.from("books").select("*").order("created_at", { ascending: false });
        if (search) {
          q = q.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
        }
        const { data, error } = await q;
        if (!error && data) dbBooks = filterExcludedItems(data as Book[]);
      } catch {
        // Fallback gracefully
      }

      // Fetch Scientific Articles
      let sciBooks: Book[] = [];
      try {
        const { SCIENTIFIC_ARTICLES } = await import("@/data/scientificArticles");
        sciBooks = SCIENTIFIC_ARTICLES.filter((s) =>
          search
            ? s.title.toLowerCase().includes(search.toLowerCase()) ||
              s.author.toLowerCase().includes(search.toLowerCase()) ||
              s.field.toLowerCase().includes(search.toLowerCase()) ||
              s.description.toLowerCase().includes(search.toLowerCase())
            : true
        ).map((s) => ({
          id: s.id,
          title: s.title,
          author: s.author,
          description: s.description,
          cover_url: s.cover_url,
          price_cents: 0,
          currency: "BRL",
          category: `Artigo Científico (${s.field})`,
          published: true,
          featured: true,
          created_at: s.published_at,
        }));
      } catch {}

      // Fetch Curricular Textbooks
      let currBooks: Book[] = [];
      try {
        const { CURRICULAR_BOOKS } = await import("@/data/curricularBooks");
        currBooks = CURRICULAR_BOOKS.filter((c) =>
          search
            ? c.title.toLowerCase().includes(search.toLowerCase()) ||
              c.author.toLowerCase().includes(search.toLowerCase()) ||
              c.discipline.toLowerCase().includes(search.toLowerCase()) ||
              c.grade_level.toLowerCase().includes(search.toLowerCase()) ||
              c.description.toLowerCase().includes(search.toLowerCase())
            : true
        ).map((c) => ({
          id: c.id,
          title: c.title,
          author: c.author,
          description: c.description,
          cover_url: c.cover_url,
          price_cents: 0,
          currency: "BRL",
          category: `Disciplina (${c.discipline})`,
          published: true,
          featured: true,
          created_at: new Date(c.year, 0, 1).toISOString(),
        }));
      } catch {}

      // Fetch modern bestsellers
      let modernBooks: Book[] = [];
      try {
        const { MODERN_BOOKS } = await import("@/lib/modernBooks");
        modernBooks = MODERN_BOOKS.filter((b) =>
          search
            ? b.title.toLowerCase().includes(search.toLowerCase()) ||
              b.author.toLowerCase().includes(search.toLowerCase()) ||
              b.description.toLowerCase().includes(search.toLowerCase())
            : true
        ).map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          description: b.description,
          cover_url: b.cover_url,
          price_cents: b.price_cents,
          currency: b.currency,
          category: b.category,
          published: b.published,
          featured: b.featured,
          created_at: b.created_at,
        }));
      } catch {
        // Fallback gracefully
      }

      // Fetch Gutenberg catalog
      let gutenBooks: Book[] = [];
      try {
        const { fetchGutenbergCatalog } = await import("@/lib/gutenbergBooks");
        const list = await fetchGutenbergCatalog(search);
        gutenBooks = list.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          description: b.description,
          cover_url: b.cover_url,
          price_cents: 0,
          currency: b.currency,
          category: b.category,
          published: true,
          featured: b.featured,
          created_at: b.created_at,
        }));
      } catch {
        // Fallback gracefully
      }

      // Fetch auto-imported books from automation pipeline
      let autoBooks: Book[] = [];
      try {
        const { getAutoImportedBooks } = await import("@/lib/bookAutomation");
        const list = await getAutoImportedBooks();
        autoBooks = list
          .filter((b) =>
            search
              ? b.title.toLowerCase().includes(search.toLowerCase()) ||
                b.author.toLowerCase().includes(search.toLowerCase()) ||
                b.description.toLowerCase().includes(search.toLowerCase())
              : true
          )
          .map((b) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            description: b.description,
            cover_url: b.cover_url,
            price_cents: b.price_cents,
            currency: b.currency,
            category: b.category,
            published: b.published,
            featured: b.featured,
            created_at: b.created_at,
          }));
      } catch {
        // Fallback gracefully
      }

      // Fetch Original PDF Registry books across diverse styles
      let pdfBooks: Book[] = [];
      try {
        const list = getAllOriginalPdfBooks();
        pdfBooks = list
          .filter((p) =>
            search
              ? p.title.toLowerCase().includes(search.toLowerCase()) ||
                p.author.toLowerCase().includes(search.toLowerCase()) ||
                p.category.toLowerCase().includes(search.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
              : true
          )
          .map((p) => ({
            id: p.id,
            title: p.title,
            author: p.author,
            description: p.description || p.editionNotes,
            cover_url: p.coverUrl,
            price_cents: 0,
            currency: "BRL",
            category: p.category,
            published: true,
            featured: true,
            created_at: new Date(p.year > 0 ? p.year : 2024, 0, 1).toISOString(),
          }));
      } catch {}

      // Fetch Cloud Books from Firestore
      let cloudBooks: Book[] = [];
      try {
        cloudBooks = await fetchCloudBooks();
      } catch {}

      const map = new Map<string, Book>();
      // Custom Cloud Books from Admin first so they take top priority
      for (const b of cloudBooks) map.set(b.id, b);
      // Scientific Articles & Curricular Textbooks, Auto, Modern, Gutenberg, Original PDFs, DB
      for (const b of sciBooks) {
        if (!map.has(b.id)) map.set(b.id, b);
      }
      for (const b of currBooks) {
        if (!map.has(b.id)) map.set(b.id, b);
      }
      for (const b of autoBooks) {
        if (!map.has(b.id)) map.set(b.id, b);
      }
      for (const b of modernBooks) {
        if (!map.has(b.id)) map.set(b.id, b);
      }
      for (const b of gutenBooks) {
        if (!map.has(b.id)) map.set(b.id, b);
      }
      for (const b of pdfBooks) {
        if (!map.has(b.id)) map.set(b.id, b);
      }
      for (const b of dbBooks) {
        if (!map.has(b.id)) map.set(b.id, b);
      }

      return filterExcludedItems(applyBookEditorialOverrides(Array.from(map.values()), search));
    },
  });

export const useBook = (id?: string) =>
  useQuery({
    queryKey: ["book", id],
    enabled: !!id && !isExcludedItem({ id }),
    queryFn: async () => {
      if (!id || isExcludedItem({ id })) return null;

      // Check custom/overridden editorial book first
      const directCustom = getSingleBookWithOverrides(id, null);
      if (id.startsWith("book-editorial-") && directCustom) {
        return directCustom;
      }

      // Check if it is a Scientific Article
      if (id.startsWith("sci-")) {
        try {
          const { SCIENTIFIC_ARTICLES } = await import("@/data/scientificArticles");
          const found = SCIENTIFIC_ARTICLES.find((s) => s.id === id);
          if (found) {
            return {
              id: found.id,
              title: found.title,
              author: found.author,
              description: found.description,
              cover_url: found.cover_url,
              price_cents: 0,
              currency: "BRL",
              category: `Artigo Científico (${found.field})`,
              published: true,
              featured: true,
              created_at: found.published_at,
            } as Book;
          }
        } catch {}
      }

      // Check if it is a Curricular Textbook
      if (id.startsWith("curr-")) {
        try {
          const { CURRICULAR_BOOKS } = await import("@/data/curricularBooks");
          const found = CURRICULAR_BOOKS.find((c) => c.id === id);
          if (found) {
            return {
              id: found.id,
              title: found.title,
              author: found.author,
              description: found.description,
              cover_url: found.cover_url,
              price_cents: 0,
              currency: "BRL",
              category: `Disciplina (${found.discipline})`,
              published: true,
              featured: true,
              created_at: new Date(found.year, 0, 1).toISOString(),
            } as Book;
          }
        } catch {}
      }

      // Check if it is an Auto-Imported book
      if (id.startsWith("auto-")) {
        try {
          const { getAutoImportedBooks } = await import("@/lib/bookAutomation");
          const list = await getAutoImportedBooks();
          const found = list.find((b) => b.id === id);
          if (found) {
            return {
              id: found.id,
              title: found.title,
              author: found.author,
              description: found.description,
              cover_url: found.cover_url,
              price_cents: found.price_cents,
              currency: found.currency,
              category: found.category,
              published: found.published,
              featured: found.featured,
              created_at: found.created_at,
            } as Book;
          }
        } catch {}
      }

      // Check if it is a Modern Bestseller book
      if (id.startsWith("mod-")) {
        const { MODERN_BOOKS } = await import("@/lib/modernBooks");
        const found = MODERN_BOOKS.find((b) => b.id === id);
        if (found) {
          return {
            id: found.id,
            title: found.title,
            author: found.author,
            description: found.description,
            cover_url: found.cover_url,
            price_cents: found.price_cents,
            currency: found.currency,
            category: found.category,
            published: found.published,
            featured: found.featured,
            created_at: found.created_at,
          } as Book;
        }
      }

      // Check if it is a Gutenberg book
      if (id.startsWith("guten-") || /^\d+$/.test(id)) {
        const { CURATED_GUTENBERG_BOOKS, fetchGutenbergCatalog } = await import("@/lib/gutenbergBooks");
        const cleanId = id.startsWith("guten-") ? id : `guten-${id}`;
        const found = CURATED_GUTENBERG_BOOKS.find((b) => b.id === cleanId);
        if (found) {
          return {
            id: found.id,
            title: found.title,
            author: found.author,
            description: found.description,
            cover_url: found.cover_url,
            price_cents: 0,
            currency: found.currency,
            category: found.category,
            published: true,
            featured: found.featured,
            created_at: found.created_at,
          } as Book;
        }

        const remote = await fetchGutenbergCatalog();
        const foundRemote = remote.find((b) => b.id === cleanId);
        if (foundRemote) {
          return {
            id: foundRemote.id,
            title: foundRemote.title,
            author: foundRemote.author,
            description: foundRemote.description,
            cover_url: foundRemote.cover_url,
            price_cents: 0,
            currency: foundRemote.currency,
            category: foundRemote.category,
            published: true,
            featured: foundRemote.featured,
            created_at: foundRemote.created_at,
          } as Book;
        }
      }

      // Supabase lookup
      try {
        const { data, error } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
        if (!error && data) return data as Book;
      } catch {}

      // Fallback Gutenberg search
      try {
        const { CURATED_GUTENBERG_BOOKS } = await import("@/lib/gutenbergBooks");
        const found = CURATED_GUTENBERG_BOOKS.find((b) => b.id === id);
        if (found) {
          return {
            id: found.id,
            title: found.title,
            author: found.author,
            description: found.description,
            cover_url: found.cover_url,
            price_cents: 0,
            currency: found.currency,
            category: found.category,
            published: true,
            featured: found.featured,
            created_at: found.created_at,
          } as Book;
        }
      } catch {}

      // Original PDF Registry lookup
      try {
        const pdf = getOriginalPdfForBook(id);
        if (pdf) {
          return getSingleBookWithOverrides(id, {
            id: pdf.id,
            title: pdf.title,
            author: pdf.author,
            description: pdf.description || pdf.editionNotes,
            cover_url: pdf.coverUrl,
            price_cents: 0,
            currency: "BRL",
            category: pdf.category,
            published: true,
            featured: true,
            created_at: new Date(pdf.year > 0 ? pdf.year : 2024, 0, 1).toISOString(),
          } as Book);
        }
      } catch {}

      return getSingleBookWithOverrides(id, null);
    },
  });

export const useChapters = (bookId?: string) =>
  useQuery({
    queryKey: ["chapters", bookId],
    enabled: !!bookId,
    queryFn: async () => {
      if (!bookId) return [];

      const customChaps = getCustomBookChapters(bookId);
      if (bookId.startsWith("book-editorial-") && customChaps.length > 0) {
        return customChaps;
      }

      // Check Scientific Articles chapters
      if (bookId.startsWith("sci-")) {
        try {
          const { SCIENTIFIC_ARTICLES } = await import("@/data/scientificArticles");
          const found = SCIENTIFIC_ARTICLES.find((s) => s.id === bookId);
          if (found && found.chapters) {
            return found.chapters as Chapter[];
          }
        } catch {}
      }

      // Check Curricular Textbooks chapters
      if (bookId.startsWith("curr-")) {
        try {
          const { CURRICULAR_BOOKS } = await import("@/data/curricularBooks");
          const found = CURRICULAR_BOOKS.find((c) => c.id === bookId);
          if (found && found.chapters) {
            return found.chapters as Chapter[];
          }
        } catch {}
      }

      // Check Auto-Imported chapters
      if (bookId.startsWith("auto-")) {
        try {
          const { getAutoImportedBooks } = await import("@/lib/bookAutomation");
          const list = await getAutoImportedBooks();
          const found = list.find((b) => b.id === bookId);
          if (found && found.chapters) {
            return found.chapters as Chapter[];
          }
        } catch {}
      }

      // Check Modern Bestsellers chapters
      if (bookId.startsWith("mod-")) {
        const { MODERN_BOOKS } = await import("@/lib/modernBooks");
        const found = MODERN_BOOKS.find((b) => b.id === bookId);
        if (found && found.chapters) {
          return found.chapters as Chapter[];
        }
      }

      // Check Gutenberg chapters
      if (bookId.startsWith("guten-") || /^\d+$/.test(bookId)) {
        const { fetchGutenbergChapters } = await import("@/lib/gutenbergBooks");
        const chaps = await fetchGutenbergChapters(bookId);
        return chaps as Chapter[];
      }

      try {
        const { data, error } = await supabase
          .from("chapters")
          .select("*")
          .eq("book_id", bookId!)
          .order("position", { ascending: true });
        if (!error && data && data.length > 0) return data as Chapter[];
      } catch {}

      // Check if it's a Gutenberg book without prefix
      try {
        const { fetchGutenbergChapters } = await import("@/lib/gutenbergBooks");
        const chaps = await fetchGutenbergChapters(bookId);
        if (chaps && chaps.length > 0) return chaps as Chapter[];
      } catch {}

      // Check Original PDF Registry for default full digitized edition chapter
      try {
        const pdf = getOriginalPdfForBook(bookId);
        if (pdf) {
          return [
            {
              id: `${pdf.id}-edicao-integral`,
              book_id: pdf.id,
              position: 1,
              title: `Edição Digitalizada Oficial (${pdf.originalPagesCount} Páginas)`,
              content: `### ${pdf.title}\n\n**Autor:** ${pdf.author} (${pdf.year > 0 ? pdf.year : `${Math.abs(pdf.year)} a.C.`})\n\n**Edição Canônica Preservada:** ${pdf.editionNotes}\n\n**Acervo Oficial:** ${pdf.sourceRepository}\n**Tamanho do Arquivo:** ${pdf.fileSizeFormatted} · **Total de Páginas Físicas:** ${pdf.originalPagesCount}\n\nEsta obra está disponível no formato fac-similar original de alta definição com todos os capítulos, ilustrações de época e diagramação original preservados. Utilize o leitor interativo de PDF para folhear as páginas, aplicar zoom e navegar pelo índice, ou utilize o botão de alternância para o modo de leitura rápida.`,
              is_free_preview: true,
            },
          ] as Chapter[];
        }
      } catch {}

      // Check Cloud Chapters from Firestore
      try {
        const cloudChaps = await fetchCloudChapters(bookId);
        if (cloudChaps && cloudChaps.length > 0) return cloudChaps;
      } catch {}

      return [] as Chapter[];
    },
  });

export const useNews = () =>
  useQuery({
    queryKey: ["news"],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      let dbNews: NewsItem[] = [];
      try {
        const { data, error } = await supabase
          .from("news")
          .select("*")
          .order("published_at", { ascending: false });
        if (!error && data) dbNews = filterExcludedItems(data as NewsItem[]);
      } catch {
        // Fallback if supabase connection is offline
      }

      // Fetch Firestore Cloud news (manual admin publications)
      let cloudNews: NewsItem[] = [];
      try {
        cloudNews = await fetchCloudNews();
      } catch {}

      // Read cached news immediately and trigger background sync if empty
      let syndicated: any[] = [];
      let archivedItems: any[] = [];
      try {
        syndicated = getCachedNews();
        if (!syndicated || syndicated.length === 0) {
          syndicated = await syncDailyNews();
        }
      } catch {}

      try {
        const archiveResult = await queryNewsArchive({ pageSize: 700 });
        archivedItems = archiveResult.items || [];
      } catch {}

      const validDbNews = dbNews.filter(Boolean);

      // Merge and deduplicate by slug or title: Firestore Cloud + Cloud DB + Syndicated + Permanent Archive
      const seen = new Set<string>();
      const combined: NewsItem[] = [];

      for (const item of [...cloudNews, ...validDbNews, ...syndicated, ...archivedItems]) {
        const key = (item.slug || item.title || "").toLowerCase().trim();
        if (key && !seen.has(key) && (item.title || "").trim().length > 0) {
          seen.add(key);
          combined.push(item);
        }
      }

      const overridden = applyNewsEditorialOverrides(combined);
      overridden.sort((a, b) => {
        const diff = new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        if (diff !== 0) return diff;
        return (a.id || "").localeCompare(b.id || "");
      });
      return filterExcludedItems(overridden);
    },
  });

export const useArticle = (slug?: string) =>
  useQuery({
    queryKey: ["news", slug],
    enabled: !!slug && !isExcludedItem({ slug, id: slug }),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!slug || isExcludedItem({ slug, id: slug })) return null;
      let rawFound: NewsItem | null = null;

      // 0. Check if edited or created in Editorial Studio first
      const editorialDirect = getSingleNewsWithOverrides(slug, null);
      if (editorialDirect && slug.startsWith("editorial-")) {
        return expandNewsToDeepReport(editorialDirect) as unknown as NewsItem;
      }

      // 1. Check permanent historical archive first (Guarantees zero 404 for historical links)
      try {
        const permanentMatch = await fetchPermanentArticle(slug);
        if (permanentMatch) {
          return getSingleNewsWithOverrides(slug, permanentMatch as NewsItem);
        }
      } catch {}

      // 2. Check Supabase
      try {
        const { data, error } = await supabase.from("news").select("*").eq("slug", slug).maybeSingle();
        if (!error && data) rawFound = data as NewsItem;
      } catch {}

      // 3. Check syndicated cache or live feed
      if (!rawFound) {
        try {
          let cached = getCachedNews();
          let found = cached.find((it) => it.slug === slug || it.id === slug);
          if (!found) {
            cached = await syncDailyNews();
            found = cached.find((it) => it.slug === slug || it.id === slug);
          }
          if (found) rawFound = found;

          if (!rawFound) {
            const res = await fetch("/api/news/feed?topic=all&limit=150");
            if (res.ok) {
              const data = await res.json();
              const match = (data.items || []).find((it: any) => it.slug === slug || it.id === slug);
              if (match) rawFound = match as NewsItem;
            }
          }
        } catch {}
      }

      const mergedEditorial = getSingleNewsWithOverrides(slug, rawFound);
      if (mergedEditorial) {
        const expanded = expandNewsToDeepReport(mergedEditorial) as unknown as NewsItem;
        return getSingleNewsWithOverrides(slug, expanded);
      }

      return null;
    },
  });

export const usePurchases = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Purchase[];
    },
  });
};
