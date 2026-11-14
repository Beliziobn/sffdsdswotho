import { useEffect } from "react";

export const CANONICAL_BASE_URL = (
  import.meta.env.VITE_APP_URL || "https://wotho.vercel.app"
).replace(/\/+$/, "");

export const DEFAULT_OG_IMAGE = `${CANONICAL_BASE_URL}/og-image.jpg`;

export type JsonLdNode = Record<string, unknown>;

export interface PageSeoOptions {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: "website" | "article" | "book" | "video.movie" | "video.tv_show";
  ogImage?: string;
  ogImageAlt?: string;
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
  if (!trimmed) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
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
  const robotsValue =
    options.robots ||
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

  if (options.keywords) {
    upsertMetaTag('meta[name="keywords"]', "name", "keywords", options.keywords);
  }

  upsertLinkTag("canonical", canonicalUrl);
  upsertLinkTag("alternate", canonicalUrl, { hreflang: "pt-BR" });
  upsertLinkTag("alternate", canonicalUrl, { hreflang: "x-default" });

  upsertMetaTag('meta[property="og:type"]', "property", "og:type", options.ogType || "website");
  upsertMetaTag('meta[property="og:url"]', "property", "og:url", canonicalUrl);
  upsertMetaTag('meta[property="og:title"]', "property", "og:title", options.title);
  upsertMetaTag('meta[property="og:description"]', "property", "og:description", cleanDesc);
  upsertMetaTag('meta[property="og:image"]', "property", "og:image", ogImage);
  upsertMetaTag('meta[property="og:image:secure_url"]', "property", "og:image:secure_url", ogImage);
  upsertMetaTag('meta[property="og:image:alt"]', "property", "og:image:alt", ogImageAlt);

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
    options?.robots,
    options?.keywords,
    options?.articlePublishedTime,
    options?.articleSection,
    serializedJsonLd,
  ]);
}
