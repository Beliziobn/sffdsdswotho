import { useState, useMemo, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimeHero from "@/components/AnimeHero";
import AnimeCard, { AnimeGrid } from "@/components/AnimeCard";
import AnimePlayerModal from "@/components/AnimePlayerModal";
import {
  ANIMES_DATA,
  ANIME_GENRES,
  Anime,
  getAnimeWatchlist,
} from "@/lib/animes";
import { useContentProtection } from "@/hooks/useContentProtection";
import { Search, Flame, Calendar, Film, Bookmark, Sparkles, Brain, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const BROADCAST_DAYS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

export const Animes = () => {
  useContentProtection();

  const [selectedGenre, setSelectedGenre] = useState("Tudo");
  const [filterMode, setFilterMode] = useState<
    "all" | "recent" | "deep" | "airing" | "completed" | "popular" | "watchlist" | "manga"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDay, setActiveDay] = useState<typeof BROADCAST_DAYS[number]>("Sábado");
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [playerAnime, setPlayerAnime] = useState<Anime | null>(null);

  useEffect(() => {
    setWatchlistIds(getAnimeWatchlist());
    const handleWatchlistChange = () => setWatchlistIds(getAnimeWatchlist());
    window.addEventListener("worscoi_watchlist_updated", handleWatchlistChange);
    return () => window.removeEventListener("worscoi_watchlist_updated", handleWatchlistChange);
  }, []);

  const featuredAnime = useMemo(() => {
    return ANIMES_DATA.find((a) => a.featured) ?? ANIMES_DATA[0];
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
      if (filterMode === "manga" && (!anime.manga || anime.manga.chapters.length === 0)) return false;

      return true;
    }).sort((a, b) => {
      if (filterMode === "popular") return b.ratingCount - a.ratingCount;
      if (filterMode === "recent") return b.year - a.year || b.rating - a.rating;
      return b.rating - a.rating;
    });
  }, [searchQuery, selectedGenre, filterMode, watchlistIds]);

  const topRanking = useMemo(() => {
    return [...ANIMES_DATA]
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
      .slice(0, 8);
  }, []);

  const deepPhilosophicalList = useMemo(() => {
    return ANIMES_DATA.filter((a) => a.isDeepPhilosophical).slice(0, 8);
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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      {/* Featured Anime Hero */}
      <AnimeHero item={featuredAnime} onPlayTrailer={(item) => setPlayerAnime(item)} />

      {/* Main Catalog Section */}
      <section id="catalogo-animes" className="py-12 lg:py-16">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Top Bar with Title and Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider mb-2 font-medium">
                <Film className="h-4 w-4" />
                <span>
                  Catálogo Oficial • {ANIMES_DATA.length} Séries • {totalSeasonsCount} Temporadas •{" "}
                  {totalEpisodesCount} Episódios
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-foreground">
                Séries, Obras Profundas, Temporadas & Top Lançamentos Atuais
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar anime, gênero ou estúdio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-card border border-border rounded-full focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-4 mb-4 border-b border-border text-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                filterMode === "all"
                  ? "bg-foreground text-background font-medium"
                  : "bg-accent/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({ANIMES_DATA.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("recent")}
              className={`px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                filterMode === "recent"
                  ? "bg-primary text-white font-medium"
                  : "bg-accent/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Top Mais Recentes</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("deep")}
              className={`px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                filterMode === "deep"
                  ? "bg-primary text-white font-medium"
                  : "bg-accent/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              <span>Obras Profundas & Filosóficas</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("airing")}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                filterMode === "airing"
                  ? "bg-foreground text-background font-medium"
                  : "bg-accent/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Em Lançamento
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("popular")}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                filterMode === "popular"
                  ? "bg-foreground text-background font-medium"
                  : "bg-accent/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Mais Populares
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("completed")}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                filterMode === "completed"
                  ? "bg-foreground text-background font-medium"
                  : "bg-accent/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              Completos
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("manga")}
              className={`px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                filterMode === "manga"
                  ? "bg-foreground text-background font-medium"
                  : "bg-accent/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Com Mangá para Ler</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("watchlist")}
              className={`px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                filterMode === "watchlist"
                  ? "bg-foreground text-background font-medium"
                  : "bg-accent/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bookmark className="h-3 w-3" />
              Minha Lista ({watchlistIds.length})
            </button>
          </div>

          {/* Genre Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
            {ANIME_GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`text-[11px] uppercase tracking-wider font-light px-3.5 py-1.5 rounded-full whitespace-nowrap border transition-all ${
                  selectedGenre === genre
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card text-foreground/80 border-border hover:bg-accent"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Anime Grid */}
          {filteredAnimes.length === 0 ? (
            <div className="text-center py-20 px-4 border border-dashed border-border rounded-xl">
              <Film className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-medium text-foreground mb-1">
                Nenhum anime encontrado
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4 font-light">
                {filterMode === "watchlist"
                  ? "Você ainda não salvou nenhum anime na sua lista. Clique no ícone de marcador para salvar seus favoritos!"
                  : "Tente ajustar seus filtros de busca ou escolher outro gênero."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedGenre("Tudo");
                  setFilterMode("all");
                  setSearchQuery("");
                }}
                className="text-xs text-primary font-medium hover:underline"
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

      {/* Curadoria Especial: Obras Profundas, Filosóficas & Psicológicas */}
      <section className="py-16 bg-accent/30 border-t border-border/60">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-primary font-medium mb-1">
                <Brain className="h-4 w-4" />
                <span>Curadoria Seinen, Filosófica & Psicológica</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-foreground">
                Obras Profundas que Transformam a Visão de Mundo
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-light max-w-md">
              Narrativas densas sobre ciência, ética, história, natureza humana e dilemas existenciais.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {deepPhilosophicalList.map((anime) => (
              <AnimeCard
                key={anime.id}
                item={anime}
                onOpenPlayer={(item) => setPlayerAnime(item)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Top 8 Ranking em Alta */}
      <section className="py-16 bg-secondary/40 border-y border-border/50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-primary font-medium mb-1">
                <Flame className="h-4 w-4" />
                <span>Ranking Oficial Atualizado</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-foreground">
                Top 8 Animes Mais Assistidos da Temporada
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topRanking.map((anime, index) => (
              <AnimeCard
                key={anime.id}
                item={anime}
                rank={index + 1}
                onOpenPlayer={(item) => setPlayerAnime(item)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Simulcast / Grade de Lançamento Semanal */}
      <section className="py-16">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider text-primary font-medium mb-2">
              <Calendar className="h-4 w-4" />
              <span>Simulcast Semanal</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-2">
              Calendário de Novos Episódios
            </h2>
            <p className="text-xs text-muted-foreground font-light">
              Acompanhe as estreias semanais simultâneas com legendas e dublagens em português.
            </p>
          </div>

          {/* Days bar */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8">
            {BROADCAST_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeDay === day
                    ? "bg-foreground text-background shadow-soft"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {dayAnimes.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-10 font-light">
              Nenhum episódio programado para exibição em {activeDay}.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {dayAnimes.map((anime) => (
                <div
                  key={anime.id}
                  className="flex items-center gap-4 p-3 bg-card border border-border rounded-xl shadow-soft hover:shadow-md transition-shadow"
                >
                  <img
                    src={anime.cover}
                    alt={anime.title}
                    className="w-16 h-22 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-primary font-medium">
                      Exibição às {anime.broadcastDay}s • {anime.seasons.length}{" "}
                      {anime.seasons.length === 1 ? "Temp." : "Temps."}
                    </span>
                    <h4 className="text-sm font-medium text-foreground truncate">{anime.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {anime.studio} • {anime.episodesCount} eps
                    </p>
                    <Link
                      to={`/animes/${anime.id}`}
                      className="text-xs text-primary font-light hover:underline inline-block mt-1"
                    >
                      Acessar temporadas →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cross-Promo Webtoons & Mangás */}
      <section className="py-12 bg-accent/40 border-t border-border">
        <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground">
                Gosta de ler a história original?
              </h3>
              <p className="text-xs text-muted-foreground font-light">
                Explore também os Webtoons e Mangás que inspiraram essas grandes animações na Worscoi.
              </p>
            </div>
          </div>

          <Link
            to="/webtoons"
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider hover:bg-foreground/90 transition-colors whitespace-nowrap shadow-soft"
          >
            Explorar Webtoons
          </Link>
        </div>
      </section>

      {/* Trailer & Player Modal */}
      <AnimePlayerModal
        anime={playerAnime}
        isOpen={!!playerAnime}
        onClose={() => setPlayerAnime(null)}
      />

      <Footer />
    </div>
  );
};

export default Animes;
