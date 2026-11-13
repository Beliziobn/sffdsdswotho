import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Subtitles,
  Loader2,
  SkipBack,
  SkipForward,
  Settings,
  Languages,
} from "lucide-react";
import {
  CinemaItem,
  CinemaLanguage,
  getCinemaStreamUrl,
  saveCinemaProgress,
  fetchCinemaResolveCached,
  prefetchCinemaStream,
} from "@/lib/cinema";
import { usePlayerAdBlock } from "@/hooks/usePlayerAdBlock";
import { toast } from "sonner";

interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface ResolvedStream {
  id: string;
  server: string;
  label: string;
  type: "mp4" | "hls";
  audioMode: "dublado" | "legendado" | "original" | "multi";
  langCode: string;
  quality: string;
  url: string;
  proxyUrl: string;
}

interface AvailableDubOption {
  id: string;
  dubCode: string;
  dubType: string;
  label: string;
  shortLabel: string;
  flag: string;
  audioMode: "dublado" | "legendado" | "original" | "multi";
  isOriginal?: boolean;
}

export interface WorscoCinemaPlayerProps {
  item: CinemaItem;
  language: CinemaLanguage;
  onLanguageChange: (lang: CinemaLanguage) => void;
  seasonNumber?: number;
  episodeNumber?: number;
  totalEpisodes?: number;
  episodeTitle?: string;
  onSelectEpisode?: (epNumber: number) => void;
}

