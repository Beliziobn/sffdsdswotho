import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Play,
  ArrowLeft,
  Bookmark,
  Share2,
  Star,
  Clock,
  Film,
  ChevronRight,
  Check,
  Volume2,
  Shield,
  Layers,
  ExternalLink,
  Download,
  Loader2,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  getCinemaById,
  CINEMA_CATALOG,
  CinemaLanguage,
  getCinemaLanguagePreference,
  setCinemaLanguagePreference,
  toggleCinemaWatchlist,
  isCinemaInWatchlist,
  saveCinemaProgress,
  prefetchCinemaStream,
  CinemaItem,
  CinemaEpisode,
} from "@/lib/cinema";
import { WorscoCinemaPlayer } from "@/components/cinema/WorscoCinemaPlayer";
import { CinemaCard } from "@/components/cinema/CinemaCard";
import { useContentProtection } from "@/hooks/useContentProtection";
import { usePlayerAdBlock } from "@/hooks/usePlayerAdBlock";
import { downloadRealCinemaVideo } from "@/lib/mediaDownloaders";
import { toast } from "sonner";

export default function CinemaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useContentProtection();
  usePlayerAdBlock(true);
  const playerStageRef = useRef<HTMLDivElement>(null);

  const [item, setItem] = useState<CinemaItem | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<CinemaLanguage>(() =>
    getCinemaLanguagePreference()
  );
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState<number>(1);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  useEffect(() => {
    const handleLangUpdate = (e: Event) => {
      const detail = (e as CustomEvent<CinemaLanguage>).detail;
      if (detail === "pt" || detail === "en") {
        setSelectedLanguage(detail);
      } else {
        setSelectedLanguage(getCinemaLanguagePreference());
      }
    };
    window.addEventListener("worscoi_cinema_language_updated", handleLangUpdate);
    return () =>
      window.removeEventListener("worscoi_cinema_language_updated", handleLangUpdate);
  }, []);

  const handleSelectLanguage = (lang: CinemaLanguage) => {
    setSelectedLanguage(lang);
    setCinemaLanguagePreference(lang);
  };

  useEffect(() => {
    if (!id) return;
    const found = getCinemaById(id);
    if (found) {
      setItem(found);
      setInWatchlist(isCinemaInWatchlist(found.id));
      if (found.seasons && found.seasons.length > 0) {
        setSelectedSeasonNumber(found.seasons[0].seasonNumber);
        if (found.seasons[0].episodes.length > 0) {
          setSelectedEpisodeNumber(found.seasons[0].episodes[0].episodeNumber);
        }
      } else {
        setSelectedEpisodeNumber(1);
      }
      const pageTitle = `${found.title} (${found.year}) — Cinema Wotho`;
      document.title = pageTitle;
      const desc =
        found.synopsis ||
        `Assista ${found.title} (${found.year}) em alta definição na Wotho.`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", desc);
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", pageTitle);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", desc);
      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute("content", pageTitle);
      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute("content", desc);
      window.scrollTo(0, 0);
    } else {
      setItem(null);
    }
  }, [id]);

  useEffect(() => {
    if (!item) return;
    const detailLabel =
      item.type === "serie"
        ? `Temporada ${selectedSeasonNumber} · Episódio ${selectedEpisodeNumber}`
        : `Filme (${item.year}) · Dublado PT-BR`;
    import("@/lib/userProfileStore").then(({ recordUserHistory }) => {
      recordUserHistory({
        itemId: item.id,
        type: "cinema",
        title: item.title,
        subtitle: `${item.type === "filme" ? "Filme" : "Série"} · ${item.director}`,
        cover: item.posterUrl || item.backdropUrl,
        href: `/cinema/${item.id}`,
        progressPercent: 25,
        detailLabel,
      });
    }).catch(() => {});
  }, [item, selectedSeasonNumber, selectedEpisodeNumber]);

  if (!item) {
    return (
      <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col">
        <Navigation variant="dark" />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Film className="w-16 h-16 text-zinc-600 mb-4 animate-pulse" />
          <h1 className="text-2xl font-serif text-zinc-100 mb-2">Título não encontrado</h1>
          <p className="text-zinc-400 text-sm max-w-md mb-6">
            O filme ou série que você está procurando pode ter sido removido ou o link está incorreto.
          </p>
          <button
            onClick={() => navigate("/cinema")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black font-semibold text-sm rounded hover:bg-amber-400 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Cinema
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const handleToggleWatchlist = () => {
    const nextState = toggleCinemaWatchlist(item.id);
    setInWatchlist(nextState);
    toast.success(
      nextState
        ? `"${item.title}" foi adicionado à sua lista`
        : `"${item.title}" foi removido da sua lista`
    );
  };

  const handleShare = async () => {
    const shareData = {
      title: `${item.title} — Cinema Wotho`,
      text: item.synopsis,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const handlePlayEpisode = (ep: CinemaEpisode) => {
    setSelectedEpisodeNumber(ep.episodeNumber);
    saveCinemaProgress(item.id, 35, selectedSeasonNumber, ep.episodeNumber);
    playerStageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDownloadCinema = async (ep?: CinemaEpisode) => {
    if (!item) return;
    const epNum = item.type === "serie" ? ep?.episodeNumber ?? selectedEpisodeNumber : 1;
    const key = `${item.id}-${selectedSeasonNumber}-${epNum}`;
    if (downloadingKey) return;
    setDownloadingKey(key);
    const toastId = toast.loading(
      item.type === "serie"
        ? `Preparando download de T${selectedSeasonNumber}E${epNum}...`
        : `Preparando download de "${item.title}"...`
    );
    try {
      await downloadRealCinemaVideo({
        item,
        language: selectedLanguage,
        seasonNumber: selectedSeasonNumber,
        episodeNumber: epNum,
        episodeTitle: ep?.title || activeEpisode?.title,
      });
      toast.success("Download concluído! Acesse e assista em Meu Perfil → Downloads.", {
        id: toastId,
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível baixar este vídeo no momento.",
        { id: toastId }
      );
    } finally {
      setDownloadingKey(null);
    }
  };

  const currentSeason =
    item.seasons?.find((s) => s.seasonNumber === selectedSeasonNumber) || item.seasons?.[0];
  const episodesList = currentSeason?.episodes || [];
  const activeEpisode =
    episodesList.find((e) => e.episodeNumber === selectedEpisodeNumber) || episodesList[0];

  const displayTitle =
    selectedLanguage === "en" && item.originalTitle ? item.originalTitle : item.title;

  const relatedItems = CINEMA_CATALOG.filter(
    (other) =>
      other.id !== item.id &&
      (other.type === item.type || other.genres.some((g) => item.genres.includes(g)))
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col selection:bg-amber-500/30">
      <Navigation variant="dark" />

      <main className="flex-1 pb-20">
        {/* Dedicated Cinema Theater Stage (Full-Page Player Experience) */}
        <section
          ref={playerStageRef}
          className="relative w-full pt-24 pb-10 border-b border-white/10 overflow-hidden"
        >
          {/* Ambient Blurred Backdrop */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={item.backdropUrl}
              alt={displayTitle}
              className="w-full h-full object-cover object-center opacity-20 blur-2xl scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#07090e]/90 via-[#07090e]/95 to-[#07090e]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Header Row: Breadcrumb, Title, Metadata & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div className="space-y-2.5">
                <Link
                  to="/cinema"
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                  <span>Voltar ao Catálogo de Cinema</span>
                </Link>

                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs tracking-wide text-zinc-300 pt-1">
                  <span className="font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    {item.type === "filme" ? "Filme Completo" : "Série Completa"}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="font-medium text-white">{item.year}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {item.duration}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {item.rating.toFixed(1)}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-300 uppercase text-[11px] font-mono tracking-wider">
                    {item.quality}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="px-1.5 py-0.5 rounded border border-white/20 text-[10px] text-zinc-300 font-mono">
                    {item.ageRating}
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                    {displayTitle}
                  </h1>
                  {item.originalTitle && item.originalTitle !== item.title && (
                    <p className="mt-1 text-xs text-zinc-400 font-mono">
                      {selectedLanguage === "pt"
                        ? `Título original (EN): ${item.originalTitle}`
                        : `Título em Português (PT-BR): ${item.title}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Download, Watchlist & Share Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadCinema(activeEpisode)}
                  disabled={Boolean(downloadingKey)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-xs sm:text-sm font-semibold transition cursor-pointer shadow-sm whitespace-nowrap shrink-0"
                  title={
                    item.type === "serie"
                      ? `Baixar Temporada ${selectedSeasonNumber} Episódio ${selectedEpisodeNumber}`
                      : `Baixar ${item.title}`
                  }
                >
                  {downloadingKey === `${item.id}-${selectedSeasonNumber}-${item.type === "serie" ? selectedEpisodeNumber : 1}` ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Baixando...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>
                        {item.type === "serie"
                          ? `Baixar Ep. ${selectedEpisodeNumber}`
                          : "Baixar Filme"}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleToggleWatchlist}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer backdrop-blur-md whitespace-nowrap shrink-0 ${
                    inWatchlist
                      ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  }`}
                >
                  {inWatchlist ? (
                    <>
                      <Check className="w-4 h-4 text-amber-400" />
                      Na Minha Lista
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      Salvar na Lista
                    </>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap shrink-0"
                  title="Compartilhar"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Compartilhar</span>
                </button>
              </div>
            </div>

            {/* Dedicated Full-Page Worsco Cinema Player */}
            <WorscoCinemaPlayer
              item={item}
              language={selectedLanguage}
              onLanguageChange={handleSelectLanguage}
              seasonNumber={selectedSeasonNumber}
              episodeNumber={selectedEpisodeNumber}
              totalEpisodes={episodesList.length}
              episodeTitle={activeEpisode?.title}
              onSelectEpisode={(epNum) => {
                setSelectedEpisodeNumber(epNum);
                saveCinemaProgress(item.id, 35, selectedSeasonNumber, epNum);
              }}
            />
          </div>
        </section>

        {/* Content Body Grid below the Dedicated Player */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Column */}
            <div className="lg:col-span-8 space-y-10">
              {/* Series Episodes List (Placed right below the player for Series!) */}
              {item.type === "serie" && item.seasons && item.seasons.length > 0 && (
                <section className="bg-zinc-900/40 border border-white/5 rounded-xl p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-amber-400" />
                        Temporadas e Episódios
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Clique em qualquer episódio para reproduzir diretamente no player acima.
                      </p>
                    </div>

                    {/* Season Selector Tabs */}
                    {item.seasons.length > 1 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {item.seasons
                          .filter((s) => s.episodes.length > 0)
                          .map((s) => (
                            <button
                              key={s.seasonNumber}
                              onClick={() => {
                                setSelectedSeasonNumber(s.seasonNumber);
                                if (s.episodes[0]) {
                                  setSelectedEpisodeNumber(s.episodes[0].episodeNumber);
                                }
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                selectedSeasonNumber === s.seasonNumber
                                  ? "bg-amber-500 text-black shadow-sm"
                                  : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
                              }`}
                            >
                              Temporada {s.seasonNumber}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Episode cards */}
                  <div className="space-y-3">
                    {episodesList.map((ep) => {
                      const isCurrent = selectedEpisodeNumber === ep.episodeNumber;
                      return (
                        <div
                          key={ep.episodeNumber}
                          onMouseEnter={() =>
                            prefetchCinemaStream(item, selectedSeasonNumber, ep.episodeNumber, "dublado")
                          }
                          onClick={() => handlePlayEpisode(ep)}
                          className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border transition cursor-pointer ${
                            isCurrent
                              ? "bg-amber-500/10 border-amber-500/40 text-white"
                              : "bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/10 text-zinc-300"
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-4 flex-1">
                            <div className="relative w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-amber-400/50 transition">
                              <Play
                                className={`w-5 h-5 ${
                                  isCurrent
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-zinc-300 group-hover:text-amber-400"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-amber-400/90 font-medium">
                                  Episódio {ep.episodeNumber}
                                </span>
                                <span className="text-zinc-600">·</span>
                                <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                                  {ep.title}
                                </h3>
                              </div>
                              {ep.synopsis && (
                                <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                                  {ep.synopsis}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center text-xs text-zinc-400">
                            <span className="flex items-center gap-1 font-mono mr-1">
                              <Clock className="w-3.5 h-3.5 text-zinc-500" />
                              {ep.duration}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadCinema(ep);
                              }}
                              disabled={Boolean(downloadingKey)}
                              title={`Baixar Episódio ${ep.episodeNumber}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-medium transition disabled:opacity-50 whitespace-nowrap shrink-0"
                            >
                              {downloadingKey === `${item.id}-${selectedSeasonNumber}-${ep.episodeNumber}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>Baixar</span>
                            </button>
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                                isCurrent
                                  ? "bg-amber-500 text-black"
                                  : "bg-amber-500/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-black"
                              }`}
                            >
                              {isCurrent ? "Reproduzindo" : "Assistir"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Sinopse */}
              <section className="bg-zinc-900/40 border border-white/5 rounded-xl p-6 sm:p-8 backdrop-blur-sm">
                <h2 className="text-lg font-serif font-semibold text-white mb-3 flex items-center gap-2">
                  Sinopse Oficial
                </h2>
                <p className="text-zinc-300 leading-relaxed text-base sm:text-lg font-sans">
                  {item.synopsis}
                </p>

                {/* Genres list */}
                <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono mr-2">
                    Gêneros:
                  </span>
                  {item.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 text-xs text-zinc-300 bg-white/5 border border-white/10 rounded font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar Details Column */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Technical Sheet */}
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-serif font-semibold uppercase tracking-wider text-amber-400">
                  Ficha Técnica
                </h3>

                <dl className="space-y-3.5 text-xs">
                  {item.director && (
                    <div>
                      <dt className="text-zinc-500 uppercase tracking-wider font-mono text-[11px]">
                        Direção
                      </dt>
                      <dd className="text-zinc-200 font-medium mt-0.5">{item.director}</dd>
                    </div>
                  )}

                  {item.cast && item.cast.length > 0 && (
                    <div>
                      <dt className="text-zinc-500 uppercase tracking-wider font-mono text-[11px]">
                        Elenco Principal
                      </dt>
                      <dd className="text-zinc-200 font-medium mt-0.5 leading-relaxed">
                        {item.cast.join(", ")}
                      </dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-zinc-500 uppercase tracking-wider font-mono text-[11px]">
                      Áudio & Idiomas Disponíveis
                    </dt>
                    <dd className="text-zinc-200 font-medium mt-0.5 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Português (Dublado & Legendado) · Inglês · Espanhol · Francês & Mais
                    </dd>
                  </div>

                  <div>
                    <dt className="text-zinc-500 uppercase tracking-wider font-mono text-[11px]">
                      Qualidade Máxima
                    </dt>
                    <dd className="text-amber-300 font-mono font-medium mt-0.5">
                      {item.quality}
                    </dd>
                  </div>

                  {item.seasons && item.seasons.length > 0 && (
                    <div>
                      <dt className="text-zinc-500 uppercase tracking-wider font-mono text-[11px]">
                        Temporadas
                      </dt>
                      <dd className="text-zinc-200 font-medium mt-0.5">
                        {item.seasons.length}{" "}
                        {item.seasons.length === 1 ? "Temporada" : "Temporadas"} (
                        {item.seasons.reduce((acc, s) => acc + s.episodes.length, 0)} episódios)
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Poster Preview Card */}
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full max-w-[260px] mx-auto aspect-[2/3] object-cover rounded-lg shadow-xl shadow-black/80"
                />
              </div>
            </aside>
          </div>

          {/* Related / Recommendations Section */}
          {relatedItems.length > 0 && (
            <section className="mt-16 pt-10 border-t border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-white">
                    Quem assistiu também gostou
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Sugestões selecionadas baseadas em gêneros e crítica.
                  </p>
                </div>
                <Link
                  to="/cinema"
                  className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition"
                >
                  Ver todo o catálogo
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {relatedItems.map((rel) => (
                  <CinemaCard
                    key={rel.id}
                    item={rel}
                    onPlay={(played) => navigate(`/cinema/${played.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
