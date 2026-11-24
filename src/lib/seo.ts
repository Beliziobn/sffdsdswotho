import { useEffect } from "react";

export const CANONICAL_BASE_URL = (
  import.meta.env.VITE_APP_URL || "https://wotho.vercel.app"
).replace(/\/+$/, "");

export const DEFAULT_OG_IMAGE = `${CANONICAL_BASE_URL}/og-wotho-home.jpg`;
export const BOOKS_OG_IMAGE = `${CANONICAL_BASE_URL}/og-livros.jpg`;

export type JsonLdNode = Record<string, unknown>;

export interface OgVideoOptions {
  url: string;
  type?: string;
  width?: number;
  height?: number;
}

export interface PageSeoOptions {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: "website" | "article" | "book" | "video.movie" | "video.tv_show";
  ogImage?: string;
  ogImageAlt?: string;
  ogVideo?: OgVideoOptions | null;
  robots?: string;
  keywords?: string;
  jsonLd?: JsonLdNode | JsonLdNode[];
  articlePublishedTime?: string;
  articleSection?: string;
  enabled?: boolean;
}

export function normalizeCanonicalPath(pathname: string): string {
  const clean = (pathname || "/").split("?")[0];
  const trimmed = clean === "/" ? "/" : clean.replace(/\/+$/, "");
  if (trimmed === "/contacto") return "/contato";
  if (trimmed === "/sitemap") return "/mapa-do-site";
  if (trimmed === "/meu-perfil") return "/perfil";
  if (trimmed === "/index.html") return "/";
  return trimmed || "/";
}

export function resolveAbsoluteSeoUrl(urlOrPath?: string): string {
  if (!urlOrPath) return DEFAULT_OG_IMAGE;
  const trimmed = urlOrPath.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed === "/og-image.jpg") {
    return DEFAULT_OG_IMAGE;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    let out = trimmed.replace(/^http:\/\//i, "https://");
    if (/^https:\/\/image\.tmdb\.org\/t\/p\/original\//i.test(out)) {
      out = out.replace(/^https:\/\/image\.tmdb\.org\/t\/p\/original\//i, "https://image.tmdb.org/t/p/w1280/");
    }
    const isSignedUrl = /[?&](s|sig|signature|token|hash|hmac)=/i.test(out) || /i\.guim\.co\.uk/i.test(out);
    if (!isSignedUrl && /([?&])width=(?:[1-4]\d{2}|[1-9]\d)(?=&|$)/i.test(out)) {
      out = out.replace(/([?&])width=\d+/i, "$1width=1200");
    }
    return out;
  }
  if (trimmed.startsWith("/")) return `${CANONICAL_BASE_URL}${trimmed}`;
  return `${CANONICAL_BASE_URL}/${trimmed}`;
}

export function upsertMetaTag(
  selector: string,
  attrName: "name" | "property",
  attrValue: string,
  content: string
) {
  if (typeof document === "undefined") return;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function removeMetaTag(selector: string) {
  if (typeof document === "undefined") return;
  document.querySelectorAll(selector).forEach((el) => el.remove());
}

export function parseDurationToIso8601(durationStr?: string, fallback = "PT1H45M"): string {
  if (!durationStr) return fallback;
  const s = String(durationStr).toLowerCase();
  const hMatch = s.match(/(\d+)\s*h/);
  const mMatch = s.match(/(\d+)\s*m(?:in)?/);
  const h = hMatch ? parseInt(hMatch[1], 10) : 0;
  const m = mMatch ? parseInt(mMatch[1], 10) : 0;
  if (h > 0 && m > 0) return `PT${h}H${m}M`;
  if (h > 0) return `PT${h}H`;
  if (m > 0) return `PT${m}M`;
  return fallback;
}

export function toValidUploadDateIso(yearOrDate?: string | number): string {
  if (typeof yearOrDate === "string" && /^\d{4}-\d{2}-\d{2}/.test(yearOrDate)) {
    const yStr = Number(yearOrDate.slice(0, 4));
    if (yStr >= 1970) {
      return yearOrDate.includes("T") ? yearOrDate : `${yearOrDate.slice(0, 10)}T12:00:00Z`;
    }
    return "2025-01-15T12:00:00Z";
  }
  const y = Number(yearOrDate);
  const nowYear = new Date().getUTCFullYear();
  if (Number.isFinite(y) && y >= 1970 && y <= nowYear) {
    const monthDay = Math.floor(y) === nowYear ? "01-15" : "06-15";
    return `${Math.floor(y)}-${monthDay}T12:00:00Z`;
  }
  return "2025-01-15T12:00:00Z";
}

export interface VideoObjectSchemaInput {
  canonicalPath: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  durationIso?: string;
  trailerYoutubeId?: string;
  isFamilyFriendly?: boolean;
}

/**
 * Generates a Google Video Indexing compliant VideoObject JSON-LD node
 * for dedicated watch pages (/cinema/:id and /animes/:id).
 */
export function buildVideoObjectSchema(input: VideoObjectSchemaInput): {
  videoId: string;
  embedUrl: string;
  contentUrl: string;
  schema: JsonLdNode;
} {
  const cleanPath = normalizeCanonicalPath(input.canonicalPath);
  const canonicalUrl = `${CANONICAL_BASE_URL}${cleanPath}`;
  const cleanYt = (input.trailerYoutubeId || "").trim();
  const hasYt = /^[a-zA-Z0-9_-]{11}$/.test(cleanYt);
  const embedUrl = hasYt ? `https://www.youtube.com/embed/${cleanYt}` : canonicalUrl;
  const contentUrl = hasYt ? `https://www.youtube.com/watch?v=${cleanYt}` : canonicalUrl;
  const videoId = `${canonicalUrl}#video`;
  const thumb = resolveAbsoluteSeoUrl(input.thumbnailUrl);
  const thumbs = hasYt
    ? [thumb, `https://i.ytimg.com/vi/${cleanYt}/hqdefault.jpg`]
    : [thumb];

  return {
    videoId,
    embedUrl,
    contentUrl,
    schema: {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "@id": videoId,
      name: input.name,
      description: input.description,
      thumbnailUrl: thumbs,
      uploadDate: input.uploadDate,
      duration: input.durationIso || "PT1H45M",
      embedUrl,
      contentUrl,
      inLanguage: "pt-BR",
      isFamilyFriendly: input.isFamilyFriendly !== false,
      publisher: {
        "@type": "Organization",
        name: "Wotho",
        logo: {
          "@type": "ImageObject",
          url: `${CANONICAL_BASE_URL}/favicon-512x512.png`,
          width: 512,
          height: 512,
        },
      },
      potentialAction: {
        "@type": "WatchAction",
        target: canonicalUrl,
      },
    },
  };
}

export function upsertLinkTag(rel: string, href: string, extraAttrs?: Record<string, string>) {
  if (typeof document === "undefined") return;
  const selectorParts = [`link[rel="${rel}"]`];
  if (extraAttrs) {
    for (const [k, v] of Object.entries(extraAttrs)) {
      selectorParts.push(`[${k}="${v}"]`);
    }
  }
  let link = document.querySelector(selectorParts.join("")) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    if (extraAttrs) {
      for (const [k, v] of Object.entries(extraAttrs)) {
        link.setAttribute(k, v);
      }
    }
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.path.startsWith("http")
        ? item.path
        : item.path === "/"
        ? `${CANONICAL_BASE_URL}/`
        : `${CANONICAL_BASE_URL}${item.path}`,
    })),
  };
}

