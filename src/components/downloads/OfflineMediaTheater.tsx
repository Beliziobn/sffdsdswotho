import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Hls from "hls.js";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Film,
  HardDrive,
  Layers,
  Loader2,
  Play,
  Tv,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DownloadFolderGroup,
  resolveDownloadFolderMetadata,
  UserDownloadEntry,
} from "@/lib/downloadsStore";

interface OfflineMediaTheaterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: UserDownloadEntry | null;
  mediaBlob?: Blob | null;
  streamUrl?: string | null;
  isHlsStream?: boolean;
  bytes?: Uint8Array | null;
  folder?: DownloadFolderGroup | null;
  cachedIds?: Set<string>;
  isLoadingMedia?: boolean;
  onSelectEntry?: (entry: UserDownloadEntry) => void;
  onPreloadEntry?: (entry: UserDownloadEntry) => void;
}

const TS_PACKET_SIZE = 188;
const TS_FIRST_CHUNK_BYTES = 2048 * TS_PACKET_SIZE; // ~385 KB for instant frame 1
const TS_CHUNK_BYTES = 10638 * TS_PACKET_SIZE; // ~2 MB subsequent virtual slices

async function createSegmentedTsPlaylist(
  tsBlob: Blob
): Promise<{ manifestUrl: string; revokeAll: () => void }> {
  const headSize = Math.min(512, tsBlob.size);
  const head = new Uint8Array(await tsBlob.slice(0, headSize).arrayBuffer());
  let syncOffset = 0;
  for (let i = 0; i < head.length; i++) {
    if (
      head[i] === 0x47 &&
      (i + TS_PACKET_SIZE >= head.length || head[i + TS_PACKET_SIZE] === 0x47)
    ) {
      syncOffset = i;
      break;
    }
  }

  const sliceUrls: string[] = [];
  const lines: string[] = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-TARGETDURATION:15",
    "#EXT-X-MEDIA-SEQUENCE:0",
  ];

  let pos = syncOffset;
  let segIndex = 0;
  while (pos < tsBlob.size) {
    const chunkLimit = segIndex === 0 ? TS_FIRST_CHUNK_BYTES : TS_CHUNK_BYTES;
    let end = Math.min(tsBlob.size, pos + chunkLimit);
    // Align intermediate boundaries cleanly to 188-byte MPEG-TS packets
    if (end < tsBlob.size) {
      const alignedLen = Math.floor((end - pos) / TS_PACKET_SIZE) * TS_PACKET_SIZE;
      if (alignedLen >= TS_PACKET_SIZE) {
        end = pos + alignedLen;
      }
    }
    const sliceUrl = URL.createObjectURL(tsBlob.slice(pos, end, "video/mp2t"));
    sliceUrls.push(sliceUrl);
    lines.push(segIndex === 0 ? "#EXTINF:4.0," : "#EXTINF:10.0,");
    lines.push(sliceUrl);
    pos = end;
    segIndex++;
  }

  lines.push("#EXT-X-ENDLIST");
  const manifestBlob = new Blob([lines.join("\n")], {
    type: "application/vnd.apple.mpegurl",
  });
  const manifestUrl = URL.createObjectURL(manifestBlob);

  return {
    manifestUrl,
    revokeAll: () => {
      try {
        URL.revokeObjectURL(manifestUrl);
      } catch {}
      for (const u of sliceUrls) {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      }
    },
  };
}

