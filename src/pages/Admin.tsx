import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Cloud,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { compressImageFile, formatBytes } from "@/lib/imageUploadUtils";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useBooks, useNews, type Book, type NewsItem } from "@/hooks/useCatalog";
import { ANIMES_DATA } from "@/lib/animes";
import { BASE_CURATED_WEBTOONS } from "@/lib/webtoons";
import { getSmartNewsCover } from "@/lib/newsImageResolver";
import { NEWS_CATEGORIES as PORTAL_NEWS_CATEGORIES } from "@/lib/news";
import {
  DIVERSE_PUBLICATION_TOPICS,
  acquireDiversePublications,
  deleteBookPublication,
  deleteNewsPublication,
  getAnimeOverrides,
  getCustomBookChapters,
  getCustomBooks,
  getCustomNewsPublications,
  getNewsOverrides,
  hasEditorialCloudProof,
  improveNewsPublication,
  isSpecialAdminLoggedIn,
  loginSpecialAdmin,
  loginSpecialAdminWithServer,
  logoutSpecialAdmin,
  refreshSpecialAdminSession,
  saveAnimeEditorialOverride,
  saveBookPublication,
  saveCustomBookChapter,
  saveNewsPublicationWithSync,
  slugifyEditorial,
} from "@/lib/editorialStore";
import { auth, signInWithGoogle } from "@/lib/firebase";
import { syncLocalEditorialToCloud } from "@/lib/cloudEditorialService";
import {
  processUploadedPdfFile,
  savePdfBytesToIndexedDB,
  saveCustomUploadedPdfEntry,
  deleteCustomUploadedPdfEntry,
  type ExtractedPdfBookData,
} from "@/lib/pdfUploadService";
import { getOriginalPdfForBook } from "@/lib/originalPdfRegistry";

const NEWS_CATEGORIES = Array.from(
  new Set([
    ...PORTAL_NEWS_CATEGORIES,
    "Esporte",
    "Tecnologia",
    "Economia",
    "Entretenimento",
    "Mundo",
    "Saúde",
    "Geral",
  ])
);

type StudioTabId = "overview" | "news" | "discover" | "books" | "animes";