export function setDynamicJsonLd(nodes?: JsonLdNode | JsonLdNode[] | null) {
  if (typeof document === "undefined") return;
  const existing = document.getElementById("wotho-dynamic-jsonld");
  if (!nodes || (Array.isArray(nodes) && nodes.length === 0)) {
    if (existing) existing.remove();
    return;
  }

  // Remove stale SSR page-level scripts once React sets live entity schema
  document.querySelectorAll('script[data-ssr-seo="true"]').forEach((el) => el.remove());

  const payload = Array.isArray(nodes)
    ? nodes.length === 1
      ? nodes[0]
      : {
          "@context": "https://schema.org",
          "@graph": nodes.map((n) => {
            const copy = { ...n };
            delete copy["@context"];
            return copy;
          }),
        }
    : nodes;

  let scriptEl = existing as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement("script");
    scriptEl.id = "wotho-dynamic-jsonld";
    scriptEl.type = "application/ld+json";
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(payload);
}

export function applySeoMetadata(options: PageSeoOptions) {
  if (typeof document === "undefined") return;

  const cleanDesc = (options.description || "").replace(/\s+/g, " ").trim();
  const rawRobots =
    options.robots ||
    "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const isNoindex = /\bnoindex\b/i.test(rawRobots);
  // Per Bing Copilot Grounding guidelines: never attach noarchive/nocache to indexable pages
  const robotsValue = isNoindex
    ? rawRobots
    : rawRobots
        .replace(/\b(noarchive|nocache)\b,?\s*/gi, "")
        .replace(/,\s*$/, "") ||
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const canonicalPath = normalizeCanonicalPath(
    options.canonicalPath || (typeof window !== "undefined" ? window.location.pathname : "/")
  );
  const canonicalUrl =
    canonicalPath === "/" ? `${CANONICAL_BASE_URL}/` : `${CANONICAL_BASE_URL}${canonicalPath}`;
  const ogImage = resolveAbsoluteSeoUrl(options.ogImage);
  const ogImageAlt = options.ogImageAlt || options.title;

  document.title = options.title;

  upsertMetaTag('meta[name="description"]', "name", "description", cleanDesc);
  upsertMetaTag('meta[name="robots"]', "name", "robots", robotsValue);
  upsertMetaTag('meta[name="googlebot"]', "name", "googlebot", robotsValue);
  upsertMetaTag('meta[name="bingbot"]', "name", "bingbot", robotsValue);

  if (options.keywords) {
    upsertMetaTag('meta[name="keywords"]', "name", "keywords", options.keywords);
  }

  if (isNoindex) {
    document.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  } else {
    upsertLinkTag("canonical", canonicalUrl);
    upsertLinkTag("alternate", canonicalUrl, { hreflang: "pt-BR" });
    upsertLinkTag("alternate", canonicalUrl, { hreflang: "x-default" });
  }

  upsertMetaTag('meta[property="og:type"]', "property", "og:type", options.ogType || "website");
  upsertMetaTag('meta[property="og:url"]', "property", "og:url", canonicalUrl);
  upsertMetaTag('meta[property="og:title"]', "property", "og:title", options.title);
  upsertMetaTag('meta[property="og:description"]', "property", "og:description", cleanDesc);
  upsertMetaTag('meta[property="og:image"]', "property", "og:image", ogImage);
  upsertMetaTag('meta[property="og:image:secure_url"]', "property", "og:image:secure_url", ogImage);
  upsertMetaTag('meta[property="og:image:alt"]', "property", "og:image:alt", ogImageAlt);

  if (options.ogVideo?.url) {
    upsertMetaTag('meta[property="og:video"]', "property", "og:video", options.ogVideo.url);
    upsertMetaTag('meta[property="og:video:url"]', "property", "og:video:url", options.ogVideo.url);
    upsertMetaTag('meta[property="og:video:secure_url"]', "property", "og:video:secure_url", options.ogVideo.url);
    upsertMetaTag('meta[property="og:video:type"]', "property", "og:video:type", options.ogVideo.type || "text/html");
    upsertMetaTag('meta[property="og:video:width"]', "property", "og:video:width", String(options.ogVideo.width || 1280));
    upsertMetaTag('meta[property="og:video:height"]', "property", "og:video:height", String(options.ogVideo.height || 720));
  } else if (options.ogVideo === null || (options.ogType && options.ogType !== "video.movie" && options.ogType !== "video.tv_show")) {
    removeMetaTag('meta[property="og:video"]');
    removeMetaTag('meta[property="og:video:url"]');
    removeMetaTag('meta[property="og:video:secure_url"]');
    removeMetaTag('meta[property="og:video:type"]');
    removeMetaTag('meta[property="og:video:width"]');
    removeMetaTag('meta[property="og:video:height"]');
  }

  if (options.articlePublishedTime) {
    upsertMetaTag(
      'meta[property="article:published_time"]',
      "property",
      "article:published_time",
      options.articlePublishedTime
    );
  }
  if (options.articleSection) {
    upsertMetaTag(
      'meta[property="article:section"]',
      "property",
      "article:section",
      options.articleSection
    );
  }

  upsertMetaTag('meta[name="twitter:url"]', "name", "twitter:url", canonicalUrl);
  upsertMetaTag('meta[name="twitter:title"]', "name", "twitter:title", options.title);
  upsertMetaTag('meta[name="twitter:description"]', "name", "twitter:description", cleanDesc);
  upsertMetaTag('meta[name="twitter:image"]', "name", "twitter:image", ogImage);
  upsertMetaTag('meta[name="twitter:image:alt"]', "name", "twitter:image:alt", ogImageAlt);

  if (options.jsonLd !== undefined) {
    setDynamicJsonLd(options.jsonLd);
  }
}

