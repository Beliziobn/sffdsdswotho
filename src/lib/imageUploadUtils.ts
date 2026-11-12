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

  if (!file.type.startsWith("image/")) {
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

export async function compressImageFile(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    preferWebp?: boolean;
  } = {}
): Promise<OptimizedImageResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const maxWidth = options.maxWidth ?? 1280;
  const maxHeight = options.maxHeight ?? 720;
  const quality = options.quality ?? 0.82;
  const preferWebp = options.preferWebp ?? true;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo de imagem selecionado."));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível decodificar os dados da imagem."));

      img.onload = () => {
        try {
          let { width, height } = img;

          // Maintain aspect ratio while fitting within maxWidth x maxHeight
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Ensure minimum dimensions
          width = Math.max(width, 1);
          height = Math.max(height, 1);

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) {
            // Fallback to original data URL if 2D context fails
            const rawUrl = reader.result as string;
            resolve({
              dataUrl: rawUrl,
              width: img.width,
              height: img.height,
              sizeBytes: file.size,
              format: file.type.includes("webp") ? "webp" : "jpeg",
              fileName: file.name,
            });
            return;
          }

          // High-quality image rendering on canvas
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Fill white background to avoid transparent black artifacts on JPEG/WebP
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0, width, height);

          // Try exporting to WebP first, fallback to JPEG
          let outputFormat: "webp" | "jpeg" = preferWebp ? "webp" : "jpeg";
          let dataUrl = "";

          if (preferWebp) {
            dataUrl = canvas.toDataURL("image/webp", quality);
            // If browser doesn't support webp export, it returns image/png
            if (!dataUrl.startsWith("data:image/webp")) {
              dataUrl = canvas.toDataURL("image/jpeg", quality);
              outputFormat = "jpeg";
            }
          } else {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
            outputFormat = "jpeg";
          }

          // Calculate approximate byte size of base64
          // Base64 header length + 4 * ceil(n / 3)
          const base64Content = dataUrl.split(",")[1] || "";
          const approxBytes = Math.round((base64Content.length * 3) / 4);

          resolve({
            dataUrl,
            width,
            height,
            sizeBytes: approxBytes,
            format: outputFormat,
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
