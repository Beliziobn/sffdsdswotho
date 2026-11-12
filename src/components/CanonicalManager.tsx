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
    title: "Wotho - Livros, notícias globais, streaming e webtoons",
    description:
      "Livros, notícias globais, streaming e webtoons, com um espaço para acompanhar as últimas novidades sobre cultura, literatura e grandes ideias.",
  },
  "/livros": {
    title: "Catálogo de Livros Digitais — Wotho",
    description:
      "Explore bestsellers modernos, obras preparatórias para o ENEM e artigos científicos para ler diretamente no navegador na Wotho.",
  },
  "/noticias": {
    title: "Portal de Notícias Globais — Wotho",
    description:
      "Acompanhe as últimas notícias e reportagens aprofundadas sobre cultura, tecnologia, futebol, negócios e grandes ideias na Wotho.",
  },
  "/webtoons": {
    title: "Webtoons & Quadrinhos Online — Wotho",
    description:
      "Leia histórias em quadrinhos e webtoons em formato scroll vertical de alta definição diretamente no navegador na Wotho.",
  },
  "/animes": {
    title: "Portal de Animes e Mangás — Wotho",
    description:
      "Catálogo de animes dublados em português, episódios, trailers, fichas técnicas completas e capítulos de mangá vinculados na Wotho.",
  },
  "/cinema": {
    title: "Cinema & Séries — Streaming Online — Wotho",
    description:
      "Assista a filmes e séries aclamados dublados em português com player cinematográfico em alta definição e catálogo completo na Wotho.",
  },
  "/biblioteca": {
    title: "Minha Estante — Wotho",
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
    title: "Sobre a Wotho — Plataforma de Streaming, Notícias e Leitura",
    description:
      "Conheça a Wotho: plataforma digital de streaming de cinema e animes, portal de notícias globais, webtoons e livros digitais.",
  },
  "/contato": {
    title: "Contato — Fale com a Wotho",
    description:
      "Entre em contato com a equipe da Wotho para dúvidas, sugestões de conteúdo, parcerias editoriais ou suporte técnico.",
  },
  "/contacto": {
    title: "Contato — Fale com a Wotho",
    description:
      "Entre em contato com a equipe da Wotho para dúvidas, sugestões de conteúdo, parcerias editoriais ou suporte técnico.",
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
 * Dynamically synchronizes <link rel="canonical">, <title>, and OpenGraph/Twitter meta tags
 * on every client-side page transition, ensuring all canonical and social URLs point
 * exclusively to https://wotho.vercel.app.
 */
export const CanonicalManager = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathname = location.pathname;
    const canonicalUrl = `${CANONICAL_BASE_URL}${pathname === "/" ? "/" : pathname}`;

    // 1. Update or create canonical link pointing exclusively to https://wotho.vercel.app
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    // 2. Update og:url, twitter:url, og:image, twitter:image
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

    // 3. Update route-specific Title & Description if matching a top-level route
    const meta = ROUTE_META_MAP[pathname];
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
