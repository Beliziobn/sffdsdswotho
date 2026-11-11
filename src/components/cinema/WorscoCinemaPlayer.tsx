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
  ShieldCheck,
  Mic,
  Globe,
  Loader2,
} from "lucide-react";
import {
  CinemaItem,
  CinemaLanguage,
  getCinemaStreamUrl,
  saveCinemaProgress,
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

export const WorscoCinemaPlayer: React.FC<WorscoCinemaPlayerProps> = ({
  item,
  language,
  onLanguageChange,
  seasonNumber = 1,
  episodeNumber = 1,
}) => {
  // Rigorously enforce anti-redirect & anti-popup protection
  const { blockedCount } = usePlayerAdBlock(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const savedTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);
  const hideControlsTimerRef = useRef<number | null>(null);

  // Audio mode: "dublado" (Português Dublado PT-BR - Default!), "legendado" (Português Legendado), or "original" (Áudio Original EN)
  const [audioMode, setAudioMode] = useState<"dublado" | "legendado" | "original">(
    language === "en" ? "original" : "dublado"
  );
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);

  // Resolved streams & subtitles from our server plugin
  const [isResolving, setIsResolving] = useState<boolean>(true);
  const [allStreams, setAllStreams] = useState<ResolvedStream[]>([]);
  const [hasPtDub, setHasPtDub] = useState<boolean>(true);
  const [hasPtSub, setHasPtSub] = useState<boolean>(true);
  const [candidateIdx, setCandidateIdx] = useState<number>(0);
  const [useProxyForMp4, setUseProxyForMp4] = useState<boolean>(false);
  const [useSandboxFallback, setUseSandboxFallback] = useState<boolean>(false);
  const [ptCues, setPtCues] = useState<SubtitleCue[]>([]);
  const [enCues, setEnCues] = useState<SubtitleCue[]>([]);

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

  // Keep audioMode synced if external language prop changes
  useEffect(() => {
    if (language === "en" && audioMode !== "original") {
      setAudioMode("original");
    } else if (language === "pt" && audioMode === "original") {
      setAudioMode("dublado");
    }
  }, [language]);

  // Resolve real MP4 & HLS streams and subtitles whenever item/season/episode changes
  useEffect(() => {
    let cancelled = false;
    setIsResolving(true);
    setIsBuffering(true);
    setUseSandboxFallback(false);
    setCandidateIdx(0);
    setUseProxyForMp4(false);
    setActiveCueText("");
    savedTimeRef.current = 0;
    wasPlayingRef.current = false;

    const mediaType = item.type === "serie" ? "tv" : "movie";
    const params = new URLSearchParams({
      tmdbId: String(item.tmdbId),
      imdbId: item.imdbId,
      type: mediaType,
      season: String(seasonNumber),
      episode: String(episodeNumber),
      title: item.originalTitle || item.title,
      year: String(item.year),
    });

    fetch(`/api/cinema/resolve?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const resolvedStreams: ResolvedStream[] = Array.isArray(data.streams)
          ? data.streams
          : [];
        setAllStreams(resolvedStreams);
        const resolvedHasPtDub = Boolean(data.hasPtDub);
        const resolvedHasPtSub = Boolean(data.hasPtSub);
        setHasPtDub(resolvedHasPtDub);
        setHasPtSub(resolvedHasPtSub);

        const resolvedPtCues = Array.isArray(data.subtitles?.pt?.cues)
          ? data.subtitles.pt.cues
          : Array.isArray(data.subtitles?.ptCues)
          ? data.subtitles.ptCues
          : [];
        const resolvedEnCues = Array.isArray(data.subtitles?.en?.cues)
          ? data.subtitles.en.cues
          : Array.isArray(data.subtitles?.enCues)
          ? data.subtitles.enCues
          : [];
        setPtCues(resolvedPtCues);
        setEnCues(resolvedEnCues);

        // If dub is not available upstream, automatically activate Portuguese subtitles
        if (!resolvedHasPtDub && audioMode === "dublado") {
          setShowSubtitles(true);
        }

        if (resolvedStreams.length === 0) {
          setUseSandboxFallback(true);
        }
        setIsResolving(false);
      })
      .catch(() => {
        if (cancelled) return;
        setAllStreams([]);
        setHasPtDub(false);
        setUseSandboxFallback(true);
        setIsResolving(false);
      });

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
  ]);

  // Rank streams based on user's selected audioMode ("dublado" | "legendado" | "original")
  const orderedCandidates = useMemo(() => {
    if (allStreams.length === 0) return [];
    const dubStreams = allStreams.filter((s) => s.audioMode === "dublado");
    const legStreams = allStreams.filter((s) => s.audioMode === "legendado");
    const origStreams = allStreams.filter((s) => s.audioMode === "original");
    const multiStreams = allStreams.filter((s) => s.audioMode === "multi");

    if (audioMode === "dublado") {
      return [...dubStreams, ...multiStreams, ...legStreams, ...origStreams];
    }
    if (audioMode === "legendado") {
      return [...legStreams, ...origStreams, ...multiStreams, ...dubStreams];
    }
    return [...origStreams, ...multiStreams, ...legStreams, ...dubStreams];
  }, [allStreams, audioMode]);

  const currentStream = orderedCandidates[candidateIdx] || orderedCandidates[0] || null;

  // Attach MP4 or HLS.js to video element when currentStream changes
  useEffect(() => {
    if (useSandboxFallback || isResolving || !currentStream) return;
    const video = videoRef.current;
    if (!video) return;

    setIsBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const restorePositionAndPlay = () => {
      setIsBuffering(false);
      if (savedTimeRef.current > 2) {
        try {
          video.currentTime = savedTimeRef.current;
        } catch {}
      }
      video.volume = isMuted ? 0 : userVolume;
      video.play().catch(() => {
        // Autoplay may wait for user click
      });
    };

    const advanceToNextCandidate = () => {
      if (currentStream.type === "mp4" && !useProxyForMp4) {
        setUseProxyForMp4(true);
        return;
      }
      setUseProxyForMp4(false);
      if (candidateIdx + 1 < orderedCandidates.length) {
        setCandidateIdx((prev) => prev + 1);
      } else {
        setUseSandboxFallback(true);
      }
    };

    if (currentStream.type === "mp4") {
      // Use backend MP4 Range proxy first so Referer is stripped for hakunaymatata.com CDN
      const mp4Source = useProxyForMp4 ? currentStream.url : currentStream.proxyUrl;
      video.src = mp4Source;
      video.load();

      const onLoadedMetadata = () => {
        restorePositionAndPlay();
      };
      const onError = () => {
        advanceToNextCandidate();
      };

      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.addEventListener("error", onError);

      return () => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("error", onError);
      };
    }

    // HLS stream handling
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 60,
        maxBufferLength: 45,
      });
      hlsRef.current = hls;

      hls.loadSource(currentStream.proxyUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
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
          advanceToNextCandidate();
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = currentStream.proxyUrl;
      const onLoaded = () => restorePositionAndPlay();
      const onErr = () => advanceToNextCandidate();
      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("error", onErr);
      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onErr);
      };
    }
  }, [currentStream, useProxyForMp4, useSandboxFallback, isResolving, audioMode]);

  // Keep native video volume at 100% of user's setting (never ducked, zero artificial TTS)
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = isMuted ? 0 : userVolume;
      video.muted = isMuted;
    }
  }, [isMuted, userVolume]);

  // Synchronize authentic subtitles with video currentTime
  useEffect(() => {
    // If playing an Orion stream that already has burned-in PT subtitles (audioMode === "legendado" & currentStream.audioMode === "legendado")
    // or if playing Dublado with subtitles turned off, avoid duplicate overlay unless requested
    if (!showSubtitles) {
      setActiveCueText("");
      return;
    }
    if (currentStream?.audioMode === "legendado" && audioMode === "legendado") {
      // Orion pt:1 streams already include Portuguese subtitles in the video stream; only show overlay if user wants extra captions
      setActiveCueText("");
      return;
    }
    if (currentStream?.audioMode === "dublado" && audioMode === "dublado") {
      // In Dublado mode, the movie itself speaks Portuguese directly
      setActiveCueText("");
      return;
    }

    const activeCueList = audioMode === "original" ? enCues : ptCues;
    const currentCue = activeCueList.find(
      (c) => currentTime >= c.start - 0.2 && currentTime <= c.end + 0.25
    );
    setActiveCueText(currentCue ? currentCue.text : "");
  }, [currentTime, audioMode, showSubtitles, ptCues, enCues, currentStream]);

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

  const handleSelectAudioMode = (nextMode: "dublado" | "legendado" | "original") => {
    if (videoRef.current && videoRef.current.currentTime > 1) {
      savedTimeRef.current = videoRef.current.currentTime;
      wasPlayingRef.current = !videoRef.current.paused;
    }
    setAudioMode(nextMode);
    setCandidateIdx(0);
    setUseProxyForMp4(false);
    if (allStreams.length > 0) {
      setUseSandboxFallback(false);
    }

    if (nextMode === "original") {
      onLanguageChange("en");
      toast.success("Áudio alterado para Original (Inglês)");
    } else if (nextMode === "legendado") {
      onLanguageChange("pt");
      setShowSubtitles(true);
      toast.success("Alterado para Áudio Original com Legendas em Português (PT-BR)");
    } else {
      onLanguageChange("pt");
      toast.success("Áudio alterado para Dublado em Português (PT-BR)");
    }
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

  const sandboxBackupUrl = getCinemaStreamUrl(item, {
    server: "vidstuck",
    seasonNumber,
    episodeNumber,
    language: audioMode === "original" ? "en" : "pt",
    audioMode,
  });

  return (
    <div className="rounded-2xl overflow-hidden border border-white/15 bg-zinc-950 shadow-2xl">
      {/* Single Unified Control Header — Direct Language Selection & Anti-Redirect Shield */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-zinc-900/95 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            Servidor Unificado 1080p FHD · Anti-Redirecionamento Ativo
            {blockedCount > 0 ? ` (${blockedCount} bloqueados)` : ""}
          </span>
        </div>

        {/* Direct 3-Way Language Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/80 border border-white/15 rounded-xl p-1">
          <button
            type="button"
            onClick={() => handleSelectAudioMode("dublado")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              audioMode === "dublado"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Dublado em Português</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectAudioMode("legendado")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              audioMode === "legendado"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>Português (Legendado)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectAudioMode("original")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              audioMode === "original"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Áudio Original (EN)</span>
          </button>
        </div>
      </div>

      {/* Main 16:9 Cinema Stage */}
      <div
        ref={containerRef}
        onMouseMove={showControlsTemporarily}
        onContextMenu={(e) => e.preventDefault()}
        className="relative aspect-video w-full bg-black select-none overflow-hidden group"
      >
        {useSandboxFallback ? (
          /* Strictly Sandboxed Multi-Audio Player (Zero Popups / Zero Redirects Guaranteed by Browser Sandbox) */
          <iframe
            key={`sandbox-${item.id}-${seasonNumber}-${episodeNumber}-${audioMode}`}
            src={sandboxBackupUrl}
            title={`${displayTitle} — Reprodução Protegida`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            referrerPolicy="no-referrer"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          /* Primary Native HTML5 1080p MP4 / HLS Video Player (Zero Iframes, Zero Popups, Real Original/Dubbed Audio) */
          <>
            <video
              ref={videoRef}
              poster={item.backdropUrl}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 backdrop-blur-xs pointer-events-none z-20">
                <Loader2 className="w-11 h-11 text-amber-400 animate-spin mb-3" />
                <p className="text-xs sm:text-sm font-medium text-white tracking-wide">
                  {isResolving
                    ? `Carregando ${displayTitle} em 1080p FHD...`
                    : "Iniciando reprodução em alta definição..."}
                </p>
                <p className="text-[11px] text-amber-400/90 mt-1">
                  {audioMode === "dublado"
                    ? "Áudio Original Dublado em Português (PT-BR)"
                    : audioMode === "legendado"
                    ? "Áudio Original com Legendas em Português (PT-BR)"
                    : "Áudio Original em Inglês (EN)"}
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

            {/* Active Subtitle Overlay (when in Legendado/Original mode with VTT cues) */}
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
                {audioMode === "dublado" && hasPtDub
                  ? "🇧🇷 Áudio Oficial Dublado em Português (PT-BR)"
                  : audioMode === "dublado" && !hasPtDub
                  ? "🇺🇸 Áudio Original · Legendas em Português (PT-BR)"
                  : audioMode === "legendado"
                  ? "🇧🇷 Áudio Original · Português (Legendado)"
                  : "🇺🇸 Áudio Original em Inglês (EN)"}
                {currentStream?.quality ? ` · ${currentStream.quality}` : ""}
              </span>

              {audioMode === "dublado" && !hasPtDub && (
                <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-200 backdrop-blur-md">
                  Faixa dublada indisponível no servidor para este título. Legendas em Português ativadas.
                </span>
              )}
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
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
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
