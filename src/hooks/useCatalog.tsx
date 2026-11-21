import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  applyBookEditorialOverrides,
  applyNewsEditorialOverrides,
  getCustomBookChapters,
  getSingleBookWithOverrides,
  getSingleNewsWithOverrides,
  mergeCloudBooksIntoStore,
  mergeCloudNewsIntoStore,
} from "@/lib/editorialStore";
import { isExcludedItem, filterExcludedItems } from "@/lib/excludedItems";
import {
  fetchCloudBookById,
  fetchCloudBooks,
  fetchCloudChapters,
  fetchCloudNews,
  fetchCloudNewsBySlug,
} from "@/lib/cloudEditorialService";
import { getAllOriginalPdfBooks, getOriginalPdfForBook } from "@/lib/originalPdfRegistry";
import { getCanonicalChaptersForOriginalPdf } from "@/lib/canonicalBookChapters";
import { expandNewsToDeepReport } from "@/lib/newsExpander";
import { syncDailyNews, getCachedNews, hasFreshLiveSyndicatedCache, fetchTopicRssNews } from "@/lib/newsSyndication";
import { queryNewsArchive, fetchPermanentArticle } from "@/lib/newsArchiveEngine";
import { SCIENTIFIC_ARTICLES } from "@/data/scientificArticles";
import { CURRICULAR_BOOKS } from "@/data/curricularBooks";
import { MODERN_BOOKS } from "@/lib/modernBooks";
import { CURATED_GUTENBERG_BOOKS, fetchGutenbergCatalog, fetchGutenbergChapters } from "@/lib/gutenbergBooks";
import { getAutoImportedBooks } from "@/lib/bookAutomation";

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
  cover_url?: string | null;
  category: string;
  published: boolean;
  published_at: string;
  author?: string;
  source_name?: string;
  source_url?: string;
  read_time?: number;
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
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const lowerSearch = search.toLowerCase();

      const [
        dbBooks,
        sciBooks,
        currBooks,
        modernBooks,
        gutenBooks,
        autoBooks,
        pdfBooks,
        cloudBooks,
      ] = await Promise.all([
        // 1. Supabase books
        (async (): Promise<Book[]> => {
          try {
            let q = supabase.from("books").select("*").order("created_at", { ascending: false });
            if (search) {
              q = q.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
            }
            const { data, error } = await q;
            if (!error && data) return filterExcludedItems(data as Book[]);
          } catch {}
          return [];
        })(),

        // 2. Scientific Articles
        (async (): Promise<Book[]> => {
          try {
            return SCIENTIFIC_ARTICLES.filter((s) =>
              search
                ? s.title.toLowerCase().includes(lowerSearch) ||
                  s.author.toLowerCase().includes(lowerSearch) ||
                  s.field.toLowerCase().includes(lowerSearch) ||
                  s.description.toLowerCase().includes(lowerSearch)
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
          return [];
        })(),

        // 3. Curricular Textbooks
        (async (): Promise<Book[]> => {
          try {
            return CURRICULAR_BOOKS.filter((c) =>
              search
                ? c.title.toLowerCase().includes(lowerSearch) ||
                  c.author.toLowerCase().includes(lowerSearch) ||
                  c.discipline.toLowerCase().includes(lowerSearch) ||
                  c.grade_level.toLowerCase().includes(lowerSearch) ||
                  c.description.toLowerCase().includes(lowerSearch)
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
          return [];
        })(),

        // 4. Modern Bestsellers
        (async (): Promise<Book[]> => {
          try {
            return MODERN_BOOKS.filter((b) =>
              search
                ? b.title.toLowerCase().includes(lowerSearch) ||
                  b.author.toLowerCase().includes(lowerSearch) ||
                  b.description.toLowerCase().includes(lowerSearch)
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
          } catch {}
          return [];
        })(),

        // 5. Gutenberg Catalog
        (async (): Promise<Book[]> => {
          try {
            const list = await fetchGutenbergCatalog(search);
            return list.map((b) => ({
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
          } catch {}
          return [];
        })(),

        // 6. Auto-Imported Books
        (async (): Promise<Book[]> => {
          try {
            const list = await getAutoImportedBooks();
            return list
              .filter((b) =>
                search
                  ? b.title.toLowerCase().includes(lowerSearch) ||
                    b.author.toLowerCase().includes(lowerSearch) ||
                    b.description.toLowerCase().includes(lowerSearch)
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
          } catch {}
          return [];
        })(),

        // 7. Original PDF Registry
        (async (): Promise<Book[]> => {
          try {
            const list = getAllOriginalPdfBooks();
            return list
              .filter((p) =>
                search
                  ? p.title.toLowerCase().includes(lowerSearch) ||
                    p.author.toLowerCase().includes(lowerSearch) ||
                    p.category.toLowerCase().includes(lowerSearch) ||
                    (p.description && p.description.toLowerCase().includes(lowerSearch))
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
          return [];
        })(),

        // 8. Cloud Books from Firestore
        (async (): Promise<Book[]> => {
          try {
            const list = await fetchCloudBooks();
            if (list.length > 0) mergeCloudBooksIntoStore(list, true);
            return list;
          } catch {}
          return [];
        })(),
      ]);

      const map = new Map<string, Book>();
      for (const b of cloudBooks) map.set(b.id, b);
      for (const b of sciBooks) if (!map.has(b.id)) map.set(b.id, b);
      for (const b of currBooks) if (!map.has(b.id)) map.set(b.id, b);
      for (const b of autoBooks) if (!map.has(b.id)) map.set(b.id, b);
      for (const b of modernBooks) if (!map.has(b.id)) map.set(b.id, b);
      for (const b of gutenBooks) if (!map.has(b.id)) map.set(b.id, b);
      for (const b of pdfBooks) if (!map.has(b.id)) map.set(b.id, b);
      for (const b of dbBooks) if (!map.has(b.id)) map.set(b.id, b);

      return filterExcludedItems(applyBookEditorialOverrides(Array.from(map.values()), search));
    },
  });

export const useBook = (id?: string) =>
  useQuery({
    queryKey: ["book", id],
    enabled: !!id && !isExcludedItem({ id }),
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      if (!id || isExcludedItem({ id })) return null;

      // 1. Check custom/overridden editorial book and cloud lookup for book-editorial-*
      const directCustom = getSingleBookWithOverrides(id, null);
      if (id.startsWith("book-editorial-")) {
        try {
          const cloudDirect = await fetchCloudBookById(id);
          if (cloudDirect) {
            mergeCloudBooksIntoStore([cloudDirect], true);
            return getSingleBookWithOverrides(id, cloudDirect);
          }
        } catch {}
        if (directCustom) return directCustom;
      }

      // 2. Check fast local registries by prefix before hitting network
      if (id.startsWith("sci-")) {
        try {
          const found = SCIENTIFIC_ARTICLES.find((s) => s.id === id);
          if (found) {
            return getSingleBookWithOverrides(id, {
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
            } as Book);
          }
        } catch {}
      }

      if (id.startsWith("curr-")) {
        try {
          const found = CURRICULAR_BOOKS.find((c) => c.id === id);
          if (found) {
            return getSingleBookWithOverrides(id, {
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
            } as Book);
          }
        } catch {}
      }

      if (id.startsWith("mod-")) {
        const found = MODERN_BOOKS.find((b) => b.id === id);
        if (found) {
          return getSingleBookWithOverrides(id, {
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
          } as Book);
        }
      }

      if (id.startsWith("auto-")) {
        try {
          const list = await getAutoImportedBooks();
          const found = list.find((b) => b.id === id);
          if (found) {
            return getSingleBookWithOverrides(id, {
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
            } as Book);
          }
        } catch {}
      }

      // Check Original PDF Registry synchronously
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

      if (id.startsWith("guten-") || /^\d+$/.test(id)) {
        const cleanId = id.startsWith("guten-") ? id : `guten-${id}`;
        const found = CURATED_GUTENBERG_BOOKS.find((b) => b.id === cleanId);
        if (found) {
          return getSingleBookWithOverrides(id, {
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
          } as Book);
        }

        const remote = await fetchGutenbergCatalog();
        const foundRemote = remote.find((b) => b.id === cleanId);
        if (foundRemote) {
          return getSingleBookWithOverrides(id, {
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
          } as Book);
        }
      }

      // 3. Parallel Cloud + Supabase lookup for custom/DB books
      const [cloudMatch, dbMatch] = await Promise.all([
        (async (): Promise<Book | null> => {
          try {
            const direct = await fetchCloudBookById(id);
            if (direct) {
              mergeCloudBooksIntoStore([direct], true);
              return direct;
            }
            const cloudList = await fetchCloudBooks();
            if (cloudList.length > 0) mergeCloudBooksIntoStore(cloudList, true);
            return cloudList.find((b) => b.id === id) || null;
          } catch {
            return null;
          }
        })(),
        (async (): Promise<Book | null> => {
          try {
            const { data, error } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
            if (!error && data) return data as Book;
          } catch {}
          return null;
        })(),
      ]);

      if (cloudMatch) return getSingleBookWithOverrides(id, cloudMatch);
      if (dbMatch) return getSingleBookWithOverrides(id, dbMatch);

      return getSingleBookWithOverrides(id, null);
    },
  });

export const useChapters = (bookId?: string) =>
  useQuery({
    queryKey: ["chapters", bookId],
    enabled: !!bookId,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      if (!bookId) return [];

      const customChaps = getCustomBookChapters(bookId);
      if (bookId.startsWith("book-editorial-")) {
        try {
          const cloudChaps = await fetchCloudChapters(bookId);
          if (cloudChaps && cloudChaps.length > 0) {
            const byKey = new Map<string, Chapter>();
            for (const c of [...customChaps, ...cloudChaps]) {
              if (!c) continue;
              const k = c.id || `pos-${c.position}`;
              byKey.set(k, c);
            }
            return Array.from(byKey.values()).sort((a, b) => (a.position || 0) - (b.position || 0));
          }
        } catch {}
        if (customChaps.length > 0) return customChaps;
      }

      // Check Scientific Articles chapters
      if (bookId.startsWith("sci-")) {
        try {
          const found = SCIENTIFIC_ARTICLES.find((s) => s.id === bookId);
          if (found && found.chapters) {
            return found.chapters as Chapter[];
          }
        } catch {}
      }

      // Check Curricular Textbooks chapters
      if (bookId.startsWith("curr-")) {
        try {
          const found = CURRICULAR_BOOKS.find((c) => c.id === bookId);
          if (found && found.chapters) {
            return found.chapters as Chapter[];
          }
        } catch {}
      }

      // Check Auto-Imported chapters
      if (bookId.startsWith("auto-")) {
        try {
          const list = await getAutoImportedBooks();
          const found = list.find((b) => b.id === bookId);
          if (found && found.chapters) {
            return found.chapters as Chapter[];
          }
        } catch {}
      }

      // Check Modern Bestsellers chapters
      if (bookId.startsWith("mod-")) {
        const found = MODERN_BOOKS.find((b) => b.id === bookId);
        if (found && found.chapters) {
          return found.chapters as Chapter[];
        }
      }

      // Check Gutenberg chapters
      if (/^(?:guten-)?\d+$/.test(bookId)) {
        const chaps = await fetchGutenbergChapters(bookId);
        if (chaps && chaps.length > 0) return chaps as Chapter[];
      }

      // Check Original PDF Registry for canonical multi-chapter edition
      try {
        const pdf = getOriginalPdfForBook(bookId);
        if (pdf) {
          return getCanonicalChaptersForOriginalPdf(pdf) as Chapter[];
        }
      } catch {}

      const [dbChaps, cloudChaps] = await Promise.all([
        (async (): Promise<Chapter[]> => {
          try {
            const { data, error } = await supabase
              .from("chapters")
              .select("*")
              .eq("book_id", bookId)
              .order("position", { ascending: true });
            if (!error && data && data.length > 0) return data as Chapter[];
          } catch {}
          return [];
        })(),
        (async (): Promise<Chapter[]> => {
          try {
            const chaps = await fetchCloudChapters(bookId);
            if (chaps && chaps.length > 0) return chaps;
          } catch {}
          return [];
        })(),
      ]);

      if (dbChaps.length > 0) return dbChaps;
      if (cloudChaps.length > 0) return cloudChaps;

      return [] as Chapter[];
    },
  });

let lastUseNewsBackgroundSyncTs = 0;

export const useNews = () =>
  useQuery({
    queryKey: ["news"],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const cachedSyndicated = getCachedNews() as unknown as NewsItem[];

      // Trigger background sync at most once every 5 minutes
      const now = Date.now();
      if (hasFreshLiveSyndicatedCache() && now - lastUseNewsBackgroundSyncTs > 5 * 60 * 1000) {
        lastUseNewsBackgroundSyncTs = now;
        void syncDailyNews().catch(() => {});
      }

      const [liveRss, dbNews, cloudNews, archivedItems, freshSyndicated] = await Promise.all([
        (async (): Promise<NewsItem[]> => {
          try {
            return (await Promise.race([
              fetchTopicRssNews("all", 36),
              new Promise<never[]>((resolve) => setTimeout(() => resolve([]), 4500)),
            ])) as unknown as NewsItem[];
          } catch {
            return [];
          }
        })(),
        (async (): Promise<NewsItem[]> => {
          try {
            const { data, error } = await supabase
              .from("news")
              .select("*")
              .order("published_at", { ascending: false });
            if (!error && data) return filterExcludedItems(data as NewsItem[]);
          } catch {}
          return [];
        })(),
        (async (): Promise<NewsItem[]> => {
          try {
            const list = await fetchCloudNews();
            if (list.length > 0) mergeCloudNewsIntoStore(list, true);
            return list;
          } catch {}
          return [];
        })(),
        (async (): Promise<NewsItem[]> => {
          try {
            const archiveResult = await queryNewsArchive({ pageSize: 24 });
            return (archiveResult.items || []) as unknown as NewsItem[];
          } catch {}
          return [];
        })(),
        (async (): Promise<NewsItem[]> => {
          if (hasFreshLiveSyndicatedCache() && cachedSyndicated.length > 0) {
            return cachedSyndicated;
          }
          try {
            return (await Promise.race([
              syncDailyNews(),
              new Promise<never[]>((resolve) => setTimeout(() => resolve([]), 4500)),
            ])) as unknown as NewsItem[];
          } catch {
            return [];
          }
        })(),
      ]);

      const validDbNews = dbNews.filter(Boolean);
      const seenKeys = new Set<string>();
      const seenIds = new Set<string>();
      const combined: NewsItem[] = [];

      const syndicatedList = freshSyndicated.length > 0 ? freshSyndicated : cachedSyndicated;

      for (const item of [...liveRss, ...syndicatedList, ...cloudNews, ...validDbNews, ...archivedItems]) {
        if (!item || !(item.title || "").trim()) continue;
        const key = (item.slug || item.title || "").toLowerCase().trim();
        const idKey = String(item.id || key).trim();
        if (key && !seenKeys.has(key) && !seenIds.has(idKey)) {
          seenKeys.add(key);
          seenIds.add(idKey);
          combined.push(item);
        }
      }

      const overridden = filterExcludedItems(applyNewsEditorialOverrides(combined));
      const finalUnique: NewsItem[] = [];
      const finalIds = new Set<string>();
      for (const item of overridden) {
        if (!item || !item.id) continue;
        const idStr = String(item.id).trim();
        if (finalIds.has(idStr)) continue;
        finalIds.add(idStr);
        finalUnique.push(item);
      }

      finalUnique.sort((a, b) => {
        const diff = new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        if (diff !== 0) return diff;
        return (a.id || "").localeCompare(b.id || "");
      });
      return finalUnique;
    },
  });

export const useArticle = (slug?: string) =>
  useQuery({
    queryKey: ["news", slug],
    enabled: !!slug && !isExcludedItem({ slug, id: slug }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!slug || isExcludedItem({ slug, id: slug })) return null;

      // 0. Check local Editorial Studio override first (instant synchronous)
      const editorialDirect = getSingleNewsWithOverrides(slug, null);
      if (editorialDirect && slug.startsWith("editorial-")) {
        return expandNewsToDeepReport(editorialDirect) as unknown as NewsItem;
      }

      // 1. Check cached syndicated news synchronously for instant resolution
      try {
        const cached = getCachedNews();
        const foundCached = cached.find((it) => it.slug === slug || it.id === slug);
        if (foundCached) {
          const merged = getSingleNewsWithOverrides(slug, foundCached as unknown as NewsItem);
          if (merged) {
            return getSingleNewsWithOverrides(
              slug,
              expandNewsToDeepReport(merged) as unknown as NewsItem
            );
          }
        }
      } catch {}

      // 2. Run Cloud, Archive, and Supabase lookups in parallel
      const [cloudMatch, permanentMatch, dbMatch] = await Promise.all([
        (async (): Promise<NewsItem | null> => {
          try {
            const match = await fetchCloudNewsBySlug(slug);
            if (match) mergeCloudNewsIntoStore([match]);
            return match || null;
          } catch {
            return null;
          }
        })(),
        (async (): Promise<NewsItem | null> => {
          try {
            const match = await fetchPermanentArticle(slug);
            return (match as NewsItem) || null;
          } catch {
            return null;
          }
        })(),
        (async (): Promise<NewsItem | null> => {
          try {
            const { data, error } = await supabase.from("news").select("*").eq("slug", slug).maybeSingle();
            if (!error && data) return data as NewsItem;
          } catch {}
          return null;
        })(),
      ]);

      let rawFound: NewsItem | null = cloudMatch || permanentMatch || dbMatch;

      // 3. Fallback to live feed if not found in local cache, archive, or cloud
      if (!rawFound) {
        try {
          const res = await fetch("/api/news/feed?topic=all&limit=150");
          if (res.ok) {
            const data = await res.json();
            const match = (data.items || []).find((it: any) => it.slug === slug || it.id === slug);
            if (match) rawFound = match as NewsItem;
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
