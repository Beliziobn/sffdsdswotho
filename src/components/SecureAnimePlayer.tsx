import React, { useState, useEffect, useRef, useMemo } from "react";
import Hls from "hls.js";
import { usePlayerAdBlock } from "@/hooks/usePlayerAdBlock";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  FastForward,
  Languages,
  RotateCcw,
  Loader2,
  ShieldCheck,
  Subtitles,
  Globe,
} from "lucide-react";
import { AnimeEpisode, AnimeSeason } from "@/lib/animes";
import { toast } from "sonner";

interface SecureAnimePlayerProps {
  animeTitle: string;
  season: AnimeSeason;
  episode: AnimeEpisode;
  onSelectEpisode: (episodeNumber: number) => void;
  onNextEpisode?: () => void;
  onPreviousEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPreviousEpisode?: boolean;
}

type AudioTrackMode = "dub" | "sub" | "en";

interface ResolvedOrionStream {
  id: string;
  type: "mp4" | "hls";
  audioMode: "dublado" | "legendado" | "original" | "multi";
  url: string;
  proxyUrl: string;
}

const ANIME_TMDB_MAP: Record<string, number> = {
  "solo-leveling": 127532,
  "frieren-beyond-journeys-end": 209867,
  "orb-movements-of-the-earth": 204635,
  "dandadan": 240411,
  "attack-on-titan": 1429,
  "vinland-saga": 88803,
  "demon-slayer-infinity-castle": 85937,
  "jujutsu-kaisen-culling-game": 95479,
  "bleach-tybw": 30984,
  "monster": 30981,
  "apothecary-diaries": 220542,
  "re-zero": 65942,
  "kaiju-no-8": 207468,
  "chainsaw-man": 114410,
  "oshi-no-ko": 203737,
  "blue-lock": 131041,
  "cyberpunk-edgerunners": 105248,
  "dungeon-meshi": 207784,
  "spy-x-family": 120089,
  "tower-of-god": 97860,
  "black-clover": 73223,
  "jojos-bizarre-adventure": 45790,
  "steel-ball-run": 45790,
  "dragon-ball": 12971,
  "naruto": 46260,
  "boruto": 70881,
  "one-piece": 37854,
  "hunter-x-hunter": 46298,
  "my-hero-academia": 65930,
  "death-note": 13916,
  "fullmetal-alchemist-brotherhood": 31911,
  "sakamoto-days": 240411,
  "dr-stone": 86031,
  "mob-psycho-100": 67075,
  "shangri-la-frontier": 205908,
  "mashle": 205366,
  "wind-breaker": 223500,
  "jigokuraku": 117465,
  "classroom-of-the-elite": 72517,
};

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const total = Math.floor(sec);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export const SecureAnimePlayer: React.FC<SecureAnimePlayerProps> = ({
  animeTitle,
  season,
  episode,
  onNextEpisode,
  onPreviousEpisode,
  hasNextEpisode = false,
  hasPreviousEpisode = false,
}) => {
  // Rigorously enforce anti-redirect and popup blocking
  const { blockedCount } = usePlayerAdBlock(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioTrack, setAudioTrack] = useState<AudioTrackMode>("dub");
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSec, setDurationSec] = useState(1420);
  const [isBuffering, setIsBuffering] = useState(false);
  const [orionStreams, setOrionStreams] = useState<ResolvedOrionStream[]>([]);
  const [useEmbedFallback, setUseEmbedFallback] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const savedTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);

  // Extract authentic Dublado (PT-BR) and Legendado (PT-BR) URLs from the verified anime episode catalog
  const cleanStreamUrl = (episode.streamUrl || "").split("?")[0];
  const catalogDubUrl =
    (episode.hlsStreamUrl || "").split("?")[0] ||
    episode.sources?.find((s) => s.id.includes("dub"))?.streamUrl?.split("?")[0] ||
    cleanStreamUrl;
  const catalogSubUrl =
    (episode.subHlsStreamUrl || "").split("?")[0] ||
    episode.sources?.find((s) => s.id.includes("sub") || s.id.includes("legendado"))?.streamUrl?.split("?")[0] ||
    catalogDubUrl;

  const isCatalogDubExplicit = /-dublado|-dub\b/i.test(catalogDubUrl);

  // Also resolve multi-audio streams from Orion (/api/cinema/resolve) for animes
  useEffect(() => {
    let cancelled = false;
    setOrionStreams([]);
    const tmdbId = ANIME_TMDB_MAP[episode.animeId || season.animeId];
    if (!tmdbId) return;

    const params = new URLSearchParams({
      tmdbId: String(tmdbId),
      type: "tv",
      season: String(season.seasonNumber || 1),
      episode: String(episode.number || 1),
      title: animeTitle,
      year: String(season.year || 2024),
    });

    fetch(`/api/cinema/resolve?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.streams)) {
          setOrionStreams(data.streams);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [episode.id, episode.animeId, episode.number, season.animeId, season.seasonNumber, season.year, animeTitle]);

  // Select the authentic video stream matching the user's selected audioTrack ("dub" | "sub" | "en")
  const selectedStreamTarget = useMemo(() => {
    const orionDub = orionStreams.find((s) => s.audioMode === "dublado");
    const orionSub = orionStreams.find((s) => s.audioMode === "legendado");
    const orionOrig = orionStreams.find((s) => s.audioMode === "original");

    if (audioTrack === "dub") {
      if (isCatalogDubExplicit && catalogDubUrl) {
        return { url: catalogDubUrl, fallbackUrl: orionDub?.url || catalogSubUrl };
      }
      if (orionDub) {
        return { url: orionDub.url, fallbackUrl: catalogDubUrl || catalogSubUrl };
      }
      return { url: catalogDubUrl || catalogSubUrl, fallbackUrl: catalogSubUrl };
    }

    if (audioTrack === "sub") {
      if (catalogSubUrl && !/-dublado|-dub\b/i.test(catalogSubUrl)) {
        return { url: catalogSubUrl, fallbackUrl: orionSub?.url || catalogDubUrl };
      }
      if (orionSub) {
        return { url: orionSub.url, fallbackUrl: catalogSubUrl || catalogDubUrl };
      }
      return { url: catalogSubUrl || catalogDubUrl, fallbackUrl: catalogDubUrl };
    }

    // audioTrack === "en" (Original / English)
    if (orionOrig) {
      return { url: orionOrig.url, fallbackUrl: catalogSubUrl || catalogDubUrl };
    }
    return { url: catalogSubUrl || catalogDubUrl, fallbackUrl: catalogDubUrl };
  }, [audioTrack, isCatalogDubExplicit, catalogDubUrl, catalogSubUrl, orionStreams]);

  const activeRawUrl = selectedStreamTarget.url;
  const fallbackRawUrl = selectedStreamTarget.fallbackUrl;
  const isDirectMp4Stream =
    Boolean(activeRawUrl) &&
    /\.mp4($|\?)/i.test(activeRawUrl) &&
    !activeRawUrl.toLowerCase().includes(".m3u8");

  // Reset state when switching episode or season
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    savedTimeRef.current = 0;
    wasPlayingRef.current = false;
    setUseEmbedFallback(false);
  }, [episode.id, season.id]);

  // Handle seamless language track switching preserving timestamp
  const handleSelectAudioTrack = (nextTrack: AudioTrackMode) => {
    if (videoRef.current && videoRef.current.currentTime > 1) {
      savedTimeRef.current = videoRef.current.currentTime;
      wasPlayingRef.current = !videoRef.current.paused || isPlaying;
    }
    setUseEmbedFallback(false);
    setAudioTrack(nextTrack);
    if (nextTrack === "dub") {
      toast.success("Áudio alterado para Dublado em Português (PT-BR)");
    } else if (nextTrack === "sub") {
      toast.success("Alterado para Áudio Original Japonês (Legendado PT-BR)");
    } else {
      toast.success("Alterado para Áudio Original / Inglês");
    }
  };

  // Attach native MP4 or HLS.js stream
  useEffect(() => {
    if (useEmbedFallback) {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl || !activeRawUrl) return;

    let isCancelled = false;
    let blobManifestUrl: string | null = null;
    setIsBuffering(true);

    const restorePlaybackState = () => {
      if (isCancelled || !videoRef.current) return;
      videoRef.current.volume = isMuted ? 0 : 1;
      videoRef.current.muted = isMuted;
      if (savedTimeRef.current > 1) {
        try {
          videoRef.current.currentTime = savedTimeRef.current;
        } catch {}
      }
      if (wasPlayingRef.current) {
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {});
      }
    };

    if (isDirectMp4Stream) {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      let triedProxyFallback = false;
      videoEl.setAttribute("referrerpolicy", "no-referrer");
      const initialMp4Src = activeRawUrl;
      videoEl.src = initialMp4Src;
      videoEl.load();

      const handleLoaded = () => {
        if (isCancelled) return;
        setIsBuffering(false);
        restorePlaybackState();
      };

      const handleError = () => {
        if (isCancelled) return;
        if (!triedProxyFallback) {
          triedProxyFallback = true;
          videoEl.src = `/api/cinema/mp4-proxy?url=${encodeURIComponent(activeRawUrl)}`;
          videoEl.load();
        } else if (fallbackRawUrl && fallbackRawUrl !== activeRawUrl) {
          setUseEmbedFallback(true);
        } else {
          setIsBuffering(false);
          setUseEmbedFallback(true);
        }
      };

      videoEl.addEventListener("loadedmetadata", handleLoaded);
      videoEl.addEventListener("error", handleError);
      return () => {
        isCancelled = true;
        videoEl.removeEventListener("loadedmetadata", handleLoaded);
        videoEl.removeEventListener("error", handleError);
      };
    }

    const manifestProxyUrl = `/api/anime/hls-manifest?url=${encodeURIComponent(
      activeRawUrl
    )}&fallbackUrl=${encodeURIComponent(fallbackRawUrl || activeRawUrl)}`;

    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    // Helper that normalizes maximaimg.online #EXTINF:...,http lines directly in browser so HLS works even without backend proxy
    const buildClientNormalizedManifestUrl = async (targetM3u8: string): Promise<string> => {
      try {
        const res = await fetch(targetM3u8);
        if (!res.ok) throw new Error("Direct fetch failed");
        const rawText = await res.text();
        if (!rawText.trim().startsWith("#EXTM3U")) throw new Error("Not M3U8");
        const baseUri = new URL(targetM3u8);
        const rewritten = rawText
          .split("\n")
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;
            if (trimmed.startsWith("#")) {
              if (trimmed.startsWith("#EXTINF") && trimmed.includes(",http")) {
                const commaIdx = trimmed.indexOf(",http");
                const tag = trimmed.slice(0, commaIdx + 1);
                const segUrl = trimmed.slice(commaIdx + 1);
                return `${tag}\n${segUrl}`;
              }
              return line;
            }
            try {
              return new URL(trimmed, baseUri).toString();
            } catch {
              return line;
            }
          })
          .join("\n");
        const blob = new Blob([rewritten], { type: "application/vnd.apple.mpegurl" });
        blobManifestUrl = URL.createObjectURL(blob);
        return blobManifestUrl;
      } catch {
        return manifestProxyUrl;
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hlsInstanceRef.current = hls;

      let fallbackStep = 0;

      void (async () => {
        const initialSource = await buildClientNormalizedManifestUrl(activeRawUrl);
        if (isCancelled) return;
        hls.loadSource(initialSource);
        hls.attachMedia(videoEl);
      })();

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isCancelled) return;
        setIsBuffering(false);
        restorePlaybackState();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (isCancelled) return;
        if (data?.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && fallbackStep === 0) {
            fallbackStep = 1;
            hls.loadSource(manifestProxyUrl);
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR && fallbackStep === 1 && fallbackRawUrl && fallbackRawUrl !== activeRawUrl) {
            fallbackStep = 2;
            void buildClientNormalizedManifestUrl(fallbackRawUrl).then((fbSource) => {
              if (!isCancelled) {
                hls.loadSource(fbSource);
                hls.startLoad();
              }
            });
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setIsBuffering(false);
            setUseEmbedFallback(true);
          }
        }
      });
    } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      videoEl.src = manifestProxyUrl;
      setIsBuffering(false);
      restorePlaybackState();
    } else {
      setUseEmbedFallback(true);
    }

    return () => {
      isCancelled = true;
      if (blobManifestUrl) {
        URL.revokeObjectURL(blobManifestUrl);
      }
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [useEmbedFallback, activeRawUrl, fallbackRawUrl, isDirectMp4Stream, episode.id, season.id]);

  // Keep native video volume at 100% (never ducked, zero artificial TTS)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : 1;
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleTogglePlay = () => {
    if (!useEmbedFallback && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
        wasPlayingRef.current = true;
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        wasPlayingRef.current = false;
      }
    }
  };

  const handleToggleMute = () => {
    if (!useEmbedFallback && videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleSeekRelative = (deltaSeconds: number) => {
    if (!useEmbedFallback && videoRef.current) {
      const target = Math.max(
        0,
        Math.min(
          videoRef.current.duration || durationSec,
          videoRef.current.currentTime + deltaSeconds
        )
      );
      videoRef.current.currentTime = target;
      savedTimeRef.current = target;
      setCurrentTime(target);
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleSkipIntro = () => {
    handleSeekRelative(85);
  };

  const anivideoIframeUrl =
    episode.anivideoEmbedUrl && episode.anivideoEmbedUrl.startsWith("https://archive.org/embed/")
      ? episode.anivideoEmbedUrl
      : `https://api.anivideo.net/videohls.php?d=${encodeURIComponent(
          catalogDubUrl || catalogSubUrl
        )}`;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="rounded-2xl overflow-hidden border border-neutral-200 bg-white text-neutral-900 shadow-2xl transition-all duration-300 w-full"
    >
      {/* Unified Control Header: Anti-Redirect Status & Direct Language Selector */}
      <div className="px-4 py-3 bg-white border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-700 font-medium">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>
            Servidor Unificado HD · Anti-Redirecionamento Ativo
            {blockedCount > 0 ? ` (${blockedCount} bloqueados)` : ""}
          </span>
        </div>

        {/* Direct 3-Way Language Switcher (Dublado PT-BR | Japonês Leg. PT | Original/EN) */}
        <div className="flex flex-wrap items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-xl p-1">
          <button
            type="button"
            onClick={() => handleSelectAudioTrack("dub")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              audioTrack === "dub"
                ? "bg-primary text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
            title="Reproduzir episódio com Áudio Original Dublado em Português (PT-BR)"
          >
            <Languages className="h-3.5 w-3.5" />
            <span>Dublado em Português</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectAudioTrack("sub")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              audioTrack === "sub"
                ? "bg-primary text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
            title="Reproduzir com Áudio Original Japonês e Legendas em Português"
          >
            <Subtitles className="h-3.5 w-3.5" />
            <span>Português (Legendado)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectAudioTrack("en")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              audioTrack === "en"
                ? "bg-primary text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
            title="Reproduzir com Áudio Original / Inglês"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Áudio Original / EN</span>
          </button>
        </div>
      </div>

      {/* Área Central de Vídeo */}
      <div
        className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center group"
        onContextMenu={(e) => e.preventDefault()}
      >
        {!useEmbedFallback ? (
          <>
            <video
              ref={videoRef}
              key={`${episode.id}-${audioTrack}`}
              poster={episode.thumbnail || season.banner || season.poster}
              controls
              playsInline
              preload="metadata"
              onPlay={() => {
                setIsPlaying(true);
                wasPlayingRef.current = true;
              }}
              onPause={() => {
                setIsPlaying(false);
                wasPlayingRef.current = false;
              }}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onCanPlay={() => setIsBuffering(false)}
              onTimeUpdate={(e) => {
                const t = e.currentTarget.currentTime;
                setCurrentTime(t);
                if (t > 1) savedTimeRef.current = t;
              }}
              onLoadedMetadata={(e) => {
                if (e.currentTarget.duration && Number.isFinite(e.currentTarget.duration)) {
                  setDurationSec(e.currentTarget.duration);
                }
                setIsBuffering(false);
              }}
              onEnded={() => {
                setIsPlaying(false);
                wasPlayingRef.current = false;
                if (hasNextEpisode && onNextEpisode) {
                  onNextEpisode();
                }
              }}
              className="w-full h-full object-contain bg-black"
            />

            {/* Active Language Status Pill inside Video Stage */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              <span className="px-2.5 py-1 rounded-full bg-black/75 border border-white/15 text-[11px] font-medium text-white backdrop-blur-md flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {audioTrack === "dub"
                  ? "🇧🇷 Dublado em Português (PT-BR)"
                  : audioTrack === "sub"
                  ? "🇯🇵 Japonês · Legendado em Português (PT-BR)"
                  : "🌐 Áudio Original / Inglês"}
              </span>
            </div>

            {/* Indicador de carregamento / Play inicial sobre o vídeo */}
            {!isPlaying && (
              <button
                type="button"
                onClick={handleTogglePlay}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/45 hover:bg-black/35 backdrop-blur-[1px] transition-all cursor-pointer group/play"
              >
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40 group-hover/play:scale-110 transition-transform">
                  {isBuffering ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <Play className="h-8 w-8 fill-current ml-1" />
                  )}
                </div>
                <span className="mt-3 px-4 py-1.5 rounded-full bg-black/80 border border-white/15 text-xs font-medium text-white shadow-lg">
                  Assistir Episódio {episode.number} Completo (
                  {audioTrack === "dub"
                    ? "Dublado em Português"
                    : audioTrack === "sub"
                    ? "Português Legendado"
                    : "Áudio Original / EN"}
                  )
                </span>
              </button>
            )}
          </>
        ) : (
          /* Sandboxed Fallback Player (Zero Redirects Guaranteed) */
          <iframe
            key={`${episode.id}-sandbox-${audioTrack}`}
            src={anivideoIframeUrl}
            title={`${animeTitle} - T${season.seasonNumber}:E${episode.number}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            referrerPolicy="no-referrer"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="w-full h-full border-0 select-none"
          />
        )}
      </div>

      {/* Barra de Controles Diretos da Plataforma */}
      <div className="px-4 py-2.5 bg-white border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors shadow-sm cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            <span>{isPlaying ? "Pausar" : "Reproduzir Episódio"}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 transition-colors cursor-pointer"
            title={isMuted ? "Ativar Som" : "Silenciar"}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-rose-500" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>

          {!useEmbedFallback && (
            <button
              type="button"
              onClick={() => handleSeekRelative(-10)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
              title="Voltar 10 segundos"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>-10s</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSkipIntro}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Avançar abertura (+85s)"
          >
            <FastForward className="h-3.5 w-3.5 text-primary" />
            <span>Pular Abertura (+85s)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-neutral-600 font-mono">
          {!useEmbedFallback && (
            <span className="text-neutral-800">
              {formatSeconds(currentTime)} / {formatSeconds(durationSec)}
            </span>
          )}
        </div>
      </div>

      {/* Barra Inferior com Metadados do Episódio e Navegação Sequencial */}
      <div className="p-4 bg-white border-t border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-neutral-900 text-sm">
              Episódio {episode.number}: {episode.title}
            </span>
          </div>
        </div>

        {/* Botões de Navegação Entre Episódios e Temporadas */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={onPreviousEpisode}
            disabled={!hasPreviousEpisode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              hasPreviousEpisode
                ? "bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200 cursor-pointer"
                : "opacity-40 border-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <SkipBack className="h-3.5 w-3.5" />
            <span>Anterior</span>
          </button>

          <button
            type="button"
            onClick={onNextEpisode}
            disabled={!hasNextEpisode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              hasNextEpisode
                ? "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/25 cursor-pointer"
                : "opacity-40 bg-neutral-200 text-neutral-500 cursor-not-allowed"
            }`}
          >
            <span>Próximo</span>
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 transition-colors cursor-pointer"
            title="Tela Cheia"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecureAnimePlayer;
