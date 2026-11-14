import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  CANONICAL_BASE_URL,
  DEFAULT_OG_IMAGE,
  applySeoMetadata,
  buildBreadcrumbSchema,
  normalizeCanonicalPath,
  setDynamicJsonLd,
  upsertMetaTag,
} from "@/lib/seo";

interface RouteMeta {
  title: string;
  description: string;
  schemaType?: string;
  breadcrumbName?: string;
}

const ROUTE_META_MAP: Record<string, RouteMeta> = {
  "/": {
    title: "Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons",
    description:
      "Explore a Wotho: biblioteca digital no navegador, jornalismo global em tempo real, streaming de cinema e animes em HD e webtoons em leitura vertical.",
    schemaType: "CollectionPage",
    breadcrumbName: "Início",
  },
  "/livros": {
    title: "Biblioteca de Livros Digitais no Navegador — Wotho",
    description:
      "Leia bestsellers modernos, filosofia, clássicos universais, conteúdos do ENEM e artigos científicos completos diretamente no navegador na Wotho.",
    schemaType: "CollectionPage",
    breadcrumbName: "Livros Digitais",
  },
  "/noticias": {
    title: "Notícias Globais em Tempo Real — Wotho",
    description:
      "Cobertura jornalística independente e atualizada sobre tecnologia, ciência, economia, política, futebol, cultura e grandes ideias na Wotho.",
    schemaType: "CollectionPage",
    breadcrumbName: "Notícias",
  },
  "/webtoons": {
    title: "Webtoons & Quadrinhos em Leitura Vertical — Wotho",
    description:
      "Leia histórias em quadrinhos e webtoons em formato scroll vertical de alta definição diretamente no navegador na Wotho.",
    schemaType: "CollectionPage",
    breadcrumbName: "Webtoons",
  },
  "/animes": {
    title: "Animes e Mangás em Streaming — Wotho",
    description:
      "Catálogo selecionado de animes dublados e legendados em português, episódios, trailers e capítulos de mangá integrados na Wotho.",
    schemaType: "CollectionPage",
    breadcrumbName: "Animes",
  },
  "/cinema": {
    title: "Cinema & Séries em Streaming HD — Wotho",
    description:
      "Assista a filmes e séries aclamados com player em alta definição, áudio dublado em português (PT-BR) e legendas completas na Wotho.",
    schemaType: "CollectionPage",
    breadcrumbName: "Cinema & Séries",
  },
  "/biblioteca": {
    title: "Minha Estante Pessoal — Wotho",
    description:
      "Acesse seus livros digitais salvos, títulos adquiridos e histórico de leitura na plataforma Wotho.",
  },
  "/para-voce": {
    title: "Recomendações Para Você — Wotho",
    description:
      "Descubra novos livros, webtoons, séries e notícias selecionados com base no seu perfil de leitura na Wotho.",
  },
  "/continuar-lendo": {
    title: "Continuar Leitura — Wotho",
    description:
      "Retome a leitura dos seus livros e webtoons exatamente de onde você parou na Wotho.",
  },
  "/buscar": {
    title: "Busca Global no Acervo — Wotho",
    description:
      "Pesquise por livros, filmes, séries, animes, webtoons, tópicos científicos e notícias na Wotho.",
  },
  "/sobre": {
    title: "Sobre a Wotho — Plataforma de Cultura, Streaming e Leitura",
    description:
      "Conheça a Wotho: plataforma digital de livros no navegador, jornalismo global, webtoons e streaming de cinema e animes.",
    schemaType: "AboutPage",
    breadcrumbName: "Sobre a Wotho",
  },
  "/contato": {
    title: "Contato e Atendimento — Wotho",
    description:
      "Entre em contato com a equipe da Wotho para dúvidas, sugestões de obras, pautas jornalísticas, parcerias editoriais ou suporte.",
    schemaType: "ContactPage",
    breadcrumbName: "Contato",
  },
  "/mapa-do-site": {
    title: "Mapa do Site (Sitemap) — Wotho",
    description:
      "Índice estruturado com todas as páginas canônicas, catálogos e acervo completo da plataforma Wotho.",
    schemaType: "CollectionPage",
    breadcrumbName: "Mapa do Site",
  },
  "/termos": {
    title: "Termos de Uso — Wotho",
    description:
      "Condições gerais de navegação, leitura digital e uso dos serviços da plataforma Wotho.",
    schemaType: "WebPage",
    breadcrumbName: "Termos de Uso",
  },
  "/privacidade": {
    title: "Política de Privacidade — Wotho",
    description:
      "Diretrizes de proteção de dados, conformidade LGPD e privacidade dos usuários da Wotho.",
    schemaType: "WebPage",
    breadcrumbName: "Política de Privacidade",
  },
};

const KNOWN_EXACT_ROUTES = new Set([
  ...Object.keys(ROUTE_META_MAP),
  "/auth",
  "/admin",
  "/perfil",
  "/meu-perfil",
  "/redefinir-senha",
  "/compra/sucesso",
  "/compra/cancelada",
]);