const STUDIO_VALID_TABS: StudioTabId[] = [
  "overview",
  "news",
  "discover",
  "books",
  "animes",
];

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data: allNews = [], isLoading: loadingNews } = useNews();
  const { data: allBooks = [], isLoading: loadingBooks } = useBooks();

  // Direct Admin Login form state (if accessing /admin before logging in)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(
    () => auth.currentUser
  );
  const [isSavingNews, setIsSavingNews] = useState(false);
  const [lastSaveCloudWarning, setLastSaveCloudWarning] = useState<string | null>(
    null
  );

  useEffect(() => {
    document.title = "Studio Editorial — Wotho";
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser && !fbUser.isAnonymous ? fbUser : null);
      if (fbUser && !fbUser.isAnonymous) {
        setLastSaveCloudWarning(null);
      }
    });
    return () => unsub();
  }, []);

  // Active Tab
  const initialTabParam = searchParams.get("tab") as StudioTabId | null;
  const [activeTab, setActiveTab] = useState<StudioTabId>(
    initialTabParam && STUDIO_VALID_TABS.includes(initialTabParam)
      ? initialTabParam
      : "overview"
  );

  const handleSelectTab = (tab: StudioTabId) => {
    setActiveTab(tab);
    setSearchParams(tab === "overview" ? {} : { tab }, { replace: true });
  };

  // ==========================================================================
  // NEWS EDITOR STATE
  // ==========================================================================
  const [newsSearch, setNewsSearch] = useState("");
  const [newsCategoryFilter, setNewsCategoryFilter] = useState("all");
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [isCreatingNewArticle, setIsCreatingNewArticle] = useState(false);

  const [editNewsTitle, setEditNewsTitle] = useState("");
  const [editNewsSlug, setEditNewsSlug] = useState("");
  const [editNewsCategory, setEditNewsCategory] = useState("Futebol");
  const [editNewsCover, setEditNewsCover] = useState("");
  const [editNewsExcerpt, setEditNewsExcerpt] = useState("");
  const [editNewsContent, setEditNewsContent] = useState("");
  const [editNewsAuthor, setEditNewsAuthor] = useState(
    "Miguel Worscoi (Editor-Chefe)"
  );
  const [lastImprovements, setLastImprovements] = useState<string[]>([]);
  const [isUploadingNewsCover, setIsUploadingNewsCover] = useState(false);
  const [newsCoverMeta, setNewsCoverMeta] = useState<{
    width?: number;
    height?: number;
    sizeBytes?: number;
    format?: string;
    fileName?: string;
  } | null>(null);
  const [isDraggingNewsCover, setIsDraggingNewsCover] = useState(false);
  const [newsCoverInputMode, setNewsCoverInputMode] = useState<"upload" | "url">(
    "upload"
  );
  const newsFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleNewsCoverFileSelect = async (file: File) => {
    if (!file) return;
    setIsUploadingNewsCover(true);
    try {
      const result = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.82,
        maxBytes: 220 * 1024,
      });
      setEditNewsCover(result.dataUrl);
      setNewsCoverMeta({
        width: result.width,
        height: result.height,
        sizeBytes: result.sizeBytes,
        format: result.format,
        fileName: result.fileName,
      });
      toast.success(
        `Capa otimizada (${result.width}x${result.height} · ${formatBytes(result.sizeBytes)})! Clique em "${
          isCreatingNewArticle
            ? "Publicar no Site"
            : "Salvar Alterações no Site"
        }" para enviar para todos os leitores.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Erro ao processar imagem de capa.");
    } finally {
      setIsUploadingNewsCover(false);
      if (newsFileInputRef.current) {
        newsFileInputRef.current.value = "";
      }
    }
  };

  // ==========================================================================
  // DIVERSE PUBLICATIONS DISCOVERY STATE
  // ==========================================================================
  const [selectedDiverseTopic, setSelectedDiverseTopic] =
    useState("futebol-europeu");
  const [diverseItems, setDiverseItems] = useState<NewsItem[]>([]);
  const [loadingDiverse, setLoadingDiverse] = useState(false);

  // ==========================================================================
  // BOOKS EDITOR STATE
  // ==========================================================================
  const [bookSearch, setBookSearch] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isCreatingNewBook, setIsCreatingNewBook] = useState(false);
  const [editBookTitle, setEditBookTitle] = useState("");
  const [editBookAuthor, setEditBookAuthor] = useState("");
  const [editBookCategory, setEditBookCategory] = useState("Literatura");
  const [editBookCover, setEditBookCover] = useState("");
  const [editBookDescription, setEditBookDescription] = useState("");
  const [editBookPdfUrl, setEditBookPdfUrl] = useState("");
  const [uploadedPdfData, setUploadedPdfData] =
    useState<ExtractedPdfBookData | null>(null);
  const [uploadedPdfFileName, setUploadedPdfFileName] = useState("");
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfProgressStep, setPdfProgressStep] = useState("");
  const [pdfProgressPct, setPdfProgressPct] = useState(0);

  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterPosition, setChapterPosition] = useState("1");
  const [chapterContent, setChapterContent] = useState("");

  // ==========================================================================
  // ANIMES EDITOR STATE
  // ==========================================================================
  const [animeSearch, setAnimeSearch] = useState("");
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>(
    ANIMES_DATA[0]?.id || "steel-ball-run"
  );
  const [animeOverridesMap, setAnimeOverridesMap] = useState<
    Record<string, Record<string, any>>
  >(() => getAnimeOverrides());
  const [editAnimeTitle, setEditAnimeTitle] = useState("");
  const [editAnimeSynopsis, setEditAnimeSynopsis] = useState("");
  const [editAnimeCover, setEditAnimeCover] = useState("");
  const [editAnimeBanner, setEditAnimeBanner] = useState("");
  const [editAnimeTrailer, setEditAnimeTrailer] = useState("");

  // Load initial diverse batch on mount
  useEffect(() => {
    void handleFetchDiverse("futebol-europeu");
  }, []);

  // Sync URL query params (?tab=news&edit=slug or ?tab=books&editBook=id)
  useEffect(() => {
    const tabParam = searchParams.get("tab") as StudioTabId | null;
    const editSlug = searchParams.get("edit");
    const editBookId = searchParams.get("editBook");

    if (tabParam && STUDIO_VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }

    if (editSlug && allNews.length > 0) {
      const target = allNews.find(
        (n) => n.slug === editSlug || n.id === editSlug
      );
      if (target) {
        selectArticleForEditing(target);
        setActiveTab("news");
      }
    }

    if (editBookId && allBooks.length > 0) {
      const targetBook = allBooks.find((b) => b.id === editBookId);
      if (targetBook) {
        selectBookForEditing(targetBook);
        setActiveTab("books");
      }
    }
  }, [searchParams, allNews, allBooks]);

  // Select default article when allNews loads
  useEffect(() => {
    if (!selectedNewsId && !isCreatingNewArticle && allNews.length > 0) {
      selectArticleForEditing(allNews[0]);
    }
  }, [allNews, selectedNewsId, isCreatingNewArticle]);

  // Select default book when allBooks loads
  useEffect(() => {
    if (!selectedBookId && !isCreatingNewBook && allBooks.length > 0) {
      selectBookForEditing(allBooks[0]);
    }
  }, [allBooks, selectedBookId, isCreatingNewBook]);

  // Sync selected anime fields
  useEffect(() => {
    const baseAnime = ANIMES_DATA.find((a) => a.id === selectedAnimeId);
    if (!baseAnime) return;
    const patch = animeOverridesMap[selectedAnimeId] || {};
    setEditAnimeTitle(patch.title || baseAnime.title);
    setEditAnimeSynopsis(patch.synopsis || baseAnime.synopsis);
    setEditAnimeCover(patch.cover || baseAnime.cover);
    setEditAnimeBanner(patch.banner || baseAnime.banner);
    setEditAnimeTrailer(patch.trailerYoutubeId || baseAnime.trailerYoutubeId);
  }, [selectedAnimeId, animeOverridesMap]);

  const selectArticleForEditing = (item: NewsItem) => {
    setIsCreatingNewArticle(false);
    setSelectedNewsId(item.id);
    setEditNewsTitle(item.title || "");
    setEditNewsSlug(item.slug || slugifyEditorial(item.title || ""));
    setEditNewsCategory(item.category || "Geral");
    const cover =
      item.cover_url || getSmartNewsCover(item.title, item.category);
    setEditNewsCover(cover);
    if (cover && cover.startsWith("data:")) {
      const b64 = cover.split(",")[1] || "";
      setNewsCoverMeta({
        sizeBytes: Math.round((b64.length * 3) / 4),
        format: cover.includes("webp") ? "webp" : "jpeg",
      });
      setNewsCoverInputMode("upload");
    } else {
      setNewsCoverMeta(null);
    }
    setEditNewsExcerpt(item.excerpt || "");
    setEditNewsContent(item.content || "");
    setEditNewsAuthor((item as any).author || "Miguel Worscoi (Editor-Chefe)");
    setLastImprovements([]);
  };

  const startNewArticle = (prefillCategory = "Futebol") => {
    setIsCreatingNewArticle(true);
    setSelectedNewsId(null);
    setEditNewsTitle("");
    setEditNewsSlug("");
    setEditNewsCategory(prefillCategory);
    setEditNewsCover("");
    setNewsCoverMeta(null);
    setNewsCoverInputMode("upload");
    setEditNewsExcerpt("");
    setEditNewsContent("");
    setEditNewsAuthor("Miguel Worscoi (Editor-Chefe)");
    setLastImprovements([]);
    setLastSaveCloudWarning(null);
    handleSelectTab("news");
  };

  const selectBookForEditing = (book: Book) => {
    setIsCreatingNewBook(false);
    setSelectedBookId(book.id);
    setEditBookTitle(book.title || "");
    setEditBookAuthor(book.author || "");
    setEditBookCategory(book.category || "Literatura");
    setEditBookCover(book.cover_url || "");
    setEditBookDescription(book.description || "");
    const existingPdf = getOriginalPdfForBook(book.id);
    setEditBookPdfUrl(
      existingPdf?.pdfUrl &&
        !existingPdf.pdfUrl.startsWith("idb://") &&
        !existingPdf.pdfUrl.startsWith("data:")
        ? existingPdf.pdfUrl
        : ""
    );
    setUploadedPdfData(null);
    setUploadedPdfFileName("");
  };

  const startNewBook = () => {
    setIsCreatingNewBook(true);
    setSelectedBookId(null);
    setEditBookTitle("");
    setEditBookAuthor("Miguel Worscoi");
    setEditBookCategory("Literatura & Filosofia");
    setEditBookCover(
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80"
    );
    setEditBookDescription("");
    setEditBookPdfUrl("");
    setUploadedPdfData(null);
    setUploadedPdfFileName("");
  };

  // ==========================================================================
  // CONTENT HEALTH & ANALYTICS COMPUTATION
  // ==========================================================================
  const analytics = useMemo(() => {
    const totalNews = allNews.length;
    const totalBooks = allBooks.length;
    const totalAnimes = ANIMES_DATA.length;
    const totalWebtoons = BASE_CURATED_WEBTOONS.length;
    const totalEpisodes = ANIMES_DATA.reduce(
      (acc, a) => acc + (a.episodesCount || 0),
      0
    );

    const overridesMap = getNewsOverrides();
    const editedCount = Object.keys(overridesMap).length / 2;

    const categoryMap: Record<string, number> = {};
    let deepArticlesCount = 0;
    const needsImprovementList: NewsItem[] = [];

    for (const n of allNews) {
      const cat = n.category || "Geral";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;

      const contentLen = (n.content || "").length;
      const hasSubheadings = (n.content || "").includes("### ");
      if (contentLen >= 900 && hasSubheadings) {
        deepArticlesCount++;
      } else if (needsImprovementList.length < 12) {
        needsImprovementList.push(n);
      }
    }

    const categoriesSorted = Object.entries(categoryMap).sort(
      (a, b) => b[1] - a[1]
    );
    const qualityScore =
      totalNews > 0
        ? Math.min(
            100,
            Math.round(((deepArticlesCount + totalNews * 0.4) / totalNews) * 100)
          )
        : 95;

    return {
      totalNews,
      totalBooks,
      totalAnimes,
      totalWebtoons,
      totalEpisodes,
      editedCount: Math.max(0, Math.round(editedCount)),
      categoriesSorted,
      deepArticlesCount,
      needsImprovementList,
      qualityScore,
    };
  }, [allNews, allBooks]);

  // Filtered News for the Editor Sidebar
  const filteredNewsList = useMemo(() => {
    const q = newsSearch.trim().toLowerCase();
    return allNews
      .filter((n) => {
        if (
          newsCategoryFilter !== "all" &&
          n.category?.toLowerCase() !== newsCategoryFilter.toLowerCase()
        ) {
          return false;
        }
        if (!q) return true;
        return (
          n.title?.toLowerCase().includes(q) ||
          n.excerpt?.toLowerCase().includes(q) ||
          n.category?.toLowerCase().includes(q) ||
          n.slug?.toLowerCase().includes(q)
        );
      })
      .slice(0, 80);
  }, [allNews, newsSearch, newsCategoryFilter]);

  // Filtered Books for the Books Editor Sidebar
  const filteredBooksList = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    return allBooks
      .filter((b) => {
        if (!q) return true;
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
        );
      })
      .slice(0, 80);
  }, [allBooks, bookSearch]);

  // Filtered Animes
  const filteredAnimesList = useMemo(() => {
    const q = animeSearch.trim().toLowerCase();
    return ANIMES_DATA.filter((a) => {
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.japaneseTitle.toLowerCase().includes(q) ||
        a.studio.toLowerCase().includes(q)
      );
    });
  }, [animeSearch]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  useEffect(() => {
    if (
      isSpecialAdminLoggedIn() &&
      !auth.currentUser &&
      !hasEditorialCloudProof()
    ) {
      void refreshSpecialAdminSession().then((ok) => {
        if (!ok) {
          logoutSpecialAdmin();
          toast.info(
            "Sessão editorial atualizada por segurança. Entre novamente com a senha mestra."
          );
        }
      });
    }
  }, []);

  const handleDirectAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await loginSpecialAdminWithServer(loginEmail, loginPassword);
    if (res.ok) {
      setLastSaveCloudWarning(null);
      setLoginPassword("");
      toast.success(
        "Bem-vindo ao Studio Editorial, Miguel Worscoi! Publicações sincronizadas na nuvem."
      );
    } else {
      toast.error(
        res.error ||
          "Credenciais inválidas. Utilize o e-mail e senha especiais de administrador."
      );
    }
  };

  const handleGoogleAdminLogin = async () => {
    try {
      const googleUser = await signInWithGoogle();
      if (googleUser) {
        setFirebaseUser(googleUser);
        setLastSaveCloudWarning(null);
        loginSpecialAdmin();
        toast.success(
          `Autenticado com Google (${googleUser.email}). Nuvem ativada.`
        );
        void handleSyncCloudNow();
      }
    } catch (err: any) {
      toast.error(
        "Erro ao autenticar com Google: " + (err.message || String(err))
      );
    }
  };

  const ensureCloudSessionForPublish = async (): Promise<boolean> => {
    if (
      isSpecialAdminLoggedIn() ||
      (auth.currentUser && !auth.currentUser.isAnonymous)
    ) {
      return true;
    }
    try {
      const googleUser = await signInWithGoogle();
      if (googleUser) {
        setFirebaseUser(googleUser);
        setLastSaveCloudWarning(null);
        return true;
      }
    } catch (err: any) {
      const msg =
        err?.message || "Não foi possível autenticar para sincronizar na nuvem.";
      setLastSaveCloudWarning(msg);
      toast.warning("Falha na autenticação para nuvem", { description: msg });
    }
    return false;
  };

  const handleSyncCloudNow = async () => {
    setSyncingCloud(true);
    try {
      if (!auth.currentUser && !isSpecialAdminLoggedIn()) {
        const googleUser = await signInWithGoogle();
        if (googleUser) {
          setFirebaseUser(googleUser);
          setLastSaveCloudWarning(null);
        }
      }

      if (!auth.currentUser && !isSpecialAdminLoggedIn()) {
        toast.warning(
          "Entre como administrador para sincronizar suas publicações na nuvem."
        );
        return;
      }

      const books = getCustomBooks();
      const chaptersMap: Record<string, any[]> = {};
      for (const b of books) {
        chaptersMap[b.id] = getCustomBookChapters(b.id);
      }

      const res = await syncLocalEditorialToCloud(
        getCustomNewsPublications(),
        books,
        chaptersMap,
        getAnimeOverrides()
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["news"] }),
        queryClient.invalidateQueries({ queryKey: ["news-feed"] }),
        queryClient.invalidateQueries({ queryKey: ["books"] }),
      ]);

      setLastSaveCloudWarning(null);
      setLastSyncTime(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      toast.success(
        `Nuvem sincronizada: ${res.newsCount} notícias, ${res.booksCount} livros e ${res.animesCount} animes atualizados.`
      );
    } catch (err: any) {
      toast.error(
        "Erro ao sincronizar na nuvem: " + (err.message || String(err))
      );
    } finally {
      setSyncingCloud(false);
    }
  };

  const handleImproveCurrentArticle = () => {
    if (!editNewsTitle.trim()) {
      toast.error("Informe um título antes de otimizar a publicação.");
      return;
    }
    const result = improveNewsPublication({
      title: editNewsTitle,
      excerpt: editNewsExcerpt,
      content: editNewsContent,
      category: editNewsCategory,
    });
    setEditNewsTitle(result.title);
    setEditNewsExcerpt(result.excerpt);
    setEditNewsContent(result.content);
    if (!editNewsCover.trim()) {
      setEditNewsCover(getSmartNewsCover(result.title, editNewsCategory));
    }
    setLastImprovements(result.improvements);
    toast.success(
      "Estrutura editorial aprimorada. Clique em Publicar/Salvar para enviar."
    );
  };

  const handleQuickImproveAndSave = async (item: NewsItem) => {
    const improved = improveNewsPublication({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      category: item.category,
    });
    await ensureCloudSessionForPublish();
    const { item: saved, cloudSynced, cloudError } =
      await saveNewsPublicationWithSync({
        ...item,
        title: improved.title,
        excerpt: improved.excerpt,
        content: improved.content,
      });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["news"] }),
      queryClient.invalidateQueries({ queryKey: ["news-feed"] }),
      queryClient.invalidateQueries({ queryKey: ["news", saved.slug] }),
    ]);
    selectArticleForEditing(saved);
    if (cloudSynced) {
      toast.success(
        `"${saved.title.slice(0, 45)}..." aprimorada e sincronizada na nuvem.`
      );
    } else {
      toast.warning(`"${saved.title.slice(0, 45)}..." salva localmente.`, {
        description:
          cloudError ||
          "Verifique sua conexão e clique em Sincronizar agora.",
      });
    }
  };

  const handleSaveNewsArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingNewsCover) {
      toast.info("Aguarde a otimização da imagem de capa terminar...");
      return;
    }
    if (!editNewsTitle.trim() || !editNewsContent.trim()) {
      toast.error("Preencha o título e o conteúdo da publicação.");
      return;
    }

    const wasCreating = isCreatingNewArticle;
    setIsSavingNews(true);
    setLastSaveCloudWarning(null);

    try {
      await ensureCloudSessionForPublish();

      const resolvedCover =
        editNewsCover.trim() ||
        getSmartNewsCover(editNewsTitle, editNewsCategory);

      const { item: saved, cloudSynced, cloudError } =
        await saveNewsPublicationWithSync({
          id: wasCreating ? undefined : selectedNewsId || undefined,
          slug: editNewsSlug.trim() || slugifyEditorial(editNewsTitle),
          title: editNewsTitle,
          excerpt: editNewsExcerpt,
          content: editNewsContent,
          cover_url: resolvedCover,
          category: editNewsCategory,
          author: editNewsAuthor,
          isNew: wasCreating,
        });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["news"] }),
        queryClient.invalidateQueries({ queryKey: ["news-feed"] }),
        queryClient.invalidateQueries({ queryKey: ["news", saved.slug] }),
      ]);

      setIsCreatingNewArticle(false);
      setSelectedNewsId(saved.id);
      setEditNewsSlug(saved.slug);
      setEditNewsCover(saved.cover_url || resolvedCover);

      if (cloudSynced) {
        setLastSaveCloudWarning(null);
        toast.success(
          wasCreating
            ? "Publicação e capa enviadas para a nuvem."
            : "Publicação e capa atualizadas na nuvem."
        );
      } else {
        const msg =
          cloudError ||
          "Não foi possível enviar à nuvem neste momento. Clique em Sincronizar agora.";
        setLastSaveCloudWarning(msg);
        toast.warning("Salvo apenas localmente neste dispositivo", {
          description: msg,
        });
      }
    } catch (err: any) {
      const msg =
        err?.message || "Erro inesperado ao publicar notícia na nuvem.";
      setLastSaveCloudWarning(msg);
      toast.error("Falha ao enviar publicação para a nuvem", {
        description: msg,
      });
    } finally {
      setIsSavingNews(false);
    }
  };

  const handleDeleteCurrentNews = () => {
    const key = selectedNewsId || editNewsSlug;
    if (!key) return;
    deleteNewsPublication(key);
    void queryClient.invalidateQueries({ queryKey: ["news"] });
    void queryClient.invalidateQueries({ queryKey: ["news-feed"] });
    toast.success("Publicação removida do catálogo.");
    startNewArticle();
  };

  const handleFetchDiverse = async (topicId: string) => {
    setSelectedDiverseTopic(topicId);
    setLoadingDiverse(true);
    try {
      const items = await acquireDiversePublications(topicId);
      setDiverseItems(items);
    } finally {
      setLoadingDiverse(false);
    }
  };

  const handlePublishDiverseItem = async (item: NewsItem) => {
    await ensureCloudSessionForPublish();
    const { item: saved, cloudSynced, cloudError } =
      await saveNewsPublicationWithSync({
        ...item,
        isNew: true,
      });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["news"] }),
      queryClient.invalidateQueries({ queryKey: ["news-feed"] }),
    ]);
    if (cloudSynced) {
      toast.success(`Publicado na nuvem: "${saved.title.slice(0, 50)}..."`);
    } else {
      toast.warning(`Salvo localmente: "${saved.title.slice(0, 50)}..."`, {
        description:
          cloudError || "Verifique sua conexão e clique em Sincronizar agora.",
      });
    }
  };

  const handlePublishAllDiverse = async () => {
    await ensureCloudSessionForPublish();
    let syncedCount = 0;
    for (const item of diverseItems) {
      const res = await saveNewsPublicationWithSync({
        ...item,
        isNew: true,
      });
      if (res.cloudSynced) syncedCount++;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["news"] }),
      queryClient.invalidateQueries({ queryKey: ["news-feed"] }),
    ]);
    if (syncedCount === diverseItems.length) {
      toast.success(
        `${syncedCount} publicações integradas ao acervo na nuvem.`
      );
    } else {
      toast.warning(
        `${diverseItems.length} salvas localmente (${syncedCount} na nuvem). Clique em Sincronizar agora.`
      );
    }
  };

  const handlePdfFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !file.name.toLowerCase().endsWith(".pdf") &&
      file.type !== "application/pdf"
    ) {
      toast.error("Por favor, selecione um arquivo em formato .PDF válido.");
      return;
    }

    setIsProcessingPdf(true);
    setUploadedPdfFileName(file.name);
    setPdfProgressStep("Iniciando leitura do PDF...");
    setPdfProgressPct(5);

    try {
      const extracted = await processUploadedPdfFile(file, (step, pct) => {
        setPdfProgressStep(step);
        setPdfProgressPct(pct);
      });

      setUploadedPdfData(extracted);

      if (isCreatingNewBook || !editBookTitle.trim()) {
        setEditBookTitle(
          extracted.suggestedTitle || file.name.replace(/\.pdf$/i, "")
        );
      }
      if (
        extracted.suggestedAuthor &&
        (!editBookAuthor.trim() || editBookAuthor === "Miguel Worscoi")
      ) {
        setEditBookAuthor(extracted.suggestedAuthor);
      }
      if (extracted.coverDataUrl) {
        setEditBookCover(extracted.coverDataUrl);
      }
      if (
        extracted.suggestedDescription &&
        (!editBookDescription.trim() || isCreatingNewBook)
      ) {
        setEditBookDescription(extracted.suggestedDescription);
      }

      toast.success(
        `PDF "${file.name}" lido · ${extracted.pagesCount} páginas e ${extracted.extractedChapters.length} capítulos extraídos.`
      );
    } catch (err: any) {
      console.error("Erro ao processar PDF:", err);
      toast.error(
        "Não foi possível ler o PDF. Verifique se o arquivo não está protegido por senha."
      );
    } finally {
      setIsProcessingPdf(false);
      e.target.value = "";
    }
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditBookCover(reader.result);
        toast.success("Capa carregada do dispositivo.");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBookTitle.trim() || !editBookAuthor.trim()) {
      toast.error("Informe o título e o autor da obra.");
      return;
    }
    let pdfUrlToUse = editBookPdfUrl.trim();
    let originalPagesCount = 200;
    let fileSizeBytes = 2500000;
    let fileSizeFormatted = "PDF Completo";
    let editionNotes =
      "Edição digital em PDF publicada pela curadoria editorial da Wotho.";

    if (uploadedPdfData) {
      const generatedId = isCreatingNewBook
        ? `book-editorial-${slugifyEditorial(editBookTitle)}-${Date.now().toString().slice(-4)}`
        : selectedBookId || "";
      const idbUri = await savePdfBytesToIndexedDB(
        generatedId,
        uploadedPdfData.arrayBuffer
      );
      pdfUrlToUse =
        uploadedPdfData.inlineDataUrl || idbUri || editBookPdfUrl.trim();
      originalPagesCount = uploadedPdfData.pagesCount;
      fileSizeBytes = uploadedPdfData.fileSizeBytes;
      fileSizeFormatted = uploadedPdfData.fileSizeFormatted;
      editionNotes = `Edição integral em PDF (${uploadedPdfData.pagesCount} páginas · ${uploadedPdfData.fileSizeFormatted}) publicada pela curadoria editorial da Wotho.`;
    }

    const saved = saveBookPublication({
      id: isCreatingNewBook ? undefined : selectedBookId || undefined,
      title: editBookTitle,
      author: editBookAuthor,
      category: editBookCategory,
      cover_url: editBookCover,
      description: editBookDescription,
      isNew: isCreatingNewBook,
      pdf_url: pdfUrlToUse || undefined,
      download_url: pdfUrlToUse || undefined,
      original_pages_count: originalPagesCount,
      file_size_formatted: fileSizeFormatted,
      edition_notes: editionNotes,
      source_repository: "Biblioteca Digital Luso-Brasileira",
    });

    if (pdfUrlToUse) {
      saveCustomUploadedPdfEntry({
        id: saved.id,
        title: saved.title,
        author: saved.author,
        year: new Date().getFullYear(),
        originalPagesCount,
        fileSizeBytes,
        fileSizeFormatted,
        pdfUrl: pdfUrlToUse,
        directDownloadUrl: pdfUrlToUse,
        sourceRepository: "Biblioteca Digital Luso-Brasileira",
        editionNotes,
        isPublicDomain: false,
        coverUrl:
          saved.cover_url ||
          (uploadedPdfData ? uploadedPdfData.coverDataUrl : "/placeholder.svg"),
        category: saved.category,
        description: saved.description,
      });

      if (uploadedPdfData?.extractedChapters) {
        for (const ch of uploadedPdfData.extractedChapters) {
          saveCustomBookChapter({
            book_id: saved.id,
            title: ch.title,
            content: ch.content,
            position: ch.position,
          });
        }
      }
    }

    void queryClient.invalidateQueries({ queryKey: ["books"] });
    void queryClient.invalidateQueries({ queryKey: ["book", saved.id] });
    void queryClient.invalidateQueries({ queryKey: ["chapters", saved.id] });
    setIsCreatingNewBook(false);
    setSelectedBookId(saved.id);
    setUploadedPdfData(null);
    toast.success(
      uploadedPdfData
        ? `Livro em PDF "${saved.title}" publicado com ${uploadedPdfData.pagesCount} páginas.`
        : "Obra atualizada na biblioteca."
    );
  };

  const handleAddChapterToBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) {
      toast.error("Selecione ou salve um livro primeiro.");
      return;
    }
    if (!chapterTitle.trim() || !chapterContent.trim()) {
      toast.error("Preencha o título e o texto do capítulo.");
      return;
    }
    saveCustomBookChapter({
      book_id: selectedBookId,
      title: chapterTitle,
      content: chapterContent,
      position: parseInt(chapterPosition) || 1,
    });
    void queryClient.invalidateQueries({
      queryKey: ["chapters", selectedBookId],
    });
    setChapterTitle("");
    setChapterContent("");
    setChapterPosition(String((parseInt(chapterPosition) || 1) + 1));
    toast.success("Capítulo adicionado à obra.");
  };

  const handleSaveAnimeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAnimeEditorialOverride(selectedAnimeId, {
      title: editAnimeTitle,
      synopsis: editAnimeSynopsis,
      cover: editAnimeCover,
      banner: editAnimeBanner,
      trailerYoutubeId: editAnimeTrailer,
    });
    setAnimeOverridesMap(getAnimeOverrides());
    toast.success("Dados do anime atualizados.");
  };

  // Word & paragraph counters for active article editor
  const editorStats = useMemo(() => {
    const words = editNewsContent.trim()
      ? editNewsContent.trim().split(/\s+/).length
      : 0;
    const paragraphs = editNewsContent
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean).length;
    const readMinutes = Math.max(1, Math.round(words / 180));
    return { words, paragraphs, readMinutes };
  }, [editNewsContent]);

  const cloudActive = Boolean(firebaseUser || isSpecialAdminLoggedIn());

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#141416] text-[#1D1D1F] dark:text-[#F5F5F7]">
        <Navigation variant="dark" />
        <p className="pt-44 text-center text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
          Carregando Studio Editorial...
        </p>
      </div>
    );
  }

  // Master Login Gate (Monochrome Spatial Executive Gate)
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#141416] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col justify-between">
        <Navigation variant="dark" />
        <main className="flex-1 pt-36 pb-24 px-5 flex items-center justify-center">
          <div className="w-full max-w-[440px] bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[20px] p-7 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="h-10 w-10 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-center shrink-0">
                <Lock className="h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#86868B]">
                  Acesso Exclusivo
                </p>
                <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Studio Editorial
                </h1>
              </div>
            </div>

            <p className="text-[13.5px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed mb-6">
              Entre com sua conta Google de administrador ou utilize suas
              credenciais de Editor-Chefe para publicar no catálogo.
            </p>

            <button
              type="button"
              onClick={handleGoogleAdminLogin}
              className="w-full mb-5 h-10 px-4 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#2C2C2E] text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors inline-flex items-center justify-center gap-2.5 whitespace-nowrap"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Entrar com Google
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/[0.065] dark:border-white/[0.08]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-[#1C1C1E] px-3 text-[#86868B]">
                  ou credenciais editoriais
                </span>
              </div>
            </div>

            <form onSubmit={handleDirectAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-login-email"
                  className="block text-[12.5px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]"
                >
                  E-mail Administrativo
                </label>
                <input
                  id="admin-login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="miguelworscoi@gmail.com"
                  required
                  className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent rounded-[10px] px-3.5 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] outline-none transition-all focus:bg-white dark:focus:bg-[#1C1C1E] focus:border-black/15 dark:focus:border-white/25 focus:ring-2 focus:ring-black/[0.06]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-login-pass"
                  className="block text-[12.5px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]"
                >
                  Senha Mestra
                </label>
                <input
                  id="admin-login-pass"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent rounded-[10px] px-3.5 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] outline-none transition-all focus:bg-white dark:focus:bg-[#1C1C1E] focus:border-black/15 dark:focus:border-white/25 focus:ring-2 focus:ring-black/[0.06]"
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-[13px] font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] transition-colors whitespace-nowrap"
              >
                Acessar Painel Editorial
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const studioNavTabs: Array<{
    id: StudioTabId;
    label: string;
    count?: number;
  }> = [
    { id: "overview", label: "Visão Geral" },
    { id: "news", label: "Notícias", count: analytics.totalNews },
    { id: "discover", label: "Explorar Lotes" },
    { id: "books", label: "Biblioteca PDF", count: analytics.totalBooks },
    {
      id: "animes",
      label: "Animes & Mangás",
      count: analytics.totalAnimes,
    },
  ];

  const inputClass =
    "w-full bg-[#FAFAFC] dark:bg-[#2C2C2E] border border-black/[0.1] dark:border-white/[0.12] rounded-[10px] px-3.5 py-2 text-[13.5px] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] outline-none transition-all focus:bg-white dark:focus:bg-[#1C1C1E] focus:border-[#1D1D1F] dark:focus:border-[#F5F5F7]";

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#141416] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col">
      <Navigation variant="dark" />

      <main className="flex-1 pt-20 pb-20">
        {/* 1. ULTRA-DISCREET FROSTED UTILITY BAR */}
        <div className="border-b border-black/[0.065] dark:border-white/[0.08] bg-[#F5F5F7]/85 dark:bg-[#141416]/85 backdrop-blur-xl">
          <div className="max-w-[1220px] mx-auto px-5 sm:px-7 h-11 flex items-center justify-between gap-4 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <span
                aria-hidden="true"
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{ backgroundColor: cloudActive ? "#28CD41" : "#D97706" }}
              />
              <span className="truncate">
                {firebaseUser ? (
                  <>
                    Nuvem conectada ·{" "}
                    <strong className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {firebaseUser.email || user.email}
                    </strong>
                  </>
                ) : isSpecialAdminLoggedIn() ? (
                  <>
                    Nuvem editorial ativa ·{" "}
                    <strong className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {user.email}
                    </strong>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleAdminLogin}
                    className="hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors underline underline-offset-2"
                  >
                    Conectar Google para nuvem
                  </button>
                )}
              </span>
              {lastSyncTime && (
                <span className="hidden sm:inline text-[#86868B] tabular-nums shrink-0">
                  · Sincronizado às {lastSyncTime}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={handleSyncCloudNow}
                disabled={syncingCloud}
                className="inline-flex items-center gap-1.5 text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`w-3 h-3 ${syncingCloud ? "animate-spin" : ""}`}
                />
                {syncingCloud ? "Sincronizando..." : "Sincronizar agora"}
              </button>
              <span
                aria-hidden="true"
                className="hidden sm:inline text-black/[0.14] dark:text-white/[0.15]"
              >
                |
              </span>
              <span className="hidden sm:inline text-[#86868B] whitespace-nowrap">
                Editor-Chefe
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center gap-1 text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3 h-3" />
                Sair
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1220px] mx-auto px-5 sm:px-7">
          {/* 2. HERO HEADER — PROTAGONIST TITLE + 2 CLEAN CTAs */}
          <header className="pt-9 pb-7 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-[34px] sm:text-[44px] font-semibold tracking-[-0.036em] leading-[1.06] text-[#1D1D1F] dark:text-[#F5F5F7] text-balance">
                Studio Editorial
              </h1>
              <p className="mt-2 text-[15.5px] text-[#6E6E73] dark:text-[#A1A1A6] tracking-[-0.01em]">
                Curadoria, análise e distribuição em tempo real.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  startNewBook();
                  handleSelectTab("books");
                }}
                className="h-[38px] px-[18px] rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#1C1C1E] text-[13.5px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF2] dark:hover:bg-[#2C2C2E] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                Importar PDF
              </button>
              <button
                type="button"
                onClick={() => startNewArticle("Futebol")}
                className="h-[38px] px-[18px] rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-[13.5px] font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                Nova Publicação
              </button>
            </div>
          </header>

          {/* 3. SEGMENTED NAVIGATION BAR (macOS Style, Zero Scrollbar) */}
          <nav
            aria-label="Seções do Studio Editorial"
            className="inline-flex max-w-full items-center bg-black/[0.045] dark:bg-[#2C2C2E] p-1 rounded-[13px] mb-7 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden gap-0.5"
          >
            {studioNavTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  className={`whitespace-nowrap shrink-0 px-4 py-[7px] text-[13px] font-medium rounded-[9px] transition-all inline-flex items-center gap-1.5 ${
                    active
                      ? "bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                      : "text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" && (
                    <span className="text-[11.5px] font-normal text-[#86868B] tabular-nums">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ================================================================
              TAB 1: VISÃO GERAL
             ================================================================ */}
          {activeTab === "overview" && (
            <section className="space-y-5">
              {/* 4 KPI Cards — Rótulo curto + Número protagonista + 1 micro-indicador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.025)] flex flex-col justify-between min-h-[132px]">
                  <span className="text-[13px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                    Notícias
                  </span>
                  <div className="text-[36px] font-semibold tracking-[-0.03em] leading-[1.1] text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums my-2">
                    {loadingNews ? "—" : analytics.totalNews}
                  </div>
                  <span className="text-[12.5px] text-[#86868B] tabular-nums">
                    {analytics.deepArticlesCount} aprofundadas
                  </span>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.025)] flex flex-col justify-between min-h-[132px]">
                  <span className="text-[13px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                    Biblioteca PDF
                  </span>
                  <div className="text-[36px] font-semibold tracking-[-0.03em] leading-[1.1] text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums my-2">
                    {loadingBooks ? "—" : analytics.totalBooks}
                  </div>
                  <span className="text-[12.5px] text-[#86868B]">
                    Obras integrais
                  </span>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.025)] flex flex-col justify-between min-h-[132px]">
                  <span className="text-[13px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                    Catálogo Geek
                  </span>
                  <div className="text-[36px] font-semibold tracking-[-0.03em] leading-[1.1] text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums my-2">
                    {analytics.totalAnimes + analytics.totalWebtoons}
                  </div>
                  <span className="text-[12.5px] text-[#86868B] tabular-nums">
                    {analytics.totalAnimes} Animes · {analytics.totalWebtoons}{" "}
                    Webtoons
                  </span>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.025)] flex flex-col justify-between min-h-[132px]">
                  <span className="text-[13px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                    Saúde Editorial
                  </span>
                  <div className="text-[36px] font-semibold tracking-[-0.03em] leading-[1.1] text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums my-2">
                    {analytics.qualityScore}%
                  </div>
                  <span className="text-[12.5px] text-[#86868B]">
                    Capas e texto verificados
                  </span>
                </div>
              </div>

              {/* Split Inferior: Por Categoria + Prontas para Aprimoramento */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Category Distribution (Monochrome Bars) */}
                <div className="lg:col-span-4 bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.025)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                        Por Categoria
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {analytics.categoriesSorted.map(([cat, count]) => {
                        const pct =
                          analytics.totalNews > 0
                            ? Math.max(
                                4,
                                Math.round((count / analytics.totalNews) * 100)
                              )
                            : 0;
                        return (
                          <div key={cat}>
                            <div className="flex items-center justify-between text-[13.5px] mb-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setNewsCategoryFilter(cat);
                                  handleSelectTab("news");
                                }}
                                className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:opacity-70 transition-opacity text-left truncate"
                              >
                                {cat}
                              </button>
                              <span className="text-[#86868B] tabular-nums shrink-0">
                                {count} · {pct}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[#EFEFF4] dark:bg-[#2C2C2E] overflow-hidden">
                              <div
                                className="h-full bg-[#1D1D1F] dark:bg-[#F5F5F7] rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-black/[0.065] dark:border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => handleSelectTab("discover")}
                      className="w-full h-9 px-4 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap"
                    >
                      Explorar lotes por editoria
                    </button>
                  </div>
                </div>

                {/* Queue Ready for 1-Click Enhancement */}
                <div className="lg:col-span-8 bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.025)]">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                      Prontas para Aprimoramento
                    </h2>
                    <span className="text-[12.5px] text-[#86868B] tabular-nums shrink-0">
                      {analytics.needsImprovementList.length} na fila
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {analytics.needsImprovementList.map((item) => {
                      const charLen = (item.content || "").length;
                      const mins = Math.max(2, Math.round(charLen / 1800));
                      return (
                        <div
                          key={item.id}
                          className="px-4 py-3.5 rounded-[12px] border border-black/[0.065] dark:border-white/[0.08] bg-[#FAFAFC] dark:bg-[#2C2C2E]/60 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[11.5px] text-[#86868B] tabular-nums">
                              <span className="font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                                {item.category}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{mins} min</span>
                              <span aria-hidden="true">·</span>
                              <span>{charLen.toLocaleString("pt-BR")} chars</span>
                            </div>
                            <h3 className="text-[14.5px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                              {item.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                selectArticleForEditing(item);
                                handleSelectTab("news");
                              }}
                              className="h-8 px-3.5 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#1C1C1E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap shrink-0"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickImproveAndSave(item)}
                              className="h-8 px-3.5 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-xs font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] transition-colors whitespace-nowrap shrink-0"
                            >
                              Aprimorar
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {analytics.needsImprovementList.length === 0 && (
                      <div className="py-12 text-center text-[13.5px] text-[#86868B]">
                        Todas as publicações recentes já foram otimizadas.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              TAB 2: NOTÍCIAS (MASTER-DETAIL)
             ================================================================ */}
          {activeTab === "news" && (
            <section className="grid lg:grid-cols-12 gap-5 items-start">
              {/* Left Sidebar: Acervo */}
              <aside className="lg:col-span-4 bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.025)] space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Acervo{" "}
                    <span className="text-xs font-normal text-[#86868B] tabular-nums ml-1">
                      {filteredNewsList.length}
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => startNewArticle("Futebol")}
                    className="h-8 px-3 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-xs font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none" />
                  <input
                    type="text"
                    value={newsSearch}
                    onChange={(e) => setNewsSearch(e.target.value)}
                    placeholder="Buscar título ou tema..."
                    className={`${inputClass} pl-8 py-2`}
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setNewsCategoryFilter("all")}
                    className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                      newsCategoryFilter === "all"
                        ? "bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F]"
                        : "bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
                    }`}
                  >
                    Todas
                  </button>
                  {NEWS_CATEGORIES.map((cat) => {
                    const active =
                      newsCategoryFilter.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewsCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                          active
                            ? "bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F]"
                            : "bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-0.5">
                  {filteredNewsList.map((item) => {
                    const isSelected =
                      !isCreatingNewArticle && selectedNewsId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectArticleForEditing(item)}
                        className={`w-full text-left p-2.5 rounded-[11px] transition-colors flex items-start gap-3 ${
                          isSelected
                            ? "bg-[#EBEBF0] dark:bg-[#2C2C2E]"
                            : "hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/60"
                        }`}
                      >
                        <img
                          src={(
                            item.cover_url ||
                            getSmartNewsCover(item.title, item.category)
                          ).replace(/&amp;/g, "&")}
                          alt=""
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = getSmartNewsCover(
                              item.title,
                              item.category
                            );
                          }}
                          className="w-12 h-12 rounded-[7px] object-cover shrink-0 bg-[#E5E5EA] dark:bg-[#3A3A3C]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 text-[11px] text-[#86868B] tabular-nums mb-0.5">
                            <span className="truncate font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                              {item.category}
                            </span>
                            <span className="shrink-0">
                              {Math.round((item.content || "").length / 6)} pal.
                            </span>
                          </div>
                          <p className="text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] line-clamp-2 leading-snug">
                            {item.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* Right Column: Full Publication Editor */}
              <div className="lg:col-span-8 bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-6 sm:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.025)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-black/[0.065] dark:border-white/[0.08]">
                  <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {isCreatingNewArticle
                      ? "Nova Publicação"
                      : "Editar Publicação"}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleImproveCurrentArticle}
                      className="h-8 px-3.5 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] dark:hover:bg-[#3A3A3C] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Aprimorar Estrutura
                    </button>

                    {!isCreatingNewArticle && editNewsSlug && (
                      <Link
                        to={`/noticias/${editNewsSlug}`}
                        target="_blank"
                        className="h-8 px-3.5 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] dark:hover:bg-[#3A3A3C] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver no Site
                      </Link>
                    )}
                  </div>
                </div>

                {lastSaveCloudWarning && (
                  <div className="mb-6 p-4 rounded-[12px] bg-[#D97706]/10 border border-[#D97706]/25 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-[#B45309] dark:text-[#FBBF24] flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Publicação salva localmente — nuvem pendente
                      </div>
                      <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                        {lastSaveCloudWarning}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSyncCloudNow}
                      disabled={syncingCloud}
                      className="h-8 px-3.5 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-xs font-medium inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      <Cloud className="h-3.5 w-3.5" />
                      {syncingCloud ? "Sincronizando..." : "Sincronizar agora"}
                    </button>
                  </div>
                )}

                {lastImprovements.length > 0 && (
                  <div className="mb-6 p-4 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.065] dark:border-white/[0.08] text-xs space-y-1.5">
                    <div className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Melhorias aplicadas pelo Otimizador Editorial
                    </div>
                    <ul className="list-disc list-inside text-[#6E6E73] dark:text-[#A1A1A6] space-y-0.5">
                      {lastImprovements.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <form
                  onSubmit={handleSaveNewsArticle}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.startsWith("image/")) {
                        const pastedFile = items[i].getAsFile();
                        if (pastedFile) {
                          e.preventDefault();
                          setNewsCoverInputMode("upload");
                          void handleNewsCoverFileSelect(pastedFile);
                          break;
                        }
                      }
                    }
                  }}
                  className="space-y-5"
                >
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        Título da Publicação
                      </label>
                      <input
                        type="text"
                        value={editNewsTitle}
                        onChange={(e) => {
                          setEditNewsTitle(e.target.value);
                          if (isCreatingNewArticle) {
                            setEditNewsSlug(slugifyEditorial(e.target.value));
                          }
                        }}
                        placeholder="Digite uma manchete clara..."
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        Editoria
                      </label>
                      <select
                        value={editNewsCategory}
                        onChange={(e) => setEditNewsCategory(e.target.value)}
                        className={inputClass}
                      >
                        {NEWS_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        Slug / URL Amigável
                      </label>
                      <input
                        type="text"
                        value={editNewsSlug}
                        onChange={(e) => setEditNewsSlug(e.target.value)}
                        placeholder="slug-da-noticia"
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        Autor / Fonte Editorial
                      </label>
                      <input
                        type="text"
                        value={editNewsAuthor}
                        onChange={(e) => setEditNewsAuthor(e.target.value)}
                        placeholder="Miguel Worscoi (Editor-Chefe)"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Cover Image Section — Clean Monochrome Bar + Preview */}
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        Capa da Notícia
                      </label>

                      <div className="inline-flex items-center bg-[#EFEFF2] dark:bg-[#2C2C2E] p-0.5 rounded-[9px]">
                        <button
                          type="button"
                          onClick={() => setNewsCoverInputMode("upload")}
                          className={`px-2.5 py-1 rounded-[7px] text-[11.5px] font-medium transition-all ${
                            newsCoverInputMode === "upload"
                              ? "bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs"
                              : "text-[#6E6E73] dark:text-[#A1A1A6]"
                          }`}
                        >
                          Upload do Dispositivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewsCoverInputMode("url")}
                          className={`px-2.5 py-1 rounded-[7px] text-[11.5px] font-medium transition-all ${
                            newsCoverInputMode === "url"
                              ? "bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs"
                              : "text-[#6E6E73] dark:text-[#A1A1A6]"
                          }`}
                        >
                          URL Externa
                        </button>
                      </div>
                    </div>

                    <input
                      ref={newsFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleNewsCoverFileSelect(file);
                      }}
                      className="hidden"
                    />

                    {newsCoverInputMode === "upload" ? (
                      <div className="space-y-3">
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingNewsCover(true);
                          }}
                          onDragLeave={() => setIsDraggingNewsCover(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingNewsCover(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) void handleNewsCoverFileSelect(file);
                          }}
                          onClick={() => newsFileInputRef.current?.click()}
                          className={`cursor-pointer flex items-center justify-between gap-4 px-4 py-3.5 rounded-[12px] border border-dashed transition-colors ${
                            isDraggingNewsCover
                              ? "border-[#1D1D1F] bg-[#EFEFF2] dark:border-[#F5F5F7] dark:bg-[#2C2C2E]"
                              : "border-black/[0.15] dark:border-white/[0.18] bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 hover:bg-[#EFEFF2] dark:hover:bg-[#2C2C2E]"
                          }`}
                        >
                          <div className="min-w-0 text-[13px] text-[#6E6E73] dark:text-[#A1A1A6]">
                            <strong className="block font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                              {isUploadingNewsCover
                                ? "Otimizando imagem (WebP)..."
                                : "Arraste ou selecione uma imagem de capa"}
                            </strong>
                            PNG, JPEG, WEBP ou AVIF · Otimizada em 1280×720
                          </div>
                          <span className="h-8 px-3.5 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#1C1C1E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                            {isUploadingNewsCover ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            Escolher Imagem
                          </span>
                        </div>

                        {editNewsCover ? (
                          <div className="p-3.5 rounded-[12px] border border-black/[0.065] dark:border-white/[0.08] bg-[#FAFAFC] dark:bg-[#2C2C2E]/40 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7] inline-flex items-center gap-1.5">
                                <Check
                                  className="w-3.5 h-3.5"
                                  style={{ color: "#16A34A" }}
                                />
                                Capa selecionada
                              </span>
                              <div className="flex items-center gap-3">
                                {newsCoverMeta?.sizeBytes && (
                                  <span className="text-[11px] font-mono text-[#86868B] tabular-nums">
                                    {newsCoverMeta.width &&
                                      `${newsCoverMeta.width}×${newsCoverMeta.height} · `}
                                    {formatBytes(newsCoverMeta.sizeBytes)}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditNewsCover("");
                                    setNewsCoverMeta(null);
                                    if (newsFileInputRef.current)
                                      newsFileInputRef.current.value = "";
                                  }}
                                  className="text-xs text-[#DC2626] hover:opacity-75 inline-flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Remover
                                </button>
                              </div>
                            </div>

                            <div className="relative rounded-[10px] overflow-hidden border border-black/[0.065] dark:border-white/[0.08] bg-[#1D1D1F] h-44 sm:h-52">
                              <img
                                src={editNewsCover}
                                alt="Preview da capa da notícia"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = getSmartNewsCover(
                                    editNewsTitle,
                                    editNewsCategory
                                  );
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs text-[#86868B]">
                            <span>Nenhuma imagem selecionada.</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditNewsCover(
                                  getSmartNewsCover(
                                    editNewsTitle || editNewsCategory,
                                    editNewsCategory
                                  )
                                );
                                setNewsCoverMeta(null);
                              }}
                              className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:underline"
                            >
                              Sugerir capa temática
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editNewsCover}
                            onChange={(e) => {
                              setEditNewsCover(e.target.value);
                              setNewsCoverMeta(null);
                            }}
                            placeholder="https://..."
                            className={`${inputClass} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditNewsCover(
                                getSmartNewsCover(
                                  editNewsTitle || editNewsCategory,
                                  editNewsCategory
                                )
                              );
                              setNewsCoverMeta(null);
                            }}
                            className="px-3.5 rounded-[10px] border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] shrink-0 whitespace-nowrap"
                          >
                            Sugerir
                          </button>
                        </div>

                        {editNewsCover && (
                          <div className="flex items-center gap-3 p-2.5 rounded-[10px] border border-black/[0.065] dark:border-white/[0.08] bg-[#FAFAFC] dark:bg-[#2C2C2E]/40">
                            <img
                              src={editNewsCover}
                              alt="Preview da capa"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = getSmartNewsCover(
                                  editNewsTitle,
                                  editNewsCategory
                                );
                              }}
                              className="h-14 w-24 rounded-[6px] object-cover shrink-0 bg-[#E5E5EA]"
                            />
                            <div className="min-w-0 flex-1 text-xs text-[#86868B] truncate font-mono">
                              {editNewsCover}
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditNewsCover("")}
                              className="text-xs text-[#6E6E73] hover:text-[#DC2626] px-2"
                            >
                              Limpar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                      Resumo Executivo
                    </label>
                    <textarea
                      rows={2}
                      value={editNewsExcerpt}
                      onChange={(e) => setEditNewsExcerpt(e.target.value)}
                      placeholder="Síntese exibida nos cartões e na abertura da matéria..."
                      className={`${inputClass} resize-y`}
                    />
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        Corpo da Publicação
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setEditNewsContent(
                              (prev) =>
                                `${prev.trim()}\n\n### Novo Subtítulo Editorial\n\n`
                            )
                          }
                          className="px-2.5 py-1 rounded-md bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-[#EBEBF0] text-[11.5px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors"
                        >
                          + Subtítulo
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditNewsContent(
                              (prev) =>
                                `${prev.trim()}\n\n> "Citação ou análise em destaque."\n\n`
                            )
                          }
                          className="px-2.5 py-1 rounded-md bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-[#EBEBF0] text-[11.5px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors"
                        >
                          + Citação
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditNewsContent(
                              (prev) =>
                                `${prev.trim()}\n\n• Primeiro ponto-chave\n• Segundo desdobramento\n• Terceiro indicador\n\n`
                            )
                          }
                          className="px-2.5 py-1 rounded-md bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:bg-[#EBEBF0] text-[11.5px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors"
                        >
                          + Tópicos
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={13}
                      value={editNewsContent}
                      onChange={(e) => setEditNewsContent(e.target.value)}
                      placeholder="Escreva ou edite os parágrafos completos da matéria..."
                      required
                      className={`${inputClass} resize-y leading-relaxed`}
                    />

                    <div className="flex flex-wrap items-center justify-between text-[11.5px] text-[#86868B] tabular-nums">
                      <span>
                        {editorStats.words} palavras · {editorStats.paragraphs}{" "}
                        blocos · ~{editorStats.readMinutes} min de leitura
                      </span>
                      <span>
                        Use <code>### Título</code> para seções
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/[0.065] dark:border-white/[0.08]">
                    {!isCreatingNewArticle ? (
                      <button
                        type="button"
                        onClick={handleDeleteCurrentNews}
                        className="h-9 px-3 rounded-full text-xs font-medium text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleImproveCurrentArticle}
                        className="h-9 px-4 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap"
                      >
                        Aprimorar Antes de Salvar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingNews || isUploadingNewsCover}
                        className="h-9 px-5 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-xs font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        {isSavingNews ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Publicando...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            {isCreatingNewArticle
                              ? "Publicar no Site"
                              : "Salvar Alterações"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* ================================================================
              TAB 3: EXPLORAR LOTES (SINDICAÇÃO LIMPA — PILLS + CAPAS)
             ================================================================ */}
          {activeTab === "discover" && (
            <section className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {DIVERSE_PUBLICATION_TOPICS.map((topic) => {
                    const active = selectedDiverseTopic === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => void handleFetchDiverse(topic.id)}
                        className={`h-[34px] px-4 rounded-full text-[13px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? "bg-[#1D1D1F] text-white border-[#1D1D1F] dark:bg-[#F5F5F7] dark:text-[#1D1D1F] dark:border-[#F5F5F7]"
                            : "bg-white dark:bg-[#1C1C1E] text-[#6E6E73] dark:text-[#A1A1A6] border-black/[0.1] dark:border-white/[0.12] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
                        }`}
                      >
                        {topic.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => void handleFetchDiverse("all")}
                    className={`h-[34px] px-4 rounded-full text-[13px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                      selectedDiverseTopic === "all"
                        ? "bg-[#1D1D1F] text-white border-[#1D1D1F] dark:bg-[#F5F5F7] dark:text-[#1D1D1F] dark:border-[#F5F5F7]"
                        : "bg-white dark:bg-[#1C1C1E] text-[#6E6E73] dark:text-[#A1A1A6] border-black/[0.1] dark:border-white/[0.12] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
                    }`}
                  >
                    Multi-Editoria
                  </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={loadingDiverse}
                    onClick={() => void handleFetchDiverse(selectedDiverseTopic)}
                    className="h-[34px] px-4 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#1C1C1E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] dark:hover:bg-[#2C2C2E] disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        loadingDiverse ? "animate-spin" : ""
                      }`}
                    />
                    Atualizar
                  </button>
                  {diverseItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handlePublishAllDiverse}
                      className="h-[34px] px-4 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-xs font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      Publicar Lote ({diverseItems.length})
                    </button>
                  )}
                </div>
              </div>

              {loadingDiverse ? (
                <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] py-16 text-center text-[13.5px] text-[#86868B]">
                  Carregando lotes editoriais...
                </div>
              ) : diverseItems.length === 0 ? (
                <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] py-16 text-center text-[13.5px] text-[#86868B]">
                  Nenhum item pendente neste lote.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {diverseItems.map((item) => {
                    const wordsCount = Math.round(
                      (item.content || "").length / 6
                    );
                    const readMins = Math.max(2, Math.round(wordsCount / 180));
                    return (
                      <article
                        key={item.slug}
                        className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.025)] flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative h-48 bg-[#E5E5EA] dark:bg-[#2C2C2E] overflow-hidden">
                            <img
                              src={
                                item.cover_url ||
                                getSmartNewsCover(item.title, item.category)
                              }
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = getSmartNewsCover(
                                  item.title,
                                  item.category
                                );
                              }}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-3 left-3 bg-[#1D1D1F]/75 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                              {item.category}
                            </span>
                          </div>

                          <div className="p-5 space-y-2">
                            <h3 className="text-[16px] font-semibold tracking-[-0.015em] leading-[1.35] text-[#1D1D1F] dark:text-[#F5F5F7]">
                              {item.title}
                            </h3>
                            <p className="text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] line-clamp-2 leading-relaxed">
                              {item.excerpt}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-[#86868B] tabular-nums">
                            Leitura · {readMins} min
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                selectArticleForEditing(item);
                                setIsCreatingNewArticle(true);
                                handleSelectTab("news");
                              }}
                              className="h-8 px-3 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePublishDiverseItem(item)}
                              className="h-8 px-3.5 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-xs font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] transition-colors whitespace-nowrap"
                            >
                              Publicar
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ================================================================
              TAB 4: BIBLIOTECA PDF (MASTER-DETAIL + COMPACT PDF BAR)
             ================================================================ */}
          {activeTab === "books" && (
            <section className="grid lg:grid-cols-12 gap-5 items-start">
              {/* Left Sidebar: Obras */}
              <aside className="lg:col-span-4 bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.025)] space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Obras{" "}
                    <span className="text-xs font-normal text-[#86868B] tabular-nums ml-1">
                      {filteredBooksList.length}
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={startNewBook}
                    className="h-8 px-3 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap shrink-0"
                  >
                    + Novo
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="Buscar título ou autor..."
                    className={`${inputClass} pl-8 py-2`}
                  />
                </div>

                <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-0.5">
                  {filteredBooksList.map((b) => {
                    const isSelected =
                      !isCreatingNewBook && selectedBookId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => selectBookForEditing(b)}
                        className={`w-full text-left p-2.5 rounded-[11px] transition-colors flex items-center gap-3 ${
                          isSelected
                            ? "bg-[#EBEBF0] dark:bg-[#2C2C2E]"
                            : "hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/60"
                        }`}
                      >
                        <img
                          src={b.cover_url || "/placeholder.svg"}
                          alt={b.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-14 rounded-[6px] object-cover shrink-0 bg-[#E5E5EA] dark:bg-[#3A3A3C]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                            {b.title}
                          </p>
                          <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] truncate mt-0.5">
                            {b.author}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* Right Column: Detail Editor + Chapter Publisher */}
              <div className="lg:col-span-8 space-y-5">
                <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-6 sm:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.025)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-black/[0.065] dark:border-white/[0.08]">
                    <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {isCreatingNewBook ? "Nova Obra" : "Editar Obra"}
                    </h2>
                    {!isCreatingNewBook && selectedBookId && (
                      <Link
                        to={`/livro/${selectedBookId}`}
                        target="_blank"
                        className="h-8 px-3.5 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] dark:hover:bg-[#3A3A3C] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Livro no Site
                      </Link>
                    )}
                  </div>

                  {/* Compact 1-Line PDF Upload Bar */}
                  <div className="mb-6 rounded-[12px] border border-dashed border-black/[0.16] dark:border-white/[0.18] bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 px-4 py-3.5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-[13px] text-[#6E6E73] dark:text-[#A1A1A6]">
                        <strong className="block font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                          Importar arquivo PDF
                        </strong>
                        Extração automática de título, capa, páginas e
                        capítulos.
                      </div>

                      <label className="cursor-pointer h-8 px-3.5 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#1C1C1E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] dark:hover:bg-[#3A3A3C] transition-colors inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto whitespace-nowrap">
                        <Upload className="w-3.5 h-3.5" />
                        {isProcessingPdf ? "Lendo PDF..." : "Escolher .PDF"}
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handlePdfFileSelect}
                          disabled={isProcessingPdf}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {isProcessingPdf && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                          <span>{pdfProgressStep}</span>
                          <span>{pdfProgressPct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-black/[0.08] dark:bg-white/[0.1] overflow-hidden">
                          <div
                            className="h-full bg-[#1D1D1F] dark:bg-[#F5F5F7] transition-all duration-300"
                            style={{ width: `${pdfProgressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {uploadedPdfData && !isProcessingPdf && (
                      <div className="p-3 rounded-[10px] bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] flex items-center gap-3">
                        {uploadedPdfData.coverDataUrl && (
                          <img
                            src={uploadedPdfData.coverDataUrl}
                            alt="Capa extraída do PDF"
                            className="w-10 h-14 object-cover rounded-[6px] border border-black/[0.08] shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold flex items-center gap-1.5 truncate"
                            style={{ color: "#15803D" }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            {uploadedPdfFileName}
                          </p>
                          <p className="text-[11.5px] text-[#86868B] tabular-nums mt-0.5">
                            {uploadedPdfData.pagesCount} páginas ·{" "}
                            {uploadedPdfData.fileSizeFormatted} ·{" "}
                            {uploadedPdfData.extractedChapters.length} capítulos
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSaveBook} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                          Título
                        </label>
                        <input
                          type="text"
                          value={editBookTitle}
                          onChange={(e) => setEditBookTitle(e.target.value)}
                          placeholder="Título da obra"
                          required
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                          Autor(es)
                        </label>
                        <input
                          type="text"
                          value={editBookAuthor}
                          onChange={(e) => setEditBookAuthor(e.target.value)}
                          placeholder="Nome do autor ou autora"
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                          Área / Gênero
                        </label>
                        <input
                          type="text"
                          value={editBookCategory}
                          onChange={(e) => setEditBookCategory(e.target.value)}
                          placeholder="Filosofia, Ciência, Literatura..."
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                            Capa (URL)
                          </label>
                          <label className="cursor-pointer text-[11.5px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:underline inline-flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Enviar imagem
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverFileSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          value={editBookCover}
                          onChange={(e) => setEditBookCover(e.target.value)}
                          placeholder="URL da capa..."
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        Link PDF Externo (opcional)
                      </label>
                      <input
                        type="text"
                        value={editBookPdfUrl}
                        onChange={(e) => setEditBookPdfUrl(e.target.value)}
                        placeholder="https://..."
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        Sinopse Editorial
                      </label>
                      <textarea
                        rows={4}
                        value={editBookDescription}
                        onChange={(e) => setEditBookDescription(e.target.value)}
                        required
                        className={`${inputClass} resize-y`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/[0.065] dark:border-white/[0.08]">
                      {!isCreatingNewBook && selectedBookId ? (
                        <button
                          type="button"
                          onClick={() => {
                            deleteBookPublication(selectedBookId);
                            deleteCustomUploadedPdfEntry(selectedBookId);
                            void queryClient.invalidateQueries({
                              queryKey: ["books"],
                            });
                            toast.success("Obra ocultada do catálogo.");
                            startNewBook();
                          }}
                          className="h-9 px-3 rounded-full text-xs font-medium text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover Obra
                        </button>
                      ) : (
                        <div />
                      )}
                      <button
                        type="submit"
                        disabled={isProcessingPdf}
                        className="h-9 px-5 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-xs font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {uploadedPdfData
                          ? "Publicar Livro PDF"
                          : "Salvar Alterações"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Add Chapter to Selected Book */}
                {selectedBookId && (
                  <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-6 sm:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.025)]">
                    <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7] mb-1 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#6E6E73]" />
                      Capítulos de "{editBookTitle}"
                    </h3>
                    <p className="text-xs text-[#86868B] mb-5">
                      Adicione ou atualize capítulos para leitura direta no
                      site.
                    </p>

                    <form
                      onSubmit={handleAddChapterToBook}
                      className="space-y-4"
                    >
                      <div className="grid sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-3 space-y-1.5">
                          <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                            Título do Capítulo
                          </label>
                          <input
                            type="text"
                            value={chapterTitle}
                            onChange={(e) => setChapterTitle(e.target.value)}
                            placeholder="Capítulo 1: O Princípio Fundamental"
                            required
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                            Posição / Nº
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={chapterPosition}
                            onChange={(e) => setChapterPosition(e.target.value)}
                            required
                            className={`${inputClass} tabular-nums`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                          Texto Integral
                        </label>
                        <textarea
                          rows={7}
                          value={chapterContent}
                          onChange={(e) => setChapterContent(e.target.value)}
                          placeholder="Escreva ou cole o texto completo do capítulo..."
                          required
                          className={`${inputClass} resize-y`}
                        />
                      </div>

                      <button
                        type="submit"
                        className="h-9 px-5 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-xs font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Publicar Capítulo
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================================================================
              TAB 5: ANIMES & MANGÁS (MASTER-DETAIL)
             ================================================================ */}
          {activeTab === "animes" && (
            <section className="grid lg:grid-cols-12 gap-5 items-start">
              <aside className="lg:col-span-4 bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.025)] space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Franquias{" "}
                    <span className="text-xs font-normal text-[#86868B] tabular-nums ml-1">
                      {filteredAnimesList.length}
                    </span>
                  </h2>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none" />
                  <input
                    type="text"
                    value={animeSearch}
                    onChange={(e) => setAnimeSearch(e.target.value)}
                    placeholder="Buscar anime ou estúdio..."
                    className={`${inputClass} pl-8 py-2`}
                  />
                </div>

                <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-0.5">
                  {filteredAnimesList.map((anime) => {
                    const active = selectedAnimeId === anime.id;
                    const patch = animeOverridesMap[anime.id] || {};
                    return (
                      <button
                        key={anime.id}
                        type="button"
                        onClick={() => setSelectedAnimeId(anime.id)}
                        className={`w-full text-left p-2.5 rounded-[11px] transition-colors flex items-center gap-3 ${
                          active
                            ? "bg-[#EBEBF0] dark:bg-[#2C2C2E]"
                            : "hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]/60"
                        }`}
                      >
                        <img
                          src={patch.cover || anime.cover}
                          alt={anime.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-14 rounded-[6px] object-cover shrink-0 bg-[#E5E5EA] dark:bg-[#3A3A3C]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-[#86868B] tabular-nums">
                            {anime.seasons.length} temp. · {anime.episodesCount}{" "}
                            ep.
                          </div>
                          <p className="text-[13.5px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                            {patch.title || anime.title}
                          </p>
                          <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] truncate">
                            {anime.studio}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="lg:col-span-8 bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[18px] p-6 sm:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.025)]">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-black/[0.065] dark:border-white/[0.08]">
                  <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Editar Anime & Mangá
                  </h2>
                  <Link
                    to={`/animes/${selectedAnimeId}`}
                    target="_blank"
                    className="h-8 px-3.5 rounded-full border border-black/[0.1] dark:border-white/[0.14] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF4] dark:hover:bg-[#3A3A3C] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir Página
                  </Link>
                </div>

                <form onSubmit={handleSaveAnimeEdit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        Título Oficial Exibido
                      </label>
                      <input
                        type="text"
                        value={editAnimeTitle}
                        onChange={(e) => setEditAnimeTitle(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        YouTube Trailer ID
                      </label>
                      <input
                        type="text"
                        value={editAnimeTrailer}
                        onChange={(e) => setEditAnimeTrailer(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        URL do Poster
                      </label>
                      <input
                        type="text"
                        value={editAnimeCover}
                        onChange={(e) => setEditAnimeCover(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                        URL do Banner Panorâmico
                      </label>
                      <input
                        type="text"
                        value={editAnimeBanner}
                        onChange={(e) => setEditAnimeBanner(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                      Sinopse Editorial
                    </label>
                    <textarea
                      rows={6}
                      value={editAnimeSynopsis}
                      onChange={(e) => setEditAnimeSynopsis(e.target.value)}
                      required
                      className={`${inputClass} resize-y`}
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-black/[0.065] dark:border-white/[0.08]">
                    <button
                      type="submit"
                      className="h-9 px-5 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-xs font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
