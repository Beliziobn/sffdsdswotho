import { CheckCircle2, FolderOpen, Play, X } from "lucide-react";
import { toast } from "sonner";
import {
  resolveDownloadFolderMetadata,
  UserDownloadEntry,
} from "./downloadsStore";

export const DOWNLOAD_NAVIGATE_EVENT = "wotho:navigate-to-download";
export const DOWNLOAD_TOAST_DURATION_MS = 5000;

export function buildDownloadTargetHref(
  entry: UserDownloadEntry,
  autoplay = false
): string {
  const meta = resolveDownloadFolderMetadata(entry);
  const params = new URLSearchParams({
    tab: "downloads",
    folder: meta.folderKey,
    item: entry.id,
  });
  if (autoplay) {
    params.set("autoplay", "1");
  }
  return `/perfil?${params.toString()}`;
}

export function navigateDirectlyToDownload(
  entry: UserDownloadEntry,
  autoplay = false
): void {
  if (typeof window === "undefined") return;
  const href = buildDownloadTargetHref(entry, autoplay);
  window.dispatchEvent(new CustomEvent(DOWNLOAD_NAVIGATE_EVENT, { detail: { href } }));
}

export function notifyDownloadSuccess(
  entry: UserDownloadEntry,
  options?: {
    toastId?: string | number;
    message?: string;
  }
): void {
  if (options?.toastId !== undefined) {
    toast.dismiss(options.toastId);
  }

  const meta = resolveDownloadFolderMetadata(entry);
  const folderHint =
    meta.seasonNumber !== null
      ? `Pasta ${meta.folderTitle} · Temporada ${meta.seasonNumber}`
      : `Pasta ${meta.folderTitle}`;

  const createdId = toast.custom(
    (t) => (
      <div
        role="status"
        className="pointer-events-auto relative w-[372px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#121216]/95 backdrop-blur-2xl text-[#1D1D1F] dark:text-white shadow-[0_18px_45px_-12px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center gap-3 p-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold tracking-tight leading-tight text-[#1D1D1F] dark:text-white">
              {options?.message || "Download concluído"}
            </p>
            <p className="mt-0.5 text-xs text-[#6E6E73] dark:text-zinc-300 truncate">
              {entry.title}
            </p>
            <p className="mt-0.5 text-[11px] text-[#86868B] dark:text-zinc-400 truncate">
              {folderHint}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t);
                navigateDirectlyToDownload(entry, true);
              }}
              title="Reproduzir / abrir agora"
              aria-label="Reproduzir / abrir agora"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D1D1F] text-white dark:bg-white dark:text-[#060608] hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t);
                navigateDirectlyToDownload(entry, false);
              }}
              title="Ir direto para o download do arquivo"
              aria-label="Ir direto para o download do arquivo"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-white hover:opacity-90 active:scale-95 transition-all"
            >
              <FolderOpen className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toast.dismiss(t)}
              title="Fechar notificação"
              aria-label="Fechar notificação"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#86868B] hover:text-[#1D1D1F] dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="h-[2px] w-full bg-black/[0.06] dark:bg-white/[0.08]">
          <div
            className="h-full bg-[#1D1D1F] dark:bg-white origin-left"
            style={{
              animation: `wothoToastCountdown ${DOWNLOAD_TOAST_DURATION_MS}ms linear forwards`,
            }}
          />
        </div>
        <style>{`@keyframes wothoToastCountdown { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
      </div>
    ),
    {
      duration: DOWNLOAD_TOAST_DURATION_MS,
    }
  );

  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      toast.dismiss(createdId);
    }, DOWNLOAD_TOAST_DURATION_MS + 100);
  }
}

export function notifyDownloadError(
  err: unknown,
  fallbackMessage: string,
  toastId?: string | number
): void {
  if (toastId !== undefined) {
    toast.dismiss(toastId);
  }
  const msg = err instanceof Error && err.message ? err.message : fallbackMessage;
  toast.error(msg, { duration: DOWNLOAD_TOAST_DURATION_MS });
}
