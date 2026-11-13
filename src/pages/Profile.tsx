import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Film,
  Tv,
  Bookmark,
  Star,
  Clock,
  Trash2,
  Play,
  ArrowRight,
  LogOut,
  LogIn,
  Shield,
  Sliders,
  Check,
  Search,
  X,
  Download,
  FileText,
  FolderOpen,
  RotateCw,
  HardDrive,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useBooks, usePurchases } from "@/hooks/useCatalog";
import {
  getLocalUserProfile,
  saveUserProfile,
  syncProfileFromCloud,
  getUnifiedUserHistory,
  removeHistoryEntry,
  clearUserHistory,
  getUserSavedCatalog,
  getUserReviewsList,
  UserProfileData,
  UserHistoryEntry,
  HistoryMediaType,
} from "@/lib/userProfileStore";
import {
  getUserDownloads,
  syncDownloadsFromCloud,
  getAllCachedDownloadIds,
  getOrFetchDownloadBytes,
  markDownloadOpened,
  removeDownloadEntry,
  clearDownloadsHistory,
  executeTrackedDownload,
  formatDownloadBytes,
  UserDownloadEntry,
  DownloadMediaType,
} from "@/lib/downloadsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import OriginalPdfViewer from "@/components/books/OriginalPdfViewer";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

type ProfileSectionTab =
  | "history"
  | "downloads"
  | "reading"
  | "watching"
  | "saved"
  | "reviews"
  | "settings";

type DownloadsFilterMode = "all" | "in_progress" | "completed" | "offline" | "failed";

const TYPE_LABELS: Record<HistoryMediaType, string> = {
  book: "Livro",
  cinema: "Cinema & Série",
  anime: "Anime",
  manga: "Mangá",
  webtoon: "Webtoon",
  news: "Reportagem",
};

const DOWNLOAD_TYPE_LABELS: Record<DownloadMediaType, string> = {
  pdf: "PDF Original",
  book: "Livro Digital",
  article: "Artigo",
  cinema: "Cinema",
  anime: "Anime",
  webtoon: "Webtoon",
  document: "Documento",
};

const READER_THEME_LABELS: Record<UserProfileData["preferredReaderTheme"], string> = {
  light: "Papel Claro",
  sepia: "Pergaminho Sépia",
  dark: "Grafite Escuro",
  oled: "Noturno OLED",
};