export function usePageSeo(options: PageSeoOptions | null) {
  const serializedJsonLd = options?.jsonLd ? JSON.stringify(options.jsonLd) : "";
  const ogVideoUrl = options?.ogVideo?.url || "";

  useEffect(() => {
    if (!options || options.enabled === false) return;
    applySeoMetadata(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options?.enabled,
    options?.title,
    options?.description,
    options?.canonicalPath,
    options?.ogType,
    options?.ogImage,
    options?.ogImageAlt,
    ogVideoUrl,
    options?.robots,
    options?.keywords,
    options?.articlePublishedTime,
    options?.articleSection,
    serializedJsonLd,
  ]);
}

const notifiedIndexNowCache = new Map<string, number>();

/**
 * Notifies IndexNow in real time for a single canonical URL addition, update, or removal (404).
 * Strictly avoids batch submissions and deduplicates within a 60s window.
 */
export function notifyIndexNowRealtime(
  pathOrUrl: string,
  action: "update" | "delete" = "update"
): void {
  if (typeof window === "undefined" || !pathOrUrl) return;
  const normalized = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : normalizeCanonicalPath(pathOrUrl);
  const key = `${action}:${normalized}`;
  const now = Date.now();
  const last = notifiedIndexNowCache.get(key);
  if (last && now - last < 60_000) return;
  notifiedIndexNowCache.set(key, now);

  try {
    void fetch("/api/seo/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: normalized, action }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Non-blocking telemetry
  }
}
