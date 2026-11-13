import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Hls from "hls.js";
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
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
  cinema: "Cinema & Série",
  anime: "Anime",
  manga: "Mangá",
  webtoon: "Webtoon",
  document: "Documento",
};

const READER_THEME_CHOICES: Array<{
  id: UserProfileData["preferredReaderTheme"];
  label: string;
  swatch: string;
}> = [
  { id: "light", label: "Papel Claro", swatch: "#FAF9F6" },
  { id: "sepia", label: "Pergaminho Sépia", swatch: "#EFE4CE" },
  { id: "dark", label: "Grafite Escuro", swatch: "#2C2C2E" },
  { id: "oled", label: "Noturno OLED", swatch: "#000000" },
];

function parseGenreTags(raw: string): string[] {
  return String(raw || "")
    .split(/[·,|/]+/)
    .map((t) => t.trim())
    .filter((t, idx, arr) => t.length > 0 && arr.indexOf(t) === idx);
}

function isVideoDownloadEntry(entry: UserDownloadEntry): boolean {
  return (
    Boolean(entry.mimeType?.startsWith("video/")) ||
    /\.(mp4|webm|ts|mkv|m4v)(\?|$)/i.test(entry.fileName || "")
  );
}

function DownloadedVideoViewer({
  entry,
  bytes,
}: {
  entry: UserDownloadEntry;
  bytes: Uint8Array;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const isTsStream =
    entry.mimeType === "video/mp2t" || /\.ts(\?|$)/i.test(entry.fileName || "");

  const handleSaveCopy = () => {
    const safeBytes = new Uint8Array(bytes);
    const blob = new Blob([safeBytes], {
      type: entry.mimeType || (isTsStream ? "video/mp2t" : "video/mp4"),
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = entry.fileName || "video-wotho.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    setVideoError(null);
    const safeBytes = new Uint8Array(bytes);
    const mediaBlob = new Blob([safeBytes], {
      type: entry.mimeType || (isTsStream ? "video/mp2t" : "video/mp4"),
    });
    const mediaUrl = URL.createObjectURL(mediaBlob);
    let hls: Hls | null = null;
    let manifestUrl: string | null = null;

    if (isTsStream && Hls.isSupported()) {
      const syntheticM3u8 = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:7200\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:7200.0,\n${mediaUrl}\n#EXT-X-ENDLIST\n`;
      const manifestBlob = new Blob([syntheticM3u8], {
        type: "application/vnd.apple.mpegurl",
      });
      manifestUrl = URL.createObjectURL(manifestBlob);
      hls = new Hls({ enableWorker: true });
      hls.loadSource(manifestUrl);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data?.fatal) {
          setVideoError(
            "Este arquivo .ts pode ser aberto em qualquer reprodutor de mídia (VLC/QuickTime). Clique em Salvar Cópia abaixo."
          );
        }
      });
    } else {
      videoEl.src = mediaUrl;
    }

    return () => {
      if (hls) hls.destroy();
      URL.revokeObjectURL(mediaUrl);
      if (manifestUrl) URL.revokeObjectURL(manifestUrl);
    };
  }, [bytes, entry.mimeType, isTsStream]);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-2 sm:p-4">
      <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border border-black/15 shadow-lg relative flex items-center justify-center">
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          onError={() =>
            setVideoError(
              "O codec deste arquivo não é decodificado diretamente pelo navegador. Salve a cópia para assistir no seu reprodutor local."
            )
          }
          className="w-full h-full object-contain"
        />
      </div>

      {videoError && (
        <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] text-center max-w-lg">
          {videoError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleSaveCopy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Salvar Cópia no Dispositivo
        </button>
        {entry.openHref && (
          <Link
            to={entry.openHref}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-black/10 dark:border-white/15 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ir para a Página da Obra
          </Link>
        )}
      </div>
    </div>
  );
}

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
  const [editTags, setEditTags] = useState<string[]>(() => parseGenreTags(profile.favoriteGenres));
  const [tagDraft, setTagDraft] = useState("");
  const [editLang, setEditLang] = useState<"pt" | "en">(profile.preferredLanguage);
  const [editTheme, setEditTheme] = useState<UserProfileData["preferredReaderTheme"]>(
    profile.preferredReaderTheme
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    document.title = "Meu Perfil — Wotho";
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
    setEditTags(parseGenreTags(next.favoriteGenres));
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

  const commitDraftTag = (rawValue: string) => {
    const additions = parseGenreTags(rawValue);
    if (additions.length === 0) return editTags;
    const merged = [...editTags];
    for (const tag of additions) {
      if (!merged.some((t) => t.toLowerCase() === tag.toLowerCase()) && merged.length < 12) {
        merged.push(tag);
      }
    }
    setEditTags(merged);
    setTagDraft("");
    return merged;
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraftTag(tagDraft);
    } else if (e.key === "Backspace" && !tagDraft && editTags.length > 0) {
      setEditTags((prev) => prev.slice(0, -1));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const finalTags = tagDraft.trim() ? commitDraftTag(tagDraft) : editTags;
      const updated = await saveUserProfile(
        {
          displayName: editName,
          bio: editBio,
          avatarUrl: editAvatar,
          favoriteGenres: finalTags.join(" · "),
          preferredLanguage: editLang,
          preferredReaderTheme: editTheme,
        },
        user
      );
      setProfile(updated);
      setEditTags(parseGenreTags(updated.favoriteGenres));
      toast.success("Alterações guardadas.");
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
        ? "Histórico limpo."
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
      if (entry.type === "book" && !entry.downloadUrl) {
        const matchedBook = books.find((b) => String(b.id) === String(entry.itemId));
        if (matchedBook) {
          const { downloadRealBook } = await import("@/lib/mediaDownloaders");
          await downloadRealBook({
            book: {
              id: String(matchedBook.id),
              title: matchedBook.title,
              author: matchedBook.author,
              category: matchedBook.category,
              description: matchedBook.description,
              cover_url: matchedBook.cover_url,
            },
          });
          toast.success(`"${entry.title}" transferido com sucesso.`);
          return;
        }
      }

      if (
        (entry.type === "manga" || entry.type === "webtoon" || entry.type === "cinema" || entry.type === "anime") &&
        !entry.downloadUrl
      ) {
        toast.info("Abra a página da obra para iniciar um novo download atualizado.");
        if (entry.openHref) navigate(entry.openHref);
        return;
      }

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
        mimeType: entry.mimeType,
        expectedFileSizeFormatted: entry.fileSizeFormatted,
      });
      toast.success(`"${entry.title}" transferido com sucesso.`);
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
        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 sm:px-6 py-4 transition-colors hover:bg-[#FAFAFC] dark:hover:bg-white/[0.02]"
      >
        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
          <Link
            to={entry.href}
            className="relative w-14 h-20 shrink-0 overflow-hidden rounded-lg border border-black/[0.065] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#2C2C2E]"
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
              <div className="w-full h-full flex items-center justify-center text-[#86868B]">
                {isVideo ? <Film className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#86868B]">
              <span>{TYPE_LABELS[entry.type]}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatRelativeTime(entry.timestamp)}</span>
              {entry.detailLabel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#1D1D1F] dark:text-[#F5F5F7] font-medium">
                    {entry.detailLabel}
                  </span>
                </>
              )}
            </div>

            <Link
              to={entry.href}
              className="block text-[15px] font-semibold tracking-[-0.01em] text-[#1D1D1F] dark:text-[#F5F5F7] hover:opacity-70 transition-opacity truncate"
            >
              {entry.title}
            </Link>

            {entry.subtitle && (
              <p className="text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] truncate">
                {entry.subtitle}
              </p>
            )}

            {typeof entry.progressPercent === "number" && (
              <div className="pt-1.5 max-w-xs flex items-center gap-3">
                <Progress
                  value={Math.max(4, Math.min(100, entry.progressPercent))}
                  className="h-1.5 flex-1 bg-[#EFEFF2] dark:bg-[#2C2C2E]"
                  indicatorClassName="bg-[#1D1D1F] dark:bg-[#F5F5F7]"
                />
                <span className="text-[11px] font-mono text-[#86868B] tabular-nums shrink-0">
                  {entry.progressPercent}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Link
            to={entry.href}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap shrink-0"
          >
            {isVideo ? (
              <>
                <Play className="w-3 h-3" />
                Continuar
              </>
            ) : (
              <>
                <BookOpen className="w-3 h-3" />
                Continuar
              </>
            )}
          </Link>
          <button
            type="button"
            onClick={() => handleRemoveEntry(entry.id, entry.title)}
            title="Remover do histórico"
            aria-label={`Remover ${entry.title} do histórico`}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[#86868B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const navTabs: Array<{
    id: ProfileSectionTab;
    label: string;
    count?: number;
  }> = [
    { id: "history", label: "Histórico", count: allHistory.length },
    {
      id: "downloads",
      label: downloadsStats.inProgressCount > 0 ? "Downloads · Ativo" : "Downloads",
      count: downloads.length,
    },
    { id: "reading", label: "Leituras", count: readingHistory.length },
    { id: "watching", label: "Cinema", count: watchingHistory.length },
    { id: "saved", label: "Estante", count: savedCatalog.length + purchases.length },
    { id: "reviews", label: "Avaliações", count: userReviews.length },
    { id: "settings", label: "Preferências" },
  ];

  const shelfTotalCount = savedCatalog.length + purchases.length + userReviews.length;

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#141416] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col">
      <Navigation variant="dark" />

      <main className="flex-1 w-full max-w-[980px] mx-auto px-5 sm:px-6 pt-28 pb-20">
        {/* 1. HERO IDENTITY & METRICS CARD */}
        <header className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[20px] p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.025)] mb-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5 sm:gap-6 min-w-0">
              <div className="relative h-[72px] w-[72px] sm:h-[76px] sm:w-[76px] rounded-full overflow-hidden border border-black/[0.065] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-[#2C2C2E] flex items-center justify-center shrink-0">
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
                  <span className="text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-[#1D1D1F] dark:text-[#F5F5F7] select-none">
                    {initials}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl sm:text-[34px] font-semibold tracking-[-0.035em] leading-[1.1] text-[#1D1D1F] dark:text-[#F5F5F7] text-balance">
                  {profile.displayName}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectTab("settings")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap shrink-0"
              >
                Editar Perfil
              </button>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-[13px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap shrink-0"
                >
                  Painel Editorial
                </Link>
              )}

              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-[13px] font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] transition-colors whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Iniciar Sessão
                </Link>
              )}
            </div>
          </div>

          {/* 5 Clean Metrics — 2 lines only (Value + Concise Label) */}
          <div className="mt-7 pt-6 border-t border-black/[0.065] dark:border-white/[0.08] grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { tab: "history" as const, value: allHistory.length, label: "Histórico" },
              { tab: "downloads" as const, value: downloadsStats.total, label: "Downloads" },
              { tab: "reading" as const, value: readingHistory.length, label: "Leituras" },
              { tab: "watching" as const, value: watchingHistory.length, label: "Cinema" },
              { tab: "saved" as const, value: shelfTotalCount, label: "Estante" },
            ].map((metric) => (
              <button
                key={metric.tab}
                type="button"
                onClick={() => handleSelectTab(metric.tab)}
                className="flex flex-col items-start gap-0.5 text-left group rounded-lg p-1 -m-1 hover:bg-[#F5F5F7]/70 dark:hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-[26px] font-semibold tracking-[-0.03em] leading-[1.15] text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                  {metric.value}
                </span>
                <span className="text-xs font-medium text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-[#F5F5F7] transition-colors">
                  {metric.label}
                </span>
              </button>
            ))}
          </div>
        </header>

        {/* 2. SEGMENTED CONTROL NAVIGATION (Zero Scrollbar) */}
        <nav
          aria-label="Seções do Perfil"
          className="flex items-center bg-[#EFEFF2] dark:bg-[#2C2C2E] p-1 rounded-[14px] mb-7 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {navTabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`flex-1 min-w-fit whitespace-nowrap shrink-0 px-3.5 py-2 text-[13px] font-medium rounded-[10px] transition-all duration-200 text-center ${
                  active
                    ? "bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]"
                    : "text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
                }`}
              >
                {tab.label}
                {typeof tab.count === "number" && (
                  <span className="ml-1 text-[11px] font-normal text-[#86868B] tabular-nums">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. TAB: HISTÓRICO */}
        {activeTab === "history" && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="mb-5">
              <h2 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                Histórico
              </h2>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-1 flex-wrap">
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
                    className={`px-3 py-1.5 text-[13px] font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
                      historyFilter === f.id
                        ? "bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F]"
                        : "text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-full pl-9 pr-8 py-2 text-[13px] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] outline-none focus:border-black/20 dark:focus:border-white/25 focus:ring-2 focus:ring-black/[0.06]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Limpar busca"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {filteredHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-[#6E6E73] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.025)] overflow-hidden">
              {filteredHistory.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] inline-flex items-center justify-center mb-3.5">
                    <Clock className="w-[18px] h-[18px]" />
                  </div>
                  <h3 className="text-base font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Nenhum registo encontrado
                  </h3>
                  <p className="text-[13px] text-[#86868B] mt-1 max-w-sm mx-auto">
                    Os itens aparecerão automaticamente aqui conforme as suas leituras e reproduções.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <Link
                      to="/livros"
                      className="px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap"
                    >
                      Explorar Livros
                    </Link>
                    <Link
                      to="/cinema"
                      className="px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap"
                    >
                      Explorar Cinema
                    </Link>
                    <Link
                      to="/animes"
                      className="px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap"
                    >
                      Explorar Animes
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.065] dark:divide-white/[0.08]">
                  {filteredHistory.map(renderHistoryCard)}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* 4. TAB: DOWNLOADS */}
        {activeTab === "downloads" && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-5">
              <h2 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                Downloads
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#86868B] tabular-nums">
                <span>
                  <strong className="text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold">
                    {downloadsStats.completedCount}
                  </strong>{" "}
                  concluídos
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold">
                    {downloadsStats.offlineCount}
                  </strong>{" "}
                  offline
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Volume{" "}
                  <strong className="text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold">
                    {downloadsStats.totalBytesFormatted}
                  </strong>
                </span>
              </div>
            </div>

            {/* Active Transfer / Recent Completion Visual Progress Banner */}
            {(inProgressDownloads.length > 0 || Object.keys(recentlyFinishedMap).length > 0) && (
              <div className="mb-4 rounded-[16px] border border-black/[0.065] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {inProgressDownloads.length > 0 ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-[#1D1D1F] dark:text-[#F5F5F7] shrink-0" />
                        <span>
                          {inProgressDownloads.length === 1
                            ? `Baixando "${inProgressDownloads[0].title}"...`
                            : `Baixando ${inProgressDownloads.length} arquivos...`}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                        <span>Download finalizado — arquivo salvo e pronto para abrir</span>
                      </>
                    )}
                  </div>
                  <span
                    className={`font-mono tabular-nums font-semibold ${
                      inProgressDownloads.length > 0
                        ? "text-[#1D1D1F] dark:text-[#F5F5F7]"
                        : "text-[#15803D] dark:text-[#4ADE80]"
                    }`}
                  >
                    {inProgressDownloads.length > 0 ? `${aggregateTransferProgress}%` : "100%"}
                  </span>
                </div>
                <Progress
                  value={inProgressDownloads.length > 0 ? aggregateTransferProgress : 100}
                  aria-label="Progresso geral de downloads"
                  className="h-2 bg-[#EFEFF2] dark:bg-[#2C2C2E]"
                  indicatorClassName={
                    inProgressDownloads.length > 0
                      ? "bg-[#1D1D1F] dark:bg-[#F5F5F7]"
                      : "bg-[#16A34A]"
                  }
                />
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-1 flex-wrap">
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
                  { id: "offline" as const, label: "Offline" },
                  { id: "failed" as const, label: "Com Falha" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setDownloadsFilter(f.id)}
                    className={`px-3 py-1.5 text-[13px] font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
                      downloadsFilter === f.id
                        ? "bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F]"
                        : "text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none" />
                  <input
                    type="text"
                    value={downloadsSearch}
                    onChange={(e) => setDownloadsSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-full pl-9 pr-8 py-2 text-[13px] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] outline-none focus:border-black/20 dark:focus:border-white/25 focus:ring-2 focus:ring-black/[0.06]"
                  />
                  {downloadsSearch && (
                    <button
                      type="button"
                      onClick={() => setDownloadsSearch("")}
                      aria-label="Limpar busca de downloads"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {downloads.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearDownloads}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-[#6E6E73] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.025)] overflow-hidden">
              {filteredDownloads.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] inline-flex items-center justify-center mb-3.5">
                    <Download className="w-[18px] h-[18px]" />
                  </div>
                  <h3 className="text-base font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {downloads.length === 0
                      ? "Nenhum registo encontrado"
                      : "Nenhum download corresponde ao filtro"}
                  </h3>
                  <p className="text-[13px] text-[#86868B] mt-1 max-w-sm mx-auto">
                    {downloads.length === 0
                      ? "Livros e PDFs transferidos ficarão disponíveis aqui para abertura imediata."
                      : "Tente limpar a busca ou selecionar outra categoria acima."}
                  </p>
                  <div className="mt-6 flex justify-center">
                    {downloads.length === 0 ? (
                      <Link
                        to="/livros"
                        className="px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap"
                      >
                        Explorar Livros & PDFs
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDownloadsFilter("all");
                          setDownloadsSearch("");
                        }}
                        className="px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors whitespace-nowrap"
                      >
                        Mostrar todos
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.065] dark:divide-white/[0.08]">
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
                        ? "Transferindo"
                        : "Falha ao transferir";

                    return (
                      <div
                        key={entry.id}
                        className="group flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-5 sm:px-6 py-4 transition-colors hover:bg-[#FAFAFC] dark:hover:bg-white/[0.02]"
                      >
                        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1 w-full">
                          <button
                            type="button"
                            onClick={() => handleOpenDownloadedFile(entry)}
                            className="relative w-14 h-20 shrink-0 overflow-hidden rounded-lg border border-black/[0.065] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#2C2C2E] text-left"
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
                              <div className="w-full h-full flex items-center justify-center text-[#86868B]">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                          </button>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#86868B]">
                              <span>{DOWNLOAD_TYPE_LABELS[entry.type] || "Arquivo"}</span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  entry.status === "failed"
                                    ? "text-[#DC2626] font-medium"
                                    : entry.status === "completed"
                                    ? "text-[#1D1D1F] dark:text-[#F5F5F7] font-medium"
                                    : "text-[#1D1D1F] dark:text-[#F5F5F7] font-medium"
                                }
                              >
                                {statusLabel}
                              </span>
                              {isCached && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-1 text-[#15803D] dark:text-[#4ADE80]">
                                    <HardDrive className="w-3 h-3" />
                                    Offline
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
                              className="block text-left text-[15px] font-semibold tracking-[-0.01em] text-[#1D1D1F] dark:text-[#F5F5F7] hover:opacity-70 transition-opacity truncate max-w-full"
                            >
                              {entry.title}
                            </button>

                            <p className="text-[13px] text-[#6E6E73] dark:text-[#A1A1A6] truncate">
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
                                className="h-1.5 bg-[#EFEFF2] dark:bg-[#2C2C2E]"
                                indicatorClassName={
                                  entry.status === "completed"
                                    ? "bg-[#16A34A]"
                                    : entry.status === "failed"
                                    ? "bg-[#DC2626]"
                                    : "bg-[#1D1D1F] dark:bg-[#F5F5F7]"
                                }
                              />
                              <div className="flex items-center justify-between gap-3 text-[11px] text-[#86868B]">
                                <span className="inline-flex items-center gap-1.5 truncate">
                                  {entry.status === "completed" && (
                                    <CheckCircle2 className="w-3 h-3 text-[#16A34A] shrink-0" />
                                  )}
                                  {entry.status === "failed" && (
                                    <AlertCircle className="w-3 h-3 text-[#DC2626] shrink-0" />
                                  )}
                                  {entry.status === "in_progress" && (
                                    <RotateCw className="w-3 h-3 animate-spin text-[#1D1D1F] dark:text-[#F5F5F7] shrink-0" />
                                  )}
                                  <span
                                    className={
                                      isRecentFinish
                                        ? "text-[#15803D] dark:text-[#4ADE80] font-medium truncate"
                                        : entry.status === "failed"
                                        ? "text-[#DC2626] truncate"
                                        : "truncate"
                                    }
                                  >
                                    {stageDescription}
                                  </span>
                                </span>
                                <span
                                  className={`font-mono tabular-nums shrink-0 font-medium ${
                                    entry.status === "completed"
                                      ? "text-[#15803D] dark:text-[#4ADE80]"
                                      : entry.status === "failed"
                                      ? "text-[#DC2626]"
                                      : "text-[#1D1D1F] dark:text-[#F5F5F7]"
                                  }`}
                                >
                                  {progressPct}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                          <button
                            type="button"
                            disabled={isOpening || entry.status === "in_progress"}
                            onClick={() => handleOpenDownloadedFile(entry)}
                            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-xs font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] disabled:opacity-45 transition-colors whitespace-nowrap shrink-0"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            {isOpening ? "Abrindo..." : "Abrir"}
                          </button>

                          <button
                            type="button"
                            disabled={isRedownloading || entry.status === "in_progress"}
                            onClick={() => handleRedownloadEntry(entry)}
                            title="Baixar arquivo novamente para o dispositivo"
                            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] disabled:opacity-45 transition-colors whitespace-nowrap shrink-0"
                          >
                            <RotateCw
                              className={`w-3 h-3 ${
                                isRedownloading || entry.status === "in_progress" ? "animate-spin" : ""
                              }`}
                            />
                            {isRedownloading || entry.status === "in_progress"
                              ? "Baixando..."
                              : entry.status === "failed"
                              ? "Tentar novamente"
                              : "Baixar novamente"}
                          </button>

                          {entry.openHref && (
                            <Link
                              to={entry.openHref}
                              title="Ir para a página da obra"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-colors shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveDownload(entry)}
                            title="Remover do histórico de downloads"
                            aria-label={`Remover ${entry.title} dos downloads`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[#86868B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* 5. TAB: LEITURAS */}
        {activeTab === "reading" && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                Leituras
              </h2>
              <Link
                to="/livros"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF2] dark:hover:bg-[#2C2C2E] transition-colors whitespace-nowrap shrink-0"
              >
                Biblioteca
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.025)] overflow-hidden">
              {readingHistory.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] inline-flex items-center justify-center mb-3.5">
                    <BookOpen className="w-[18px] h-[18px]" />
                  </div>
                  <h3 className="text-base font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Nenhum registo encontrado
                  </h3>
                  <p className="text-[13px] text-[#86868B] mt-1">
                    Livros, mangás e webtoons em leitura aparecerão aqui.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/livros"
                      className="inline-flex items-center px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors"
                    >
                      Explorar Livros
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.065] dark:divide-white/[0.08]">
                  {readingHistory.map(renderHistoryCard)}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* 6. TAB: CINEMA */}
        {activeTab === "watching" && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                Cinema
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  to="/cinema"
                  className="px-3.5 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF2] dark:hover:bg-[#2C2C2E] transition-colors whitespace-nowrap shrink-0"
                >
                  Cinema
                </Link>
                <Link
                  to="/animes"
                  className="px-3.5 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#EFEFF2] dark:hover:bg-[#2C2C2E] transition-colors whitespace-nowrap shrink-0"
                >
                  Animes
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.025)] overflow-hidden">
              {watchingHistory.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] inline-flex items-center justify-center mb-3.5">
                    <Tv className="w-[18px] h-[18px]" />
                  </div>
                  <h3 className="text-base font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Nenhum registo encontrado
                  </h3>
                  <p className="text-[13px] text-[#86868B] mt-1">
                    Filmes, séries e episódios assistidos aparecerão aqui.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Link
                      to="/cinema"
                      className="px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors"
                    >
                      Ver Filmes & Séries
                    </Link>
                    <Link
                      to="/animes"
                      className="px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition-colors"
                    >
                      Ver Animes
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.065] dark:divide-white/[0.08]">
                  {watchingHistory.map(renderHistoryCard)}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* 7. TAB: ESTANTE */}
        {activeTab === "saved" && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-[#1D1D1F] dark:text-[#F5F5F7] mb-5">
                Estante
              </h2>

              <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.025)] p-6 sm:p-7">
                {savedCatalog.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] inline-flex items-center justify-center mb-3.5">
                      <Bookmark className="w-[18px] h-[18px]" />
                    </div>
                    <h3 className="text-base font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                      Nenhum registo encontrado
                    </h3>
                    <p className="text-[13px] text-[#86868B] mt-1">
                      Obras salvas nos favoritos aparecerão organizadas aqui.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {savedCatalog.map((item) => (
                      <Link key={item.id} to={item.href} className="group flex flex-col space-y-2">
                        <div className="aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/[0.065] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#2C2C2E]">
                          {item.cover ? (
                            <img
                              src={item.cover}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#86868B]">
                              <Bookmark className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] text-[#86868B]">{item.badge}</p>
                          <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:opacity-70 transition-opacity line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] line-clamp-1">
                            {item.subtitle}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {purchases.length > 0 && (
              <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.025)] p-6 sm:p-7">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1D1D1F] dark:text-[#F5F5F7] mb-4">
                  Livros Adquiridos
                </h3>
                <div className="divide-y divide-black/[0.065] dark:divide-white/[0.08]">
                  {purchases.map((p) => {
                    const b = books.find((bk) => bk.id === p.book_id);
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                            {b?.title ?? "Livro"}
                          </p>
                          <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] truncate">
                            {b?.author} · {p.status === "paid" ? "Liberado para leitura" : "Em processamento"}
                          </p>
                        </div>
                        <Link
                          to={`/ler/${p.book_id}`}
                          className="px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] transition-colors whitespace-nowrap shrink-0"
                        >
                          Ler Obra
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* 8. TAB: AVALIAÇÕES */}
        {activeTab === "reviews" && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <h2 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-[#1D1D1F] dark:text-[#F5F5F7] mb-5">
              Avaliações
            </h2>

            <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.025)] overflow-hidden">
              {userReviews.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] inline-flex items-center justify-center mb-3.5">
                    <Star className="w-[18px] h-[18px]" />
                  </div>
                  <h3 className="text-base font-semibold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Nenhum registo encontrado
                  </h3>
                  <p className="text-[13px] text-[#86868B] mt-1">
                    Suas avaliações e críticas publicadas aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.065] dark:divide-white/[0.08]">
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
                      <div key={rev.id} className="px-6 py-5 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-[#86868B]">
                            <span className="capitalize">{rev.itemType}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7] font-medium">
                              Nota {rev.rating}/5
                            </span>
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
                            className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] underline underline-offset-4 hover:opacity-70"
                          >
                            Ver obra
                          </Link>
                        </div>
                        <h3 className="text-[15px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {rev.itemTitle}
                        </h3>
                        <p className="text-[13.5px] text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed max-w-3xl">
                          {rev.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* 9. TAB: PREFERÊNCIAS (Monochrome Spatial Settings) */}
        {activeTab === "settings" && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <h2 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-[#1D1D1F] dark:text-[#F5F5F7] mb-5">
              Preferências
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Card 1: Identidade Pública */}
              <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[20px] p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.025)] space-y-5">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Identidade Pública
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="profile-name"
                      className="block text-[12.5px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]"
                    >
                      Nome de Exibição
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={editName}
                      maxLength={100}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Seu nome completo ou apelido"
                      required
                      className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent rounded-[10px] px-3.5 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] outline-none transition-all focus:bg-white dark:focus:bg-[#1C1C1E] focus:border-black/15 dark:focus:border-white/25 focus:ring-2 focus:ring-black/[0.06]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="profile-avatar"
                      className="block text-[12.5px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]"
                    >
                      Foto de Perfil (URL opcional)
                    </label>
                    <input
                      id="profile-avatar"
                      type="url"
                      value={editAvatar}
                      maxLength={1000}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent rounded-[10px] px-3.5 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] outline-none transition-all focus:bg-white dark:focus:bg-[#1C1C1E] focus:border-black/15 dark:focus:border-white/25 focus:ring-2 focus:ring-black/[0.06]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="profile-bio"
                    className="block text-[12.5px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]"
                  >
                    Apresentação
                  </label>
                  <textarea
                    id="profile-bio"
                    rows={3}
                    maxLength={600}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Conte um pouco sobre as suas leituras, filmes e temas favoritos..."
                    className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent rounded-[10px] px-3.5 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] outline-none transition-all resize-y min-h-[82px] focus:bg-white dark:focus:bg-[#1C1C1E] focus:border-black/15 dark:focus:border-white/25 focus:ring-2 focus:ring-black/[0.06]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="profile-genres"
                    className="block text-[12.5px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]"
                  >
                    Gêneros & Temas (pressione Enter para adicionar)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent rounded-[10px] px-2.5 py-2 transition-all focus-within:bg-white dark:focus-within:bg-[#1C1C1E] focus-within:border-black/15 dark:focus-within:border-white/25 focus-within:ring-2 focus-within:ring-black/[0.06]">
                    {editTags.map((tag, idx) => (
                      <button
                        key={`${tag}-${idx}`}
                        type="button"
                        onClick={() => setEditTags((prev) => prev.filter((_, i) => i !== idx))}
                        title={`Remover ${tag}`}
                        className="inline-flex items-center gap-1.5 bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.1] px-2.5 py-1 rounded-full text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:border-black/20 dark:hover:border-white/25 transition-colors"
                      >
                        <span>{tag}</span>
                        <X className="w-3 h-3 text-[#86868B]" />
                      </button>
                    ))}
                    <input
                      id="profile-genres"
                      type="text"
                      value={tagDraft}
                      maxLength={80}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      onBlur={() => {
                        if (tagDraft.trim()) commitDraftTag(tagDraft);
                      }}
                      placeholder="Adicionar tema..."
                      className="flex-1 min-w-[140px] bg-transparent border-none outline-none px-1.5 py-1 text-[13.5px] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Áudio & Leitura */}
              <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.065] dark:border-white/[0.08] rounded-[20px] p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.025)] space-y-5">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Áudio & Leitura
                </h3>

                <div className="space-y-2">
                  <label className="block text-[12.5px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                    Idioma Padrão de Cinema & Animes
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: "pt" as const, label: "Português (Dublado PT-BR)" },
                      { id: "en" as const, label: "Áudio Original (Legendado)" },
                    ].map((opt) => {
                      const selected = editLang === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setEditLang(opt.id)}
                          className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-[10px] border text-[13.5px] font-medium text-left transition-all ${
                            selected
                              ? "bg-white dark:bg-[#1C1C1E] border-[#1D1D1F] dark:border-[#F5F5F7] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                              : "bg-[#F5F5F7] dark:bg-[#2C2C2E] border-black/[0.065] dark:border-white/[0.08] text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:border-black/15"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[12.5px] font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                    Tema do Leitor
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {READER_THEME_CHOICES.map((themeOpt) => {
                      const selected = editTheme === themeOpt.id;
                      return (
                        <button
                          key={themeOpt.id}
                          type="button"
                          onClick={() => setEditTheme(themeOpt.id)}
                          className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-[10px] border text-[13.5px] font-medium text-left transition-all ${
                            selected
                              ? "bg-white dark:bg-[#1C1C1E] border-[#1D1D1F] dark:border-[#F5F5F7] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                              : "bg-[#F5F5F7] dark:bg-[#2C2C2E] border-black/[0.065] dark:border-white/[0.08] text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:border-black/15"
                          }`}
                        >
                          <span className="truncate">{themeOpt.label}</span>
                          <span
                            aria-hidden="true"
                            className="w-3 h-3 rounded-full border border-black/20 dark:border-white/25 shrink-0"
                            style={{ backgroundColor: themeOpt.swatch }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectTab("history")}
                  className="px-4 py-2.5 rounded-full text-[13px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0"
                >
                  Voltar ao Histórico
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] text-[13px] font-medium hover:bg-[#333336] dark:hover:bg-[#E5E5EA] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSavingProfile ? "A guardar..." : "Guardar Alterações"}
                </button>
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
            {viewerState &&
              (isVideoDownloadEntry(viewerState.entry) ? (
                <DownloadedVideoViewer
                  entry={viewerState.entry}
                  bytes={viewerState.bytes}
                />
              ) : (
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
              ))}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Profile;