export default function OfflineMediaTheater({
  open,
  onOpenChange,
  entry,
  mediaBlob,
  streamUrl,
  isHlsStream = false,
  bytes,
  folder,
  cachedIds,
  isLoadingMedia = false,
  onSelectEntry,
  onPreloadEntry,
}: OfflineMediaTheaterProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const activeMeta = useMemo(
    () => (entry ? resolveDownloadFolderMetadata(entry) : null),
    [entry]
  );

  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(
    activeMeta?.seasonNumber ?? 1
  );

  useEffect(() => {
    if (activeMeta?.seasonNumber) {
      setSelectedSeasonNum(activeMeta.seasonNumber);
    } else if (folder?.seasons?.length) {
      setSelectedSeasonNum(folder.seasons[0].seasonNumber);
    }
  }, [activeMeta?.seasonNumber, folder?.folderKey]);

  const orderedPlayableEntries = useMemo(() => {
    if (!folder) return entry ? [entry] : [];
    const list = folder.entries.filter((e) => e.status === "completed");
    return list.length > 0 ? list : entry ? [entry] : [];
  }, [folder, entry]);

  const currentIdx = useMemo(() => {
    if (!entry) return -1;
    return orderedPlayableEntries.findIndex((e) => e.id === entry.id);
  }, [orderedPlayableEntries, entry]);

  const prevEntry = currentIdx > 0 ? orderedPlayableEntries[currentIdx - 1] : null;
  const nextEntry =
    currentIdx >= 0 && currentIdx < orderedPlayableEntries.length - 1
      ? orderedPlayableEntries[currentIdx + 1]
      : null;

  const hasSeriesPlaylist =
    Boolean(folder) &&
    ((folder?.seasons?.length || 0) > 0 || orderedPlayableEntries.length > 1);

  const activeSeasonGroup = useMemo(() => {
    if (!folder?.seasons?.length) return null;
    return (
      folder.seasons.find((s) => s.seasonNumber === selectedSeasonNum) ||
      folder.seasons[0]
    );
  }, [folder, selectedSeasonNum]);

  const isTsStream = Boolean(
    entry &&
      (entry.mimeType === "video/mp2t" || /\.ts(\?|$)/i.test(entry.fileName || ""))
  );

  const resolvedBlob = useMemo(() => {
    if (mediaBlob && mediaBlob.size > 0) return mediaBlob;
    if (bytes && bytes.byteLength > 0) {
      return new Blob([bytes as unknown as BlobPart], {
        type: entry?.mimeType || (isTsStream ? "video/mp2t" : "video/mp4"),
      });
    }
    return null;
  }, [mediaBlob, bytes, entry?.mimeType, isTsStream]);

  const hasMediaSource = Boolean(resolvedBlob || streamUrl);

  // Pre-warm adjacent episodes in background while watching
  useEffect(() => {
    if (!open || !onPreloadEntry) return;
    if (nextEntry && nextEntry.status === "completed") {
      onPreloadEntry(nextEntry);
    }
    if (prevEntry && prevEntry.status === "completed") {
      onPreloadEntry(prevEntry);
    }
  }, [open, entry?.id, nextEntry?.id, prevEntry?.id, onPreloadEntry]);

  const handleSaveCopy = () => {
    if (!entry) return;
    if (resolvedBlob) {
      const url = URL.createObjectURL(resolvedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = entry.fileName || "video-wotho.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
    } else if (streamUrl) {
      const a = document.createElement("a");
      a.href = streamUrl;
      a.download = entry.fileName || "video-wotho.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!open || !videoEl || !entry || !hasMediaSource || isLoadingMedia) return;

    let cancelled = false;
    let hls: Hls | null = null;
    let objectMediaUrl: string | null = null;
    let revokePlaylist: (() => void) | null = null;

    setVideoError(null);

    const setupPlayback = async () => {
      if (resolvedBlob) {
        if (isTsStream && Hls.isSupported()) {
          const playlist = await createSegmentedTsPlaylist(resolvedBlob);
          if (cancelled) {
            playlist.revokeAll();
            return;
          }
          revokePlaylist = playlist.revokeAll;
          hls = new Hls({
            enableWorker: true,
            startFragPrefetch: true,
            maxBufferLength: 15,
            maxMaxBufferLength: 30,
            backBufferLength: 15,
          });
          hls.loadSource(playlist.manifestUrl);
          hls.attachMedia(videoEl);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!cancelled) videoEl.play()?.catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_evt, data) => {
            if (data?.fatal && !cancelled) {
              setVideoError(
                "Este arquivo .ts pode ser aberto em qualquer reprodutor de mídia (VLC/QuickTime). Clique em Salvar Cópia acima."
              );
            }
          });
          return;
        }

        objectMediaUrl = URL.createObjectURL(resolvedBlob);
        videoEl.src = objectMediaUrl;
        videoEl.play()?.catch(() => {});
        return;
      }

      if (streamUrl) {
        if (isHlsStream && Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            startFragPrefetch: true,
            maxBufferLength: 15,
            maxMaxBufferLength: 30,
            backBufferLength: 15,
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(videoEl);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!cancelled) videoEl.play()?.catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_evt, data) => {
            if (data?.fatal && !cancelled) {
              setVideoError(
                "Não foi possível iniciar o fluxo deste vídeo no navegador. Tente baixar novamente."
              );
            }
          });
        } else {
          videoEl.src = streamUrl;
          videoEl.play()?.catch(() => {});
        }
      }
    };

    void setupPlayback();

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
      if (objectMediaUrl) URL.revokeObjectURL(objectMediaUrl);
      if (revokePlaylist) revokePlaylist();
    };
  }, [
    open,
    entry?.id,
    resolvedBlob,
    streamUrl,
    isHlsStream,
    hasMediaSource,
    isTsStream,
    isLoadingMedia,
  ]);

  if (!entry || !activeMeta) return null;

  const isCached = cachedIds ? cachedIds.has(entry.id) : true;
  const isSerieOrAnime =
    activeMeta.folderKind === "serie" || activeMeta.folderKind === "anime";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[96vw] h-[92vh] max-h-[92vh] p-0 gap-0 overflow-hidden border border-white/[0.1] bg-[#060608] text-white shadow-[0_32px_90px_rgba(0,0,0,0.85)] rounded-2xl flex flex-col [&>button]:hidden">
        <DialogTitle className="sr-only">
          {activeMeta.folderTitle} — Reprodutor Offline Wotho
        </DialogTitle>
        <DialogDescription className="sr-only">
          Sala de exibição organizada para {entry.title}
        </DialogDescription>

        {/* Top Theater Bar */}
        <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-white/[0.08] bg-[#0B0B0F]/95 backdrop-blur-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-white/[0.12] bg-white/[0.06] text-xs font-medium text-white/90 hover:bg-white/[0.12] transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para Pasta
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 truncate">
                <span className="inline-flex items-center gap-1 text-zinc-300 font-medium">
                  {isSerieOrAnime ? (
                    <Tv className="w-3 h-3" />
                  ) : (
                    <Film className="w-3 h-3" />
                  )}
                  {activeMeta.kindLabel}
                </span>
                {activeMeta.seasonNumber !== null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      Temporada {activeMeta.seasonNumber}
                    </span>
                  </>
                )}
                {activeMeta.episodeNumber !== null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums text-white font-medium">
                      Episódio {String(activeMeta.episodeNumber).padStart(2, "0")}
                    </span>
                  </>
                )}
                {activeMeta.languageLabel && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{activeMeta.languageLabel}</span>
                  </>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-white truncate">
                {activeMeta.folderTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveCopy}
              disabled={!hasMediaSource || isLoadingMedia}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-white text-[#060608] text-xs font-semibold hover:bg-zinc-200 disabled:opacity-45 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Salvar Cópia
            </button>

            {entry.openHref && (
              <Link
                to={entry.openHref}
                onClick={() => onOpenChange(false)}
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-white/[0.12] bg-white/[0.06] text-xs font-medium text-white/90 hover:bg-white/[0.12] transition-colors whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Página da Obra
              </Link>
            )}

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar reprodutor"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-zinc-300 hover:text-white hover:bg-white/[0.12] transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Screening Room Body */}
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          <div
            className={`h-full grid grid-cols-1 ${
              hasSeriesPlaylist ? "lg:grid-cols-12" : ""
            }`}
          >
            {/* Video Stage + Episode Transport / Movie Details */}
            <div
              className={`${
                hasSeriesPlaylist ? "lg:col-span-8" : "max-w-5xl w-full mx-auto"
              } flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4`}
            >
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/[0.1] shadow-2xl flex items-center justify-center">
                {isLoadingMedia || !hasMediaSource ? (
                  <div className="flex flex-col items-center gap-2.5 text-zinc-300">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span className="text-xs font-medium">
                      Abrindo mídia salva...
                    </span>
                  </div>
                ) : (
                  <video
                    key={entry.id}
                    ref={videoRef}
                    controls
                    autoPlay
                    preload="auto"
                    playsInline
                    onError={() =>
                      setVideoError(
                        "O codec deste arquivo não é decodificado diretamente pelo navegador. Salve a cópia para assistir no seu reprodutor local."
                      )
                    }
                    className="w-full h-full object-contain bg-black"
                  />
                )}
              </div>

              {videoError && (
                <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  {videoError}
                </div>
              )}

              {/* Organized Info & Transport Bar below Video */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  {entry.cover && (
                    <img
                      src={entry.cover}
                      alt={activeMeta.folderTitle}
                      referrerPolicy="no-referrer"
                      className="hidden sm:block w-12 h-16 rounded-lg object-cover border border-white/[0.1] shrink-0"
                    />
                  )}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                      <span className="text-white font-medium">
                        {isSerieOrAnime && activeMeta.seasonNumber !== null
                          ? `T${String(activeMeta.seasonNumber).padStart(2, "0")} · E${String(
                              activeMeta.episodeNumber ?? 1
                            ).padStart(2, "0")}`
                          : activeMeta.kindLabel}
                      </span>
                      {entry.fileSizeFormatted && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{entry.fileSizeFormatted}</span>
                        </>
                      )}
                      {isCached && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <HardDrive className="w-3 h-3" />
                            Armazenado Offline
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base font-semibold tracking-tight text-white truncate">
                      {activeMeta.episodeTitle || entry.title}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate">
                      {entry.author ? `${entry.author} · ` : ""}
                      {entry.fileName}
                    </p>
                  </div>
                </div>

                {hasSeriesPlaylist && onSelectEntry && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={!prevEntry || isLoadingMedia}
                      onClick={() => prevEntry && onSelectEntry(prevEntry)}
                      className="inline-flex items-center gap-1 h-9 px-3.5 rounded-full border border-white/[0.12] bg-white/[0.06] text-xs font-medium text-white hover:bg-white/[0.14] disabled:opacity-35 transition-colors whitespace-nowrap shrink-0"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={!nextEntry || isLoadingMedia}
                      onClick={() => nextEntry && onSelectEntry(nextEntry)}
                      className="inline-flex items-center gap-1 h-9 px-3.5 rounded-full bg-white text-[#060608] text-xs font-semibold hover:bg-zinc-200 disabled:opacity-35 transition-colors whitespace-nowrap shrink-0"
                    >
                      Próximo
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Organized Season & Episode Sidebar for Series / Animes */}
            {hasSeriesPlaylist && folder && (
              <aside className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-[#0B0B10] flex flex-col min-h-[260px] lg:min-h-0 overflow-hidden">
                <div className="shrink-0 p-4 border-b border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {folder.seasons.length > 0
                          ? "Temporadas & Episódios"
                          : "Arquivos na Pasta"}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 tabular-nums">
                      {orderedPlayableEntries.length}{" "}
                      {orderedPlayableEntries.length === 1 ? "arquivo" : "arquivos"}
                    </span>
                  </div>

                  {folder.seasons.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {folder.seasons.map((season) => {
                        const isActive =
                          activeSeasonGroup?.seasonNumber === season.seasonNumber;
                        return (
                          <button
                            key={season.seasonNumber}
                            type="button"
                            onClick={() => setSelectedSeasonNum(season.seasonNumber)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                              isActive
                                ? "bg-white text-[#060608]"
                                : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.12] hover:text-white"
                            }`}
                          >
                            {season.label} ({season.entries.length})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {(activeSeasonGroup
                    ? activeSeasonGroup.entries
                    : folder.looseEntries
                  ).map((ep) => {
                    const epMeta = resolveDownloadFolderMetadata(ep);
                    const isPlayingNow = ep.id === entry.id;
                    const isAvailable = ep.status === "completed";
                    const isEpCached = cachedIds ? cachedIds.has(ep.id) : true;

                    return (
                      <button
                        key={ep.id}
                        type="button"
                        disabled={!isAvailable}
                        onMouseEnter={() => isAvailable && onPreloadEntry?.(ep)}
                        onFocus={() => isAvailable && onPreloadEntry?.(ep)}
                        onClick={() => onSelectEntry?.(ep)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isPlayingNow
                            ? "border-white/30 bg-white/[0.12] text-white"
                            : "border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:bg-white/[0.07] hover:text-white"
                        } disabled:opacity-45`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums ${
                            isPlayingNow
                              ? "bg-white text-[#060608]"
                              : "bg-white/[0.07] text-zinc-200"
                          }`}
                        >
                          {isPlayingNow ? (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          ) : epMeta.episodeNumber !== null ? (
                            `E${String(epMeta.episodeNumber).padStart(2, "0")}`
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium truncate text-white">
                            {epMeta.episodeTitle ||
                              (epMeta.episodeNumber !== null
                                ? `Episódio ${epMeta.episodeNumber}`
                                : ep.title)}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                            {epMeta.languageLabel && <span>{epMeta.languageLabel}</span>}
                            {ep.fileSizeFormatted && (
                              <>
                                {epMeta.languageLabel && <span aria-hidden="true">·</span>}
                                <span className="tabular-nums">{ep.fileSizeFormatted}</span>
                              </>
                            )}
                            {isEpCached && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-400">Offline</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
