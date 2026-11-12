import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface RouteMeta {
  title: string;
  description: string;
}

const CANONICAL_BASE_URL = (
  import.meta.env.VITE_APP_URL || "https://wotho.vercel.app"
).replace(/\/+$/, "");

const DEFAULT_OG_IMAGE = `${CANONICAL_BASE_URL}/og-image.jpg`;

const ROUTE_META_MAP: Record<string, RouteMeta> = {
  "/": {
    title: "Wotho — Livros Digitais, Notícias Globais, Streaming e Webtoons",
    description:
      "Explore a Wotho: biblioteca digital no navegador, jornalismo global em tempo real, streaming de cinema e animes em HD e webtoons em leitura vertical.",
  },
  "/livros": {
    title: "Biblioteca de Livros Digitais no Navegador — Wotho",
    description:
      "Leia bestsellers modernos, filosofia, clássicos universais, conteúdos do ENEM e artigos científicos completos diretamente no navegador na Wotho.",
  },
  "/noticias": {
    title: "Notícias Globais em Tempo Real — Wotho",
    description:
      "Cobertura jornalística independente e atualizada sobre tecnologia, ciência, economia, política, futebol, cultura e grandes ideias na Wotho.",
  },
  "/webtoons": {
    title: "Webtoons & Quadrinhos em Leitura Vertical — Wotho",
    description:
      "Leia histórias em quadrinhos e webtoons em formato scroll vertical de alta definição diretamente no navegador na Wotho.",
  },
  "/animes": {
    title: "Animes e Mangás em Streaming — Wotho",
    description:
      "Catálogo selecionado de animes dublados e legendados em português, episódios, trailers e capítulos de mangá integrados na Wotho.",
  },
  "/cinema": {
    title: "Cinema & Séries em Streaming HD — Wotho",
    description:
      "Assista a filmes e séries aclamados com player em alta definição, áudio dublado em português (PT-BR) e legendas completas na Wotho.",
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
  },
  "/contato": {
    title: "Contato e Atendimento — Wotho",
    description:
      "Entre em contato com a equipe da Wotho para dúvidas, sugestões de obras, pautas jornalísticas, parcerias editoriais ou suporte.",
  },
  "/contacto": {
    title: "Contato e Atendimento — Wotho",
    description:
      "Entre em contato com a equipe da Wotho para dúvidas, sugestões de obras, pautas jornalísticas, parcerias editoriais ou suporte.",
  },
  "/mapa-do-site": {
    title: "Mapa do Site (Sitemap) — Wotho",
    description:
      "Índice estruturado com todas as páginas canônicas, catálogos e acervo completo da plataforma Wotho.",
  },
  "/sitemap": {
    title: "Mapa do Site (Sitemap) — Wotho",
    description:
      "Índice estruturado com todas as páginas canônicas, catálogos e acervo completo da plataforma Wotho.",
  },
  "/termos": {
    title: "Termos de Uso — Wotho",
    description:
      "Condições gerais de navegação, leitura digital e uso dos serviços da plataforma Wotho.",
  },
  "/privacidade": {
    title: "Política de Privacidade — Wotho",
    description:
      "Diretrizes de proteção de dados, conformidade LGPD e privacidade dos usuários da Wotho.",
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
];

const setMetaTag = (
  selector: string,
  attr: string,
  value: string,
  createAttr: string,
  createVal: string
) => {
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(createAttr, createVal);
    document.head.appendChild(element);
  }
  element.setAttribute(attr, value);
};

/**
 * Dynamically synchronizes <link rel="canonical">, <meta name="robots">, <title>, and
 * OpenGraph/Twitter meta tags on every client-side page transition, ensuring all canonical
 * and social URLs point exclusively to https://wotho.vercel.app.
 */
export const CanonicalManager = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathname = location.pathname;
    const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
    const isKnownRoute =
      KNOWN_EXACT_ROUTES.has(normalizedPath) ||
      KNOWN_DYNAMIC_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));

    if (!isKnownRoute) {
      const staleCanonical = document.querySelector('link[rel="canonical"]');
      if (staleCanonical) staleCanonical.remove();
      setMetaTag('meta[name="robots"]', "content", "noindex, nofollow", "name", "robots");
      return;
    }

    const canonicalUrl = normalizedPath === "/" ? `${CANONICAL_BASE_URL}/` : `${CANONICAL_BASE_URL}${normalizedPath}`;

    // 1. Update or create canonical link pointing exclusively to https://wotho.vercel.app
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    // 2. Restore indexability on public routes, keep noindex on private/utility routes
    const isPrivateRoute = PRIVATE_NOINDEX_PREFIXES.some(
      (prefix) => normalizedPath === prefix || normalizedPath.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
    );
    setMetaTag(
      'meta[name="robots"]',
      "content",
      isPrivateRoute
        ? "noindex, follow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      "name",
      "robots"
    );

    // 3. Update og:url, twitter:url, og:image, twitter:image
    setMetaTag('meta[property="og:url"]', "content", canonicalUrl, "property", "og:url");
    setMetaTag('meta[name="twitter:url"]', "content", canonicalUrl, "name", "twitter:url");
    setMetaTag('meta[property="og:image"]', "content", DEFAULT_OG_IMAGE, "property", "og:image");
    setMetaTag(
      'meta[property="og:image:secure_url"]',
      "content",
      DEFAULT_OG_IMAGE,
      "property",
      "og:image:secure_url"
    );
    setMetaTag('meta[name="twitter:image"]', "content", DEFAULT_OG_IMAGE, "name", "twitter:image");

    // 4. Update route-specific Title & Description if matching a top-level route
    const meta = ROUTE_META_MAP[normalizedPath];
    if (meta) {
      document.title = meta.title;
      setMetaTag('meta[name="description"]', "content", meta.description, "name", "description");
      setMetaTag('meta[property="og:title"]', "content", meta.title, "property", "og:title");
      setMetaTag(
        'meta[property="og:description"]',
        "content",
        meta.description,
        "property",
        "og:description"
      );
      setMetaTag('meta[name="twitter:title"]', "content", meta.title, "name", "twitter:title");
      setMetaTag(
        'meta[name="twitter:description"]',
        "content",
        meta.description,
        "name",
        "twitter:description"
      );
    }
  }, [location.pathname]);

  return null;
};

export default CanonicalManager;
