import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  Tv,
  Star,
  Search,
  Sparkles,
  Award,
  Play,
  RotateCcw,
  Bookmark,
  TrendingUp,
  X,
  Clock,
  Layers,
  Globe,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  CINEMA_CATALOG,
  CINEMA_GENRES,
  CINEMA_LANGUAGE_OPTIONS,
  CinemaItem,
  CinemaLanguage,
  getCinemaWatchlist,
  getCinemaProgressMap,
  getCinemaLanguagePreference,
  setCinemaLanguagePreference,
} from "@/lib/cinema";
import { CinemaHero } from "@/components/cinema/CinemaHero";
import { CinemaCard } from "@/components/cinema/CinemaCard";
import { useContentProtection } from "@/hooks/useContentProtection";
import { toast } from "sonner";

export const Cinema = () => {
  useContentProtection();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "filme" | "serie" | "award" | "watchlist">("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("Todos");
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, { progressPercent: number }>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<CinemaLanguage>(() =>
    getCinemaLanguagePreference()
  );

  useEffect(() => {
    setWatchlistIds(getCinemaWatchlist());
    setProgressMap(getCinemaProgressMap());

    const handleWatchlist = () => setWatchlistIds(getCinemaWatchlist());
    const handleProgress = () => setProgressMap(getCinemaProgressMap());
    const handleLang = () => setSelectedLanguage(getCinemaLanguagePreference());

    window.addEventListener("worscoi_cinema_watchlist_updated", handleWatchlist);
    window.addEventListener("worscoi_cinema_progress_updated", handleProgress);
    window.addEventListener("worscoi_cinema_language_updated", handleLang);

    return () => {
      window.removeEventListener("worscoi_cinema_watchlist_updated", handleWatchlist);
      window.removeEventListener("worscoi_cinema_progress_updated", handleProgress);
      window.removeEventListener("worscoi_cinema_language_updated", handleLang);
    };
  }, []);

  const handleLanguageChange = (lang: CinemaLanguage) => {
    setSelectedLanguage(lang);
    setCinemaLanguagePreference(lang);
    toast.success(
      lang === "pt"
        ? "Idioma padrão do Cinema definido para Português (PT-BR)"
        : "Cinema default language set to English (EN)"
    );
  };

  // Top hero item
  const heroItem = useMemo(() => {
    return CINEMA_CATALOG.find((c) => c.featured) || CINEMA_CATALOG[0];
  }, []);

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    return CINEMA_CATALOG.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesOrig = item.originalTitle.toLowerCase().includes(q);
        const matchesDirector = item.director.toLowerCase().includes(q);
        const matchesCast = item.cast.some((actor) => actor.toLowerCase().includes(q));
        const matchesGenre = item.genres.some((g) => g.toLowerCase().includes(q));
        if (!matchesTitle && !matchesOrig && !matchesDirector && !matchesCast && !matchesGenre) {
          return false;
        }
      }

      // Type Filter
      if (selectedType === "filme" && item.type !== "filme") return false;
      if (selectedType === "serie" && item.type !== "serie") return false;
      if (selectedType === "award" && !item.awardWinning) return false;
      if (selectedType === "watchlist" && !watchlistIds.includes(item.id)) return false;

      // Genre Filter (case-insensitive & accent-tolerant)
      if (selectedGenre !== "Todos") {
        const normTarget = selectedGenre
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        const hasGenre = item.genres.some((g) => {
          const normG = g
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
          return normG === normTarget || normG.includes(normTarget.slice(0, 5));
        });
        if (!hasGenre) return false;
      }

      return true;
    }).sort((a, b) => b.rating - a.rating);
  }, [search, selectedType, selectedGenre, watchlistIds]);

  // Continue Watching items
  const continueWatchingItems = useMemo(() => {
    return CINEMA_CATALOG.filter((item) => progressMap[item.id] && progressMap[item.id].progressPercent > 0);
  }, [progressMap]);

  // Movies list
  const moviesList = useMemo(() => {
    return CINEMA_CATALOG.filter((item) => item.type === "filme");
  }, []);

  // Series list
  const seriesList = useMemo(() => {
    return CINEMA_CATALOG.filter((item) => item.type === "serie");
  }, []);

  // Award winning list
  const awardList = useMemo(() => {
    return CINEMA_CATALOG.filter((item) => item.awardWinning);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-amber-400 selection:text-black">
      <Navigation variant="dark" />

      {/* Top Cinema Hero */}
      <CinemaHero item={heroItem} onPlay={(item) => navigate(`/cinema/${item.id}`)} />

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-6 lg:px-12 py-12 max-w-7xl">
        {/* Search, Language & Filter Header Bar */}
        <div className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium block mb-1">
              Cinema & Séries • {CINEMA_CATALOG.length} Títulos Oficiais
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              Catálogo de Transmissão
            </h2>
            <p className="text-xs text-zinc-400 font-light mt-1">
              Explore {moviesList.length} filmes e {seriesList.length} séries desde os lançamentos mais recentes até os mais aclamados em Português (PT-BR) ou Inglês (EN).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Dual Language Selector (Português | Inglês) */}
            <div className="flex items-center justify-between sm:justify-start bg-zinc-900 border border-zinc-800 rounded-full p-1">
              <div className="flex items-center gap-1.5 pl-2.5 pr-2 text-xs text-zinc-400">
                <Globe className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-medium">Idioma:</span>
              </div>
              <div className="flex items-center gap-1">
                {CINEMA_LANGUAGE_OPTIONS.map((langOpt) => (
                  <button
                    key={langOpt.id}
                    type="button"
                    onClick={() => handleLanguageChange(langOpt.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                      selectedLanguage === langOpt.id
                        ? "bg-amber-400 text-black shadow-sm"
                        : "text-zinc-300 hover:text-white hover:bg-white/5"
                    }`}
                    title={langOpt.audioDescription}
                  >
                    {langOpt.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 lg:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, ator ou diretor…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-9 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Controls: Segmented Type Selector */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {[
            { id: "all", label: `Tudo (${CINEMA_CATALOG.length})`, icon: Sparkles },
            { id: "filme", label: `Filmes (${moviesList.length})`, icon: Film },
            { id: "serie", label: `Séries (${seriesList.length})`, icon: Tv },
            { id: "award", label: `Obras Premiadas (${awardList.length})`, icon: Award },
            { id: "watchlist", label: `Minha Lista (${watchlistIds.length})`, icon: Bookmark },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  active
                    ? "bg-white text-black shadow-md"
                    : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-black" : "text-amber-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Genre Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-10 no-scrollbar">
          {CINEMA_GENRES.map((genre) => {
            const active = selectedGenre === genre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`text-xs px-3.5 py-1.5 rounded-md font-light whitespace-nowrap transition-colors ${
                  active
                    ? "bg-amber-400/15 text-amber-300 font-medium border border-amber-400/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>

        {/* Continue Watching Section (if any exists) */}
        {continueWatchingItems.length > 0 && selectedType === "all" && !search && selectedGenre === "Todos" && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw className="h-4 w-4 text-amber-400" />
              <h3 className="text-base font-light text-white tracking-tight">Continuar Assistindo</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {continueWatchingItems.map((item) => (
                <CinemaCard
                  key={`continue-${item.id}`}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent || 50}
                />
              ))}
            </div>
          </section>
        )}

        {/* Filtered Grid or Empty State */}
        {filteredCatalog.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-zinc-800 rounded-xl">
            <Film className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-300 font-light mb-1">Nenhum título encontrado.</p>
            <p className="text-xs text-zinc-500 font-light max-w-sm mx-auto mb-5">
              Tente redefinir os filtros de gênero ou termo de pesquisa.
            </p>
            <Button
              onClick={() => {
                setSearch("");
                setSelectedType("all");
                setSelectedGenre("Todos");
              }}
              variant="outline"
              size="sm"
              className="rounded-full text-xs text-white border-zinc-700"
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-400 font-light">
                Exibindo <span className="text-white font-medium">{filteredCatalog.length}</span> títulos disponíveis
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {filteredCatalog.map((item) => (
                <CinemaCard
                  key={item.id}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent}
                />
              ))}
            </div>
          </div>
        )}

        {/* Dedicated Section: Filmes em Destaque */}
        {selectedType === "all" && !search && selectedGenre === "Todos" && (
          <section className="mt-16 pt-12 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium block">
                  Longas-Metragens
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight mt-0.5">
                  Filmes Consagrados
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedType("filme")}
                className="text-xs text-zinc-400 hover:text-white uppercase tracking-wider font-normal"
              >
                Ver Todos os Filmes
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {moviesList.slice(0, 6).map((item) => (
                <CinemaCard
                  key={`film-${item.id}`}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Dedicated Section: Séries em Destaque */}
        {selectedType === "all" && !search && selectedGenre === "Todos" && (
          <section className="mt-16 pt-12 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium block">
                  Produções Seriadas
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight mt-0.5">
                  Séries Aclamadas
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedType("serie")}
                className="text-xs text-zinc-400 hover:text-white uppercase tracking-wider font-normal"
              >
                Ver Todas as Séries
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {seriesList.slice(0, 6).map((item) => (
                <CinemaCard
                  key={`serie-${item.id}`}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Cinema;