const KNOWN_DYNAMIC_PREFIXES = [
  "/livros/",
  "/ler/",
  "/noticias/",
  "/cinema/",
  "/animes/",
  "/webtoons/",
  "/webtoon/",
  "/conteudo/",
  "/leitura/",
];

const PRIVATE_NOINDEX_PREFIXES = [
  "/auth",
  "/admin",
  "/perfil",
  "/meu-perfil",
  "/redefinir-senha",
  "/compra/",
  "/biblioteca",
  "/continuar-lendo",
  "/para-voce",
  "/buscar",
  "/ler/",
  "/leitura/",
];

function resolveCanonicalAlias(normalizedPath: string): string {
  if (normalizedPath.startsWith("/ler/")) {
    const id = normalizedPath.slice("/ler/".length).split("/")[0];
    return id ? `/livros/${id}` : "/livros";
  }
  if (normalizedPath.startsWith("/leitura/")) {
    const id = normalizedPath.slice("/leitura/".length).split("/")[0];
    return id ? `/conteudo/${id}` : "/livros";
  }
  if (/^\/animes\/([^/]+)\/manga/.test(normalizedPath)) {
    const id = normalizedPath.split("/")[2];
    return id ? `/animes/${id}` : "/animes";
  }
  if (/^\/webtoon\/([^/]+)\/(ep|ler)/.test(normalizedPath)) {
    const id = normalizedPath.split("/")[2];
    return id ? `/webtoon/${id}` : "/webtoons";
  }
  return normalizedPath;
}

/**
 * Dynamically synchronizes <link rel="canonical">, <meta name="robots">, <meta name="googlebot">,
 * <title>, hreflang alternates, OpenGraph/Twitter tags, and route Schema.org JSON-LD
 * on every client-side SPA transition.
 */
export const CanonicalManager = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const normalizedPath = normalizeCanonicalPath(location.pathname);
    const isKnownRoute =
      KNOWN_EXACT_ROUTES.has(normalizedPath) ||
      KNOWN_DYNAMIC_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));

    if (!isKnownRoute) {
      const staleCanonical = document.querySelector('link[rel="canonical"]');
      if (staleCanonical) staleCanonical.remove();
      upsertMetaTag('meta[name="robots"]', "name", "robots", "noindex, nofollow");
      upsertMetaTag('meta[name="googlebot"]', "name", "googlebot", "noindex, nofollow");
      setDynamicJsonLd(null);
      return;
    }

    const isReaderSubRoute =
      normalizedPath.startsWith("/ler/") ||
      normalizedPath.startsWith("/leitura/") ||
      /^\/animes\/[^/]+\/manga/.test(normalizedPath) ||
      /^\/webtoon\/[^/]+\/(ep|ler)/.test(normalizedPath);

    const isPrivateRoute =
      isReaderSubRoute ||
      PRIVATE_NOINDEX_PREFIXES.some(
        (prefix) =>
          normalizedPath === prefix ||
          normalizedPath.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
      );

    const canonicalPath = resolveCanonicalAlias(normalizedPath);
    const robotsDirective = normalizedPath.startsWith("/admin")
      ? "noindex, nofollow"
      : isPrivateRoute
      ? "noindex, follow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    const meta = ROUTE_META_MAP[normalizedPath];

    if (meta) {
      const canonicalUrl =
        canonicalPath === "/"
          ? `${CANONICAL_BASE_URL}/`
          : `${CANONICAL_BASE_URL}${canonicalPath}`;
      const jsonLd = meta.schemaType
        ? [
            {
              "@context": "https://schema.org",
              "@type": meta.schemaType,
              name: meta.title,
              description: meta.description,
              url: canonicalUrl,
              inLanguage: "pt-BR",
              isPartOf: {
                "@type": "WebSite",
                name: "Wotho",
                url: `${CANONICAL_BASE_URL}/`,
              },
            },
            ...(meta.breadcrumbName
              ? [
                  buildBreadcrumbSchema(
                    canonicalPath === "/"
                      ? [{ name: "Wotho", path: "/" }]
                      : [
                          { name: "Wotho", path: "/" },
                          { name: meta.breadcrumbName, path: canonicalPath },
                        ]
                  ),
                ]
              : []),
          ]
        : undefined;

      applySeoMetadata({
        title: meta.title,
        description: meta.description,
        canonicalPath,
        robots: robotsDirective,
        ogType: "website",
        ogImage: DEFAULT_OG_IMAGE,
        ogImageAlt: meta.title,
        jsonLd,
      });
    } else {
      // Dynamic detail/utility route: set canonical & robots immediately; detail page will enrich title/jsonLd
      const currentTitle = document.title || "Wotho";
      const currentDesc =
        document.querySelector('meta[name="description"]')?.getAttribute("content") ||
        "Explore a Wotho: biblioteca digital, notícias globais, streaming e webtoons.";
      applySeoMetadata({
        title: currentTitle,
        description: currentDesc,
        canonicalPath,
        robots: robotsDirective,
        ogType: "website",
        ogImage: DEFAULT_OG_IMAGE,
      });
    }
  }, [location.pathname]);

  return null;
};

export default CanonicalManager;
