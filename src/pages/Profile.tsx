import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Film,
  Tv,
  Newspaper,
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
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

type ProfileSectionTab = "history" | "reading" | "watching" | "saved" | "reviews" | "settings";

const TYPE_LABELS: Record<HistoryMediaType, string> = {
  book: "Livro",
  cinema: "Cinema & Série",
  anime: "Anime",
  manga: "Mangá",
  webtoon: "Webtoon",
  news: "Reportagem",
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

  const [activeTab, setActiveTab] = useState<ProfileSectionTab>("history");
  const [historyFilter, setHistoryFilter] = useState<HistoryMediaType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
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
    }
  }, [user]);

  useEffect(() => {
    const handleSync = () => {
      const next = getLocalUserProfile(user);
      setProfile(next);
      setRefreshTick((t) => t + 1);
    };
    window.addEventListener("worscoi_history_updated", handleSync);
    window.addEventListener("worscoi_profile_updated", handleSync);
    window.addEventListener("worscoi_watchlist_updated", handleSync);
    window.addEventListener("worscoi_reviews_updated", handleSync);
    return () => {
      window.removeEventListener("worscoi_history_updated", handleSync);
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
                onClick={() => setActiveTab("settings")}
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
          <div className="mt-10 pt-8 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Histórico Total</p>
              <p className="mt-1 font-display text-2xl sm:text-3xl tabular-nums text-foreground">
                {allHistory.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">obras acessadas</p>
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
                onClick={() => setActiveTab(tab.id)}
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
                  onClick={() => setActiveTab("history")}
                  className="text-xs"
                >
                  Voltar ao Histórico
                </Button>
              </div>
            </form>
          </motion.section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