const Profile = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { data: books = [] } = useBooks();
  const { data: purchases = [] } = usePurchases();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTabParam = searchParams.get("tab") as ProfileSectionTab | null;
  const validTabs: ProfileSectionTab[] = [
    "history",
    "downloads",
    "reading",
    "watching",
    "saved",
    "reviews",
    "settings",
  ];
  const [activeTab, setActiveTab] = useState<ProfileSectionTab>(
    initialTabParam && validTabs.includes(initialTabParam) ? initialTabParam : "history"
  );
  const [historyFilter, setHistoryFilter] = useState<HistoryMediaType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadsFilter, setDownloadsFilter] = useState<DownloadsFilterMode>("all");
  const [downloadsSearch, setDownloadsSearch] = useState("");
  const [cachedDownloadIds, setCachedDownloadIds] = useState<Set<string>>(new Set());
  const [openingDownloadId, setOpeningDownloadId] = useState<string | null>(null);
  const [redownloadingId, setRedownloadingId] = useState<string | null>(null);
  const [viewerState, setViewerState] = useState<{
    entry: UserDownloadEntry;
    bytes: Uint8Array;
  } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [profile, setProfile] = useState<UserProfileData>(() => getLocalUserProfile(user));
  const [editName, setEditName] = useState(profile.displayName);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editAvatar, setEditAvatar] = useState(profile.avatarUrl);
  const [editGenres, setEditGenres] = useState(profile.favoriteGenres);
  const [editLang, setEditLang] = useState<"pt" | "en">(profile.preferredLanguage);
  const [editTheme, setEditTheme] = useState<UserProfileData["preferredReaderTheme"]>(
    profile.preferredReaderTheme
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    document.title = "Meu Perfil & Histórico — Wotho";
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as ProfileSectionTab | null;
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleSelectTab = (tab: ProfileSectionTab) => {
    setActiveTab(tab);
    setSearchParams(tab === "history" ? {} : { tab }, { replace: true });
  };

  useEffect(() => {
    const next = getLocalUserProfile(user);
    setProfile(next);
    setEditName(next.displayName);
    setEditBio(next.bio);
    setEditAvatar(next.avatarUrl);
    setEditGenres(next.favoriteGenres);
    setEditLang(next.preferredLanguage);
    setEditTheme(next.preferredReaderTheme);
    if (user) {
      void syncProfileFromCloud();
      void syncDownloadsFromCloud();
    }
  }, [user]);

  useEffect(() => {
    const handleSync = () => {
      const next = getLocalUserProfile(user);
      setProfile(next);
      setRefreshTick((t) => t + 1);
    };
    window.addEventListener("worscoi_history_updated", handleSync);
    window.addEventListener("worscoi_downloads_updated", handleSync);
    window.addEventListener("worscoi_profile_updated", handleSync);
    window.addEventListener("worscoi_watchlist_updated", handleSync);
    window.addEventListener("worscoi_reviews_updated", handleSync);
    return () => {
      window.removeEventListener("worscoi_history_updated", handleSync);
      window.removeEventListener("worscoi_downloads_updated", handleSync);
      window.removeEventListener("worscoi_profile_updated", handleSync);
      window.removeEventListener("worscoi_watchlist_updated", handleSync);
      window.removeEventListener("worscoi_reviews_updated", handleSync);
    };
  }, [user]);

  const allHistory = useMemo(() => {
    void refreshTick;
    return getUnifiedUserHistory(books);
  }, [books, refreshTick]);

  const savedCatalog = useMemo(() => {
    void refreshTick;
    return getUserSavedCatalog(user?.id, books);
  }, [user?.id, books, refreshTick]);

  const userReviews = useMemo(() => {
    void refreshTick;
    return getUserReviewsList(user?.id, profile.displayName);
  }, [user?.id, profile.displayName, refreshTick]);

  const readingHistory = useMemo(
    () => allHistory.filter((item) => item.type === "book" || item.type === "webtoon" || item.type === "manga"),
    [allHistory]
  );

  const watchingHistory = useMemo(
    () => allHistory.filter((item) => item.type === "cinema" || item.type === "anime"),
    [allHistory]
  );

  const downloads = useMemo(() => {
    void refreshTick;
    return getUserDownloads();
  }, [refreshTick]);

  const [recentlyFinishedMap, setRecentlyFinishedMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const now = Date.now();
    const newlyCompleted: Record<string, number> = {};
    for (const d of downloads) {
      if (d.status === "completed") {
        const ageMs = now - new Date(d.downloadedAt).getTime();
        if (ageMs >= 0 && ageMs < 12000 && !recentlyFinishedMap[d.id]) {
          newlyCompleted[d.id] = now;
        }
      }
    }
    if (Object.keys(newlyCompleted).length > 0) {
      setRecentlyFinishedMap((prev) => ({ ...prev, ...newlyCompleted }));
    }
  }, [downloads]);

  useEffect(() => {
    const activeEntries = Object.entries(recentlyFinishedMap);
    if (activeEntries.length === 0) return;
    const timer = window.setTimeout(() => {
      const now = Date.now();
      setRecentlyFinishedMap((prev) => {
        const next: Record<string, number> = {};
        for (const [id, ts] of Object.entries(prev)) {
          if (now - ts < 12000) next[id] = ts;
        }
        return next;
      });
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [recentlyFinishedMap]);

  useEffect(() => {
    let active = true;
    getAllCachedDownloadIds().then((ids) => {
      if (active) setCachedDownloadIds(ids);
    });
    return () => {
      active = false;
    };
  }, [downloads, refreshTick]);

  const inProgressDownloads = useMemo(
    () => downloads.filter((d) => d.status === "in_progress"),
    [downloads]
  );

  const aggregateTransferProgress = useMemo(() => {
    if (inProgressDownloads.length === 0) return 100;
    const sum = inProgressDownloads.reduce((acc, d) => acc + (d.progressPercent ?? 12), 0);
    return Math.max(5, Math.min(99, Math.round(sum / inProgressDownloads.length)));
  }, [inProgressDownloads]);

  const downloadsStats = useMemo(() => {
    const completed = downloads.filter((d) => d.status === "completed");
    const offlineCount = downloads.filter((d) => cachedDownloadIds.has(d.id)).length;
    const totalBytes = completed.reduce((acc, d) => acc + (d.fileSizeBytes || 0), 0);
    return {
      total: downloads.length,
      inProgressCount: inProgressDownloads.length,
      completedCount: completed.length,
      offlineCount,
      totalBytesFormatted: totalBytes > 0 ? formatDownloadBytes(totalBytes) : "—",
    };
  }, [downloads, inProgressDownloads.length, cachedDownloadIds]);

  const filteredDownloads = useMemo(() => {
    return downloads.filter((d) => {
      if (downloadsFilter === "in_progress" && d.status !== "in_progress") return false;
      if (downloadsFilter === "completed" && d.status !== "completed") return false;
      if (downloadsFilter === "offline" && !cachedDownloadIds.has(d.id)) return false;
      if (downloadsFilter === "failed" && d.status !== "failed") return false;
      if (downloadsSearch.trim()) {
        const q = downloadsSearch.toLowerCase().trim();
        return (
          d.title.toLowerCase().includes(q) ||
          (d.author || "").toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          (d.category || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [downloads, downloadsFilter, downloadsSearch, cachedDownloadIds]);

  const filteredHistory = useMemo(() => {
    return allHistory.filter((item) => {
      if (historyFilter !== "all" && item.type !== historyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.subtitle || "").toLowerCase().includes(q) ||
          (item.detailLabel || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allHistory, historyFilter, searchQuery]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await saveUserProfile(
        {
          displayName: editName,
          bio: editBio,
          avatarUrl: editAvatar,
          favoriteGenres: editGenres,
          preferredLanguage: editLang,
          preferredReaderTheme: editTheme,
        },
        user
      );
      setProfile(updated);
      toast.success("Perfil e preferências atualizados com sucesso!");
    } catch {
      toast.error("Não foi possível atualizar o perfil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRemoveEntry = async (entryId: string, title: string) => {
    await removeHistoryEntry(entryId);
    setRefreshTick((t) => t + 1);
    toast.success(`"${title}" removido do histórico.`);
  };

  const handleClearHistory = () => {
    clearUserHistory(historyFilter);
    setRefreshTick((t) => t + 1);
    toast.success(
      historyFilter === "all"
        ? "Todo o histórico de atividade foi limpo."
        : `Histórico de ${TYPE_LABELS[historyFilter]} limpo.`
    );
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Sessão encerrada com sucesso.");
    navigate("/");
  };

  const handleOpenDownloadedFile = async (entry: UserDownloadEntry) => {
    if (openingDownloadId) return;
    setOpeningDownloadId(entry.id);
    try {
      const { bytes } = await getOrFetchDownloadBytes(entry);
      const updated = markDownloadOpened(entry.id) || entry;
      setViewerState({ entry: updated, bytes });
      setRefreshTick((t) => t + 1);
    } catch {
      toast.error("Não foi possível abrir o arquivo agora. Tente baixar novamente.");
    } finally {
      setOpeningDownloadId(null);
    }
  };

  const handleRedownloadEntry = async (entry: UserDownloadEntry) => {
    if (redownloadingId) return;
    setRedownloadingId(entry.id);
    try {
      await executeTrackedDownload({
        itemId: entry.itemId,
        type: entry.type,
        title: entry.title,
        author: entry.author,
        category: entry.category,
        cover: entry.cover,
        sourceUrl: entry.downloadUrl,
        openHref: entry.openHref,
        fileName: entry.fileName,
        expectedFileSizeFormatted: entry.fileSizeFormatted,
      });
      toast.success(`"${entry.title}" baixado novamente com sucesso.`);
    } catch {
      toast.error("Erro ao transferir o arquivo novamente.");
    } finally {
      setRedownloadingId(null);
    }
  };

  const handleRemoveDownload = async (entry: UserDownloadEntry) => {
    await removeDownloadEntry(entry.id);
    setRefreshTick((t) => t + 1);
    toast.success(`"${entry.title}" removido dos downloads.`);
  };

  const handleClearDownloads = async () => {
    await clearDownloadsHistory();
    setRefreshTick((t) => t + 1);
    toast.success("Histórico de downloads e cache local limpos.");
  };

  const initials = useMemo(() => {
    const parts = (profile.displayName || "Leitor Wotho").trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || "LW").toUpperCase();
  }, [profile.displayName]);

  const formatRelativeTime = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const mins = Math.max(1, Math.floor(diffMs / 60000));
      if (mins < 60) return `Há ${mins} min`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `Há ${hours}h`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `Há ${days} dia${days > 1 ? "s" : ""}`;
      return formatDate(iso);
    } catch {
      return "Recente";
    }
  };

  const renderHistoryCard = (entry: UserHistoryEntry) => {
    const isVideo = entry.type === "cinema" || entry.type === "anime";
    return (
      <div
        key={entry.id}
        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 py-5 border-b border-border/80 transition-colors hover:bg-secondary/20 px-3 -mx-3 rounded-lg"
      >
        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
          <Link
            to={entry.href}
            className="relative w-16 h-24 sm:w-18 sm:h-26 shrink-0 overflow-hidden rounded border border-border bg-secondary/40"
          >
            {entry.cover ? (
              <img
                src={entry.cover}
                alt={entry.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {isVideo ? <Film className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{TYPE_LABELS[entry.type]}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatRelativeTime(entry.timestamp)}</span>
              {entry.detailLabel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-foreground/80 font-medium">{entry.detailLabel}</span>
                </>
              )}
            </div>

            <Link
              to={entry.href}
              className="block font-display text-lg text-foreground hover:text-primary transition-colors truncate"
            >
              {entry.title}
            </Link>

            {entry.subtitle && (
              <p className="text-xs text-muted-foreground truncate">{entry.subtitle}</p>
            )}

            {typeof entry.progressPercent === "number" && (
              <div className="pt-1 max-w-xs flex items-center gap-3">
                <div className="h-1 flex-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground transition-all duration-300"
                    style={{ width: `${Math.max(4, Math.min(100, entry.progressPercent))}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                  {entry.progressPercent}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 px-4 text-xs whitespace-nowrap shrink-0"
          >
            <Link to={entry.href}>
              {isVideo ? (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Continuar a assistir
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Continuar leitura
                </>
              )}
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => handleRemoveEntry(entry.id, entry.title)}
            title="Remover do histórico"
            aria-label={`Remover ${entry.title} do histórico`}
            className="h-9 w-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation variant="dark" />

      {/* Editorial Header Banner */}
      <header className="pt-28 pb-12 border-b border-border bg-secondary/20">
        <div className="container mx-auto max-w-6xl px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-start sm:items-center gap-6">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border border-border bg-card flex items-center justify-center shrink-0 shadow-sm">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="font-display text-2xl sm:text-3xl text-foreground select-none">
                    {initials}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{user ? "Conta Sincronizada" : "Perfil Local no Dispositivo"}</span>
                  {user?.email && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{user.email}</span>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-foreground font-medium">Editor-Chefe & Admin Mestre</span>
                    </>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-foreground">
                  {profile.displayName}
                </h1>

                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  {profile.bio}
                </p>

                {profile.favoriteGenres && (
                  <p className="text-xs text-muted-foreground pt-0.5">
                    Interesses: <span className="text-foreground/80">{profile.favoriteGenres}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectTab("settings")}
                className="text-xs whitespace-nowrap shrink-0"
              >
                <Sliders className="w-3.5 h-3.5 mr-1.5" />
                Editar Perfil
              </Button>

              {isAdmin && (
                <Button asChild variant="outline" size="sm" className="text-xs whitespace-nowrap shrink-0">
                  <Link to="/admin">
                    <Shield className="w-3.5 h-3.5 mr-1.5" />
                    Painel Editorial
                  </Link>
                </Button>
              )}

              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Sair
                </Button>
              ) : (
                <Button asChild size="sm" className="text-xs whitespace-nowrap shrink-0">
                  <Link to="/auth">
                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                    Iniciar Sessão
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Tabular Summary Strip */}
          <div className="mt-10 pt-8 border-t border-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Histórico Total</p>
              <p className="mt-1 font-display text-2xl sm:text-3xl tabular-nums text-foreground">
                {allHistory.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">obras acessadas</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Downloads</p>
              <p className="mt-1 font-display text-2xl sm:text-3xl tabular-nums text-foreground">
                {downloadsStats.total}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {downloadsStats.inProgressCount > 0
                  ? `${downloadsStats.inProgressCount} em transferência · ${aggregateTransferProgress}%`
                  : `${downloadsStats.offlineCount} em cache offline`}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Leituras Ativas</p>
              <p className="mt-1 font-display text-2xl sm:text-3xl tabular-nums text-foreground">
                {readingHistory.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">livros, mangás e webtoons</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cinema & Animes</p>
              <p className="mt-1 font-display text-2xl sm:text-3xl tabular-nums text-foreground">
                {watchingHistory.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">filmes e episódios</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Salvos & Avaliações</p>
              <p className="mt-1 font-display text-2xl sm:text-3xl tabular-nums text-foreground">
                {savedCatalog.length + userReviews.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {savedCatalog.length} na lista · {userReviews.length} críticas
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto max-w-6xl px-6 lg:px-12 py-12">
        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-3 border-b border-border no-scrollbar">
          {[
            { id: "history" as const, label: "Histórico Completo", count: allHistory.length },
            {
              id: "downloads" as const,
              label: downloadsStats.inProgressCount > 0 ? "Downloads (Baixando)" : "Downloads",
              count: downloads.length,
            },
            { id: "reading" as const, label: "Histórico de Leitura", count: readingHistory.length },
            { id: "watching" as const, label: "Cinema & Animes", count: watchingHistory.length },
            { id: "saved" as const, label: "Minha Lista & Estante", count: savedCatalog.length + purchases.length },
            { id: "reviews" as const, label: "Minhas Avaliações", count: userReviews.length },
            { id: "settings" as const, label: "Dados & Preferências" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {tab.label}
                {typeof tab.count === "number" && (
                  <span className="ml-1.5 opacity-70 tabular-nums">({tab.count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: FULL UNIFIED HISTORY */}
        {activeTab === "history" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: "all" as const, label: "Todos" },
                  { id: "book" as const, label: "Livros" },
                  { id: "cinema" as const, label: "Filmes & Séries" },
                  { id: "anime" as const, label: "Animes" },
                  { id: "manga" as const, label: "Mangás" },
                  { id: "webtoon" as const, label: "Webtoons" },
                  { id: "news" as const, label: "Notícias" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setHistoryFilter(f.id)}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      historyFilter === f.id
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar no histórico..."
                    className="pl-8 pr-8 h-9 text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {filteredHistory.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="text-xs text-muted-foreground hover:text-destructive whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3 stroke-[1.5]" />
                <h2 className="font-display text-xl text-foreground">
                  Nenhum registo encontrado no histórico
                </h2>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  À medida que você lê livros, acompanha webtoons e mangás ou assiste a filmes, séries e animes em português, o seu progresso aparece automaticamente aqui.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <Link to="/livros">Explorar Livros</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <Link to="/cinema">Explorar Cinema</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <Link to="/animes">Explorar Animes</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredHistory.map(renderHistoryCard)}
              </div>
            )}
          </motion.section>
        )}

        {/* TAB 2: USER DOWNLOADS & OFFLINE LIBRARY */}
        {activeTab === "downloads" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-8"
          >
            <div className="pb-6 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-foreground">
                  Meus Downloads & Arquivos Salvos
                </h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Central com todos os arquivos transferidos na plataforma, registro histórico de downloads e abertura direta dos livros e PDFs já baixados.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground tabular-nums">
                <span>
                  <strong className="text-foreground font-medium">{downloadsStats.completedCount}</strong> concluídos
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-foreground font-medium">{downloadsStats.offlineCount}</strong> disponíveis offline
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Volume: <strong className="text-foreground font-medium">{downloadsStats.totalBytesFormatted}</strong>
                </span>
              </div>
            </div>

            {/* Active Transfer / Recent Completion Visual Progress Banner */}
            {(inProgressDownloads.length > 0 || Object.keys(recentlyFinishedMap).length > 0) && (
              <div className="mt-5 rounded-lg border border-border bg-card p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    {inProgressDownloads.length > 0 ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                        <span>
                          {inProgressDownloads.length === 1
                            ? `Baixando "${inProgressDownloads[0].title}"...`
                            : `Baixando ${inProgressDownloads.length} arquivos simultaneamente...`}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Download finalizado — arquivo salvo e pronto para abrir</span>
                      </>
                    )}
                  </div>
                  <span
                    className={`font-mono tabular-nums font-medium ${
                      inProgressDownloads.length > 0
                        ? "text-foreground"
                        : "text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    {inProgressDownloads.length > 0 ? `${aggregateTransferProgress}%` : "100%"}
                  </span>
                </div>
                <Progress
                  value={inProgressDownloads.length > 0 ? aggregateTransferProgress : 100}
                  aria-label="Progresso geral de downloads"
                  className="h-2 bg-secondary"
                  indicatorClassName={
                    inProgressDownloads.length > 0
                      ? "bg-foreground"
                      : "bg-emerald-600 dark:bg-emerald-500"
                  }
                />
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-5 border-b border-border">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: "all" as const, label: "Todos" },
                  {
                    id: "in_progress" as const,
                    label:
                      inProgressDownloads.length > 0
                        ? `Baixando (${inProgressDownloads.length})`
                        : "Em Andamento",
                  },
                  { id: "completed" as const, label: "Concluídos" },
                  { id: "offline" as const, label: "Em Cache Offline" },
                  { id: "failed" as const, label: "Com Falha" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setDownloadsFilter(f.id)}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      downloadsFilter === f.id
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={downloadsSearch}
                    onChange={(e) => setDownloadsSearch(e.target.value)}
                    placeholder="Buscar nos downloads..."
                    className="pl-8 pr-8 h-9 text-xs"
                  />
                  {downloadsSearch && (
                    <button
                      type="button"
                      onClick={() => setDownloadsSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {downloads.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearDownloads}
                    className="text-xs text-muted-foreground hover:text-destructive whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {filteredDownloads.length === 0 ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <Download className="w-8 h-8 text-muted-foreground mx-auto mb-3 stroke-[1.5]" />
                <h3 className="font-display text-xl text-foreground">
                  {downloads.length === 0
                    ? "Você ainda não possui downloads"
                    : "Nenhum download corresponde ao filtro"}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {downloads.length === 0
                    ? "Sempre que você baixar um livro, edição em PDF ou material de leitura na Wotho, o arquivo ficará listado aqui para abrir e consultar seu histórico completo."
                    : "Tente limpar a busca ou selecionar outra categoria de filtro acima."}
                </p>
                {downloads.length === 0 ? (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Button asChild size="sm" variant="outline" className="text-xs">
                      <Link to="/livros">Explorar Livros & PDFs</Link>
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDownloadsFilter("all");
                      setDownloadsSearch("");
                    }}
                    className="mt-5 text-xs"
                  >
                    Mostrar todos os downloads
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredDownloads.map((entry) => {
                  const isCached = cachedDownloadIds.has(entry.id);
                  const isOpening = openingDownloadId === entry.id;
                  const isRedownloading = redownloadingId === entry.id;
                  const progressPct =
                    entry.status === "completed"
                      ? 100
                      : Math.max(0, Math.min(99, entry.progressPercent ?? 12));
                  const isRecentFinish =
                    entry.status === "completed" && Boolean(recentlyFinishedMap[entry.id]);
                  const stageDescription =
                    entry.status === "completed"
                      ? isRecentFinish
                        ? "Finalização concluída — pronto para abrir"
                        : "Download concluído"
                      : entry.status === "failed"
                      ? "Transferência interrompida"
                      : entry.progressStage === "connecting"
                      ? "Conectando ao servidor..."
                      : entry.progressStage === "saving"
                      ? "Salvando no armazenamento offline..."
                      : entry.loadedBytes && entry.loadedBytes > 0
                      ? entry.totalBytes
                        ? `Baixando ${formatDownloadBytes(entry.loadedBytes)} de ${formatDownloadBytes(entry.totalBytes)}`
                        : `Baixando ${formatDownloadBytes(entry.loadedBytes)}`
                      : "Iniciando transferência...";
                  const statusLabel =
                    entry.status === "completed"
                      ? "Concluído"
                      : entry.status === "in_progress"
                      ? "Transferindo..."
                      : "Falha ao transferir";

                  return (
                    <div
                      key={entry.id}
                      className="group flex flex-col md:flex-row items-start md:items-center justify-between gap-5 py-5 transition-colors hover:bg-secondary/20 px-3 -mx-3 rounded-lg"
                    >
                      <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDownloadedFile(entry)}
                          className="relative w-14 h-20 sm:w-16 sm:h-24 shrink-0 overflow-hidden rounded border border-border bg-secondary/40 text-left"
                          title={`Abrir ${entry.title}`}
                        >
                          {entry.cover ? (
                            <img
                              src={entry.cover}
                              alt={entry.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                        </button>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{DOWNLOAD_TYPE_LABELS[entry.type] || "Arquivo"}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                entry.status === "failed"
                                  ? "text-destructive font-medium"
                                  : entry.status === "completed"
                                  ? "text-foreground/80 font-medium"
                                  : "text-primary font-medium"
                              }
                            >
                              {statusLabel}
                            </span>
                            {isCached && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                  <HardDrive className="w-3 h-3" />
                                  Offline no dispositivo
                                </span>
                              </>
                            )}
                            {entry.fileSizeFormatted && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">{entry.fileSizeFormatted}</span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{formatRelativeTime(entry.downloadedAt)}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenDownloadedFile(entry)}
                            className="block text-left font-display text-lg text-foreground hover:text-primary transition-colors truncate max-w-full"
                          >
                            {entry.title}
                          </button>

                          <p className="text-xs text-muted-foreground truncate">
                            {entry.author ? `${entry.author} · ` : ""}
                            {entry.fileName}
                            {entry.openCount && entry.openCount > 0
                              ? ` · Aberto ${entry.openCount}×`
                              : ""}
                          </p>

                          {/* Per-Item Download Completion Progress Bar */}
                          <div className="pt-1.5 max-w-md space-y-1">
                            <Progress
                              value={entry.status === "failed" ? Math.max(8, progressPct) : progressPct}
                              aria-label={`Progresso de download de ${entry.title}: ${progressPct}%`}
                              className="h-1.5 bg-secondary"
                              indicatorClassName={
                                entry.status === "completed"
                                  ? "bg-emerald-600 dark:bg-emerald-500"
                                  : entry.status === "failed"
                                  ? "bg-destructive"
                                  : "bg-foreground"
                              }
                            />
                            <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5 truncate">
                                {entry.status === "completed" && (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                )}
                                {entry.status === "failed" && (
                                  <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                                )}
                                {entry.status === "in_progress" && (
                                  <RotateCw className="w-3 h-3 animate-spin text-foreground shrink-0" />
                                )}
                                <span
                                  className={
                                    isRecentFinish
                                      ? "text-emerald-700 dark:text-emerald-400 font-medium truncate"
                                      : entry.status === "failed"
                                      ? "text-destructive truncate"
                                      : "truncate"
                                  }
                                >
                                  {stageDescription}
                                </span>
                              </span>
                              <span
                                className={`font-mono tabular-nums shrink-0 ${
                                  entry.status === "completed"
                                    ? "text-emerald-700 dark:text-emerald-400 font-medium"
                                    : entry.status === "failed"
                                    ? "text-destructive font-medium"
                                    : "text-foreground font-medium"
                                }`}
                              >
                                {progressPct}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isOpening || entry.status === "in_progress"}
                          onClick={() => handleOpenDownloadedFile(entry)}
                          className="h-9 px-4 text-xs whitespace-nowrap shrink-0"
                        >
                          <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                          {isOpening ? "Abrindo..." : "Abrir"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isRedownloading || entry.status === "in_progress"}
                          onClick={() => handleRedownloadEntry(entry)}
                          title="Baixar arquivo novamente para o dispositivo"
                          className="h-9 px-3 text-xs whitespace-nowrap shrink-0"
                        >
                          <RotateCw
                            className={`w-3.5 h-3.5 mr-1.5 ${
                              isRedownloading || entry.status === "in_progress"
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          {isRedownloading || entry.status === "in_progress"
                            ? "Baixando..."
                            : entry.status === "failed"
                            ? "Tentar novamente"
                            : "Baixar novamente"}
                        </Button>

                        {entry.openHref && (
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
                            title="Ir para a página da obra"
                          >
                            <Link to={entry.openHref}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveDownload(entry)}
                          title="Remover do histórico de downloads"
                          aria-label={`Remover ${entry.title} dos downloads`}
                          className="h-9 w-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>
        )}

        {/* TAB 2: READING HISTORY (BOOKS, WEBTOONS, MANGAS) */}
        {activeTab === "reading" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="font-display text-2xl text-foreground">Leituras em Andamento & Concluídas</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Retome os seus livros, capítulos de mangá e episódios de webtoon exatamente de onde parou.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs whitespace-nowrap shrink-0">
                <Link to="/livros">
                  Ir para Biblioteca <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>

            {readingHistory.length === 0 ? (
              <div className="py-16 text-center">
                <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3 stroke-[1.5]" />
                <p className="text-sm text-muted-foreground">
                  Você ainda não iniciou a leitura de nenhum livro, mangá ou webtoon.
                </p>
                <Button asChild size="sm" className="mt-5 text-xs">
                  <Link to="/livros">Começar uma leitura</Link>
                </Button>
              </div>
            ) : (
              <div>{readingHistory.map(renderHistoryCard)}</div>
            )}
          </motion.section>
        )}

        {/* TAB 3: WATCHING HISTORY (CINEMA & ANIMES) */}
        {activeTab === "watching" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="font-display text-2xl text-foreground">Filmes, Séries & Animes Assistidos</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Histórico de reprodução com suporte a áudio Dublado em Português (PT-BR).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="text-xs whitespace-nowrap shrink-0">
                  <Link to="/cinema">Cinema</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="text-xs whitespace-nowrap shrink-0">
                  <Link to="/animes">Animes</Link>
                </Button>
              </div>
            </div>

            {watchingHistory.length === 0 ? (
              <div className="py-16 text-center">
                <Tv className="w-8 h-8 text-muted-foreground mx-auto mb-3 stroke-[1.5]" />
                <p className="text-sm text-muted-foreground">
                  Você ainda não assistiu a nenhum filme, série ou anime recentemente.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <Button asChild size="sm" className="text-xs">
                    <Link to="/cinema">Ver Filmes & Séries</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <Link to="/animes">Ver Animes Dublados</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div>{watchingHistory.map(renderHistoryCard)}</div>
            )}
          </motion.section>
        )}

        {/* TAB 4: SAVED WATCHLIST & FAVORITES */}
        {activeTab === "saved" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-8 space-y-12"
          >
            <div>
              <div className="pb-4 border-b border-border">
                <h2 className="font-display text-2xl text-foreground">Minha Lista & Obras Favoritas</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Filmes, séries, animes, livros e webtoons salvos na sua lista pessoal.
                </p>
              </div>

              {savedCatalog.length === 0 ? (
                <div className="py-14 text-center">
                  <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-3 stroke-[1.5]" />
                  <p className="text-sm text-muted-foreground">
                    A sua lista de favoritos está vazia. Salve filmes, animes ou livros para acessá-los rapidamente aqui.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {savedCatalog.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="group flex flex-col space-y-2.5"
                    >
                      <div className="aspect-[3/4] w-full overflow-hidden rounded border border-border bg-secondary/30">
                        {item.cover ? (
                          <img
                            src={item.cover}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Bookmark className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">{item.badge}</p>
                        <h3 className="font-display text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {purchases.length > 0 && (
              <div className="pt-6 border-t border-border">
                <h3 className="font-display text-xl text-foreground">Livros Adquiridos na Conta</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {purchases.map((p) => {
                    const b = books.find((bk) => bk.id === p.book_id);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-4 rounded border border-border bg-card p-4"
                      >
                        <div>
                          <p className="font-display text-base">{b?.title ?? "Livro"}</p>
                          <p className="text-xs text-muted-foreground">
                            {b?.author} · {p.status === "paid" ? "Liberado para leitura" : "Em processamento"}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline" className="text-xs">
                          <Link to={`/ler/${p.book_id}`}>Ler Obra</Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* TAB 5: USER COMMUNITY REVIEWS */}
        {activeTab === "reviews" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-8"
          >
            <div className="pb-4 border-b border-border">
              <h2 className="font-display text-2xl text-foreground">Minhas Avaliações & Críticas</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Comentários e notas publicados por você nas obras da plataforma.
              </p>
            </div>

            {userReviews.length === 0 ? (
              <div className="py-16 text-center">
                <Star className="w-8 h-8 text-muted-foreground mx-auto mb-3 stroke-[1.5]" />
                <p className="text-sm text-muted-foreground">
                  Você ainda não publicou nenhuma avaliação nas obras do catálogo.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {userReviews.map((rev) => {
                  const itemHref =
                    rev.itemType === "anime"
                      ? `/animes/${rev.itemId}`
                      : rev.itemType === "manga"
                      ? `/animes/${rev.itemId}/manga`
                      : rev.itemType === "webtoon"
                      ? `/webtoon/${rev.itemId}`
                      : `/livros/${rev.itemId}`;
                  return (
                    <div key={rev.id} className="py-6 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="uppercase tracking-wider">{rev.itemType}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">Nota: {rev.rating}/5</span>
                          {rev.statusTag && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{rev.statusTag}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{formatDate(rev.createdAt)}</span>
                        </div>
                        <Link
                          to={itemHref}
                          className="text-xs text-foreground underline underline-offset-4 hover:text-primary"
                        >
                          Ver obra
                        </Link>
                      </div>
                      <h3 className="font-display text-lg text-foreground">{rev.itemTitle}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                        {rev.comment}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>
        )}

        {/* TAB 6: PROFILE SETTINGS & PREFERENCES */}
        {activeTab === "settings" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-8 max-w-2xl"
          >
            <div className="pb-6 border-b border-border">
              <h2 className="font-display text-2xl text-foreground">Dados do Perfil & Preferências</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Personalize como o seu perfil aparece e configure o idioma de áudio e tema de leitura padrão.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-name" className="text-xs text-muted-foreground">
                    Nome de Exibição
                  </Label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="profile-name"
                      value={editName}
                      maxLength={100}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Seu nome completo ou apelido"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-avatar" className="text-xs text-muted-foreground">
                    URL da Foto de Perfil (Opcional)
                  </Label>
                  <Input
                    id="profile-avatar"
                    type="url"
                    value={editAvatar}
                    maxLength={1000}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-bio" className="text-xs text-muted-foreground">
                  Biografia & Apresentação
                </Label>
                <textarea
                  id="profile-bio"
                  rows={3}
                  maxLength={600}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Conte um pouco sobre as suas leituras, filmes e temas favoritos..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-genres" className="text-xs text-muted-foreground">
                  Gêneros & Temas Favoritos
                </Label>
                <Input
                  id="profile-genres"
                  value={editGenres}
                  maxLength={500}
                  onChange={(e) => setEditGenres(e.target.value)}
                  placeholder="Filosofia · Ficção Científica · Seinen · Literatura Clássica"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Idioma Padrão de Cinema & Animes
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditLang("pt")}
                      className={`px-3 py-2.5 text-xs rounded-md border text-left transition-colors ${
                        editLang === "pt"
                          ? "border-foreground bg-foreground text-background font-medium"
                          : "border-border bg-card text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      Português (Dublado PT-BR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditLang("en")}
                      className={`px-3 py-2.5 text-xs rounded-md border text-left transition-colors ${
                        editLang === "en"
                          ? "border-foreground bg-foreground text-background font-medium"
                          : "border-border bg-card text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      Áudio Original (Legendado)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Tema Padrão do Leitor de Livros
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["light", "sepia", "dark", "oled"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditTheme(t)}
                        className={`px-3 py-2 text-xs rounded-md border text-left transition-colors ${
                          editTheme === t
                            ? "border-foreground bg-foreground text-background font-medium"
                            : "border-border bg-card text-foreground hover:bg-secondary/50"
                        }`}
                      >
                        {READER_THEME_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <Button type="submit" disabled={isSavingProfile} className="text-xs px-6">
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  {isSavingProfile ? "A guardar..." : "Guardar Alterações"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleSelectTab("history")}
                  className="text-xs"
                >
                  Voltar ao Histórico
                </Button>
              </div>
            </form>
          </motion.section>
        )}
      </main>

      {/* In-App Downloaded File Viewer Modal */}
      <Dialog
        open={Boolean(viewerState)}
        onOpenChange={(open) => {
          if (!open) setViewerState(null);
        }}
      >
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0 pr-12">
            <DialogTitle className="font-display text-lg truncate">
              {viewerState?.entry.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground truncate">
              {viewerState?.entry.author ? `${viewerState.entry.author} · ` : ""}
              {viewerState?.entry.fileName}
              {viewerState?.entry.fileSizeFormatted
                ? ` · ${viewerState.entry.fileSizeFormatted}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-muted/20">
            {viewerState && (
              <OriginalPdfViewer
                pdfUrl={viewerState.entry.downloadUrl || ""}
                downloadUrl={viewerState.entry.downloadUrl || ""}
                pdfBytes={viewerState.bytes}
                itemId={viewerState.entry.itemId}
                cover={viewerState.entry.cover}
                category={viewerState.entry.category}
                title={viewerState.entry.title}
                author={viewerState.entry.author || "Acervo Wotho"}
                fileSizeFormatted={viewerState.entry.fileSizeFormatted}
                hasTextMode={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Profile;
