/**
 * Utility for client-side image compression and upload processing.
 * Optimizes photos to crisp high-definition WebP/JPEG format while keeping
 * the payload ultra-compact (~30KB-90KB) for instantaneous Firestore sync
 * and zero-lag rendering across all devices.
 */

export interface OptimizedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  format: "webp" | "jpeg" | "png";
  fileName: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "Nenhum arquivo selecionado." };
  }

  const hasImageMime = Boolean(file.type && file.type.startsWith("image/"));
  const hasImageExt = /\.(png|jpe?g|webp|avif|gif|bmp)$/i.test(file.name || "");

  if (!hasImageMime && !hasImageExt) {
    return {
      valid: false,
      error: `Formato inválido (${file.type || "desconhecido"}). Por favor selecione uma imagem (PNG, JPG, WEBP, AVIF).`,
    };
  }

  // Maximum raw input size: 20MB
  const maxRawBytes = 20 * 1024 * 1024;
  if (file.size > maxRawBytes) {
    return {
      valid: false,
      error: `Imagem muito pesada (${formatBytes(file.size)}). O limite máximo de envio é 20MB.`,
    };
  }

  return { valid: true };
}

function renderToDataUrl(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
  preferWebp: boolean
): { dataUrl: string; format: "webp" | "jpeg"; approxBytes: number } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    throw new Error("Não foi possível inicializar o processador gráfico do navegador.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let format: "webp" | "jpeg" = preferWebp ? "webp" : "jpeg";
  let dataUrl = "";

  if (preferWebp) {
    dataUrl = canvas.toDataURL("image/webp", quality);
    if (!dataUrl.startsWith("data:image/webp")) {
      dataUrl = canvas.toDataURL("image/jpeg", quality);
      format = "jpeg";
    }
  } else {
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    format = "jpeg";
  }

  const base64Content = dataUrl.split(",")[1] || "";
  const approxBytes = Math.round((base64Content.length * 3) / 4);
  return { dataUrl, format, approxBytes };
}

export async function compressImageFile(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    preferWebp?: boolean;
    maxBytes?: number;
  } = {}
): Promise<OptimizedImageResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const maxWidth = options.maxWidth ?? 1280;
  const maxHeight = options.maxHeight ?? 720;
  const initialQuality = options.quality ?? 0.82;
  const preferWebp = options.preferWebp ?? true;
  const maxBytes = options.maxBytes ?? 220 * 1024;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo de imagem selecionado."));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível decodificar os dados da imagem."));

      img.onload = () => {
        try {
          const fitSize = (limitW: number, limitH: number) => {
            let w = img.width;
            let h = img.height;
            if (w > limitW || h > limitH) {
              const ratio = Math.min(limitW / w, limitH / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }
            return { width: Math.max(w, 1), height: Math.max(h, 1) };
          };

          const sizeSteps = [
            fitSize(maxWidth, maxHeight),
            fitSize(960, 540),
            fitSize(800, 450),
          ];
          const qualitySteps = [initialQuality, 0.72, 0.62, 0.52];

          let bestResult = renderToDataUrl(
            img,
            sizeSteps[0].width,
            sizeSteps[0].height,
            qualitySteps[0],
            preferWebp
          );
          let bestWidth = sizeSteps[0].width;
          let bestHeight = sizeSteps[0].height;

          if (bestResult.approxBytes > maxBytes) {
            outer: for (let s = 0; s < sizeSteps.length; s++) {
              const dim = sizeSteps[s];
              for (let q = s === 0 ? 1 : 0; q < qualitySteps.length; q++) {
                const candidate = renderToDataUrl(
                  img,
                  dim.width,
                  dim.height,
                  qualitySteps[q],
                  preferWebp
                );
                if (candidate.approxBytes < bestResult.approxBytes) {
                  bestResult = candidate;
                  bestWidth = dim.width;
                  bestHeight = dim.height;
                }
                if (candidate.approxBytes <= maxBytes) {
                  break outer;
                }
              }
            }
          }

          resolve({
            dataUrl: bestResult.dataUrl,
            width: bestWidth,
            height: bestHeight,
            sizeBytes: bestResult.approxBytes,
            format: bestResult.format,
            fileName: file.name,
          });
        } catch (err: any) {
          reject(new Error(`Erro ao otimizar imagem: ${err?.message || err}`));
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
