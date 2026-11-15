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
  onDubChange?: (dubId: string) => void;
}

interface ResolvedOrionStream {
  id: string;
  server?: string;
  type: "mp4" | "hls";
  audioMode: "dublado" | "legendado" | "original" | "multi";
  langCode?: string;
  label?: string;
  quality?: string;
  url: string;
  proxyUrl: string;
  requiresProxy?: boolean;
}

interface AvailableDubOption {
  id: string;
  dubCode: string;
  dubType: string;
  label: string;
  shortLabel: string;
  flag: string;
  audioMode: "dublado" | "legendado" | "original" | "multi";
}

const DEFAULT_ANIME_DUB_PRESETS: AvailableDubOption[] = [
  {
    id: "ptbr:0",
    dubCode: "ptbr",
    dubType: "0",
    label: "Português (Dublado PT-BR)",
    shortLabel: "🇧🇷 Dublado PT-BR",
    flag: "🇧🇷",
    audioMode: "dublado",
  },
  {
    id: "pt:1",
    dubCode: "pt",
    dubType: "1",
    label: "Português (Legendado PT-BR)",
    shortLabel: "🇧🇷 Legendado PT-BR",
    flag: "🇧🇷",
    audioMode: "legendado",
  },
  {
    id: "ja:0",
    dubCode: "ja",
    dubType: "0",
    label: "Japonês (Áudio Original)",
    shortLabel: "🇯🇵 Japonês (Original)",
    flag: "🇯🇵",
    audioMode: "original",
  },
  {
    id: "esla:0",
    dubCode: "esla",
    dubType: "0",
    label: "Espanhol Latino (Dublado)",
    shortLabel: "🇲🇽 Espanhol",
    flag: "🇲🇽",
    audioMode: "multi",
  },
  {
    id: "fr:0",
    dubCode: "fr",
    dubType: "0",
    label: "Francês (Dublado)",
    shortLabel: "🇫🇷 Francês",
    flag: "🇫🇷",
    audioMode: "multi",
  },
];

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
  onDubChange,
}) => {
  // Rigorously enforce anti-redirect and popup blocking
  usePlayerAdBlock(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedDubId, setSelectedDubId] = useState<string>("ptbr:0");
  const [availableDubs, setAvailableDubs] = useState<AvailableDubOption[]>(
    DEFAULT_ANIME_DUB_PRESETS
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSec, setDurationSec] = useState(1420);
  const [isBuffering, setIsBuffering] = useState(false);
  const [orionStreams, setOrionStreams] = useState<ResolvedOrionStream[]>([]);
  const [ptbrEmbedUrls, setPtbrEmbedUrls] = useState<string[]>([]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [isResolvingOrion, setIsResolvingOrion] = useState(false);
  const [useEmbedFallback, setUseEmbedFallback] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const savedTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);

  const animeId = episode.animeId || season.animeId;
  const isSteelBallRun = animeId === "steel-ball-run";

  // Extract authentic Dublado (PT-BR) and Legendado (PT-BR) URLs from the verified anime episode catalog
  const cleanStreamUrl = (episode.streamUrl || "").split("?")[0];
  const catalogDubUrl =
    episode.sources?.find((s) => s.id.includes("dub"))?.streamUrl?.split("?")[0] ||
    (episode.hlsStreamUrl || "").split("?")[0] ||
    cleanStreamUrl;
  const catalogSubUrl =
    episode.sources?.find((s) => s.id.includes("sub") || s.id.includes("legendado"))?.streamUrl?.split("?")[0] ||
    (episode.subHlsStreamUrl || "").split("?")[0] ||
    catalogDubUrl;

  const isCatalogDubExplicit =
    !isSteelBallRun &&
    /-dublado|-dub\b|op-cn|dublado|-pt\.mp4/i.test(catalogDubUrl);

  // Map anime catalog seasons/episodes to exact TMDB ID, Season & Episode
  const tmdbTarget = useMemo(() => {
    const baseTmdbId = ANIME_TMDB_MAP[animeId];
    const sNum = season.seasonNumber || 1;
    const epNum = episode.number || 1;
    const urlEpMatch = cleanStreamUrl.match(/\/(\d+)(?:v2)?\.mp4/i);
    const parsedFileEp = urlEpMatch ? parseInt(urlEpMatch[1], 10) : epNum;

    if (isSteelBallRun) {
      return {
        tmdbId: 45790,
        season: 6,
        episode: sNum === 1 ? 1 : epNum + 1,
        title: "JoJo's Bizarre Adventure",
        year: 2012,
      };
    }

    // Naruto S3/S4 in catalog are Naruto Shippuden (TMDB 31910)
    if (animeId === "naruto" && sNum >= 3) {
      return {
        tmdbId: 31910,
        season: 1,
        episode: parsedFileEp || epNum,
        title: "Naruto Shippuden",
        year: 2007,
      };
    }

    // Hunter x Hunter on TMDB 46298 is a single continuous Season 1 (1..148)
    if (animeId === "hunter-x-hunter") {
      return {
        tmdbId: 46298,
        season: 1,
        episode: parsedFileEp || epNum,
        title: animeTitle,
        year: 2011,
      };
    }

    // Attack on Titan S5 in catalog = TMDB Season 4 Part 2 (episodes 17+)
    if (animeId === "attack-on-titan" && sNum === 5) {
      return {
        tmdbId: 1429,
        season: 4,
        episode: epNum + 16,
        title: animeTitle,
        year: 2013,
      };
    }

    // Frieren S2 in catalog = TMDB Season 1 episodes 17..28; S3 = TMDB Season 2
    if (animeId === "frieren-beyond-journeys-end") {
      if (sNum === 2) {
        return { tmdbId: 209867, season: 1, episode: epNum + 16, title: animeTitle, year: 2023 };
      }
      if (sNum === 3) {
        return { tmdbId: 209867, season: 2, episode: epNum, title: animeTitle, year: 2026 };
      }
    }

    // Re:Zero S3 in catalog = TMDB Season 2 Part 2; S4 = TMDB Season 3
    if (animeId === "re-zero") {
      if (sNum === 3) {
        return { tmdbId: 65942, season: 2, episode: epNum + 13, title: animeTitle, year: 2020 };
      }
      if (sNum === 4) {
        return { tmdbId: 65942, season: 3, episode: epNum, title: animeTitle, year: 2024 };
      }
    }

    return {
      tmdbId: baseTmdbId,
      season: sNum,
      episode: epNum,
      title: animeTitle,
      year: season.year || 2024,
    };
  }, [animeId, season.seasonNumber, season.year, episode.number, cleanStreamUrl, isSteelBallRun, animeTitle]);

  const effectiveTmdbSeason = tmdbTarget.season;
  const effectiveTmdbEpisode = tmdbTarget.episode;

  // Resolve multi-language streams from unified backend (/api/cinema/resolve)
  useEffect(() => {
    let cancelled = false;
    setOrionStreams([]);
    setPtbrEmbedUrls([]);
    setCandidateIdx(0);
    const tmdbId = tmdbTarget.tmdbId;
    if (!tmdbId) {
      setIsResolvingOrion(false);
      return;
    }

    const [dubCode, dubType] = selectedDubId.split(":");
    const shouldWaitForOrion =
      isSteelBallRun ||
      !isCatalogDubExplicit ||
      selectedDubId !== "ptbr:0";

    if (shouldWaitForOrion) {
      setIsResolvingOrion(true);
    }

    const audioModeParam =
      dubCode.startsWith("pt") && dubType === "0"
        ? "dublado"
        : dubType === "1"
        ? "legendado"
        : "original";

    const params = new URLSearchParams({
      tmdbId: String(tmdbId),
      type: "tv",
      season: String(effectiveTmdbSeason),
      episode: String(effectiveTmdbEpisode),
      title: tmdbTarget.title,
      year: String(tmdbTarget.year),
      audioMode: audioModeParam,
      dubCode,
      dubType,
    });

    fetch(`/api/cinema/resolve?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.streams)) {
          setOrionStreams(data.streams);
        }
        if (Array.isArray(data?.ptbrEmbedUrls)) {
          setPtbrEmbedUrls(data.ptbrEmbedUrls);
        }
        if (Array.isArray(data?.availableDubs) && data.availableDubs.length > 0) {
          setAvailableDubs(data.availableDubs);
        }
        setIsResolvingOrion(false);
      })
      .catch(() => {
        if (!cancelled) setIsResolvingOrion(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    episode.id,
    tmdbTarget,
    isSteelBallRun,
    isCatalogDubExplicit,
    selectedDubId,
    effectiveTmdbSeason,
    effectiveTmdbEpisode,
  ]);

  // Build prioritized list of authentic streams matching the user's selected language (selectedDubId)
  const candidateStreams = useMemo(() => {
    const list: ResolvedOrionStream[] = [];
    const seen = new Set<string>();
    const addCandidate = (s: ResolvedOrionStream) => {
      if (!s?.url || seen.has(s.url)) return;
      seen.add(s.url);
      list.push(s);
    };

    const makeCatalogStream = (
      rawUrl: string,
      audioMode: "dublado" | "legendado" | "original",
      label: string
    ): ResolvedOrionStream => {
      const isMp4 = /\.mp4($|\?)/i.test(rawUrl) && !rawUrl.toLowerCase().includes(".m3u8");
      return {
        id: `catalog-${audioMode}-${episode.id}`,
        server: "catalog",
        label,
        type: isMp4 ? "mp4" : "hls",
        audioMode,
        langCode: audioMode === "dublado" ? "ptbr" : "ja",
        quality: "1080p FHD",
        url: rawUrl,
        proxyUrl: isMp4
          ? `/api/cinema/mp4-proxy?url=${encodeURIComponent(rawUrl)}`
          : `/api/anime/hls-manifest?url=${encodeURIComponent(rawUrl)}`,
      };
    };

    const dubResolved = orionStreams.filter((s) => s.audioMode === "dublado");
    const nonDubResolved = orionStreams.filter((s) => s.audioMode !== "dublado");

    if (isSteelBallRun) {
      const sbrFallbackUrl =
        selectedDubId === "pt:1" || selectedDubId === "ja:0"
          ? catalogSubUrl || catalogDubUrl
          : catalogDubUrl || catalogSubUrl;
      orionStreams.forEach(addCandidate);
      if (sbrFallbackUrl) {
        addCandidate(makeCatalogStream(sbrFallbackUrl, "original", "Steel Ball Run (Áudio Original)"));
      }
      return list;
    }

    if (selectedDubId === "ptbr:0" || selectedDubId === "pt:0") {
      // 1. Verified explicit PT-BR dub URL from catalog (maximaimg -dublado)
      if (isCatalogDubExplicit && catalogDubUrl) {
        addCandidate(makeCatalogStream(catalogDubUrl, "dublado", "Português (Dublado PT-BR)"));
      }
      // 2. All PT-BR dubbed streams from Orion / WatchPlay / Embedplayer2 / Blogger
      dubResolved.forEach(addCandidate);
      // 3. Only if zero PT-BR dubbed routes worked, fall back gracefully to original + sub
      nonDubResolved.forEach(addCandidate);
      if (catalogSubUrl) {
        addCandidate(makeCatalogStream(catalogSubUrl, "original", "Japonês (Original · Sem Dublagem PT-BR)"));
      }
      return list;
    }

    if (selectedDubId === "pt:1" || selectedDubId === "ptbr:1") {
      orionStreams.forEach(addCandidate);
      if (catalogSubUrl && !/-dublado|-dub\b|op-cn|dublado/i.test(catalogSubUrl)) {
        addCandidate(makeCatalogStream(catalogSubUrl, "legendado", "Português (Legendado)"));
      } else if (catalogSubUrl) {
        addCandidate(makeCatalogStream(catalogSubUrl, "legendado", "Português (Legendado)"));
      }
      return list;
    }

    orionStreams.forEach(addCandidate);
    if (catalogSubUrl || catalogDubUrl) {
      addCandidate(
        makeCatalogStream(catalogSubUrl || catalogDubUrl, "original", "Áudio Original")
      );
    }
    return list;
  }, [
    selectedDubId,
    isSteelBallRun,
    isCatalogDubExplicit,
    catalogDubUrl,
    catalogSubUrl,
    orionStreams,
    episode.id,
  ]);

  const activeStream = candidateStreams[candidateIdx] || candidateStreams[0] || null;
  const activeRawUrl = activeStream?.url || "";
  const fallbackRawUrl = candidateStreams[candidateIdx + 1]?.url || catalogSubUrl || catalogDubUrl;
  const isDirectMp4Stream =
    Boolean(activeRawUrl) &&
    (activeStream?.type === "mp4" ||
      (/\.mp4($|\?)/i.test(activeRawUrl) && !activeRawUrl.toLowerCase().includes(".m3u8")));

  // Reset state when switching episode or season
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCandidateIdx(0);
    savedTimeRef.current = 0;
    wasPlayingRef.current = false;
    setUseEmbedFallback(false);
  }, [episode.id, season.id]);

  const activeDubObj = useMemo(() => {
    return (
      availableDubs.find((d) => d.id === selectedDubId) ||
      DEFAULT_ANIME_DUB_PRESETS.find((d) => d.id === selectedDubId) ||
      DEFAULT_ANIME_DUB_PRESETS[0]
    );
  }, [availableDubs, selectedDubId]);

  const quickDubPresets = useMemo(() => {
    const map = new Map<string, AvailableDubOption>();
    DEFAULT_ANIME_DUB_PRESETS.forEach((p) => map.set(p.id, p));
    availableDubs.forEach((d) => map.set(d.id, d));

    const priorityIds = ["ptbr:0", "pt:1", "ja:0", "esla:0", "es:0", "fr:0"];
    const result: AvailableDubOption[] = [];
    for (const id of priorityIds) {
      const found = map.get(id);
      if (found && result.length < 5) {
        if (id === "es:0" && result.some((r) => r.id === "esla:0")) continue;
        result.push(found);
      }
    }
    return result;
  }, [availableDubs]);

  // Handle seamless language track switching preserving timestamp
  const handleSelectDubOption = (dubOpt: AvailableDubOption) => {
    if (videoRef.current && videoRef.current.currentTime > 1) {
      savedTimeRef.current = videoRef.current.currentTime;
      wasPlayingRef.current = !videoRef.current.paused || isPlaying;
    }
    setUseEmbedFallback(false);
    setCandidateIdx(0);
    setSelectedDubId(dubOpt.id);
    onDubChange?.(dubOpt.id);
    toast.success(`Idioma alterado para: ${dubOpt.label}`);
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

    const shouldWaitForOrion =
      isSteelBallRun ||
      !isCatalogDubExplicit ||
      selectedDubId !== "ptbr:0";

    if (isResolvingOrion && shouldWaitForOrion) {
      setIsBuffering(true);
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl || !activeRawUrl) {
      if (!isResolvingOrion && candidateStreams.length === 0) {
        setUseEmbedFallback(true);
      }
      return;
    }

    let isCancelled = false;
    let blobManifestUrl: string | null = null;
    let hasStartedMetadata = false;
    setIsBuffering(true);

    const advanceToNextStream = () => {
      if (isCancelled) return;
      if (candidateIdx + 1 < candidateStreams.length) {
        setCandidateIdx((prev) => prev + 1);
      } else {
        setIsBuffering(false);
        setUseEmbedFallback(true);
      }
    };

    const watchdogTimer = window.setTimeout(() => {
      if (!hasStartedMetadata && videoEl.readyState < 1) {
        advanceToNextStream();
      }
    }, 8000);

    const restorePlaybackState = () => {
      hasStartedMetadata = true;
      window.clearTimeout(watchdogTimer);
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
      const [dubCode, dubType] = selectedDubId.split(":");
      const baseProxyUrl = activeStream?.proxyUrl || `/api/cinema/mp4-proxy?url=${encodeURIComponent(activeRawUrl)}`;
      const selfHealParams = new URLSearchParams({
        tmdbId: String(tmdbTarget.tmdbId || ""),
        type: "tv",
        season: String(effectiveTmdbSeason),
        episode: String(effectiveTmdbEpisode),
        title: tmdbTarget.title,
        year: String(tmdbTarget.year),
        audioMode:
          dubCode.startsWith("pt") && dubType === "0"
            ? "dublado"
            : dubType === "1"
            ? "legendado"
            : "original",
      });
      const proxyMp4Url = baseProxyUrl.includes("tmdbId=")
        ? baseProxyUrl
        : `${baseProxyUrl}&${selfHealParams.toString()}`;

      let triedProxyForThisStream = Boolean(activeStream?.requiresProxy);
      videoEl.setAttribute("referrerpolicy", "no-referrer");
      videoEl.src = triedProxyForThisStream ? proxyMp4Url : activeRawUrl;
      videoEl.load();

      const handleLoaded = () => {
        if (isCancelled) return;
        setIsBuffering(false);
        restorePlaybackState();
      };

      const handleError = () => {
        if (isCancelled) return;
        if (!triedProxyForThisStream) {
          triedProxyForThisStream = true;
          videoEl.src = proxyMp4Url;
          videoEl.load();
        } else {
          window.clearTimeout(watchdogTimer);
          advanceToNextStream();
        }
      };

      videoEl.addEventListener("loadedmetadata", handleLoaded);
      videoEl.addEventListener("error", handleError);
      return () => {
        isCancelled = true;
        window.clearTimeout(watchdogTimer);
        videoEl.removeEventListener("loadedmetadata", handleLoaded);
        videoEl.removeEventListener("error", handleError);
      };
    }

    const preferLangQuery =
      selectedDubId.startsWith("pt") && selectedDubId.endsWith(":0") ? "&preferLang=por" : "";
    const manifestProxyUrl = activeStream?.proxyUrl?.startsWith("/api/")
      ? activeStream.proxyUrl
      : `/api/anime/hls-manifest?url=${encodeURIComponent(
          activeRawUrl
        )}&fallbackUrl=${encodeURIComponent(fallbackRawUrl || activeRawUrl)}${preferLangQuery}`;

    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

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

      hls.loadSource(manifestProxyUrl);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isCancelled) return;
        setIsBuffering(false);
        restorePlaybackState();
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        const tracks = data.audioTracks || [];
        const ptIdx = tracks.findIndex((t) =>
          /por|pt|portug|brazil|dub/i.test(`${t.lang || ""} ${t.name || ""}`)
        );
        const jaEnIdx = tracks.findIndex((t) =>
          /jpn|ja|jap|eng|en|orig/i.test(`${t.lang || ""} ${t.name || ""}`)
        );
        if (selectedDubId.startsWith("pt") && selectedDubId.endsWith(":0") && ptIdx !== -1) {
          hls.audioTrack = ptIdx;
        } else if (jaEnIdx !== -1) {
          hls.audioTrack = jaEnIdx;
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (isCancelled) return;
        if (data?.fatal) {
          if (
            data.type === Hls.ErrorTypes.NETWORK_ERROR &&
            fallbackStep === 0 &&
            !activeStream?.requiresProxy
          ) {
            fallbackStep = 1;
            void buildClientNormalizedManifestUrl(activeRawUrl).then((clientUrl) => {
              if (!isCancelled) {
                hls.loadSource(clientUrl);
                hls.startLoad();
              }
            });
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && fallbackStep < 2) {
            fallbackStep = 2;
            hls.recoverMediaError();
          } else {
            window.clearTimeout(watchdogTimer);
            advanceToNextStream();
          }
        }
      });
    } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      videoEl.src = manifestProxyUrl;
      setIsBuffering(false);
      restorePlaybackState();
    } else {
      window.clearTimeout(watchdogTimer);
      advanceToNextStream();
    }

    return () => {
      isCancelled = true;
      window.clearTimeout(watchdogTimer);
      if (blobManifestUrl) {
        URL.revokeObjectURL(blobManifestUrl);
      }
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [
    useEmbedFallback,
    activeStream,
    activeRawUrl,
    fallbackRawUrl,
    isDirectMp4Stream,
    candidateIdx,
    candidateStreams.length,
    episode.id,
    season.id,
    isResolvingOrion,
    isCatalogDubExplicit,
    isSteelBallRun,
    selectedDubId,
    tmdbTarget,
    effectiveTmdbSeason,
    effectiveTmdbEpisode,
  ]);

  // Keep native video volume at 100%
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
      : ptbrEmbedUrls[0] ||
        (tmdbTarget.tmdbId
          ? `https://embedyplayer.xyz/embed/${tmdbTarget.tmdbId}/${effectiveTmdbSeason}/${effectiveTmdbEpisode}`
          : `https://playerflix.ink/`);

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
      {/* Unified Multi-Language Control Header */}
      <div className="px-4 py-3 bg-white border-b border-neutral-200 flex flex-wrap items-center justify-end gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-xl p-1">
          {quickDubPresets.map((preset) => {
            const isSelected = selectedDubId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectDubOption(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                title={preset.label}
              >
                <span>{preset.shortLabel}</span>
              </button>
            );
          })}

          {availableDubs.length > quickDubPresets.length && (
            <div className="relative inline-flex items-center pl-1 border-l border-neutral-300">
              <Languages className="h-3.5 w-3.5 text-primary ml-1.5 pointer-events-none" />
              <select
                aria-label="Mais idiomas disponíveis"
                value={selectedDubId}
                onChange={(e) => {
                  const found =
                    availableDubs.find((d) => d.id === e.target.value) ||
                    DEFAULT_ANIME_DUB_PRESETS.find((d) => d.id === e.target.value);
                  if (found) handleSelectDubOption(found);
                }}
                className="bg-transparent text-neutral-800 hover:text-primary px-2 py-1.5 text-xs font-semibold cursor-pointer focus:outline-none"
              >
                {availableDubs.map((dub) => (
                  <option key={dub.id} value={dub.id} className="bg-white text-neutral-900">
                    {dub.flag} {dub.label}
                  </option>
                ))}
              </select>
            </div>
          )}
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
              key={`${episode.id}-${selectedDubId}`}
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
                {activeStream &&
                (selectedDubId === "ptbr:0" || selectedDubId === "pt:0") &&
                activeStream.audioMode !== "dublado"
                  ? `🇯🇵 ${activeStream.label || "Japonês Original (Sem Dublagem PT-BR)"}`
                  : `${activeDubObj.flag} ${activeDubObj.label}`}
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
                  Assistir Episódio {episode.number} ({activeDubObj.flag} {activeDubObj.label})
                </span>
              </button>
            )}
          </>
        ) : (
          /* Sandboxed Fallback Player (Zero Redirects Guaranteed) */
          <iframe
            key={`${episode.id}-sandbox-${selectedDubId}`}
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
