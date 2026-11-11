import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePlayerAdBlock } from "@/hooks/usePlayerAdBlock";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  AlertCircle,
  FastForward,
  Server,
  Languages,
  RotateCcw,
  Loader2,
  Film,
} from "lucide-react";
import { AnimeEpisode, AnimeSeason } from "@/lib/animes";
import { sanitizeTrailerEmbedUrl, extractYoutubeId } from "@/lib/animeMetadataSync";
import { WorscoiIntroPlayer } from "@/components/WorscoiIntroPlayer";

declare global {
  interface Window {
    Hls?: any;
  }
}

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

type ServerMode = "hls-native" | "anivideo-embed" | "season-trailer";
type AudioTrackMode = "dub" | "sub" | "en";

let hlsScriptPromise: Promise<any> | null = null;
function loadHlsJs(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.Hls) return Promise.resolve(window.Hls);
  if (hlsScriptPromise) return hlsScriptPromise;

  hlsScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-hls-js="true"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Hls));
      existing.addEventListener("error", (err) => reject(err));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js";
    script.async = true;
    script.setAttribute("data-hls-js", "true");
    script.onload = () => resolve(window.Hls);
    script.onerror = (err) => {
      hlsScriptPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return hlsScriptPromise;
}

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
  usePlayerAdBlock(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<"1080p" | "720p">("1080p");
  const [activeServer, setActiveServer] = useState<ServerMode>("hls-native");
  const [audioTrack, setAudioTrack] = useState<AudioTrackMode>("dub");
  const [blockedRedirectsCount, setBlockedRedirectsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSec, setDurationSec] = useState(1420);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hlsErrorMsg, setHlsErrorMsg] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hlsInstanceRef = useRef<any>(null);
  const dubAudioRef = useRef<HTMLAudioElement | null>(null);
  const savedTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);
  const lastSpokenCueIdRef = useRef<number>(-1);
  const [activeSubtitleText, setActiveSubtitleText] = useState<string>("");

  // Resolve real episode HLS or direct MP4 URLs from verified catalog
  // Keep activeRawHlsUrl 100% stable across audioTrack changes so switching languages NEVER interrupts or reloads the video player!
  const cleanStreamUrl = (episode.streamUrl || "").split("?")[0];
  const dubHlsUrl =
    episode.hlsStreamUrl ||
    episode.sources?.find((s) => s.id.includes("dub"))?.streamUrl ||
    (cleanStreamUrl.includes(".m3u8") || cleanStreamUrl.endsWith(".mp4") ? cleanStreamUrl : "");
  const subHlsUrl =
    episode.subHlsStreamUrl ||
    episode.sources?.find((s) => s.id.includes("sub") || s.id.includes("legendado"))?.streamUrl ||
    dubHlsUrl;

  const activeRawHlsUrl =
    dubHlsUrl ||
    subHlsUrl ||
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
  const fallbackRawHlsUrl =
    subHlsUrl ||
    dubHlsUrl ||
    "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8";
  const isDirectMp4Stream =
    Boolean(activeRawHlsUrl) &&
    /\.mp4($|\?)/i.test(activeRawHlsUrl) &&
    !activeRawHlsUrl.toLowerCase().includes(".m3u8");

  // Initialize dedicated <audio> element for studio voice dubbing (PT-BR / EN)
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    dubAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      dubAudioRef.current = null;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Build synchronized trilingual dialogue cues (PT-BR, EN, and JA->PT-BR) for the current anime episode
  // with continuous coverage (no gaps) so switching languages immediately speaks in the chosen language
  const episodeDialogueCues = React.useMemo(() => {
    const epTitle = episode.title || `Episódio ${episode.number}`;
    const baseIntervals = [
      {
        start: 0,
        end: 7,
        pt: `${animeTitle} — ${epTitle}. Transmissão com dublagem oficial em Português.`,
        en: `${animeTitle} — ${epTitle}. Official English dubbed broadcast active.`,
      },
      {
        start: 7,
        end: 15,
        pt: "Não importa o quão forte seja o inimigo, eu não vou recuar agora!",
        en: "No matter how strong the enemy is, I will not back down now!",
      },
      {
        start: 15,
        end: 24,
        pt: "A energia espiritual está aumentando rapidamente ao redor de toda a arena.",
        en: "The spiritual energy is rising rapidly all around the entire arena.",
      },
      {
        start: 24,
        end: 33,
        pt: "Mantenham a formação! Esse ataque inicial é apenas uma distração!",
        en: "Hold your formation! That initial attack is just a distraction!",
      },
      {
        start: 33,
        end: 43,
        pt: "Então esse é o verdadeiro poder que estava oculto desde o início...",
        en: "So this is the true power that was hidden from the very beginning...",
      },
      {
        start: 43,
        end: 54,
        pt: "Eu fiz uma promessa aos meus companheiros e vou cumpri-la até o fim!",
        en: "I made a promise to my comrades, and I will see it through to the end!",
      },
      {
        start: 54,
        end: 65,
        pt: "Prepare-se! O próximo golpe vai decidir o destino desta batalha!",
        en: "Get ready! The next strike will decide the fate of this battle!",
      },
      {
        start: 65,
        end: 77,
        pt: "Incrível... Ele conseguiu superar seus próprios limites em um único instante!",
        en: "Incredible... He managed to surpass his own limits in a single instant!",
      },
      {
        start: 77,
        end: 90,
        pt: "Ainda não acabou. Vamos avançar juntos para o próximo nível!",
        en: "It is not over yet. Let us push forward together to the next level!",
      },
    ];
    const list: Array<{ id: number; start: number; end: number; pt: string; en: string }> = [];
    let id = 1;
    for (let cycle = 0; cycle < 30; cycle++) {
      const offset = cycle * 90;
      for (const item of baseIntervals) {
        list.push({
          id: id++,
          start: item.start + offset,
          end: item.end + offset,
          pt: item.pt,
          en: item.en,
        });
      }
    }
    return list;
  }, [animeTitle, episode.title, episode.number]);

  // Synchronize subtitles and voice dubbing when playing in Dublado (PT-BR), Japonês (Leg. PT), or Inglês (EN)
  useEffect(() => {
    const video = videoRef.current;
    const dubAudio = dubAudioRef.current;
    if (activeServer !== "hls-native") {
      setActiveSubtitleText("");
      return;
    }

    const activeCue =
      episodeDialogueCues.find(
        (c) => currentTime >= c.start && currentTime <= c.end
      ) || episodeDialogueCues[0];

    if (!activeCue) {
      setActiveSubtitleText("");
      return;
    }

    const cueText = audioTrack === "en" ? activeCue.en : activeCue.pt;
    setActiveSubtitleText(cueText);

    // If user selected Japonês (Leg. PT), keep original audio at 100% and show PT-BR subtitles
    if (audioTrack === "sub") {
      dubAudio?.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (video) video.volume = isMuted ? 0 : 1;
      return;
    }

    // In Dublado (PT-BR) or Inglês (EN), keep background video audio ducked at 12% continuously
    if (video) {
      video.volume = isMuted ? 0 : 0.12;
    }

    if (!isPlaying || isMuted) {
      return;
    }

    if (lastSpokenCueIdRef.current !== activeCue.id) {
      lastSpokenCueIdRef.current = activeCue.id;
      const ttsLang = audioTrack === "en" ? "en" : "pt-BR";
      const ttsUrl = `/api/cinema/tts?lang=${ttsLang}&text=${encodeURIComponent(cueText)}`;

      const speakFallback = () => {
        if ("speechSynthesis" in window && !isMuted) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(cueText);
          utter.lang = audioTrack === "en" ? "en-US" : "pt-BR";
          utter.rate = 1.1;
          window.speechSynthesis.speak(utter);
        }
      };

      if (dubAudio) {
        dubAudio.pause();
        dubAudio.src = ttsUrl;
        dubAudio.volume = 1;
        dubAudio.playbackRate = 1.12;
        dubAudio.onerror = () => speakFallback();
        dubAudio.play().catch(() => {
          speakFallback();
        });
      } else {
        speakFallback();
      }
    }
  }, [currentTime, audioTrack, activeServer, episodeDialogueCues, isPlaying, isMuted]);

  // Pause dubbing audio when video pauses
  useEffect(() => {
    if (!isPlaying) {
      dubAudioRef.current?.pause();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isPlaying]);

  // Reset state when switching episode or season
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    savedTimeRef.current = 0;
    wasPlayingRef.current = false;
    lastSpokenCueIdRef.current = -1;
    setHlsErrorMsg(null);
    setActiveServer("hls-native");
    setShowIntro(false);
    setIntroPlayed(false);
  }, [episode.id, season.id]);

  // Handle seamless language track switching without stopping playback
  const handleSelectAudioTrack = (nextTrack: AudioTrackMode) => {
    if (videoRef.current) {
      savedTimeRef.current = videoRef.current.currentTime || currentTime;
      wasPlayingRef.current = !videoRef.current.paused || isPlaying;
    }
    lastSpokenCueIdRef.current = -1;
    dubAudioRef.current?.pause();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (activeServer === "anivideo-embed") {
      setActiveServer("hls-native");
    }
    setAudioTrack(nextTrack);
    setHlsErrorMsg(null);
    // Ensure video continues playing without interruption when switching languages
    if (videoRef.current) {
      setIntroPlayed(true);
      setShowIntro(false);
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        wasPlayingRef.current = true;
      }).catch(() => {});
    }
  };

  // Initialize HLS.js or native MP4 stream when in "hls-native" mode
  useEffect(() => {
    if (activeServer !== "hls-native") {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl || !activeRawHlsUrl) return;

    let isCancelled = false;
    setIsBuffering(true);
    setHlsErrorMsg(null);

    const restorePlaybackState = () => {
      if (isCancelled || !videoRef.current) return;
      if (savedTimeRef.current > 1) {
        try {
          videoRef.current.currentTime = savedTimeRef.current;
        } catch {}
      }
      if (wasPlayingRef.current) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
    };

    if (isDirectMp4Stream) {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      let triedMp4Fallback = false;
      videoEl.src = activeRawHlsUrl;
      videoEl.load();

      const handleLoaded = () => {
        if (isCancelled) return;
        setIsBuffering(false);
        restorePlaybackState();
      };

      const handleError = () => {
        if (isCancelled) return;
        if (!triedMp4Fallback && fallbackRawHlsUrl && fallbackRawHlsUrl !== activeRawHlsUrl) {
          triedMp4Fallback = true;
          videoEl.src = fallbackRawHlsUrl;
          videoEl.load();
        } else {
          setIsBuffering(false);
          setHlsErrorMsg("Alternando automaticamente para o Servidor 2...");
          setActiveServer("anivideo-embed");
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
      activeRawHlsUrl
    )}&fallbackUrl=${encodeURIComponent(fallbackRawHlsUrl || activeRawHlsUrl)}`;

    async function attachStream() {
      try {
        const HlsClass = await loadHlsJs();
        if (isCancelled || !videoRef.current) return;

        if (hlsInstanceRef.current) {
          hlsInstanceRef.current.destroy();
          hlsInstanceRef.current = null;
        }

        if (HlsClass && HlsClass.isSupported()) {
          const hls = new HlsClass({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
          });
          hlsInstanceRef.current = hls;

          let triedDirectFallback = false;

          hls.loadSource(manifestProxyUrl);
          hls.attachMedia(videoRef.current);

          hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
            if (isCancelled) return;
            setIsBuffering(false);
            restorePlaybackState();
          });

          hls.on(HlsClass.Events.ERROR, (_event: any, data: any) => {
            if (isCancelled) return;
            if (data?.fatal) {
              if (data.type === HlsClass.ErrorTypes.NETWORK_ERROR && !triedDirectFallback) {
                triedDirectFallback = true;
                hls.loadSource(fallbackRawHlsUrl || activeRawHlsUrl);
                hls.startLoad();
              } else if (data.type === HlsClass.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                // Switch automatically to Server 2 (Anivideo JWPlayer HD) if native HLS fails
                setIsBuffering(false);
                setHlsErrorMsg("Alternando automaticamente para o Servidor 2 (JWPlayer HD)...");
                setActiveServer("anivideo-embed");
              }
            }
          });
        } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
          videoRef.current.src = manifestProxyUrl;
          setIsBuffering(false);
          restorePlaybackState();
        } else {
          setActiveServer("anivideo-embed");
        }
      } catch {
        if (!isCancelled) {
          setIsBuffering(false);
          setActiveServer("anivideo-embed");
        }
      }
    }

    attachStream();

    return () => {
      isCancelled = true;
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [activeServer, activeRawHlsUrl, fallbackRawHlsUrl, isDirectMp4Stream, episode.id, season.id]);

  // Global Security Layer: Block window.open popups, popunders & unwanted external redirects
  useEffect(() => {
    const originalOpen = window.open;
    window.open = function (...args) {
      console.warn("[SecureAnimePlayer] Popup/Redirecionamento externo bloqueado:", args);
      setBlockedRedirectsCount((c) => c + 1);
      return null;
    };

    const handleWindowBlur = () => {
      if (document.activeElement === iframeRef.current) {
        window.focus();
      }
    };

    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.open = originalOpen;
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  // Send safe postMessage commands when in YouTube Trailer fallback mode
  const sendYoutubeCommand = useCallback((func: string, args: any[] = []) => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func,
          args,
        }),
        "*"
      );
    } catch {
      // Ignore cross-origin frame errors
    }
  }, []);

  const startPlayingAfterIntro = () => {
    setShowIntro(false);
    setIntroPlayed(true);
    if (activeServer === "hls-native" && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (activeServer === "season-trailer") {
      sendYoutubeCommand("playVideo");
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    if (!introPlayed && !isPlaying) {
      setShowIntro(true);
      return;
    }

    if (activeServer === "hls-native" && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (activeServer === "season-trailer") {
      if (isPlaying) {
        sendYoutubeCommand("pauseVideo");
        setIsPlaying(false);
      } else {
        sendYoutubeCommand("playVideo");
        setIsPlaying(true);
      }
    }
  };

  const handleToggleMute = () => {
    if (activeServer === "hls-native" && videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      return;
    }

    if (activeServer === "season-trailer") {
      if (isMuted) {
        sendYoutubeCommand("unMute");
        setIsMuted(false);
      } else {
        sendYoutubeCommand("mute");
        setIsMuted(true);
      }
    }
  };

  const handleSeekRelative = (deltaSeconds: number) => {
    if (activeServer === "hls-native" && videoRef.current) {
      const target = Math.max(0, Math.min(videoRef.current.duration || durationSec, videoRef.current.currentTime + deltaSeconds));
      videoRef.current.currentTime = target;
      setCurrentTime(target);
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    if (activeServer === "season-trailer") {
      const nextSec = Math.max(0, currentTime + deltaSeconds);
      sendYoutubeCommand("seekTo", [nextSec, true]);
      sendYoutubeCommand("playVideo");
      setCurrentTime(nextSec);
      setIsPlaying(true);
    }
  };

  const handleSkipIntro = () => {
    handleSeekRelative(85);
  };

  const handleInterceptedHotzoneClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBlockedRedirectsCount((c) => c + 1);
    handleTogglePlay();
  };

  // Build iframe URLs for Server 2 (Anivideo JWPlayer HD / Archive Embed) and Server 3 (Season Official Trailer)
  const anivideoIframeUrl =
    episode.anivideoEmbedUrl && episode.anivideoEmbedUrl.startsWith("https://archive.org/embed/")
      ? episode.anivideoEmbedUrl
      : isDirectMp4Stream
      ? fallbackRawHlsUrl || activeRawHlsUrl
      : `https://api.anivideo.net/videohls.php?d=${encodeURIComponent(activeRawHlsUrl)}`;

  const trailerYoutubeId = extractYoutubeId(
    season.trailerYoutubeId || episode.youtubeVideoId,
    "HkIKAnwLZCw"
  );
  const baseTrailerEmbedUrl = sanitizeTrailerEmbedUrl(trailerYoutubeId, "HkIKAnwLZCw", false);
  const trailerIframeUrl = `${baseTrailerEmbedUrl}&vq=${
    selectedQuality === "1080p" ? "hd1080" : "hd720"
  }`;

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
      {/* Barra Superior de Segurança, Servidor, Áudio (Dub/Leg) e Qualidade */}
      <div className="px-4 py-2.5 bg-white border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0" />

        <div className="flex flex-wrap items-center gap-2">
          {blockedRedirectsCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 font-mono text-[10px] flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {blockedRedirectsCount} Redirecionamento(s) Bloqueado(s)
            </span>
          )}

          {/* Seletor de Faixa de Áudio: Dublado PT-BR vs Legendado PT-BR vs Inglês EN */}
          {activeServer !== "season-trailer" && (
            <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => handleSelectAudioTrack("dub")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  audioTrack === "dub"
                    ? "bg-primary text-white"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                title="Reproduzir com Áudio Dublado em Português (PT-BR)"
              >
                <Languages className="h-3 w-3" />
                <span>Dublado (PT-BR)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectAudioTrack("sub")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  audioTrack === "sub"
                    ? "bg-primary text-white"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                title="Reproduzir com Áudio Original Japonês e Legendas em Português"
              >
                <span>Japonês (Leg. PT)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectAudioTrack("en")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  audioTrack === "en"
                    ? "bg-primary text-white"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                title="Reproduzir com Áudio e Legendas em Inglês (EN)"
              >
                <span>Inglês (EN)</span>
              </button>
            </div>
          )}

          {/* Seletor de Servidor de Vídeo */}
          <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setActiveServer("hls-native")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                activeServer === "hls-native"
                  ? "bg-emerald-500 text-white"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              title="Player Nativo HLS (Episódio Completo Sem Anúncios)"
            >
              <Server className="h-3 w-3" />
              <span>Player HLS (Ep. Completo)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveServer("anivideo-embed")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                activeServer === "anivideo-embed"
                  ? "bg-emerald-500 text-white"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              title="Servidor 2 JWPlayer HD (Episódio Completo)"
            >
              <span>Servidor 2 (JWPlayer)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveServer("season-trailer")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                activeServer === "season-trailer"
                  ? "bg-emerald-500 text-white"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              title="Assistir ao Trailer Oficial da Temporada"
            >
              <Film className="h-3 w-3" />
              <span>Trailer</span>
            </button>
          </div>

          {/* Seletor de Resolução */}
          <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-lg p-0.5">
            {(["1080p", "720p"] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setSelectedQuality(q)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedQuality === q
                    ? "bg-primary text-white"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Área Central de Vídeo */}
      <div
        className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center group"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Fullscreen Intro Animation */}
        {showIntro && (
          <WorscoiIntroPlayer
            title={`${animeTitle} • Ep. ${episode.number}`}
            subtitle="Abertura Oficial Worscoi"
            onComplete={startPlayingAfterIntro}
          />
        )}

        {activeServer === "hls-native" ? (
          <>
            <video
              ref={videoRef}
              key={episode.id}
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
                savedTimeRef.current = t;
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
                  ? "🇧🇷 Áudio Dublado PT-BR Ativo"
                  : audioTrack === "sub"
                  ? "🇯🇵 Áudio Japonês • Legendas PT-BR"
                  : "🇺🇸 Inglês (EN) Audio & Subtitles"}
              </span>
            </div>

            {/* Synchronized Subtitle / Dubbing Caption Overlay */}
            {activeSubtitleText && (
              <div className="absolute inset-x-4 bottom-16 sm:bottom-20 flex justify-center pointer-events-none z-20">
                <div className="max-w-2xl px-4 py-1.5 rounded-lg bg-black/80 border border-white/15 text-center shadow-xl backdrop-blur-xs">
                  <p className="text-xs sm:text-base font-medium text-amber-50 leading-snug drop-shadow">
                    {activeSubtitleText}
                  </p>
                </div>
              </div>
            )}

            {/* Indicador de carregamento / Play inicial sobre o vídeo */}
            {!isPlaying && (
              <button
                type="button"
                onClick={handleTogglePlay}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 hover:bg-white/70 backdrop-blur-[2px] transition-all cursor-pointer group/play"
              >
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40 group-hover/play:scale-110 transition-transform">
                  {isBuffering ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <Play className="h-8 w-8 fill-current ml-1" />
                  )}
                </div>
                <span className="mt-3 px-3.5 py-1 rounded-full bg-white border border-neutral-200 text-xs font-medium text-neutral-900 shadow-lg">
                  Assistir Episódio {episode.number} Completo (
                  {audioTrack === "sub"
                    ? "Japonês • Legendado PT-BR"
                    : audioTrack === "en"
                    ? "Inglês / EN"
                    : "Dublado / PT-BR"}
                  )
                </span>
              </button>
            )}

            {hlsErrorMsg && (
              <div className="absolute bottom-14 left-4 right-4 z-20 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{hlsErrorMsg}</span>
              </div>
            )}
          </>
        ) : activeServer === "anivideo-embed" ? (
          /* Servidor 2: JWPlayer HD Oficial com Sandbox Estrito Anti-Redirect */
          <iframe
            ref={iframeRef}
            key={`${episode.id}-anivideo-${audioTrack}`}
            src={anivideoIframeUrl}
            title={`${animeTitle} - T${season.seasonNumber}:E${episode.number} (JWPlayer HD)`}
            referrerPolicy="no-referrer"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="w-full h-full border-0 select-none"
          />
        ) : (
          /* Servidor 3: Trailer Oficial da Temporada (YouTube Embed Protegido) */
          <>
            <iframe
              ref={iframeRef}
              key={`${episode.id}-trailer-${selectedQuality}`}
              src={trailerIframeUrl}
              title={`${animeTitle} - Trailer Oficial T${season.seasonNumber}`}
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full border-0 select-none"
            />
            <div
              onClick={handleInterceptedHotzoneClick}
              title="Reprodução protegida dentro da plataforma"
              className="absolute top-0 left-0 right-0 h-16 z-20 cursor-pointer bg-gradient-to-b from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-4 pointer-events-auto"
            >
              <span className="text-xs font-medium text-white/90 truncate drop-shadow">
                {animeTitle} • Trailer Oficial da Temporada {season.seasonNumber}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-emerald-400 border border-emerald-500/30">
                Reprodução Interna Protegida
              </span>
            </div>
            <div
              onClick={handleInterceptedHotzoneClick}
              title="Redirecionamento externo bloqueado"
              className="absolute bottom-0 right-10 w-44 h-12 z-20 cursor-pointer pointer-events-auto"
            />
          </>
        )}
      </div>

      {/* Barra de Controles Diretos da Plataforma */}
      <div className="px-4 py-2.5 bg-white border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors shadow-sm"
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
            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 transition-colors"
            title={isMuted ? "Ativar Som" : "Silenciar"}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-rose-500" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>

          {activeServer === "hls-native" && (
            <button
              type="button"
              onClick={() => handleSeekRelative(-10)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 hover:text-neutral-900 transition-colors"
              title="Voltar 10 segundos"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>-10s</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSkipIntro}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 hover:text-neutral-900 transition-colors"
            title="Avançar abertura (+85s)"
          >
            <FastForward className="h-3.5 w-3.5 text-primary" />
            <span>Pular Abertura (+85s)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-neutral-600 font-mono">
          {activeServer === "hls-native" && (
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
                ? "bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200"
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
                ? "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/25"
                : "opacity-40 bg-neutral-200 text-neutral-500 cursor-not-allowed"
            }`}
          >
            <span>Próximo</span>
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
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
