import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Globe,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Film,
  Mic,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  CinemaItem,
  CinemaLanguage,
  getCinemaStreamUrl,
  saveCinemaProgress,
} from "@/lib/cinema";
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
  type: string;
  quality: string;
  proxyUrl: string;
}

interface WorscoCinemaPlayerProps {
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
  totalEpisodes = 1,
  episodeTitle,
  onSelectEpisode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dubAudioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Playback mode: "movie" (full movie/episode) or "trailer"
  const [contentMode, setContentMode] = useState<"movie" | "trailer">("movie");
  // Portuguese sub-mode: "dublado" (spoken PT-BR voice + ducked original audio) or "legendado" (original audio + PT-BR subtitles)
  const [ptMode, setPtMode] = useState<"dublado" | "legendado">("dublado");
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);

  // Resolved streams & subtitles from our server plugin
  const [isResolving, setIsResolving] = useState<boolean>(true);
  const [streams, setStreams] = useState<ResolvedStream[]>([]);
  const [activeStreamIdx, setActiveStreamIdx] = useState<number>(0);
  const [useSandboxFallback, setUseSandboxFallback] = useState<boolean>(false);
  const [ptCues, setPtCues] = useState<SubtitleCue[]>([]);
  const [enCues, setEnCues] = useState<SubtitleCue[]>([]);
  const [hasNativePtAudioTrack, setHasNativePtAudioTrack] = useState<boolean>(false);

  // Video player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [userVolume, setUserVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeCueText, setActiveCueText] = useState<string>("");
  const [isDubSpeaking, setIsDubSpeaking] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);

  // Cache for pre-fetched PT-BR TTS audio blobs
  const ttsBlobCacheRef = useRef<Map<number, string>>(new Map());
  const ttsFetchingSetRef = useRef<Set<number>>(new Set());
  const lastSpokenCueIdRef = useRef<number>(-1);
  const hideControlsTimerRef = useRef<number | null>(null);

  const isDubladoActive =
    language === "pt" && ptMode === "dublado" && contentMode === "movie" && !useSandboxFallback;

  // Clean up dubbing audio and speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (dubAudioRef.current) {
        dubAudioRef.current.pause();
        dubAudioRef.current.src = "";
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Resolve 1080p HLS streams and PT-BR/EN subtitles whenever item/season/episode changes
  useEffect(() => {
    let cancelled = false;
    setIsResolving(true);
    setIsBuffering(true);
    setUseSandboxFallback(false);
    setActiveStreamIdx(0);
    setActiveCueText("");
    lastSpokenCueIdRef.current = -1;

    // Clear previous TTS blob cache
    ttsBlobCacheRef.current.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
    ttsBlobCacheRef.current.clear();
    ttsFetchingSetRef.current.clear();
    if (dubAudioRef.current) {
      dubAudioRef.current.pause();
      dubAudioRef.current.src = "";
    }

    const mediaType = item.type === "serie" ? "tv" : "movie";
    const params = new URLSearchParams({
      tmdbId: String(item.tmdbId),
      imdbId: item.imdbId,
      type: mediaType,
      season: String(seasonNumber),
      episode: String(episodeNumber),
      title: item.title,
      year: String(item.year),
    });

    fetch(`/api/cinema/resolve?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const resolvedStreams: ResolvedStream[] = Array.isArray(data.streams)
          ? data.streams
          : [];
        setStreams(resolvedStreams);
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
        if (resolvedStreams.length === 0) {
          setUseSandboxFallback(true);
        }
        setIsResolving(false);
      })
      .catch(() => {
        if (cancelled) return;
        setStreams([]);
        setUseSandboxFallback(true);
        setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item.id, item.tmdbId, item.imdbId, item.type, item.originalTitle, item.title, item.year, seasonNumber, episodeNumber]);

  // Attach HLS.js to video element when active stream changes
  useEffect(() => {
    if (contentMode !== "movie" || useSandboxFallback || isResolving) return;
    const currentStream = streams[activeStreamIdx];
    const video = videoRef.current;
    if (!currentStream || !video) return;

    setIsBuffering(true);
    setHasNativePtAudioTrack(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const savedTime = video.currentTime > 5 ? video.currentTime : 0;

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
        setIsBuffering(false);
        if (savedTime > 0) {
          video.currentTime = savedTime;
        }
        video.play().catch(() => {
          // Autoplay may wait for user click
        });
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        const tracks = data.audioTracks || [];
        const ptIdx = tracks.findIndex((t) =>
          /por|pt|portug|brazil|dub/i.test(`${t.lang || ""} ${t.name || ""}`)
        );
        const enIdx = tracks.findIndex((t) =>
          /eng|en|english|orig/i.test(`${t.lang || ""} ${t.name || ""}`)
        );
        if (ptIdx !== -1) {
          setHasNativePtAudioTrack(true);
          if (language === "pt" && ptMode === "dublado") {
            hls.audioTrack = ptIdx;
          } else if (enIdx !== -1) {
            hls.audioTrack = enIdx;
          }
        }
      });

      hls.on(Hls.Events.ERROR, (_, errData) => {
        if (errData.fatal) {
          if (activeStreamIdx + 1 < streams.length) {
            setActiveStreamIdx((prev) => prev + 1);
          } else if (language !== "pt") {
            setUseSandboxFallback(true);
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = currentStream.proxyUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsBuffering(false);
        if (savedTime > 0) video.currentTime = savedTime;
        video.play().catch(() => {});
      });
    }
  }, [streams, activeStreamIdx, contentMode, useSandboxFallback, isResolving, language, ptMode]);

  // Switch native HLS audio track if available when user switches PT/EN
  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls || !hls.audioTracks || hls.audioTracks.length <= 1) return;
    const tracks = hls.audioTracks;
    const ptIdx = tracks.findIndex((t) =>
      /por|pt|portug|brazil/i.test(`${t.lang || ""} ${t.name || ""}`)
    );
    const enIdx = tracks.findIndex((t) =>
      /eng|en|english/i.test(`${t.lang || ""} ${t.name || ""}`)
    );

    if (language === "pt" && ptMode === "dublado" && ptIdx !== -1) {
      hls.audioTrack = ptIdx;
    } else if (enIdx !== -1) {
      hls.audioTrack = enIdx;
    }
  }, [language, ptMode]);

  // Pre-fetch upcoming PT-BR TTS audio cues (20 seconds ahead of currentTime)
  useEffect(() => {
    if (!isDubladoActive || hasNativePtAudioTrack || ptCues.length === 0) return;

    const upcoming = ptCues.filter(
      (c) => c.start >= currentTime - 1 && c.start <= currentTime + 20
    );

    for (const cue of upcoming.slice(0, 5)) {
      if (
        ttsBlobCacheRef.current.has(cue.id) ||
        ttsFetchingSetRef.current.has(cue.id)
      ) {
        continue;
      }
      ttsFetchingSetRef.current.add(cue.id);
      const ttsUrl = `/api/cinema/tts?lang=pt-BR&text=${encodeURIComponent(cue.text)}`;
      fetch(ttsUrl)
        .then((r) => (r.ok ? r.blob() : Promise.reject()))
        .then((blob) => {
          const objUrl = URL.createObjectURL(blob);
          ttsBlobCacheRef.current.set(cue.id, objUrl);
        })
        .catch(() => {
          // fallback handled at speak time
        })
        .finally(() => {
          ttsFetchingSetRef.current.delete(cue.id);
        });
    }
  }, [currentTime, isDubladoActive, hasNativePtAudioTrack, ptCues]);

  // Synchronize subtitles & PT-BR studio voice dubbing with video currentTime
  useEffect(() => {
    const activeCueList = language === "pt" ? ptCues : enCues;
    const currentCue =
      activeCueList.find(
        (c) => currentTime >= c.start - 0.25 && currentTime <= c.end + 0.35
      ) ||
      (isDubladoActive && currentTime < 8 ? activeCueList[0] : undefined);

    setActiveCueText(currentCue ? currentCue.text : "");

    const video = videoRef.current;
    const dubAudio = dubAudioRef.current;

    if (!isDubladoActive || hasNativePtAudioTrack) {
      if (video) {
        video.volume = isMuted ? 0 : userVolume;
      }
      setIsDubSpeaking(false);
      return;
    }

    // Keep original English video audio continuously ducked at 10% in Português Dublado mode
    // so the movie never jumps back to loud English speech between dialogue cues!
    if (video) {
      video.volume = isMuted ? 0 : Math.min(0.12, userVolume * 0.1);
    }

    if (!isPlaying) {
      setIsDubSpeaking(false);
      return;
    }

    if (currentCue && language === "pt") {
      if (lastSpokenCueIdRef.current !== currentCue.id) {
        lastSpokenCueIdRef.current = currentCue.id;
        setIsDubSpeaking(true);

        const cachedBlobUrl = ttsBlobCacheRef.current.get(currentCue.id);
        const directTtsUrl =
          cachedBlobUrl ||
          `/api/cinema/tts?lang=pt-BR&text=${encodeURIComponent(currentCue.text)}`;

        const speakViaWebSpeech = () => {
          if ("speechSynthesis" in window && !isMuted) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(currentCue.text);
            utter.lang = "pt-BR";
            utter.rate = 1.12;
            utter.volume = Math.min(1, userVolume);
            utter.onend = () => setIsDubSpeaking(false);
            window.speechSynthesis.speak(utter);
          }
        };

        if (dubAudio) {
          dubAudio.pause();
          dubAudio.src = directTtsUrl;
          dubAudio.volume = isMuted ? 0 : Math.min(1, userVolume * 1.0);
          const cueDuration = Math.max(1.2, currentCue.end - currentCue.start);
          const estimatedSpeechDuration = Math.max(1.2, currentCue.text.length / 13.5);
          const rate = Math.min(
            1.35,
            Math.max(1.0, estimatedSpeechDuration / cueDuration)
          );
          dubAudio.playbackRate = rate;
          dubAudio.onended = () => {
            setIsDubSpeaking(false);
          };
          dubAudio.onerror = () => {
            speakViaWebSpeech();
          };
          dubAudio.play().catch(() => {
            speakViaWebSpeech();
          });
        } else {
          speakViaWebSpeech();
        }
      }
    }
  }, [
    currentTime,
    language,
    ptCues,
    enCues,
    isDubladoActive,
    hasNativePtAudioTrack,
    isPlaying,
    isMuted,
    userVolume,
    isDubSpeaking,
  ]);

  // Pause dubbing audio immediately when video pauses or seeks
  useEffect(() => {
    const dubAudio = dubAudioRef.current;
    if (!isPlaying) {
      dubAudio?.pause();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsDubSpeaking(false);
    }
  }, [isPlaying]);

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

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      if (dubAudioRef.current) {
        dubAudioRef.current.play().then(() => {
          dubAudioRef.current?.pause();
        }).catch(() => {});
      }
    } else {
      video.pause();
      dubAudioRef.current?.pause();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsDubSpeaking(false);
    }
    showControlsTemporarily();
  };

  const handleSeek = (newTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(duration || 0, newTime));
    video.currentTime = clamped;
    setCurrentTime(clamped);
    lastSpokenCueIdRef.current = -1;
    dubAudioRef.current?.pause();
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

  const handleSwitchSignal = () => {
    if (contentMode === "trailer") {
      setContentMode("movie");
      return;
    }
    if (!useSandboxFallback && activeStreamIdx + 1 < streams.length) {
      const nextIdx = activeStreamIdx + 1;
      setActiveStreamIdx(nextIdx);
      toast.success(`Alternando para ${streams[nextIdx].label}`);
    } else if (!useSandboxFallback) {
      setUseSandboxFallback(true);
      toast.success("Alternando para Player Blindado (Sandbox Anti-Redirecionamento)");
    } else if (streams.length > 0) {
      setUseSandboxFallback(false);
      setActiveStreamIdx(0);
      toast.success(`Retornando ao ${streams[0].label}`);
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
    language === "en" && item.originalTitle ? item.originalTitle : item.title;

  const trailerEmbedUrl = getCinemaStreamUrl(item, {
    server: "trailer",
    seasonNumber,
    episodeNumber,
    language,
  });

  const sandboxBackupUrl = getCinemaStreamUrl(item, {
    server: "vidsrc",
    seasonNumber,
    episodeNumber,
    language,
  });

  return (
    <div className="rounded-2xl overflow-hidden border border-white/15 bg-zinc-950 shadow-2xl">
      {/* Unified, Clean Control Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-3 px-4 sm:px-6 py-3.5 bg-zinc-900/95 border-b border-white/10">
        {/* Simple 3-Way Audio/Language Selector (Português Dublado | Português Legendado | Inglês Original) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-black/80 border border-white/15 rounded-xl p-1 gap-1">
            {/* Option 1: Português Dublado (PT-BR) */}
            <button
              type="button"
              onClick={() => {
                lastSpokenCueIdRef.current = -1;
                onLanguageChange("pt");
                setPtMode("dublado");
                setShowSubtitles(true);
                setContentMode("movie");
                if (streams.length > 0) setUseSandboxFallback(false);
                toast.success("Áudio alterado para Português Dublado (PT-BR)");
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                language === "pt" && ptMode === "dublado"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Português (Dublado)</span>
            </button>

            {/* Option 2: Português Legendado (PT-BR) */}
            <button
              type="button"
              onClick={() => {
                dubAudioRef.current?.pause();
                if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                setIsDubSpeaking(false);
                if (videoRef.current) videoRef.current.volume = isMuted ? 0 : userVolume;
                onLanguageChange("pt");
                setPtMode("legendado");
                setShowSubtitles(true);
                setContentMode("movie");
                if (streams.length > 0) setUseSandboxFallback(false);
                toast.success("Idioma alterado para Português Legendado (PT-BR)");
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                language === "pt" && ptMode === "legendado"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>Português (Legendado)</span>
            </button>

            {/* Option 3: Inglês Original (EN) */}
            <button
              type="button"
              onClick={() => {
                dubAudioRef.current?.pause();
                if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                setIsDubSpeaking(false);
                if (videoRef.current) videoRef.current.volume = isMuted ? 0 : userVolume;
                onLanguageChange("en");
                setShowSubtitles(true);
                setContentMode("movie");
                if (streams.length > 0) setUseSandboxFallback(false);
                toast.success("Language set to Original English (EN)");
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                language === "en"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>Inglês (Original EN)</span>
            </button>
          </div>

          {/* Discreet Single Signal Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSwitchSignal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition cursor-pointer"
              title="Trocar sinal automaticamente caso sua conexão esteja lenta"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Trocar Sinal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 16:9 Cinema Stage */}
      <div
        ref={containerRef}
        onMouseMove={showControlsTemporarily}
        className="relative aspect-video w-full bg-black select-none overflow-hidden group"
      >
        {contentMode === "trailer" ? (
          /* Sandboxed Official Trailer (100% Zero Redirects) */
          <iframe
            key={`trailer-${item.id}-${seasonNumber}-${episodeNumber}-${language}`}
            src={trailerEmbedUrl}
            title={`${displayTitle} — Trailer Oficial`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : useSandboxFallback ? (
          /* Strictly Sandboxed Backup Player (Kernel-Level Popup/Redirect Block) */
          <iframe
            key={`backup-${item.id}-${seasonNumber}-${episodeNumber}-${language}`}
            src={sandboxBackupUrl}
            title={`${displayTitle} — Player Blindado`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            referrerPolicy="no-referrer"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          /* Primary Native Worsco 1080p HLS Video Player (Zero Iframes, Zero Popups, PT-BR Dublado + Subtitles) */
          <>
            <video
              ref={videoRef}
              poster={item.backdropUrl}
              playsInline
              crossOrigin="anonymous"
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
              onPlay={() => {
                setIsPlaying(true);
                setIsBuffering(false);
              }}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onTimeUpdate={(e) => {
                const t = e.currentTarget.currentTime;
                setCurrentTime(t);
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

            {/* Neural Portuguese Dubbing Audio Node */}
            <audio
              ref={dubAudioRef}
              className="hidden"
              preload="auto"
              playsInline
            />

            {/* Loading / Resolving Spinner Overlay */}
            {(isResolving || isBuffering) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs pointer-events-none z-20">
                <Loader2 className="w-11 h-11 text-amber-400 animate-spin mb-3" />
                <p className="text-xs sm:text-sm font-medium text-white tracking-wide">
                  {isResolving
                    ? "Conectando ao servidor Worsco 1080p FHD..."
                    : "Carregando transmissão em alta definição..."}
                </p>
                <p className="text-[11px] text-amber-400/90 mt-1">
                  {language === "pt" && ptMode === "dublado"
                    ? "Dublagem em Português (PT-BR) Sincronizada Ativa"
                    : language === "pt"
                      ? "Legendas em Português (PT-BR) Sincronizadas"
                      : "Original English Audio (EN)"}
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

            {/* Active PT-BR / EN Subtitle & Dubbing Caption Overlay */}
            {showSubtitles && activeCueText && (
              <div className="absolute inset-x-4 bottom-20 sm:bottom-24 flex justify-center pointer-events-none z-20">
                <div className="max-w-3xl px-4 py-2 rounded-lg bg-black/80 border border-white/10 text-center shadow-xl backdrop-blur-xs">
                  <p className="text-sm sm:text-lg md:text-xl font-medium text-amber-50 leading-snug drop-shadow">
                    {activeCueText}
                  </p>
                </div>
              </div>
            )}

            {/* Top-Left Status Pill inside Video Stage */}
            <div
              className={`absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none transition-opacity duration-300 ${
                controlsVisible || !isPlaying ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="px-2.5 py-1 rounded-full bg-black/75 border border-white/15 text-[11px] font-medium text-zinc-200 backdrop-blur-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {language === "pt" && ptMode === "dublado"
                  ? "🇧🇷 Áudio Dublado PT-BR Ativo"
                  : language === "pt"
                    ? "🇧🇷 Legendado PT-BR Ativo"
                    : "🇺🇸 Inglês Original (EN)"}
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
                <span className="text-[11px] font-mono text-zinc-300 w-12 text-right">
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
                <span className="text-[11px] font-mono text-zinc-400 w-12">
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

  function setShowSubtitlesSafe(val: boolean) {
    setShowSubtitles(val);
  }
};

export default WorscoCinemaPlayer;
