import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Film,
  Tv,
  Search,
  Sparkles,
  Award,
  RotateCcw,
  Bookmark,
  X,
  Globe,
  Flame,
  Heart,
  Zap,
  ChevronDown,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  CINEMA_CATALOG,
  CINEMA_GENRES,
  CINEMA_LANGUAGE_OPTIONS,
  CinemaLanguage,
  ensureExpandedCinemaLoaded,
  getCinemaWatchlist,
  getCinemaProgressMap,
  getCinemaLanguagePreference,
  setCinemaLanguagePreference,
} from "@/lib/cinema";
import { CinemaHero } from "@/components/cinema/CinemaHero";
import { CinemaCard } from "@/components/cinema/CinemaCard";
import { useContentProtection } from "@/hooks/useContentProtection";
import { toast } from "sonner";

const PAGE_BATCH_SIZE = 48;

type CinemaTabType =
  | "all"
  | "filme"
  | "serie"
  | "doramas"
  | "juvenis"
  | "acao"
  | "romance"
  | "award"
  | "watchlist";

export const Cinema = () => {
  useContentProtection();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<CinemaTabType>("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("Todos");
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, { progressPercent: number }>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<CinemaLanguage>(() =>
    getCinemaLanguagePreference()
  );
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [isLoadingExpanded, setIsLoadingExpanded] = useState(() => CINEMA_CATALOG.length < 50);
  const [visibleCount, setVisibleCount] = useState(PAGE_BATCH_SIZE);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void ensureExpandedCinemaLoaded().then(() => {
      setCatalogVersion((v) => v + 1);
      setIsLoadingExpanded(false);
    });
    setWatchlistIds(getCinemaWatchlist());
    setProgressMap(getCinemaProgressMap());

    const handleWatchlist = () => setWatchlistIds(getCinemaWatchlist());
    const handleProgress = () => setProgressMap(getCinemaProgressMap());
    const handleLang = () => setSelectedLanguage(getCinemaLanguagePreference());
    const handleCatalogUpdated = () => {
      setCatalogVersion((v) => v + 1);
      setIsLoadingExpanded(false);
    };

    window.addEventListener("worscoi_cinema_watchlist_updated", handleWatchlist);
    window.addEventListener("worscoi_cinema_progress_updated", handleProgress);
    window.addEventListener("worscoi_cinema_language_updated", handleLang);
    window.addEventListener("worscoi_cinema_catalog_updated", handleCatalogUpdated);

    return () => {
      window.removeEventListener("worscoi_cinema_watchlist_updated", handleWatchlist);
      window.removeEventListener("worscoi_cinema_progress_updated", handleProgress);
      window.removeEventListener("worscoi_cinema_language_updated", handleLang);
      window.removeEventListener("worscoi_cinema_catalog_updated", handleCatalogUpdated);
    };
  }, []);

  // Reset batch pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_BATCH_SIZE);
  }, [search, selectedType, selectedGenre]);

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
  }, [catalogVersion]);

  // Dedicated Category Lists
  const moviesList = useMemo(
    () => CINEMA_CATALOG.filter((item) => item.type === "filme"),
    [catalogVersion]
  );
  const seriesList = useMemo(
    () => CINEMA_CATALOG.filter((item) => item.type === "serie"),
    [catalogVersion]
  );
  const doramasList = useMemo(
    () => CINEMA_CATALOG.filter((item) => item.genres.includes("Doramas")),
    [catalogVersion]
  );
  const youthList = useMemo(
    () => CINEMA_CATALOG.filter((item) => item.genres.includes("Séries Juvenis")),
    [catalogVersion]
  );
  const actionList = useMemo(
    () =>
      CINEMA_CATALOG.filter((item) =>
        item.genres.some((g) => g.toLowerCase() === "ação" || g.toLowerCase() === "acao")
      ),
    [catalogVersion]
  );
  const romanceList = useMemo(
    () => CINEMA_CATALOG.filter((item) => item.genres.includes("Romance")),
    [catalogVersion]
  );
  const scifiFantasyList = useMemo(
    () =>
      CINEMA_CATALOG.filter((item) =>
        item.genres.some((g) => {
          const low = g.toLowerCase();
          return low.includes("ficção") || low.includes("ficcao") || low === "fantasia";
        })
      ),
    [catalogVersion]
  );
  const thrillerCrimeList = useMemo(
    () =>
      CINEMA_CATALOG.filter((item) =>
        item.genres.some((g) => {
          const low = g.toLowerCase();
          return low === "suspense" || low === "crime" || low === "terror";
        })
      ),
    [catalogVersion]
  );
  const comedyAnimationList = useMemo(
    () =>
      CINEMA_CATALOG.filter((item) =>
        item.genres.some((g) => {
          const low = g.toLowerCase();
          return low.includes("comédia") || low.includes("comedia") || low.includes("animação") || low.includes("animacao");
        })
      ),
    [catalogVersion]
  );
  const awardList = useMemo(
    () => CINEMA_CATALOG.filter((item) => item.awardWinning),
    [catalogVersion]
  );

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

      // Type / Quick Tab Filter
      if (selectedType === "filme" && item.type !== "filme") return false;
      if (selectedType === "serie" && item.type !== "serie") return false;
      if (selectedType === "doramas" && !item.genres.includes("Doramas")) return false;
      if (selectedType === "juvenis" && !item.genres.includes("Séries Juvenis")) return false;
      if (
        selectedType === "acao" &&
        !item.genres.some((g) => g.toLowerCase() === "ação" || g.toLowerCase() === "acao")
      ) {
        return false;
      }
      if (selectedType === "romance" && !item.genres.includes("Romance")) return false;
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
    });
  }, [search, selectedType, selectedGenre, watchlistIds, catalogVersion]);

  const visibleCatalog = useMemo(
    () => filteredCatalog.slice(0, visibleCount),
    [filteredCatalog, visibleCount]
  );

  // Automatic progressive loading via IntersectionObserver
  useEffect(() => {
    const el = loadMoreTriggerRef.current;
    if (!el || visibleCount >= filteredCatalog.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_BATCH_SIZE, filteredCatalog.length));
        }
      },
      { rootMargin: "450px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, filteredCatalog.length]);

  // Continue Watching items
  const continueWatchingItems = useMemo(() => {
    return CINEMA_CATALOG.filter(
      (item) => progressMap[item.id] && progressMap[item.id].progressPercent > 0
    );
  }, [progressMap, catalogVersion]);

  const showShowcaseSections =
    selectedType === "all" && !search.trim() && selectedGenre === "Todos";

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-amber-400 selection:text-black">
      <Navigation variant="dark" />

      {/* Top Cinema Hero */}
      <CinemaHero item={heroItem} onPlay={(item) => navigate(`/cinema/${item.id}`)} />

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-6 lg:px-12 py-12 max-w-7xl">
        {/* Search, Language & Filter Header Bar */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium block mb-1">
              Cinema, Séries & Doramas • {CINEMA_CATALOG.length} Títulos Oficiais
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              Catálogo de Transmissão
            </h2>
            <p className="text-xs text-zinc-400 font-light mt-1">
              Explore {moviesList.length} filmes, {seriesList.length} séries completas,{" "}
              {doramasList.length} doramas e {youthList.length} séries juvenis (estilo Weak Hero) com
              todas as temporadas e episódios originais.
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
                placeholder="Buscar dorama, filme, série ou ator…"
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

        {/* Filter Controls: Segmented Type & Collection Selector */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {[
            { id: "all", label: `Tudo (${CINEMA_CATALOG.length})`, icon: Sparkles },
            { id: "doramas", label: `Doramas & K-Dramas (${doramasList.length})`, icon: Flame },
            { id: "juvenis", label: `Séries Juvenis & Weak Hero (${youthList.length})`, icon: Zap },
            { id: "acao", label: `Ação (${actionList.length})`, icon: Film },
            { id: "romance", label: `Romance (${romanceList.length})`, icon: Heart },
            { id: "filme", label: `Filmes (${moviesList.length})`, icon: Film },
            { id: "serie", label: `Séries (${seriesList.length})`, icon: Tv },
            { id: "award", label: `Premiados (${awardList.length})`, icon: Award },
            { id: "watchlist", label: `Minha Lista (${watchlistIds.length})`, icon: Bookmark },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id as CinemaTabType)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
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
                className={`text-xs px-3.5 py-1.5 rounded-md font-light whitespace-nowrap transition-colors cursor-pointer ${
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
        {continueWatchingItems.length > 0 && showShowcaseSections && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw className="h-4 w-4 text-amber-400" />
              <h3 className="text-base font-light text-white tracking-tight">
                Continuar Assistindo
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {continueWatchingItems.slice(0, 6).map((item) => (
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

        {/* Curated Showcase Row 1: Séries Juvenis & Ação Escolar (Estilo Weak Hero) */}
        {showShowcaseSections && youthList.length > 0 && (
          <section className="mb-14 pb-10 border-b border-zinc-800/80">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium block">
                  Ação Escolar, Sobrevivência & Juventude
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight mt-0.5">
                  Séries Juvenis do Estilo de Weak Hero
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedType("juvenis")}
                className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider font-normal"
              >
                Ver Todas ({youthList.length})
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {youthList.slice(0, 12).map((item) => (
                <CinemaCard
                  key={`youth-${item.id}`}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Curated Showcase Row 2: Doramas & K-Dramas em Destaque */}
        {showShowcaseSections && doramasList.length > 0 && (
          <section className="mb-14 pb-10 border-b border-zinc-800/80">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium block">
                  K-Dramas, C-Dramas & J-Dramas Completos
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight mt-0.5">
                  Doramas Aclamados (Dublados & Legendados)
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedType("doramas")}
                className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider font-normal"
              >
                Ver Todos ({doramasList.length})
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {doramasList.slice(0, 12).map((item) => (
                <CinemaCard
                  key={`dorama-${item.id}`}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Curated Showcase Row 3: Filmes e Séries de Romance */}
        {showShowcaseSections && romanceList.length > 0 && (
          <section className="mb-14 pb-10 border-b border-zinc-800/80">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium block">
                  Paixão, Drama & Comédia Romântica
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight mt-0.5">
                  Filmes e Séries de Romance
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedType("romance")}
                className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider font-normal"
              >
                Ver Todos ({romanceList.length})
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {romanceList.slice(0, 12).map((item) => (
                <CinemaCard
                  key={`romance-${item.id}`}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Curated Showcase Row 4: Filmes e Séries de Ação */}
        {showShowcaseSections && actionList.length > 0 && (
          <section className="mb-14 pb-10 border-b border-zinc-800/80">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium block">
                  Adrenalina, Artes Marciais & Blockbusters
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight mt-0.5">
                  Ação e Combate em Alta Definição
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedType("acao")}
                className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider font-normal"
              >
                Ver Todos ({actionList.length})
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {actionList.slice(0, 12).map((item) => (
                <CinemaCard
                  key={`action-${item.id}`}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Curated Showcase Row 5: Ficção Científica, Fantasia & Mundos Épicos */}
        {showShowcaseSections && scifiFantasyList.length > 0 && (
          <section className="mb-14 pb-10 border-b border-zinc-800/80">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium block">
                  Viagens Espaciais, Magia, Distopias & Universos Épicos
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight mt-0.5">
                  Ficção Científica & Fantasia
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGenre("Ficção Científica")}
                className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider font-normal"
              >
                Ver Todos ({scifiFantasyList.length})
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {scifiFantasyList.slice(0, 12).map((item) => (
                <CinemaCard
                  key={`scifi-${item.id}`}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Curated Showcase Row 6: Suspense, Crime, Mistério & Terror */}
        {showShowcaseSections && thrillerCrimeList.length > 0 && (
          <section className="mb-14 pb-10 border-b border-zinc-800/80">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium block">
                  Investigação, Thriller Psicológico, Máfia & Sobrenatural
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight mt-0.5">
                  Suspense, Crime & Terror
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGenre("Suspense")}
                className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider font-normal"
              >
                Ver Todos ({thrillerCrimeList.length})
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {thrillerCrimeList.slice(0, 12).map((item) => (
                <CinemaCard
                  key={`thriller-${item.id}`}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Curated Showcase Row 7: Comédia, Animação & Entretenimento */}
        {showShowcaseSections && comedyAnimationList.length > 0 && (
          <section className="mb-14 pb-10 border-b border-zinc-800/80">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium block">
                  Sitcoms Completas, Humor & Animações Aclamadas
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight mt-0.5">
                  Comédia & Animação
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGenre("Comédia")}
                className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider font-normal"
              >
                Ver Todos ({comedyAnimationList.length})
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {comedyAnimationList.slice(0, 12).map((item) => (
                <CinemaCard
                  key={`comedy-${item.id}`}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Complete Filtered Catalog Grid */}
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
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg sm:text-xl font-light text-white tracking-tight">
                  {selectedType === "all" && selectedGenre === "Todos" && !search
                    ? "Acervo Completo (Filmes, Séries e Doramas)"
                    : "Resultados do Catálogo"}
                </h3>
                <span className="text-xs text-zinc-400 font-light">
                  Exibindo <span className="text-white font-medium">{visibleCatalog.length}</span> de{" "}
                  <span className="text-white font-medium">{filteredCatalog.length}</span> títulos
                  disponíveis
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {visibleCatalog.map((item) => (
                <CinemaCard
                  key={item.id}
                  item={item}
                  onPlay={(item) => navigate(`/cinema/${item.id}`)}
                  showProgress={progressMap[item.id]?.progressPercent}
                />
              ))}
              {isLoadingExpanded &&
                Array.from({ length: 12 }).map((_, idx) => (
                  <div
                    key={`cinema-skel-${idx}`}
                    className="rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-800/80 animate-pulse"
                  >
                    <div className="aspect-[2/3] w-full bg-zinc-800/80" />
                    <div className="p-3 space-y-2">
                      <div className="h-3.5 bg-zinc-800 rounded w-4/5" />
                      <div className="h-2.5 bg-zinc-800/70 rounded w-1/2" />
                    </div>
                  </div>
                ))}
            </div>

            {visibleCount < filteredCatalog.length && (
              <div ref={loadMoreTriggerRef} className="mt-10 flex flex-col items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setVisibleCount((prev) =>
                      Math.min(prev + PAGE_BATCH_SIZE, filteredCatalog.length)
                    )
                  }
                  className="rounded-full px-6 py-2.5 text-xs uppercase tracking-wider border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white"
                >
                  <ChevronDown className="h-4 w-4 mr-2 text-amber-400" />
                  Mostrar mais títulos ({filteredCatalog.length - visibleCount} restantes)
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Cinema;