const DEFAULT_LANGUAGE_PRESETS: AvailableDubOption[] = [
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
    id: "en:0",
    dubCode: "en",
    dubType: "0",
    label: "Inglês (Áudio Original)",
    shortLabel: "🇺🇸 Inglês (Original)",
    flag: "🇺🇸",
    audioMode: "original",
    isOriginal: true,
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

export const WorscoCinemaPlayer: React.FC<WorscoCinemaPlayerProps> = ({
  item,
  language,
  onLanguageChange,
  seasonNumber = 1,
  episodeNumber = 1,
  totalEpisodes = 1,
  episodeTitle,
  onSelectEpisode,
}) => {
  // Rigorously enforce anti-redirect & anti-popup protection
  usePlayerAdBlock(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const savedTimeRef = useRef<number>(0);
  const hideControlsTimerRef = useRef<number | null>(null);

  // Unified internal server pipeline ("orion" -> "atlas" -> "embed") handled 100% automatically
  const [internalPipelineStage, setInternalPipelineStage] = useState<"orion" | "atlas" | "embed">("orion");

  // Audio mode & explicit language code (supports PT-BR Dub, PT Sub, EN, ES, FR, RU, HI, AR, JA, KO, etc.)
  const [audioMode, setAudioMode] = useState<"dublado" | "legendado" | "original">(
    language === "en" ? "original" : "dublado"
  );
  const [selectedDubId, setSelectedDubId] = useState<string>(
    language === "en" ? "en:0" : "ptbr:0"
  );
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [preferredQuality, setPreferredQuality] = useState<string>("auto");

  // Resolved streams & available languages from unified backend
  const [isResolving, setIsResolving] = useState<boolean>(true);
  const [allStreams, setAllStreams] = useState<ResolvedStream[]>([]);
  const [availableDubs, setAvailableDubs] = useState<AvailableDubOption[]>(DEFAULT_LANGUAGE_PRESETS);
  const [hasPtDub, setHasPtDub] = useState<boolean>(true);
  const [hasPtSub, setHasPtSub] = useState<boolean>(true);
  const [candidateIdx, setCandidateIdx] = useState<number>(0);
  const [useProxyForMp4, setUseProxyForMp4] = useState<boolean>(false);
  const [ptCues, setPtCues] = useState<SubtitleCue[]>([]);
  const [enCues, setEnCues] = useState<SubtitleCue[]>([]);
  const [resolvedImdbId, setResolvedImdbId] = useState<string>(item.imdbId || "");

  // Video player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [userVolume, setUserVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeCueText, setActiveCueText] = useState<string>("");
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);

  // Ensure document referrer policy is no-referrer so direct CDN MP4 streams respond in ~12ms without 429 blocks
  useEffect(() => {
    let meta = document.querySelector('meta[name="referrer"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "referrer";
      document.head.appendChild(meta);
    }
    meta.content = "no-referrer";
  }, []);

  // Keep audioMode synced if external language prop changes
  useEffect(() => {
    if (language === "en" && selectedDubId === "ptbr:0") {
      setAudioMode("original");
      setSelectedDubId("en:0");
    } else if (language === "pt" && selectedDubId === "en:0") {
      setAudioMode("dublado");
      setSelectedDubId("ptbr:0");
    }
  }, [language]);

  // Reset pipeline to primary when movie or episode changes
  useEffect(() => {
    setInternalPipelineStage("orion");
    savedTimeRef.current = 0;
  }, [item.id, seasonNumber, episodeNumber]);

  // Prefetch next episode in background when watching a series
  useEffect(() => {
    if (item.type === "serie" && episodeNumber < totalEpisodes) {
      const timer = window.setTimeout(() => {
        prefetchCinemaStream(item, seasonNumber, episodeNumber + 1, audioMode);
      }, 2000);
      return () => window.clearTimeout(timer);
    }
  }, [item, seasonNumber, episodeNumber, totalEpisodes, audioMode]);

  // Resolve real MP4 & HLS streams from unified server
  useEffect(() => {
    if (internalPipelineStage === "embed") {
      setIsResolving(false);
      setIsBuffering(false);
      return;
    }

    let cancelled = false;
    setIsResolving(true);
    setIsBuffering(true);
    setCandidateIdx(0);
    setUseProxyForMp4(false);
    setActiveCueText("");

    const [dubCode, dubType] = selectedDubId.split(":");
    const mediaType = item.type === "serie" ? "tv" : "movie";

    const fetchStreams = async (attempt = 1) => {
      try {
        const data = await fetchCinemaResolveCached({
          tmdbId: item.tmdbId,
          imdbId: item.imdbId,
          type: mediaType,
          season: seasonNumber,
          episode: episodeNumber,
          title: item.originalTitle || item.title,
          year: item.year,
          audioMode,
          dubCode: internalPipelineStage === "atlas" ? undefined : dubCode,
          dubType: internalPipelineStage === "atlas" ? undefined : dubType,
          server: internalPipelineStage === "atlas" ? "atlas" : "orion",
          forceBust: attempt > 1,
        });

        if (cancelled) return;
        const resolvedStreams: ResolvedStream[] = Array.isArray(data?.streams)
          ? data.streams
          : [];

        if (resolvedStreams.length === 0) {
          if (internalPipelineStage === "orion") {
            setInternalPipelineStage("atlas");
            return;
          }
          setInternalPipelineStage("embed");
          setIsResolving(false);
          return;
        }

        setAllStreams(resolvedStreams);
        if (Array.isArray(data?.availableDubs) && data.availableDubs.length > 0) {
          setAvailableDubs(data.availableDubs);
        }
        if (data?.imdbId) {
          setResolvedImdbId(data.imdbId);
        }

        const resolvedHasPtDub = Boolean(data?.hasPtDub);
        const resolvedHasPtSub = Boolean(data?.hasPtSub);
        setHasPtDub(resolvedHasPtDub);
        setHasPtSub(resolvedHasPtSub);

        const resolvedPtCues = Array.isArray(data?.subtitles?.pt?.cues)
          ? data.subtitles.pt.cues
          : Array.isArray(data?.subtitles?.ptCues)
          ? data.subtitles.ptCues
          : [];
        const resolvedEnCues = Array.isArray(data?.subtitles?.en?.cues)
          ? data.subtitles.en.cues
          : Array.isArray(data?.subtitles?.enCues)
          ? data.subtitles.enCues
          : [];
        if (resolvedPtCues.length > 0) setPtCues(resolvedPtCues);
        if (resolvedEnCues.length > 0) setEnCues(resolvedEnCues);

        if (!resolvedHasPtDub && audioMode === "dublado") {
          setShowSubtitles(true);
        }

        setIsResolving(false);
      } catch {
        if (cancelled) return;
        if (internalPipelineStage === "orion") {
          setInternalPipelineStage("atlas");
          return;
        }
        setInternalPipelineStage("embed");
        setIsResolving(false);
      }
    };

    void fetchStreams(1);

    return () => {
      cancelled = true;
    };
  }, [
    item.id,
    item.tmdbId,
    item.imdbId,
    item.type,
    item.originalTitle,
    item.title,
    item.year,
    seasonNumber,
    episodeNumber,
    selectedDubId,
    audioMode,
    internalPipelineStage,
  ]);

  // Non-blocking background subtitle loader so OpenSubtitles never delays video startup
  useEffect(() => {
    const targetImdb = resolvedImdbId || item.imdbId;
    if (!targetImdb) return;
    const needsPt = ptCues.length === 0 && (audioMode === "legendado" || (!hasPtDub && audioMode === "dublado") || showSubtitles);
    const needsEn = enCues.length === 0 && audioMode === "original" && showSubtitles;
    if (!needsPt && !needsEn) return;

    let cancelled = false;
    const mediaType = item.type === "serie" ? "tv" : "movie";
    const langParam = needsEn ? "eng" : "pob";

    fetch(
      `/api/cinema/vtt?imdbId=${encodeURIComponent(targetImdb)}&lang=${langParam}&type=${mediaType}&season=${seasonNumber}&episode=${episodeNumber}&format=json`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data?.cues) || data.cues.length === 0) return;
        if (langParam === "eng") {
          setEnCues(data.cues);
        } else {
          setPtCues(data.cues);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [resolvedImdbId, item.imdbId, item.type, seasonNumber, episodeNumber, audioMode, hasPtDub, showSubtitles, ptCues.length, enCues.length]);

  // Rank streams based on user's preferredQuality
  const orderedCandidates = useMemo(() => {
    if (allStreams.length === 0) return [];
    let list = [...allStreams];

    if (preferredQuality !== "auto") {
      const matchingQuality = list.filter((s) => s.quality === preferredQuality);
      const others = list.filter((s) => s.quality !== preferredQuality);
      list = [...matchingQuality, ...others];
    }

    return list;
  }, [allStreams, preferredQuality]);

  const availableQualities = useMemo(() => {
    const set = new Set<string>();
    allStreams.forEach((s) => {
      if (s.quality) set.add(s.quality);
    });
    return Array.from(set);
  }, [allStreams]);

  const currentStream = orderedCandidates[candidateIdx] || orderedCandidates[0] || null;

  // Attach MP4 (Direct CDN first!) or HLS.js to video element when currentStream changes
  useEffect(() => {
    if (internalPipelineStage === "embed" || isResolving || !currentStream) return;
    const video = videoRef.current;
    if (!video) return;

    setIsBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let hasStartedMetadata = false;

    const restorePositionAndPlay = () => {
      hasStartedMetadata = true;
      setIsBuffering(false);
      if (savedTimeRef.current > 2) {
        try {
          video.currentTime = savedTimeRef.current;
        } catch {}
      }
      video.volume = isMuted ? 0 : userVolume;
      video.playbackRate = playbackRate;
      video.play().catch(() => {});
    };

    const advanceToNextCandidate = () => {
      if (currentStream.type === "mp4" && !useProxyForMp4) {
        setUseProxyForMp4(true);
        return;
      }
      setUseProxyForMp4(false);
      let nextIdx = candidateIdx + 1;
      while (
        nextIdx < orderedCandidates.length &&
        orderedCandidates[nextIdx].url === currentStream.url
      ) {
        nextIdx++;
      }
      if (nextIdx < orderedCandidates.length) {
        setCandidateIdx(nextIdx);
      } else if (internalPipelineStage === "orion") {
        setInternalPipelineStage("atlas");
      } else {
        setInternalPipelineStage("embed");
      }
    };

    // Automatic watchdog: if stream doesn't load metadata within 7 seconds, seamlessly try next unified source
    const watchdogTimer = window.setTimeout(() => {
      if (!hasStartedMetadata && video.readyState < 1) {
        advanceToNextCandidate();
      }
    }, 7000);

    if (currentStream.type === "mp4") {
      video.setAttribute("referrerpolicy", "no-referrer");
      const mediaType = item.type === "serie" ? "tv" : "movie";
      const selfHealParams = new URLSearchParams({
        tmdbId: String(item.tmdbId),
        imdbId: item.imdbId || "",
        type: mediaType,
        season: String(seasonNumber),
        episode: String(episodeNumber),
        title: item.originalTitle || item.title,
        year: String(item.year),
        audioMode: currentStream.audioMode === "dublado" ? "dublado" : audioMode,
        quality: currentStream.quality || "1080p",
      });
      const enrichedProxyUrl = currentStream.proxyUrl.includes("tmdbId=")
        ? currentStream.proxyUrl
        : `${currentStream.proxyUrl}&${selfHealParams.toString()}`;

      const mp4Source = useProxyForMp4 ? enrichedProxyUrl : currentStream.url;
      video.src = mp4Source;
      video.load();

      const onLoadedMetadata = () => {
        window.clearTimeout(watchdogTimer);
        restorePositionAndPlay();
      };
      const onCanPlay = () => {
        hasStartedMetadata = true;
        window.clearTimeout(watchdogTimer);
        setIsBuffering(false);
      };
      const onError = () => {
        window.clearTimeout(watchdogTimer);
        advanceToNextCandidate();
      };

      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.addEventListener("canplay", onCanPlay);
      video.addEventListener("error", onError);

      return () => {
        window.clearTimeout(watchdogTimer);
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("error", onError);
      };
    }

    // HLS stream handling
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1,
        backBufferLength: 60,
        maxBufferLength: 30,
      });
      hlsRef.current = hls;

      hls.loadSource(currentStream.proxyUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        window.clearTimeout(watchdogTimer);
        restorePositionAndPlay();
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        const tracks = data.audioTracks || [];
        const ptIdx = tracks.findIndex((t) =>
          /por|pt|portug|brazil|dub/i.test(`${t.lang || ""} ${t.name || ""}`)
        );
        const enIdx = tracks.findIndex((t) =>
          /eng|en|english|orig/i.test(`${t.lang || ""} ${t.name || ""}`)
        );
        if (audioMode === "dublado" && ptIdx !== -1) {
          hls.audioTrack = ptIdx;
        } else if (enIdx !== -1) {
          hls.audioTrack = enIdx;
        }
      });

      hls.on(Hls.Events.ERROR, (_, errData) => {
        if (errData.fatal) {
          window.clearTimeout(watchdogTimer);
          advanceToNextCandidate();
        }
      });

      return () => {
        window.clearTimeout(watchdogTimer);
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = currentStream.proxyUrl;
      const onLoaded = () => {
        window.clearTimeout(watchdogTimer);
        restorePositionAndPlay();
      };
      const onErr = () => {
        window.clearTimeout(watchdogTimer);
        advanceToNextCandidate();
      };
      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("error", onErr);
      return () => {
        window.clearTimeout(watchdogTimer);
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onErr);
      };
    }
  }, [currentStream, useProxyForMp4, isResolving, audioMode, internalPipelineStage, candidateIdx, orderedCandidates]);

  // Keep native video volume and playbackRate synced
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = isMuted ? 0 : userVolume;
      video.muted = isMuted;
      video.playbackRate = playbackRate;
    }
  }, [isMuted, userVolume, playbackRate]);

  // Synchronize authentic subtitles with video currentTime
  useEffect(() => {
    if (!showSubtitles) {
      setActiveCueText("");
      return;
    }
    if (currentStream?.audioMode === "legendado" && selectedDubId.endsWith(":1")) {
      setActiveCueText("");
      return;
    }
    if (currentStream?.audioMode === "dublado" && selectedDubId.startsWith("pt")) {
      setActiveCueText("");
      return;
    }

    const activeCueList = audioMode === "original" ? enCues : ptCues;
    const currentCue = activeCueList.find(
      (c) => currentTime >= c.start - 0.2 && currentTime <= c.end + 0.25
    );
    setActiveCueText(currentCue ? currentCue.text : "");
  }, [currentTime, audioMode, selectedDubId, showSubtitles, ptCues, enCues, currentStream]);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = window.setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3500);
  }, [isPlaying]);

  const handleSelectLanguageOption = (dubOpt: AvailableDubOption) => {
    if (videoRef.current && videoRef.current.currentTime > 1) {
      savedTimeRef.current = videoRef.current.currentTime;
    }
    setSelectedDubId(dubOpt.id);
    const nextAudioMode =
      dubOpt.audioMode === "dublado"
        ? "dublado"
        : dubOpt.audioMode === "legendado"
        ? "legendado"
        : "original";
    setAudioMode(nextAudioMode);
    setCandidateIdx(0);
    setUseProxyForMp4(false);
    setInternalPipelineStage("orion");

    if (dubOpt.dubCode === "en") {
      onLanguageChange("en");
    } else if (dubOpt.dubCode.startsWith("pt")) {
      onLanguageChange("pt");
      if (dubOpt.dubType === "1") setShowSubtitles(true);
    }
    toast.success(`Idioma selecionado: ${dubOpt.label}`);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    showControlsTemporarily();
  };

  const handleSeek = (newTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(duration || 0, newTime));
    video.currentTime = clamped;
    savedTimeRef.current = clamped;
    setCurrentTime(clamped);
    showControlsTemporarily();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec) || sec < 0) return "00:00";
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const displayTitle =
    audioMode === "original" && item.originalTitle ? item.originalTitle : item.title;

  const activeDubObj =
    availableDubs.find((d) => d.id === selectedDubId) ||
    DEFAULT_LANGUAGE_PRESETS.find((d) => d.id === selectedDubId) ||
    DEFAULT_LANGUAGE_PRESETS[0];

  const [activeDubCode, activeDubType] = selectedDubId.split(":");
  const embedPlayerUrl = getCinemaStreamUrl(item, {
    server: "vidstuck",
    seasonNumber,
    episodeNumber,
    language: audioMode === "original" ? "en" : "pt",
    audioMode,
    dubCode: activeDubCode,
    dubType: activeDubType,
  });

  // Quick preset buttons shown directly in the bar
  const quickDubPresets = useMemo(() => {
    const map = new Map<string, AvailableDubOption>();
    DEFAULT_LANGUAGE_PRESETS.forEach((p) => map.set(p.id, p));
    availableDubs.forEach((d) => map.set(d.id, d));

    const priorityIds = ["ptbr:0", "pt:1", "en:0", "esla:0", "es:0", "fr:0"];
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

  return (
    <div className="rounded-2xl overflow-hidden border border-white/15 bg-zinc-950 shadow-2xl">
      {/* Single Clean Unified Header — Only Language & Quality Selection (Zero Server Complication) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-3 px-4 sm:px-6 py-3.5 bg-zinc-900/95 border-b border-white/10">
        {/* Direct 1-Click Language Switcher + Quality */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 bg-black/80 border border-white/15 rounded-xl p-1">
            {quickDubPresets.map((preset) => {
              const isSelected = selectedDubId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectLanguageOption(preset)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-black shadow-sm"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{preset.shortLabel}</span>
                </button>
              );
            })}

            {/* Full Language Dropdown when additional languages exist */}
            {availableDubs.length > quickDubPresets.length && (
              <div className="relative inline-flex items-center pl-1 border-l border-white/10">
                <Languages className="w-3.5 h-3.5 text-amber-400 ml-1.5 pointer-events-none" />
                <select
                  aria-label="Mais idiomas disponíveis"
                  value={selectedDubId}
                  onChange={(e) => {
                    const found =
                      availableDubs.find((d) => d.id === e.target.value) ||
                      DEFAULT_LANGUAGE_PRESETS.find((d) => d.id === e.target.value);
                    if (found) handleSelectLanguageOption(found);
                  }}
                  className="bg-transparent text-amber-300 hover:text-amber-200 px-2 py-1.5 text-xs font-semibold cursor-pointer focus:outline-none"
                >
                  {availableDubs.map((dub) => (
                    <option key={dub.id} value={dub.id} className="bg-zinc-900 text-white">
                      {dub.flag} {dub.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quality Selector */}
          {availableQualities.length > 1 && internalPipelineStage !== "embed" && (
            <div className="flex items-center gap-1.5 bg-black/80 border border-white/15 rounded-xl px-2.5 py-1.5">
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <select
                aria-label="Qualidade de vídeo"
                value={preferredQuality}
                onChange={(e) => {
                  if (videoRef.current && videoRef.current.currentTime > 1) {
                    savedTimeRef.current = videoRef.current.currentTime;
                  }
                  setPreferredQuality(e.target.value);
                  setCandidateIdx(0);
                  setUseProxyForMp4(false);
                }}
                className="bg-transparent text-zinc-200 text-xs font-mono cursor-pointer focus:outline-none"
              >
                <option value="auto" className="bg-zinc-900">
                  Auto ({currentStream?.quality || "1080p FHD"})
                </option>
                {availableQualities.map((q) => (
                  <option key={q} value={q} className="bg-zinc-900">
                    {q}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main 16:9 Cinema Stage */}
      <div
        ref={containerRef}
        onMouseMove={showControlsTemporarily}
        onContextMenu={(e) => e.preventDefault()}
        className="relative aspect-video w-full bg-black select-none overflow-hidden group"
      >
        {internalPipelineStage === "embed" ? (
          <div className="relative w-full h-full bg-black">
            <iframe
              key={`${item.id}-${seasonNumber}-${episodeNumber}-${selectedDubId}`}
              src={embedPlayerUrl}
              title={`${displayTitle} — Player Unificado`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="origin"
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            />
          </div>
        ) : (
          /* Unified Native HTML5 1080p MP4 / HLS Video Player (Direct CDN Edge, Zero Popups, Multi-Audio) */
          <>
            <video
              ref={videoRef}
              poster={item.backdropUrl}
              preload="auto"
              playsInline
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
              onPlay={() => {
                setIsPlaying(true);
                setIsBuffering(false);
              }}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onCanPlay={() => setIsBuffering(false)}
              onTimeUpdate={(e) => {
                const t = e.currentTarget.currentTime;
                setCurrentTime(t);
                if (t > 1) savedTimeRef.current = t;
                if (duration > 0 && Math.floor(t) % 15 === 0) {
                  const pct = Math.min(98, Math.max(5, Math.round((t / duration) * 100)));
                  saveCinemaProgress(item.id, pct, seasonNumber, episodeNumber);
                }
              }}
              onLoadedMetadata={(e) => {
                setDuration(e.currentTarget.duration || 0);
                setIsBuffering(false);
              }}
              className="w-full h-full object-contain bg-black cursor-pointer"
            />

            {/* Loading / Resolving Spinner Overlay */}
            {(isResolving || isBuffering) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs pointer-events-none z-20 p-4 text-center">
                <Loader2 className="w-11 h-11 text-amber-400 animate-spin mb-3" />
                <p className="text-xs sm:text-sm font-medium text-white tracking-wide">
                  {isResolving
                    ? `Iniciando ${displayTitle}...`
                    : "Reproduzindo em alta definição..."}
                </p>
                <p className="text-[11px] text-amber-400/90 mt-1">
                  {activeDubObj.flag} {activeDubObj.label}
                  {currentStream?.quality ? ` · ${currentStream.quality}` : ""}
                </p>
              </div>
            )}

            {/* Big Center Play Button when Paused */}
            {!isPlaying && !isResolving && !isBuffering && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-10"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/95 hover:bg-amber-400 text-black flex items-center justify-center shadow-2xl shadow-amber-500/40 transition transform hover:scale-105">
                  <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-black ml-1" />
                </div>
              </div>
            )}

            {/* Active Subtitle Overlay */}
            {showSubtitles && activeCueText && (
              <div className="absolute inset-x-4 bottom-20 sm:bottom-24 flex justify-center pointer-events-none z-20">
                <div className="max-w-3xl px-4 py-2 rounded-lg bg-black/80 border border-white/10 text-center shadow-xl backdrop-blur-xs">
                  <p className="text-sm sm:text-lg md:text-xl font-medium text-amber-50 leading-snug drop-shadow">
                    {activeCueText}
                  </p>
                </div>
              </div>
            )}

            {/* Top-Left Status Badge inside Video Stage */}
            <div
              className={`absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none transition-opacity duration-300 ${
                controlsVisible || !isPlaying ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="px-3 py-1 rounded-full bg-black/80 border border-white/15 text-[11px] font-medium text-zinc-200 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {activeDubObj.flag} {activeDubObj.label}
                {currentStream?.quality ? ` · ${currentStream.quality}` : ""}
                {item.type === "serie"
                  ? ` · T${seasonNumber}:E${episodeNumber}${episodeTitle ? ` (${episodeTitle})` : ""}`
                  : ""}
              </span>
            </div>

            {/* Bottom Custom Native Video Controls */}
            <div
              className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-10 pb-3 px-4 sm:px-6 transition-opacity duration-300 ${
                controlsVisible || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              {/* Interactive Timeline Progress Bar */}
              <div className="mb-3 flex items-center gap-3">
                <span className="text-[11px] font-mono text-zinc-300 w-14 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={1}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-[11px] font-mono text-zinc-400 w-14">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Control Buttons Row */}
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition cursor-pointer"
                    title={isPlaying ? "Pausar" : "Reproduzir"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-black" />
                    ) : (
                      <Play className="w-4 h-4 fill-black" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSeek(currentTime - 10)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title="Voltar 10 segundos"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSeek(currentTime + 10)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title="Avançar 10 segundos"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Episode Prev/Next Controls for Series */}
                  {item.type === "serie" && onSelectEpisode && (
                    <div className="flex items-center gap-1.5 ml-1">
                      <button
                        type="button"
                        disabled={episodeNumber <= 1}
                        onClick={() => onSelectEpisode(episodeNumber - 1)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-white transition cursor-pointer"
                        title="Episódio Anterior"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={episodeNumber >= totalEpisodes}
                        onClick={() => onSelectEpisode(episodeNumber + 1)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-white transition cursor-pointer"
                        title="Próximo Episódio"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Volume Control */}
                  <div className="flex items-center gap-2 ml-1">
                    <button
                      type="button"
                      onClick={() => setIsMuted((m) => !m)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                      title={isMuted ? "Ativar Som" : "Silenciar"}
                    >
                      {isMuted || userVolume === 0 ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : userVolume}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setUserVolume(v);
                        setIsMuted(v === 0);
                      }}
                      className="hidden sm:block w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Playback Speed Selector */}
                  <select
                    aria-label="Velocidade de reprodução"
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                    className="hidden sm:block bg-white/10 border border-white/10 text-zinc-200 rounded-lg px-2 py-1.5 text-xs font-mono cursor-pointer focus:outline-none"
                    title="Velocidade de Reprodução"
                  >
                    <option value={0.75} className="bg-zinc-900">0.75x</option>
                    <option value={1} className="bg-zinc-900">1.0x</option>
                    <option value={1.25} className="bg-zinc-900">1.25x</option>
                    <option value={1.5} className="bg-zinc-900">1.5x</option>
                    <option value={2} className="bg-zinc-900">2.0x</option>
                  </select>

                  {/* Toggle Captions Button */}
                  <button
                    type="button"
                    onClick={() => setShowSubtitles((s) => !s)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      showSubtitles
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "bg-white/10 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                    title="Mostrar / Ocultar Legendas na Tela"
                  >
                    <Subtitles className="w-4 h-4" />
                    <span className="hidden sm:inline">Legendas</span>
                  </button>

                  {/* Fullscreen Toggle */}
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title="Tela Cheia"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WorscoCinemaPlayer;
