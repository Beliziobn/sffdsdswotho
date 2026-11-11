import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface RouteMeta {
  title: string;
  description: string;
}

const ROUTE_META_MAP: Record<string, RouteMeta> = {
  "/": {
    title: "Worsco - streaming e notícias",
    description:
      "Livros, notícias globais, streaming e webtoons, com um espaço para acompanhar as últimas novidades sobre cultura, literatura e grandes ideias.",
  },
  "/livros": {
    title: "Catálogo de Livros Digitais — Worsco",
    description:
      "Explore bestsellers modernos, obras preparatórias para o ENEM e artigos científicos para ler diretamente no navegador.",
  },
  "/noticias": {
    title: "Portal de Notícias Globais — Worsco",
    description:
      "Acompanhe as últimas notícias e reportagens aprofundadas sobre cultura, tecnologia, futebol, negócios e grandes ideias.",
  },
  "/webtoons": {
    title: "Webtoons & Quadrinhos Online — Worsco",
    description:
      "Leia histórias em quadrinhos e webtoons em formato scroll vertical de alta definição diretamente no navegador.",
  },
  "/animes": {
    title: "Portal de Animes e Mangás — Worsco",
    description:
      "Catálogo de animes, episódios, trailers, fichas técnicas completas e capítulos de mangá vinculados.",
  },
  "/cinema": {
    title: "Cinema & Séries — Filmes e Séries Online — Worsco",
    description:
      "Assista a filmes e séries aclamados com player cinematográfico, seleção de episódios em alta definição e catálogo completo na Worsco.",
  },
  "/biblioteca": {
    title: "Minha Estante — Worsco",
    description:
      "Acesse seus livros digitais salvos, títulos adquiridos e histórico de leitura na plataforma Worsco.",
  },
  "/para-voce": {
    title: "Recomendações Para Você — Worsco",
    description:
      "Descubra novos livros, webtoons e notícias selecionados com base no seu perfil de leitura.",
  },
  "/continuar-lendo": {
    title: "Continuar Leitura — Worsco",
    description: "Retome a leitura dos seus livros e webtoons exatamente de onde você parou.",
  },
  "/buscar": {
    title: "Busca Global no Acervo — Worsco",
    description:
      "Pesquise por títulos, autores, tópicos científicos, webtoons e notícias na Worsco.",
  },
  "/sobre": {
    title: "Sobre a Worsco — Streaming, Notícias e Leitura",
    description:
      "Conheça a Worsco: plataforma digital de streaming de animes, portal de notícias globais, webtoons e livros digitais para ler online.",
  },
  "/contato": {
    title: "Contato — Fale com a Worsco",
    description:
      "Entre em contato com a equipe da Worsco para dúvidas, sugestões de conteúdo, parcerias editoriais ou suporte técnico.",
  },
  "/contacto": {
    title: "Contato — Fale com a Worsco",
    description:
      "Entre em contato com a equipe da Worsco para dúvidas, sugestões de conteúdo, parcerias editoriais ou suporte técnico.",
  },
  "/mapa-do-site": {
    title: "Mapa do Site (Sitemap) — Worsco",
    description:
      "Índice estruturado com todas as páginas canônicas, catálogos e acervo da plataforma Worsco.",
  },
  "/sitemap": {
    title: "Mapa do Site (Sitemap) — Worsco",
    description:
      "Índice estruturado com todas as páginas canônicas, catálogos e acervo da plataforma Worsco.",
  },
  "/termos": {
    title: "Termos de Uso — Worsco",
    description:
      "Condições gerais de navegação, leitura digital e uso dos serviços da plataforma Worsco.",
  },
  "/privacidade": {
    title: "Política de Privacidade — Worsco",
    description:
      "Diretrizes de proteção de dados, conformidade LGPD e privacidade dos leitores da Worsco.",
  },
};

const setMetaTag = (selector: string, attr: string, value: string, createAttr: string, createVal: string) => {
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(createAttr, createVal);
    document.head.appendChild(element);
  }
  element.setAttribute(attr, value);
};

/**
 * Dynamically synchronizes <link rel="canonical">, <title>, and OpenGraph meta tags
 * on every client-side page transition, guaranteeing rich snippets for crawlers,
 * social media previews and search consoles.
 */
export const CanonicalManager = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const origin = window.location.origin;
    const pathname = location.pathname;
    const canonicalUrl = `${origin}${pathname === "/" ? "/" : pathname}`;

    // 1. Update or create canonical link
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    // 2. Update og:url and twitter:url
    setMetaTag('meta[property="og:url"]', "content", canonicalUrl, "property", "og:url");

    // 3. Update route-specific Title & Description if matching a top-level route
    const meta = ROUTE_META_MAP[pathname];
    if (meta) {
      document.title = meta.title;
      setMetaTag('meta[name="description"]', "content", meta.description, "name", "description");
      setMetaTag('meta[property="og:title"]', "content", meta.title, "property", "og:title");
      setMetaTag('meta[property="og:description"]', "content", meta.description, "property", "og:description");
      setMetaTag('meta[name="twitter:title"]', "content", meta.title, "name", "twitter:title");
      setMetaTag('meta[name="twitter:description"]', "content", meta.description, "name", "twitter:description");
    }
  }, [location.pathname]);

  return null;
};

export default CanonicalManager;
