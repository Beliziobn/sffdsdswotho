import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Image as ImageIcon,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Newspaper,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { compressImageFile, formatBytes } from "@/lib/imageUploadUtils";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useBooks, useNews, type Book, type NewsItem } from "@/hooks/useCatalog";
import { ANIMES_DATA } from "@/lib/animes";
import { BASE_CURATED_WEBTOONS } from "@/lib/webtoons";
import { getSmartNewsCover } from "@/lib/newsImageResolver";
import {
  DIVERSE_PUBLICATION_TOPICS,
  SPECIAL_ADMIN_EMAIL,
  acquireDiversePublications,
  deleteBookPublication,
  deleteNewsPublication,
  getAnimeOverrides,
  getCustomBookChapters,
  getCustomBooks,
  getCustomNewsPublications,
  getNewsOverrides,
  improveNewsPublication,
  loginSpecialAdmin,
  saveAnimeEditorialOverride,
  saveBookPublication,
  saveCustomBookChapter,
  saveNewsPublication,
  slugifyEditorial,
  verifySpecialAdminCredentials,
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

const NEWS_CATEGORIES = [
  "Esporte",
  "Tecnologia",
  "Ciência",
  "Cultura",
  "Economia",
  "Entretenimento",
  "Mundo",
  "Política",
  "Saúde",
  "Geral",
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

  // Active Tab
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  // ==========================================================================
  // NEWS EDITOR STATE
  // ==========================================================================
  const [newsSearch, setNewsSearch] = useState("");
  const [newsCategoryFilter, setNewsCategoryFilter] = useState("all");
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [isCreatingNewArticle, setIsCreatingNewArticle] = useState(false);

  const [editNewsTitle, setEditNewsTitle] = useState("");
  const [editNewsSlug, setEditNewsSlug] = useState("");
  const [editNewsCategory, setEditNewsCategory] = useState("Esporte");
  const [editNewsCover, setEditNewsCover] = useState("");
  const [editNewsExcerpt, setEditNewsExcerpt] = useState("");
  const [editNewsContent, setEditNewsContent] = useState("");
  const [editNewsAuthor, setEditNewsAuthor] = useState("Miguel Worscoi (Editor-Chefe)");
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
  const [newsCoverInputMode, setNewsCoverInputMode] = useState<"upload" | "url">("upload");
  const newsFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleNewsCoverFileSelect = async (file: File) => {
    if (!file) return;
    setIsUploadingNewsCover(true);
    try {
      const result = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.82,
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
        `Capa otimizada com sucesso (${result.width}x${result.height} · ${formatBytes(result.sizeBytes)})! Pronta para sincronizar na nuvem para todos os leitores.`
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
  const [selectedDiverseTopic, setSelectedDiverseTopic] = useState("futebol-europeu");
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
  const [uploadedPdfData, setUploadedPdfData] = useState<ExtractedPdfBookData | null>(null);
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
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>(ANIMES_DATA[0]?.id || "steel-ball-run");
  const [animeOverridesMap, setAnimeOverridesMap] = useState<Record<string, Record<string, any>>>(() =>
    getAnimeOverrides()
  );
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
    const tabParam = searchParams.get("tab");
    const editSlug = searchParams.get("edit");
    const editBookId = searchParams.get("editBook");

    if (tabParam) setActiveTab(tabParam);

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
    const cover = item.cover_url || getSmartNewsCover(item.title, item.category);
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

  const startNewArticle = (prefillCategory = "Esporte") => {
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
    setActiveTab("news");
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
    setEditBookPdfUrl(existingPdf?.pdfUrl && !existingPdf.pdfUrl.startsWith("idb://") && !existingPdf.pdfUrl.startsWith("data:") ? existingPdf.pdfUrl : "");
    setUploadedPdfData(null);
    setUploadedPdfFileName("");
  };

  const startNewBook = () => {
    setIsCreatingNewBook(true);
    setSelectedBookId(null);
    setEditBookTitle("");
    setEditBookAuthor("Miguel Worscoi");
    setEditBookCategory("Literatura & Filosofia");
    setEditBookCover("https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80");
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
    const totalEpisodes = ANIMES_DATA.reduce((acc, a) => acc + (a.episodesCount || 0), 0);

    const overridesMap = getNewsOverrides();
    const editedCount = Object.keys(overridesMap).length / 2;

    const categoryMap: Record<string, number> = {};
    let deepArticlesCount = 0;
    let needsImprovementList: NewsItem[] = [];

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

    const categoriesSorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const qualityScore =
      totalNews > 0 ? Math.min(100, Math.round(((deepArticlesCount + totalNews * 0.4) / totalNews) * 100)) : 95;

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
        if (newsCategoryFilter !== "all" && n.category?.toLowerCase() !== newsCategoryFilter.toLowerCase()) {
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

  const handleDirectAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifySpecialAdminCredentials(loginEmail, loginPassword)) {
      loginSpecialAdmin();
      toast.success("Bem-vindo ao Studio Editorial Mestre, Miguel Worscoi!");
    } else {
      toast.error("Credenciais inválidas. Utilize o e-mail e senha especiais de administrador.");
    }
  };

  const handleGoogleAdminLogin = async () => {
    try {
      const googleUser = await signInWithGoogle();
      if (googleUser) {
        loginSpecialAdmin();
        toast.success(`Autenticado com Google (${googleUser.email})! Nuvem Firestore ativada.`);
        void handleSyncCloudNow();
      }
    } catch (err: any) {
      toast.error("Erro ao autenticar com Google: " + (err.message || String(err)));
    }
  };

  const handleSyncCloudNow = async () => {
    setSyncingCloud(true);
    try {
      if (!auth.currentUser) {
        await signInWithGoogle();
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

      void queryClient.invalidateQueries({ queryKey: ["news"] });
      void queryClient.invalidateQueries({ queryKey: ["news-feed"] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });

      toast.success(
        `Nuvem sincronizada com sucesso! ${res.newsCount} notícias, ${res.booksCount} livros e ${res.animesCount} animes já estão refletindo para todos os usuários em tempo real.`
      );
    } catch (err: any) {
      toast.error("Erro ao sincronizar na nuvem: " + (err.message || String(err)));
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
    toast.success("Publicação melhorada e estruturada com sucesso! Clique em Salvar para publicar.");
  };

  const handleQuickImproveAndSave = (item: NewsItem) => {
    const improved = improveNewsPublication({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      category: item.category,
    });
    const saved = saveNewsPublication({
      ...item,
      title: improved.title,
      excerpt: improved.excerpt,
      content: improved.content,
    });
    void queryClient.invalidateQueries({ queryKey: ["news"] });
    void queryClient.invalidateQueries({ queryKey: ["news-feed"] });
    selectArticleForEditing(saved);
    toast.success(`"${saved.title.slice(0, 45)}..." foi melhorada e atualizada no site!`);
  };

  const handleSaveNewsArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNewsTitle.trim() || !editNewsContent.trim()) {
      toast.error("Preencha o título e o conteúdo da publicação.");
      return;
    }
    const saved = saveNewsPublication({
      id: isCreatingNewArticle ? undefined : selectedNewsId || undefined,
      slug: editNewsSlug.trim() || slugifyEditorial(editNewsTitle),
      title: editNewsTitle,
      excerpt: editNewsExcerpt,
      content: editNewsContent,
      cover_url: editNewsCover || getSmartNewsCover(editNewsTitle, editNewsCategory),
      category: editNewsCategory,
      author: editNewsAuthor,
      isNew: isCreatingNewArticle,
    });

    void queryClient.invalidateQueries({ queryKey: ["news"] });
    void queryClient.invalidateQueries({ queryKey: ["news-feed"] });
    setIsCreatingNewArticle(false);
    setSelectedNewsId(saved.id);
    setEditNewsSlug(saved.slug);
    toast.success(
      isCreatingNewArticle
        ? "Nova publicação criada e disponível imediatamente no site!"
        : "Publicação atualizada com sucesso em todo o site!"
    );
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

  const handlePublishDiverseItem = (item: NewsItem) => {
    const saved = saveNewsPublication({
      ...item,
      isNew: true,
    });
    void queryClient.invalidateQueries({ queryKey: ["news"] });
    void queryClient.invalidateQueries({ queryKey: ["news-feed"] });
    toast.success(`Publicado com sucesso: "${saved.title.slice(0, 50)}..."`);
  };

  const handlePublishAllDiverse = () => {
    for (const item of diverseItems) {
      saveNewsPublication({
        ...item,
        isNew: true,
      });
    }
    void queryClient.invalidateQueries({ queryKey: ["news"] });
    void queryClient.invalidateQueries({ queryKey: ["news-feed"] });
    toast.success(`${diverseItems.length} publicações diversas adicionadas ao site!`);
  };

  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
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
        setEditBookTitle(extracted.suggestedTitle || file.name.replace(/\.pdf$/i, ""));
      }
      if (extracted.suggestedAuthor && (!editBookAuthor.trim() || editBookAuthor === "Miguel Worscoi")) {
        setEditBookAuthor(extracted.suggestedAuthor);
      }
      if (extracted.coverDataUrl) {
        setEditBookCover(extracted.coverDataUrl);
      }
      if (extracted.suggestedDescription && (!editBookDescription.trim() || isCreatingNewBook)) {
        setEditBookDescription(extracted.suggestedDescription);
      }

      toast.success(
        `PDF "${file.name}" carregado! ${extracted.pagesCount} páginas e ${extracted.extractedChapters.length} partes extraídas automaticamente.`
      );
    } catch (err: any) {
      console.error("Erro ao processar PDF:", err);
      toast.error("Não foi possível ler o PDF. Verifique se o arquivo não está protegido por senha.");
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
        toast.success("Capa personalizada carregada do dispositivo!");
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
    let editionNotes = "Edição digital em PDF publicada pela curadoria editorial da Wotho.";

    if (uploadedPdfData) {
      const generatedId = isCreatingNewBook
        ? `book-editorial-${slugifyEditorial(editBookTitle)}-${Date.now().toString().slice(-4)}`
        : selectedBookId || "";
      const idbUri = await savePdfBytesToIndexedDB(generatedId, uploadedPdfData.arrayBuffer);
      pdfUrlToUse = uploadedPdfData.inlineDataUrl || idbUri || editBookPdfUrl.trim();
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

    // If a PDF file was uploaded from device or external PDF URL was provided, register it locally
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
        coverUrl: saved.cover_url || (uploadedPdfData ? uploadedPdfData.coverDataUrl : "/placeholder.svg"),
        category: saved.category,
        description: saved.description,
      });

      // Also save all extracted chapters so the book is readable in both PDF and Text mode across all devices
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
        ? `Livro em PDF "${saved.title}" publicado com ${uploadedPdfData.pagesCount} páginas e capítulos sincronizados!`
        : "Obra literária salva e atualizada no catálogo!"
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
    void queryClient.invalidateQueries({ queryKey: ["chapters", selectedBookId] });
    setChapterTitle("");
    setChapterContent("");
    setChapterPosition(String((parseInt(chapterPosition) || 1) + 1));
    toast.success("Capítulo adicionado à obra com sucesso!");
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
    toast.success("Dados do anime atualizados com sucesso!");
  };

  // Word & paragraph counters for active article editor
  const editorStats = useMemo(() => {
    const words = editNewsContent.trim() ? editNewsContent.trim().split(/\s+/).length : 0;
    const paragraphs = editNewsContent
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean).length;
    const readMinutes = Math.max(1, Math.round(words / 180));
    return { words, paragraphs, readMinutes };
  }, [editNewsContent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="dark" />
        <p className="pt-40 text-center text-sm text-muted-foreground font-light">
          Carregando Studio Editorial...
        </p>
      </div>
    );
  }

  // If not logged in as Admin, show direct Master Login Gate
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Navigation variant="dark" />
        <div className="pt-36 pb-24 px-6 flex items-center justify-center">
          <Card className="w-full max-w-md p-8 border border-border bg-card shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-primary font-semibold block">
                  Acesso Exclusivo
                </span>
                <h1 className="text-xl font-light text-foreground tracking-tight">
                  Studio Editorial & Análise
                </h1>
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-light leading-relaxed mb-6">
              Entre com sua conta Google de administrador ou com as credenciais especiais de Editor-Chefe para publicar livros, notícias e capítulos com sincronização em nuvem para todos os usuários.
            </p>

            <Button
              type="button"
              onClick={handleGoogleAdminLogin}
              variant="outline"
              className="w-full mb-4 rounded-full text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 border-primary/40 hover:bg-primary/5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              Entrar com Google (Nuvem Firestore)
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-card px-2 text-muted-foreground">Ou senha mestra</span>
              </div>
            </div>

            <form onSubmit={handleDirectAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  E-mail Administrativo
                </Label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="miguelworscoi@gmail.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Senha Mestra
                </Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-full text-[11px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Acessar Painel Editorial
              </Button>
            </form>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="dark" />

      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Top Executive Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-8 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] uppercase tracking-widest font-semibold">
                  Editor-Chefe Mestre
                </span>
                <span className="text-xs text-muted-foreground font-light">
                  {user.email}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-wider font-medium border border-emerald-500/20">
                  Nuvem Firestore Ativa
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-light tracking-tight text-foreground">
                Studio Editorial, Análise & Curadoria de Conteúdos
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-light mt-1">
                Monitore o acervo, publique artigos, livros e animes que refletem imediatamente para todos os usuários em tempo real na nuvem.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={handleSyncCloudNow}
                disabled={syncingCloud}
                variant="outline"
                size="sm"
                className="rounded-full text-[11px] uppercase tracking-wider border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncingCloud ? "animate-spin" : ""}`} />
                {syncingCloud ? "Sincronizando..." : "Sincronizar Nuvem"}
              </Button>
              <Button
                onClick={() => startNewArticle("Esporte")}
                size="sm"
                className="rounded-full text-[11px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nova Publicação
              </Button>
              <Button
                onClick={() => {
                  startNewBook();
                  setActiveTab("books");
                }}
                variant="outline"
                size="sm"
                className="rounded-full text-[11px] uppercase tracking-wider border-primary/40 text-primary hover:bg-primary/10"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Publicar Livro PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("discover")}
                className="rounded-full text-[11px] uppercase tracking-wider"
              >
                <Compass className="h-3.5 w-3.5 mr-1.5" />
                Conseguir Publicações
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void signOut()}
                className="rounded-full text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sair
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-secondary/80 p-1 rounded-xl flex flex-wrap h-auto gap-1">
              <TabsTrigger value="overview" className="text-xs font-normal py-2 px-4 rounded-lg">
                <BarChart3 className="h-3.5 w-3.5 mr-2" />
                Análise de Conteúdos
              </TabsTrigger>
              <TabsTrigger value="news" className="text-xs font-normal py-2 px-4 rounded-lg">
                <Edit3 className="h-3.5 w-3.5 mr-2" />
                Editar & Melhorar Notícias ({analytics.totalNews})
              </TabsTrigger>
              <TabsTrigger value="discover" className="text-xs font-normal py-2 px-4 rounded-lg">
                <Compass className="h-3.5 w-3.5 mr-2" />
                Conseguir Publicações Diversas
              </TabsTrigger>
              <TabsTrigger value="books" className="text-xs font-normal py-2 px-4 rounded-lg">
                <BookOpen className="h-3.5 w-3.5 mr-2" />
                Editar Livros & Capítulos ({analytics.totalBooks})
              </TabsTrigger>
              <TabsTrigger value="animes" className="text-xs font-normal py-2 px-4 rounded-lg">
                <Film className="h-3.5 w-3.5 mr-2" />
                Animes & Mangás ({analytics.totalAnimes})
              </TabsTrigger>
            </TabsList>

            {/* ================================================================
                TAB 1: VISÃO GERAL & ANÁLISE DE CONTEÚDOS
               ================================================================ */}
            <TabsContent value="overview" className="space-y-8">
              {/* Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 border border-border bg-card shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Notícias & Reportagens
                    </span>
                    <Newspaper className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-light text-foreground">
                    {loadingNews ? "..." : analytics.totalNews}
                  </div>
                  <p className="text-xs text-muted-foreground font-light mt-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <span>{analytics.deepArticlesCount} matérias de alta profundidade</span>
                  </p>
                </Card>

                <Card className="p-6 border border-border bg-card shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Livros & Acervo PDF
                    </span>
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-light text-foreground">
                    {loadingBooks ? "..." : analytics.totalBooks}
                  </div>
                  <p className="text-xs text-muted-foreground font-light mt-2 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>Obras integrais, científicas e bestsellers</span>
                  </p>
                </Card>

                <Card className="p-6 border border-border bg-card shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Animes, Mangás & Webtoons
                    </span>
                    <Film className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-light text-foreground">
                    {analytics.totalAnimes + analytics.totalWebtoons}
                  </div>
                  <p className="text-xs text-muted-foreground font-light mt-2">
                    {analytics.totalAnimes} Animes ({analytics.totalEpisodes} episódios) · {analytics.totalWebtoons} Webtoons
                  </p>
                </Card>

                <Card className="p-6 border border-border bg-card shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Índice de Saúde Editorial
                    </span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-light text-foreground">
                    {analytics.qualityScore}%
                  </div>
                  <p className="text-xs text-muted-foreground font-light mt-2">
                    Capas verificadas, subtítulos e texto integral
                  </p>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Category Distribution */}
                <Card className="p-6 border border-border bg-card shadow-soft lg:col-span-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-primary font-semibold block">
                        Distribuição Editorial
                      </span>
                      <h2 className="text-lg font-light text-foreground">
                        Publicações por Categoria
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-3.5 mt-4">
                    {analytics.categoriesSorted.map(([cat, count]) => {
                      const pct =
                        analytics.totalNews > 0
                          ? Math.max(4, Math.round((count / analytics.totalNews) * 100))
                          : 0;
                      return (
                        <div key={cat} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setNewsCategoryFilter(cat);
                                setActiveTab("news");
                              }}
                              className="font-medium text-foreground hover:text-primary transition-colors text-left"
                            >
                              {cat}
                            </button>
                            <span className="text-muted-foreground font-light">
                              {count} matérias ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-5 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("discover")}
                      className="w-full rounded-lg text-xs font-normal"
                    >
                      <Compass className="h-3.5 w-3.5 mr-2 text-primary" />
                      Importar Mais Publicações por Tema
                    </Button>
                  </div>
                </Card>

                {/* Publications Ready for 1-Click Improvement */}
                <Card className="p-6 border border-border bg-card shadow-soft lg:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-primary font-semibold block">
                        Otimizador de Qualidade Worscoi
                      </span>
                      <h2 className="text-lg font-light text-foreground">
                        Publicações do Site Prontas para Aprimoramento Editorial
                      </h2>
                      <p className="text-xs text-muted-foreground font-light">
                        Clique em <strong>"Melhorar em 1 Clique"</strong> para expandir parágrafos, adicionar subtítulos e citações automaticamente, ou abra no editor completo.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                    {analytics.needsImprovementList.map((item) => {
                      const charLen = (item.content || "").length;
                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] uppercase tracking-wider font-medium">
                                {item.category}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-light">
                                {charLen} caracteres
                              </span>
                            </div>
                            <h3 className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </h3>
                            <p className="text-xs text-muted-foreground font-light line-clamp-1">
                              {item.excerpt}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                selectArticleForEditing(item);
                                setActiveTab("news");
                              }}
                              className="h-8 text-xs font-normal"
                            >
                              <Edit3 className="h-3 w-3 mr-1.5" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleQuickImproveAndSave(item)}
                              className="h-8 text-xs font-normal bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <Wand2 className="h-3 w-3 mr-1.5" />
                              Melhorar em 1 Clique
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {analytics.needsImprovementList.length === 0 && (
                      <div className="py-12 text-center text-xs text-muted-foreground font-light">
                        Todas as publicações recentes já estão com estrutura editorial completa!
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* ================================================================
                TAB 2: EDITAR & MELHORAR PUBLICAÇÕES (NOTÍCIAS)
               ================================================================ */}
            <TabsContent value="news">
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Searchable List of All Existing Publications */}
                <Card className="lg:col-span-4 p-5 border border-border bg-card shadow-soft space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-primary font-semibold block">
                        Acervo de Notícias
                      </span>
                      <h2 className="text-base font-medium text-foreground">
                        Publicações no Site ({filteredNewsList.length})
                      </h2>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => startNewArticle("Esporte")}
                      className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Nova
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={newsSearch}
                        onChange={(e) => setNewsSearch(e.target.value)}
                        placeholder="Buscar por título, clube, tema..."
                        className="pl-9 text-xs h-9"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setNewsCategoryFilter("all")}
                        className={`px-2.5 py-1 rounded-md text-[11px] shrink-0 transition-colors ${
                          newsCategoryFilter === "all"
                            ? "bg-primary text-primary-foreground font-medium"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Todas
                      </button>
                      {NEWS_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewsCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-md text-[11px] shrink-0 transition-colors ${
                            newsCategoryFilter.toLowerCase() === cat.toLowerCase()
                              ? "bg-primary text-primary-foreground font-medium"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                    {filteredNewsList.map((item) => {
                      const isSelected = !isCreatingNewArticle && selectedNewsId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectArticleForEditing(item)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/70 bg-background hover:bg-secondary/50"
                          }`}
                        >
                          <img
                            src={
                              (item.cover_url || getSmartNewsCover(item.title, item.category)).replace(
                                /&amp;/g,
                                "&"
                              )
                            }
                            alt=""
                            onError={(e) => {
                              e.currentTarget.src = getSmartNewsCover(item.title, item.category);
                            }}
                            className="w-14 h-14 rounded-lg object-cover shrink-0 bg-secondary"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                                {item.category}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-light">
                                {Math.round((item.content || "").length / 6)} pal.
                              </span>
                            </div>
                            <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                              {item.title}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Right Column: Full Publication Editor & Enhancer */}
                <Card className="lg:col-span-8 p-6 sm:p-8 border border-border bg-card shadow-soft">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-border">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-primary font-semibold block">
                        {isCreatingNewArticle ? "Modo de Criação" : "Modo de Edição & Melhoria"}
                      </span>
                      <h2 className="text-xl font-light text-foreground">
                        {isCreatingNewArticle
                          ? "Criar Nova Publicação Editorial"
                          : "Editar e Melhorar Publicação do Site"}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        onClick={handleImproveCurrentArticle}
                        className="rounded-full text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                        Melhorar Texto & Estrutura
                      </Button>

                      {!isCreatingNewArticle && editNewsSlug && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs"
                        >
                          <Link to={`/noticias/${editNewsSlug}`} target="_blank">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Ver no Site
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  {lastImprovements.length > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-secondary/70 border border-border text-xs space-y-1">
                      <div className="font-medium text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Melhorias aplicadas pelo Otimizador Editorial:
                      </div>
                      <ul className="list-disc list-inside text-muted-foreground font-light space-y-0.5">
                        {lastImprovements.map((imp, idx) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <form onSubmit={handleSaveNewsArticle} className="space-y-5">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Título da Publicação
                        </Label>
                        <Input
                          value={editNewsTitle}
                          onChange={(e) => {
                            setEditNewsTitle(e.target.value);
                            if (isCreatingNewArticle) {
                              setEditNewsSlug(slugifyEditorial(e.target.value));
                            }
                          }}
                          placeholder="Ex: Real Madrid e Manchester City protagonizam duelo tático histórico na Champions"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Categoria / Editoria
                        </Label>
                        <select
                          value={editNewsCategory}
                          onChange={(e) => setEditNewsCategory(e.target.value)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
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
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Slug / URL Amigável
                        </Label>
                        <Input
                          value={editNewsSlug}
                          onChange={(e) => setEditNewsSlug(e.target.value)}
                          placeholder="slug-da-noticia"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Autor / Fonte Editorial
                        </Label>
                        <Input
                          value={editNewsAuthor}
                          onChange={(e) => setEditNewsAuthor(e.target.value)}
                          placeholder="Miguel Worscoi (Editor-Chefe)"
                        />
                      </div>
                    </div>

                    {/* Cover Image Upload (Device File / Drag & Drop or Custom URL) */}
                    <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-secondary/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
                        <div>
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-primary" />
                            Capa da Notícia
                          </Label>
                          <span className="text-[11px] text-muted-foreground font-light">
                            Faça upload de uma foto do seu dispositivo ou informe uma URL externa. A imagem será sincronizada na nuvem para todos os leitores.
                          </span>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border shrink-0 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setNewsCoverInputMode("upload")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                              newsCoverInputMode === "upload"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Upload className="h-3 w-3" />
                            Upload do Dispositivo
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewsCoverInputMode("url")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                              newsCoverInputMode === "url"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Link / URL
                          </button>
                        </div>
                      </div>

                      {/* Hidden File Input */}
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

                      {/* Mode A: Upload from Device */}
                      {newsCoverInputMode === "upload" && (
                        <div className="space-y-3">
                          {/* Drag & Drop Zone */}
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
                            className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                              isDraggingNewsCover
                                ? "border-primary bg-primary/10 scale-[1.005]"
                                : "border-border hover:border-primary/50 hover:bg-secondary/40"
                            }`}
                          >
                            {isUploadingNewsCover ? (
                              <div className="flex flex-col items-center justify-center gap-2 py-4">
                                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                                <div className="text-xs font-medium text-foreground">
                                  Otimizando imagem para alta resolução (WebP)...
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  Ajustando proporção e reduzindo peso para carregamento instantâneo.
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                                  <Upload className="h-5 w-5" />
                                </div>
                                <div className="text-xs font-medium text-foreground">
                                  Clique para escolher uma imagem ou arraste o arquivo até aqui
                                </div>
                                <div className="text-[11px] text-muted-foreground max-w-md">
                                  Aceita PNG, JPEG, WEBP ou AVIF até 20MB. A foto é convertida automaticamente em alta definição (1280x720) para rápida exibição.
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Live Preview & Metadata Details */}
                          {editNewsCover ? (
                            <div className="p-3.5 rounded-xl border border-border bg-background space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-foreground flex items-center gap-1.5">
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  Capa Atual Selecionada
                                </span>
                                <div className="flex items-center gap-2">
                                  {newsCoverMeta?.sizeBytes && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-mono">
                                      {newsCoverMeta.width && `${newsCoverMeta.width}x${newsCoverMeta.height} · `}
                                      {formatBytes(newsCoverMeta.sizeBytes)}
                                      {newsCoverMeta.format && ` · ${newsCoverMeta.format.toUpperCase()}`}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditNewsCover("");
                                      setNewsCoverMeta(null);
                                      if (newsFileInputRef.current) newsFileInputRef.current.value = "";
                                    }}
                                    className="text-[11px] text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                    Remover
                                  </button>
                                </div>
                              </div>

                              <div className="relative rounded-lg overflow-hidden border border-border bg-black/40 h-44 sm:h-56 group">
                                <img
                                  src={editNewsCover}
                                  alt="Preview da capa da notícia"
                                  className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-102"
                                  onError={(e) => {
                                    e.currentTarget.src = getSmartNewsCover(editNewsTitle, editNewsCategory);
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white">
                                  <span className="truncate max-w-[70%] font-medium drop-shadow-sm">
                                    {newsCoverMeta?.fileName || editNewsTitle || "Pré-visualização da Capa"}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] uppercase font-semibold">
                                    {editNewsCover.startsWith("data:") ? "Upload Local" : "URL Externa"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => newsFileInputRef.current?.click()}
                                  className="h-7 text-xs font-normal"
                                >
                                  <Upload className="h-3 w-3 mr-1.5" />
                                  Substituir por Outra Foto
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const smart = getSmartNewsCover(editNewsTitle || editNewsCategory, editNewsCategory);
                                    setEditNewsCover(smart);
                                    setNewsCoverMeta(null);
                                  }}
                                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  Usar Capa Temática de Acervo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                              <span>Nenhuma imagem própria carregada no momento.</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const smart = getSmartNewsCover(editNewsTitle || editNewsCategory, editNewsCategory);
                                  setEditNewsCover(smart);
                                  setNewsCoverMeta(null);
                                }}
                                className="text-[11px] text-primary hover:underline flex items-center gap-1"
                              >
                                <Sparkles className="h-3 w-3" />
                                Sugerir Capa Temática HD
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mode B: Manual URL Input */}
                      {newsCoverInputMode === "url" && (
                        <div className="space-y-3">
                          <div className="flex gap-2 items-center">
                            <Input
                              value={editNewsCover}
                              onChange={(e) => {
                                setEditNewsCover(e.target.value);
                                setNewsCoverMeta(null);
                              }}
                              placeholder="https://images.unsplash.com/... ou https://..."
                              className="flex-1 text-xs"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const smart = getSmartNewsCover(editNewsTitle || editNewsCategory, editNewsCategory);
                                setEditNewsCover(smart);
                                setNewsCoverMeta(null);
                              }}
                              className="h-9 text-xs shrink-0"
                            >
                              <Sparkles className="h-3 w-3 mr-1 text-primary" />
                              Sugerir Temática
                            </Button>
                          </div>

                          {editNewsCover && (
                            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background">
                              <img
                                src={editNewsCover}
                                alt="Preview da capa"
                                onError={(e) => {
                                  e.currentTarget.src = getSmartNewsCover(editNewsTitle, editNewsCategory);
                                }}
                                className="h-16 w-28 rounded-md object-cover border border-border shrink-0 bg-secondary"
                              />
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="text-xs font-medium text-foreground truncate">
                                  Preview da Imagem Externa
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate font-mono">
                                  {editNewsCover}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditNewsCover("")}
                                className="h-8 text-xs text-muted-foreground hover:text-red-500"
                              >
                                Limpar
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Excerpt / Resumo Editorial */}
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Resumo Editorial (Lead / Subtítulo)
                      </Label>
                      <Textarea
                        rows={2}
                        value={editNewsExcerpt}
                        onChange={(e) => setEditNewsExcerpt(e.target.value)}
                        placeholder="Síntese de impacto exibida nos cards e na abertura da matéria..."
                      />
                    </div>

                    {/* Main Body Content + Quick Formatting Toolbar */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Corpo Completo da Publicação
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setEditNewsContent((prev) => `${prev.trim()}\n\n### Novo Subtítulo Editorial\n\n`)
                            }
                            className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-[11px] text-foreground transition-colors"
                          >
                            + Subtítulo (H3)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditNewsContent(
                                (prev) => `${prev.trim()}\n\n> "Citação ou análise em destaque na reportagem."\n\n`
                              )
                            }
                            className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-[11px] text-foreground transition-colors"
                          >
                            + Citação
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditNewsContent(
                                (prev) =>
                                  `${prev.trim()}\n\n• Primeiro ponto-chave de destaque\n• Segundo desdobramento confirmado\n• Terceiro indicador analisado\n\n`
                              )
                            }
                            className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-[11px] text-foreground transition-colors"
                          >
                            + Lista de Tópicos
                          </button>
                        </div>
                      </div>

                      <Textarea
                        rows={14}
                        value={editNewsContent}
                        onChange={(e) => setEditNewsContent(e.target.value)}
                        placeholder="Escreva ou edite os parágrafos completos da matéria..."
                        className="font-light leading-relaxed text-sm"
                        required
                      />

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground font-light pt-1">
                        <span>
                          {editorStats.words} palavras · {editorStats.paragraphs} blocos/parágrafos · ~{editorStats.readMinutes} min de leitura
                        </span>
                        <span>
                          Dica: Use <code>### Título</code> para seções e <code>&gt; Frase</code> para citações.
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                      {!isCreatingNewArticle ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleDeleteCurrentNews}
                          className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Excluir Publicação
                        </Button>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleImproveCurrentArticle}
                          className="rounded-full text-xs"
                        >
                          <Wand2 className="h-3.5 w-3.5 mr-1.5 text-primary" />
                          Melhorar Antes de Salvar
                        </Button>
                        <Button
                          type="submit"
                          className="rounded-full text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 px-6"
                        >
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                          {isCreatingNewArticle ? "Publicar no Site" : "Salvar Alterações no Site"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Card>
              </div>
            </TabsContent>

            {/* ================================================================
                TAB 3: CONSEGUIR PUBLICAÇÕES DIVERSAS (HUB DE DESCOBERTA & IMPORTAÇÃO)
               ================================================================ */}
            <TabsContent value="discover" className="space-y-6">
              <Card className="p-6 sm:p-8 border border-border bg-card shadow-soft">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-border">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-primary font-semibold block">
                      Aquisição & Sindicação Editorial
                    </span>
                    <h2 className="text-xl sm:text-2xl font-light text-foreground">
                      Conseguir Publicações Diversas para o Site
                    </h2>
                    <p className="text-xs text-muted-foreground font-light mt-1">
                      Escolha uma editoria abaixo para buscar e gerar reportagens completas de alta qualidade. Você pode publicar imediatamente em 1 clique ou abrir no editor para personalizar.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingDiverse}
                      onClick={() => void handleFetchDiverse(selectedDiverseTopic)}
                      className="rounded-full text-xs"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingDiverse ? "animate-spin" : ""}`} />
                      Atualizar Lote
                    </Button>
                    {diverseItems.length > 0 && (
                      <Button
                        size="sm"
                        onClick={handlePublishAllDiverse}
                        className="rounded-full text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Publicar Todas ({diverseItems.length})
                      </Button>
                    )}
                  </div>
                </div>

                {/* Topic Selector Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                  {DIVERSE_PUBLICATION_TOPICS.map((topic) => {
                    const active = selectedDiverseTopic === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => void handleFetchDiverse(topic.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          active
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-background hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                            {topic.category}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-foreground mb-1">
                          {topic.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-light line-clamp-2">
                          {topic.description}
                        </p>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => void handleFetchDiverse("all")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedDiverseTopic === "all"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:bg-secondary/50"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary block mb-1">
                      Multi-Editoria
                    </span>
                    <p className="text-xs font-medium text-foreground mb-1">
                      Pacote Completo Diversificado
                    </p>
                    <p className="text-[11px] text-muted-foreground font-light line-clamp-2">
                      Combina Futebol Europeu, Ciência, Tecnologia, Animes, Literatura e Economia.
                    </p>
                  </button>
                </div>

                {/* Discovered / Generated Publications List */}
                {loadingDiverse ? (
                  <div className="py-16 text-center text-xs text-muted-foreground font-light">
                    Buscando e estruturando publicações diversas em alta definição...
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-5">
                    {diverseItems.map((item) => (
                      <div
                        key={item.slug}
                        className="rounded-xl border border-border bg-background overflow-hidden flex flex-col justify-between shadow-soft"
                      >
                        <div>
                          <div className="aspect-[16/9] bg-secondary relative overflow-hidden">
                            <img
                              src={item.cover_url || getSmartNewsCover(item.title, item.category)}
                              alt={item.title}
                              onError={(e) => {
                                e.currentTarget.src = getSmartNewsCover(item.title, item.category);
                              }}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur text-white text-[10px] uppercase tracking-wider font-semibold">
                              {item.category}
                            </span>
                          </div>

                          <div className="p-5 space-y-2.5">
                            <h3 className="text-base font-medium text-foreground leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-xs text-muted-foreground font-light line-clamp-3 leading-relaxed">
                              {item.excerpt}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-muted-foreground font-light">
                            {Math.round((item.content || "").length / 6)} palavras · Texto completo
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                selectArticleForEditing(item);
                                setIsCreatingNewArticle(true);
                                setActiveTab("news");
                              }}
                              className="h-8 text-xs font-normal"
                            >
                              <Edit3 className="h-3 w-3 mr-1.5" />
                              Personalizar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handlePublishDiverseItem(item)}
                              className="h-8 text-xs font-normal bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Publicar Agora
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ================================================================
                TAB 4: EDITAR LIVROS & CAPÍTULOS DO SITE
               ================================================================ */}
            <TabsContent value="books">
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Books List */}
                <Card className="lg:col-span-4 p-5 border border-border bg-card shadow-soft space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-primary font-semibold block">
                        Biblioteca Digital
                      </span>
                      <h2 className="text-base font-medium text-foreground">
                        Obras no Site ({filteredBooksList.length})
                      </h2>
                    </div>
                    <Button
                      size="sm"
                      onClick={startNewBook}
                      className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Novo Livro
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      placeholder="Buscar livro por título, autor..."
                      className="pl-9 text-xs h-9"
                    />
                  </div>

                  <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                    {filteredBooksList.map((b) => {
                      const isSelected = !isCreatingNewBook && selectedBookId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => selectBookForEditing(b)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/70 bg-background hover:bg-secondary/50"
                          }`}
                        >
                          <img
                            src={b.cover_url || "/placeholder.svg"}
                            alt={b.title}
                            className="w-11 h-16 rounded object-cover shrink-0 bg-secondary"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase tracking-wider text-primary font-semibold block truncate">
                              {b.category}
                            </span>
                            <p className="text-xs font-medium text-foreground line-clamp-1">
                              {b.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-light truncate">
                              {b.author}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Book Editor + Chapter Publisher */}
                <div className="lg:col-span-8 space-y-6">
                  <Card className="p-6 sm:p-8 border border-border bg-card shadow-soft">
                    <div className="flex items-center justify-between pb-5 mb-6 border-b border-border">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-primary font-semibold block">
                          Curadoria Literária
                        </span>
                        <h2 className="text-xl font-light text-foreground">
                          {isCreatingNewBook ? "Publicar Nova Obra no Catálogo" : "Editar Obra Literária"}
                        </h2>
                      </div>
                      {!isCreatingNewBook && selectedBookId && (
                        <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
                          <Link to={`/livro/${selectedBookId}`} target="_blank">
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Ver Livro no Site
                          </Link>
                        </Button>
                      )}
                    </div>

                    {/* Direct PDF Book Upload Box from Admin Device */}
                    <div className="mb-6 p-5 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-widest text-primary font-semibold flex items-center gap-1.5">
                            <Upload className="h-3.5 w-3.5" />
                            Upload Direto do Dispositivo (PDF Completo)
                          </span>
                          <h3 className="text-sm font-medium text-foreground">
                            Enviar Arquivo de Livro em PDF do seu Computador ou Celular
                          </h3>
                          <p className="text-xs text-muted-foreground font-light">
                            O sistema extrai automaticamente o título, gera a capa em alta definição a partir da 1ª página, organiza os capítulos e disponibiliza o PDF completo para leitura e download no site.
                          </p>
                        </div>

                        <label className="cursor-pointer shrink-0 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 text-xs uppercase tracking-wider font-medium transition-colors shadow-sm">
                          <Upload className="h-3.5 w-3.5 mr-2" />
                          {isProcessingPdf ? "Processando PDF..." : "Escolher Arquivo .PDF"}
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
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center justify-between text-xs text-primary font-medium">
                            <span>{pdfProgressStep}</span>
                            <span>{pdfProgressPct}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${pdfProgressPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {uploadedPdfData && !isProcessingPdf && (
                        <div className="p-3.5 rounded-xl bg-background/90 border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {uploadedPdfData.coverDataUrl && (
                              <img
                                src={uploadedPdfData.coverDataUrl}
                                alt="Capa gerada do PDF"
                                className="w-12 h-16 object-cover rounded border border-border shrink-0"
                              />
                            )}
                            <div>
                              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Arquivo PDF pronto para publicar: {uploadedPdfFileName}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-light mt-0.5">
                                {uploadedPdfData.pagesCount} páginas · {uploadedPdfData.fileSizeFormatted} · {uploadedPdfData.extractedChapters.length} partes/capítulos extraídos automaticamente
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                            Capa + Texto + PDF Integral
                          </span>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSaveBook} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Título da Obra
                          </Label>
                          <Input
                            value={editBookTitle}
                            onChange={(e) => setEditBookTitle(e.target.value)}
                            placeholder="Ex: Meditações, Hábitos Atômicos..."
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Autor(a)
                          </Label>
                          <Input
                            value={editBookAuthor}
                            onChange={(e) => setEditBookAuthor(e.target.value)}
                            placeholder="Nome do autor ou autora"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Categoria / Gênero
                          </Label>
                          <Input
                            value={editBookCategory}
                            onChange={(e) => setEditBookCategory(e.target.value)}
                            placeholder="Ex: Filosofia, Romance, Finanças, Ciência..."
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                              Capa do Livro (URL ou Upload)
                            </Label>
                            <label className="cursor-pointer text-[10px] uppercase tracking-wider text-primary hover:underline font-medium flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              Enviar Imagem
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverFileSelect}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <Input
                            value={editBookCover}
                            onChange={(e) => setEditBookCover(e.target.value)}
                            placeholder="Gerada automaticamente do PDF ou cole uma URL..."
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Link Direto de PDF Externo (Opcional — caso não envie arquivo do dispositivo)
                        </Label>
                        <Input
                          value={editBookPdfUrl}
                          onChange={(e) => setEditBookPdfUrl(e.target.value)}
                          placeholder="https://exemplo.com/arquivo-do-livro.pdf (opcional)"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Sinopse & Apresentação Editorial
                        </Label>
                        <Textarea
                          rows={5}
                          value={editBookDescription}
                          onChange={(e) => setEditBookDescription(e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        {!isCreatingNewBook && selectedBookId ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              deleteBookPublication(selectedBookId);
                              deleteCustomUploadedPdfEntry(selectedBookId);
                              void queryClient.invalidateQueries({ queryKey: ["books"] });
                              toast.success("Obra ocultada do catálogo.");
                              startNewBook();
                            }}
                            className="text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Remover Obra
                          </Button>
                        ) : (
                          <div />
                        )}
                        <Button
                          type="submit"
                          disabled={isProcessingPdf}
                          className="rounded-full text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 px-6"
                        >
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                          {uploadedPdfData
                            ? "Publicar Livro PDF no Site Agora"
                            : "Salvar Obra no Catálogo"}
                        </Button>
                      </div>
                    </form>
                  </Card>

                  {/* Add Chapter to Selected Book */}
                  {selectedBookId && (
                    <Card className="p-6 sm:p-8 border border-border bg-card shadow-soft">
                      <h3 className="text-base font-medium text-foreground mb-1 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Adicionar / Atualizar Capítulo em "{editBookTitle}"
                      </h3>
                      <p className="text-xs text-muted-foreground font-light mb-5">
                        Insira capítulos completos para leitura direta no leitor Worscoi.
                      </p>

                      <form onSubmit={handleAddChapterToBook} className="space-y-4">
                        <div className="grid sm:grid-cols-4 gap-4">
                          <div className="sm:col-span-3 space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                              Título do Capítulo
                            </Label>
                            <Input
                              value={chapterTitle}
                              onChange={(e) => setChapterTitle(e.target.value)}
                              placeholder="Capítulo 1: O Princípio Fundamental"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                              Posição / Nº
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              value={chapterPosition}
                              onChange={(e) => setChapterPosition(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Texto Integral do Capítulo
                          </Label>
                          <Textarea
                            rows={8}
                            value={chapterContent}
                            onChange={(e) => setChapterContent(e.target.value)}
                            placeholder="Escreva ou cole o texto integral do capítulo..."
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          className="rounded-full text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Publicar Capítulo
                        </Button>
                      </form>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ================================================================
                TAB 5: EDITAR ANIMES & MANGÁS
               ================================================================ */}
            <TabsContent value="animes">
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                <Card className="lg:col-span-4 p-5 border border-border bg-card shadow-soft space-y-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-primary font-semibold block">
                      Catálogo de Animes & Mangás
                    </span>
                    <h2 className="text-base font-medium text-foreground">
                      Franquias Ativas ({filteredAnimesList.length})
                    </h2>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={animeSearch}
                      onChange={(e) => setAnimeSearch(e.target.value)}
                      placeholder="Buscar anime (ex: Steel Ball Run, One Piece)..."
                      className="pl-9 text-xs h-9"
                    />
                  </div>

                  <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                    {filteredAnimesList.map((anime) => {
                      const active = selectedAnimeId === anime.id;
                      const patch = animeOverridesMap[anime.id] || {};
                      return (
                        <button
                          key={anime.id}
                          type="button"
                          onClick={() => setSelectedAnimeId(anime.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                            active
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/70 bg-background hover:bg-secondary/50"
                          }`}
                        >
                          <img
                            src={patch.cover || anime.cover}
                            alt={anime.title}
                            className="w-11 h-16 rounded object-cover shrink-0 bg-secondary"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase tracking-wider text-primary font-semibold block">
                              {anime.seasons.length} temp. · {anime.episodesCount} ep.
                            </span>
                            <p className="text-xs font-medium text-foreground line-clamp-1">
                              {patch.title || anime.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-light truncate">
                              {anime.studio} · Mangá: {anime.manga.chaptersCount} caps
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card className="lg:col-span-8 p-6 sm:p-8 border border-border bg-card shadow-soft">
                  <div className="flex items-center justify-between pb-5 mb-6 border-b border-border">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-primary font-semibold block">
                        Curadoria de Anime & Mangá
                      </span>
                      <h2 className="text-xl font-light text-foreground">
                        Editar Metadados, Sinopse & Mídia do Anime
                      </h2>
                    </div>
                    <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
                      <Link to={`/animes/${selectedAnimeId}`} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Abrir Página do Anime
                      </Link>
                    </Button>
                  </div>

                  <form onSubmit={handleSaveAnimeEdit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Título Oficial Exibido
                        </Label>
                        <Input
                          value={editAnimeTitle}
                          onChange={(e) => setEditAnimeTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          YouTube Trailer ID Oficial
                        </Label>
                        <Input
                          value={editAnimeTrailer}
                          onChange={(e) => setEditAnimeTrailer(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          URL do Poster (Capa Vertical)
                        </Label>
                        <Input
                          value={editAnimeCover}
                          onChange={(e) => setEditAnimeCover(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          URL do Banner Panorâmico
                        </Label>
                        <Input
                          value={editAnimeBanner}
                          onChange={(e) => setEditAnimeBanner(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Sinopse Editorial Completa
                      </Label>
                      <Textarea
                        rows={6}
                        value={editAnimeSynopsis}
                        onChange={(e) => setEditAnimeSynopsis(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex justify-end pt-3">
                      <Button
                        type="submit"
                        className="rounded-full text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 px-6"
                      >
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        Salvar Alterações do Anime
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
