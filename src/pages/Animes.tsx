import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimeHero from "@/components/AnimeHero";
import AnimeCard, { AnimeGrid } from "@/components/AnimeCard";
import AnimePlayerModal from "@/components/AnimePlayerModal";
import AnimeSpotlightModal from "@/components/anime/AnimeSpotlightModal";
import ProtectedImage from "@/components/ProtectedImage";
import {
  ANIMES_DATA,
  ANIME_GENRES,
  Anime,
  getAnimeWatchlist,
} from "@/lib/animes";
import {
  getPhilosophicalMeta,
  isOriginalAnimationWork,
} from "@/lib/canonBridge";
import { useContentProtection } from "@/hooks/useContentProtection";
import {
  Search,
  Calendar,
  Film,
  Bookmark,
  Brain,
  ArrowRight,
  ArrowLeftRight,
  Star,
  Bell,
  BellRing,
  Command,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

const BROADCAST_DAYS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

const SIMULCAST_REMINDERS_KEY = "wotho_simulcast_reminders";

function getStoredReminders(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SIMULCAST_REMINDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const Animes = () => {
  useContentProtection();

  const [selectedGenre, setSelectedGenre] = useState("Tudo");
  const [filterMode, setFilterMode] = useState<
    "all" | "recent" | "deep" | "airing" | "completed" | "popular" | "watchlist" | "manga"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<(typeof BROADCAST_DAYS)[number]>("Sábado");
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [reminderIds, setReminderIds] = useState<string[]>(() => getStoredReminders());
  const [playerAnime, setPlayerAnime] = useState<Anime | null>(null);

  useEffect(() => {
    setWatchlistIds(getAnimeWatchlist());
    const handleWatchlistChange = () => setWatchlistIds(getAnimeWatchlist());
    window.addEventListener("worscoi_watchlist_updated", handleWatchlistChange);
    return () => window.removeEventListener("worscoi_watchlist_updated", handleWatchlistChange);
  }, []);

  // Global Cmd+K / Ctrl+K / "/" Spotlight shortcut
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      } else if (!isInput && e.key === "/") {
        e.preventDefault();
        setIsSpotlightOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const heroSlides = useMemo(() => {
    const preferredOrder = [
      "frieren-beyond-journeys-end",
      "one-piece",
      "orb-movements-of-the-earth",
      "solo-leveling",
      "steel-ball-run",
    ];
    const picked: Anime[] = [];
    for (const id of preferredOrder) {
      const found = ANIMES_DATA.find((a) => a.id === id);
      if (found) picked.push(found);
    }
    return picked.length > 0 ? picked : ANIMES_DATA.filter((a) => a.featured).slice(0, 5);
  }, []);

  const filteredAnimes = useMemo(() => {
    return ANIMES_DATA.filter((anime) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = anime.title.toLowerCase().includes(q);
        const matchesJap = anime.japaneseTitle.toLowerCase().includes(q);
        const matchesStudio = anime.studio.toLowerCase().includes(q);
        const matchesGenre = anime.genres.some((g) => g.toLowerCase().includes(q));
        if (!matchesTitle && !matchesJap && !matchesStudio && !matchesGenre) return false;
      }

      if (selectedGenre !== "Tudo") {
        if (!anime.genres.includes(selectedGenre)) return false;
      }

      if (filterMode === "recent" && !anime.isRecentTop) return false;
      if (filterMode === "deep" && !anime.isDeepPhilosophical) return false;
      if (filterMode === "airing" && anime.status !== "Em lançamento") return false;
      if (filterMode === "completed" && anime.status !== "Completo") return false;
      if (filterMode === "watchlist" && !watchlistIds.includes(anime.id)) return false;
      if (filterMode === "manga" && isOriginalAnimationWork(anime)) return false;

      return true;
    }).sort((a, b) => {
      if (filterMode === "popular") return b.ratingCount - a.ratingCount;
      if (filterMode === "recent") return b.year - a.year || b.rating - a.rating;
      return b.rating - a.rating;
    });
  }, [searchQuery, selectedGenre, filterMode, watchlistIds]);

  const topRanking = useMemo(() => {
    return [...ANIMES_DATA].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).slice(0, 8);
  }, []);

  const deepPhilosophicalList = useMemo(() => {
    return ANIMES_DATA.filter((a) => a.isDeepPhilosophical).slice(0, 6);
  }, []);

  const dayAnimes = useMemo(() => {
    return ANIMES_DATA.filter((a) => a.broadcastDay === activeDay);
  }, [activeDay]);

  const totalSeasonsCount = useMemo(
    () => ANIMES_DATA.reduce((acc, a) => acc + (a.seasons?.length || 1), 0),
    []
  );
  const totalEpisodesCount = useMemo(
    () => ANIMES_DATA.reduce((acc, a) => acc + a.episodesCount, 0),
    []
  );

  const toggleSimulcastReminder = (anime: Anime) => {
    setReminderIds((prev) => {
      const exists = prev.includes(anime.id);
      const next = exists ? prev.filter((id) => id !== anime.id) : [...prev, anime.id];
      try {
        localStorage.setItem(SIMULCAST_REMINDERS_KEY, JSON.stringify(next));
      } catch {}
      if (!exists) {
        toast.success(`Lembrete ativado para ${anime.title}`, {
          description: `Notificaremos você na exibição de ${anime.broadcastDay}.`,
        });
      } else {
        toast.info(`Lembrete removido de ${anime.title}`);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      {/* Atmospheric Hero Stage */}
      <AnimeHero
        item={heroSlides[0]}
        items={heroSlides}
        onPlayTrailer={(item) => setPlayerAnime(item)}
      />

      {/* Main Catalog Section */}
      <section id="catalogo-animes" className="py-12 lg:py-16">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Header + Command Spotlight Bar */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-xs text-muted-foreground mb-2 tabular-nums">
                Catálogo Oficial · {ANIMES_DATA.length} séries · {totalSeasonsCount} temporadas ·{" "}
                {totalEpisodesCount} episódios
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground text-balance">
                Catálogo de Animes & Mangás Sincronizados
              </h2>
            </div>

            {/* Dual Search + Spotlight Trigger */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filtrar catálogo por título ou estúdio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Limpar filtro"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsSpotlightOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary hover:bg-accent border border-border text-xs font-medium text-foreground transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title='Abrir Spotlight: busque por obra, "ep 4" ou "cap 8"'
              >
                <Command className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Spotlight</span>
                <kbd className="text-[10px] font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                  ⌘K
                </kbd>
              </button>
            </div>
          </div>

          {/* Segmented Mode Control */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-secondary/70 border border-border rounded-xl mb-5 w-fit max-w-full">
            {(
              [
                { id: "all", label: `Todos (${ANIMES_DATA.length})` },
                { id: "recent", label: "Mais Recentes" },
                { id: "deep", label: "Obras Profundas" },
                { id: "manga", label: "Anime ⇄ Mangá" },
                { id: "airing", label: "Em Lançamento" },
                { id: "completed", label: "Completos" },
                { id: "popular", label: "Populares" },
                { id: "watchlist", label: `Minha Lista (${watchlistIds.length})` },
              ] as const
            ).map((tab) => {
              const active = filterMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? "bg-card text-foreground shadow-sm border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Clean Single-Line Genre Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar border-b border-border/60">
            {ANIME_GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedGenre === genre
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Zero-Noise Catalog Grid */}
          {filteredAnimes.length === 0 ? (
            <div className="text-center py-20 px-4 border border-dashed border-border rounded-2xl">
              <Film className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-medium text-foreground mb-1">
                Nenhum anime encontrado
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                {filterMode === "watchlist"
                  ? "Você ainda não salvou nenhum anime na sua lista. Clique no marcador sobre o pôster para salvar favoritos."
                  : "Tente ajustar seus filtros de busca ou escolher outro gênero."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedGenre("Tudo");
                  setFilterMode("all");
                  setSearchQuery("");
                }}
                className="text-xs text-primary font-medium hover:underline cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            <AnimeGrid>
              {filteredAnimes.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  item={anime}
                  onOpenPlayer={(item) => setPlayerAnime(item)}
                />
              ))}
            </AnimeGrid>
          )}
        </div>
      </section>

      {/* Editorial Bento Showcase: Obras Profundas & Filosóficas */}
      <section className="py-16 border-t border-border/60 bg-secondary/25">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1.5">
                <Brain className="h-4 w-4" />
                <span>Curadoria Seinen, Filosófica & Psicológica</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground text-balance">
                Obras Profundas que Transformam a Visão de Mundo
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Narrativas densas sobre ciência, ética, memória, história e dilemas existenciais.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {deepPhilosophicalList.map((anime) => {
              const phil = getPhilosophicalMeta(anime);
              const original = isOriginalAnimationWork(anime);
              return (
                <article
                  key={anime.id}
                  className="group rounded-2xl bg-card border border-border p-4 sm:p-5 flex gap-4 sm:gap-5 hover:shadow-lg transition-all"
                >
                  <Link
                    to={`/animes/${anime.id}`}
                    className="w-24 sm:w-32 aspect-[2/3] rounded-xl overflow-hidden bg-accent shrink-0 border border-border/70"
                  >
                    <ProtectedImage
                      src={anime.cover}
                      alt={anime.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1 tabular-nums">
                        <span className="font-medium text-foreground/80">{phil.themeLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{anime.studio}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-0.5 text-amber-500 font-semibold">
                          <Star className="h-3 w-3 fill-current" />
                          {anime.rating.toFixed(1)}
                        </span>
                      </div>

                      <Link to={`/animes/${anime.id}`}>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {anime.title}
                        </h3>
                      </Link>

                      <blockquote className="mt-2 pt-2 border-t border-border/60 text-xs sm:text-sm italic text-foreground/85 leading-relaxed line-clamp-2">
                        {phil.quote}
                      </blockquote>
                      <p className="text-[11px] text-muted-foreground mt-1">{phil.authorNote}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-border/60">
                      <Link
                        to={`/animes/${anime.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        <span>Explorar obra completa</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      {!original && anime.manga?.chaptersCount ? (
                        <Link
                          to={`/animes/${anime.id}?tab=manga`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <ArrowLeftRight className="h-3 w-3" />
                          <span>Mangá ({anime.manga.chaptersCount} caps)</span>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sculptural Typographic Ranking (Clean Numeral Beside Poster, Zero Watermark on Art) */}
      <section className="py-16 border-t border-border/60">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mb-10">
            <p className="text-xs font-semibold text-primary mb-1.5">
              Ranking Editorial da Temporada
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Mais Assistidos na Wotho
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {topRanking.map((anime, index) => {
              const rankStr = String(index + 1).padStart(2, "0");
              const original = isOriginalAnimationWork(anime);
              return (
                <Link
                  key={anime.id}
                  to={`/animes/${anime.id}`}
                  className="group rounded-2xl bg-card border border-border p-3.5 flex items-center gap-3.5 hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <span className="text-3xl sm:text-4xl font-semibold tracking-tighter text-muted-foreground/40 group-hover:text-primary transition-colors tabular-nums w-10 text-center shrink-0">
                    {rankStr}
                  </span>

                  <div className="w-14 aspect-[2/3] rounded-lg overflow-hidden bg-accent shrink-0 border border-border/60">
                    <ProtectedImage
                      src={anime.cover}
                      alt={anime.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {anime.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
                      {anime.studio} · ★ {anime.rating.toFixed(1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1 tabular-nums">
                      {anime.episodesCount} eps{" "}
                      {!original && anime.manga?.chaptersCount
                        ? `· ${anime.manga.chaptersCount} caps`
                        : "· Original"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Simulcast Horizon */}
      <section className="py-16 bg-secondary/25 border-t border-border/60">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1.5">
                <Calendar className="h-4 w-4" />
                <span>Horizonte Simulcast Semanal</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                Calendário de Novos Episódios
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Ative lembretes com 1 clique para acompanhar estreias simultâneas com áudio e legendas em português.
            </p>
          </div>

          {/* Days Segmented Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-card border border-border rounded-xl mb-8 w-fit max-w-full">
            {BROADCAST_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeDay === day
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {dayAnimes.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-12">
              Nenhum episódio programado para exibição em {activeDay}.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayAnimes.map((anime) => {
                const reminded = reminderIds.includes(anime.id);
                return (
                  <div
                    key={anime.id}
                    className="flex items-center gap-4 p-3.5 bg-card border border-border rounded-xl hover:shadow-md transition-all"
                  >
                    <Link
                      to={`/animes/${anime.id}`}
                      className="w-14 aspect-[2/3] rounded-lg overflow-hidden shrink-0 border border-border/60"
                    >
                      <ProtectedImage
                        src={anime.cover}
                        alt={anime.title}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-primary tabular-nums">
                        {anime.broadcastDay} · {anime.seasons.length}{" "}
                        {anime.seasons.length === 1 ? "temporada" : "temporadas"}
                      </p>
                      <Link to={`/animes/${anime.id}`}>
                        <h4 className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors">
                          {anime.title}
                        </h4>
                      </Link>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
                        {anime.studio} · {anime.episodesCount} eps
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSimulcastReminder(anime)}
                      className={`h-9 px-3 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                        reminded
                          ? "bg-primary/15 border-primary text-primary"
                          : "bg-secondary hover:bg-accent border-border text-foreground"
                      }`}
                      title={reminded ? "Remover lembrete" : "Ativar lembrete de episódio"}
                    >
                      {reminded ? (
                        <>
                          <BellRing className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Ativo</span>
                        </>
                      ) : (
                        <>
                          <Bell className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Lembrar</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Cross-Promo Webtoons */}
      <section className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Explorar Origens em Webtoon & Mangá
              </h3>
              <p className="text-xs text-muted-foreground">
                Leia diretamente na plataforma as séries digitais e quadrinhos que originaram essas animações.
              </p>
            </div>
          </div>

          <Link
            to="/webtoons"
            className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-foreground/90 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Explorar Webtoons</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Modals */}
      <AnimePlayerModal
        anime={playerAnime}
        isOpen={!!playerAnime}
        onClose={() => setPlayerAnime(null)}
      />

      <AnimeSpotlightModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default Animes;
