import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export type AppLanguage = "pt" | "en";

export interface GeoInfo {
  countryCode: string;
  countryName: string;
  isLusophone: boolean;
  language: AppLanguage;
  detectionSource: string;
  isManualOverride: boolean;
}

interface GeoLanguageContextValue {
  language: AppLanguage;
  geo: GeoInfo;
  isDetecting: boolean;
  isTranslating: boolean;
  setLanguageManual: (lang: AppLanguage, simulatedCountry?: string) => void;
  resetToAutoGeo: () => Promise<void>;
  t: (text: string) => string;
  translateAsync: (text: string, targetLang?: AppLanguage) => Promise<string>;
  translateBatchAsync: (texts: string[], targetLang?: AppLanguage) => Promise<string[]>;
}

export const LUSOPHONE_COUNTRY_CODES = new Set([
  "BR", // Brazil
  "PT", // Portugal
  "AO", // Angola
  "MZ", // Mozambique
  "CV", // Cape Verde
  "GW", // Guinea-Bissau
  "ST", // São Tomé and Príncipe
  "TL", // Timor-Leste
  "GQ", // Equatorial Guinea
  "MO", // Macau
]);

export const COUNTRY_DISPLAY_NAMES: Record<string, { en: string; pt: string; flag: string }> = {
  NO: { en: "Norway", pt: "Noruega", flag: "🇳🇴" },
  SE: { en: "Sweden", pt: "Suécia", flag: "🇸🇪" },
  DK: { en: "Denmark", pt: "Dinamarca", flag: "🇩🇰" },
  FI: { en: "Finland", pt: "Finlândia", flag: "🇫🇮" },
  IS: { en: "Iceland", pt: "Islândia", flag: "🇮🇸" },
  US: { en: "United States", pt: "Estados Unidos", flag: "🇺🇸" },
  GB: { en: "United Kingdom", pt: "Reino Unido", flag: "🇬🇧" },
  CA: { en: "Canada", pt: "Canadá", flag: "🇨🇦" },
  AU: { en: "Australia", pt: "Austrália", flag: "🇦🇺" },
  NZ: { en: "New Zealand", pt: "Nova Zelândia", flag: "🇳🇿" },
  IE: { en: "Ireland", pt: "Irlanda", flag: "🇮🇪" },
  DE: { en: "Germany", pt: "Alemanha", flag: "🇩🇪" },
  FR: { en: "France", pt: "França", flag: "🇫🇷" },
  ES: { en: "Spain", pt: "Espanha", flag: "🇪🇸" },
  IT: { en: "Italy", pt: "Itália", flag: "🇮🇹" },
  NL: { en: "Netherlands", pt: "Países Baixos", flag: "🇳🇱" },
  BE: { en: "Belgium", pt: "Bélgica", flag: "🇧🇪" },
  CH: { en: "Switzerland", pt: "Suíça", flag: "🇨🇭" },
  AT: { en: "Austria", pt: "Áustria", flag: "🇦🇹" },
  PL: { en: "Poland", pt: "Polônia", flag: "🇵🇱" },
  JP: { en: "Japan", pt: "Japão", flag: "🇯🇵" },
  KR: { en: "South Korea", pt: "Coreia do Sul", flag: "🇰🇷" },
  CN: { en: "China", pt: "China", flag: "🇨🇳" },
  IN: { en: "India", pt: "Índia", flag: "🇮🇳" },
  ZA: { en: "South Africa", pt: "África do Sul", flag: "🇿🇦" },
  MX: { en: "Mexico", pt: "México", flag: "🇲🇽" },
  AR: { en: "Argentina", pt: "Argentina", flag: "🇦🇷" },
  BR: { en: "Brazil", pt: "Brasil", flag: "🇧🇷" },
  PT: { en: "Portugal", pt: "Portugal", flag: "🇵🇹" },
  AO: { en: "Angola", pt: "Angola", flag: "🇦🇴" },
  MZ: { en: "Mozambique", pt: "Moçambique", flag: "🇲🇿" },
  CV: { en: "Cape Verde", pt: "Cabo Verde", flag: "🇨🇻" },
  GW: { en: "Guinea-Bissau", pt: "Guiné-Bissau", flag: "🇬🇼" },
  ST: { en: "São Tomé & Príncipe", pt: "São Tomé e Príncipe", flag: "🇸🇹" },
  TL: { en: "Timor-Leste", pt: "Timor-Leste", flag: "🇹🇱" },
};

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // Norway & Nordics
  "Europe/Oslo": "NO",
  "Arctic/Longyearbyen": "NO",
  "Europe/Stockholm": "SE",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Atlantic/Reykjavik": "IS",
  // Lusophone Timezones
  "America/Sao_Paulo": "BR",
  "America/Fortaleza": "BR",
  "America/Recife": "BR",
  "America/Bahia": "BR",
  "America/Belem": "BR",
  "America/Manaus": "BR",
  "America/Cuiaba": "BR",
  "America/Porto_Velho": "BR",
  "America/Boa_Vista": "BR",
  "America/Rio_Branco": "BR",
  "America/Noronha": "BR",
  "America/Maceio": "BR",
  "America/Araguaina": "BR",
  "America/Santarem": "BR",
  "America/Campo_Grande": "BR",
  "America/Eirunepe": "BR",
  "Europe/Lisbon": "PT",
  "Atlantic/Madeira": "PT",
  "Atlantic/Azores": "PT",
  "Africa/Luanda": "AO",
  "Africa/Maputo": "MZ",
  "Atlantic/Cape_Verde": "CV",
  "Africa/Bissau": "GW",
  "Africa/Sao_Tome": "ST",
  "Asia/Dili": "TL",
  "Asia/Macau": "MO",
  // Major International Timezones
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Zurich": "CH",
  "Europe/Vienna": "AT",
  "Europe/Warsaw": "PL",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Phoenix": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Singapore": "SG",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
};

const STORAGE_OVERRIDE_KEY = "wotho_user_lang_override_v1";
const STORAGE_GEO_CACHE_KEY = "wotho_detected_geo_v1";
const STORAGE_TRANSLATION_CACHE_KEY = "wotho_translation_cache_v3";

// Complete Instant Synchronous UI & System Dictionary (Portuguese -> English)
export const PT_TO_EN_DICTIONARY: Record<string, string> = {
  // Navigation & Global Header
  "Livros": "Books",
  "Webtoons": "Webtoons",
  "Animes": "Animes",
  "Cinema": "Cinema",
  "Cinema & Séries": "Cinema & Series",
  "Cinema & Séries Wotho": "Wotho Cinema & Series",
  "Notícias": "News",
  "Biblioteca": "Library",
  "Minha estante": "My Bookshelf",
  "Minha Estante": "My Bookshelf",
  "Para Você": "For You",
  "Meu Perfil": "My Profile",
  "Meu Perfil & Histórico": "My Profile & History",
  "Perfil": "Profile",
  "Buscar": "Search",
  "Pesquisar": "Search",
  "Entrar": "Sign In",
  "Sair": "Sign Out",
  "Criar Conta": "Create Account",
  "Modo Claro": "Light Mode",
  "Modo Escuro": "Dark Mode",
  "Alternar tema": "Toggle theme",
  "Abrir menu": "Open menu",
  "Fechar menu": "Close menu",
  "Início": "Home",
  "Explorar": "Explore",
  "Carregando…": "Loading…",
  "Carregando...": "Loading...",

  // Home Page (Index.tsx, FeaturedBooks.tsx, Booking.tsx, ContentSection.tsx)
  "Retome de onde parou": "Pick up where you left off",
  "Continuar Lendo": "Continue Reading",
  "Continuar Assistindo": "Continue Watching",
  "Recomendações Wotho": "Wotho Recommendations",
  "Seleções personalizadas de leitura digital e séries": "Personalized selections of digital reading and series",
  "Em alta": "Trending",
  "Em Alta": "Trending",
  "Destaques da Semana": "Weekly Highlights",
  "Os títulos mais acessados pelos leitores da Wotho": "The most accessed titles by Wotho readers",
  "Hoje": "Today",
  "Semana": "Week",
  "Mês": "Month",
  "Ano": "Year",
  "Coleções": "Collections",
  "Coleções Editoriais Wotho": "Wotho Editorial Collections",
  "Curadoria de obras literárias, didáticas e ensaios": "Curated literary, academic, and essay works",
  "Séries Ilustradas": "Illustrated Series",
  "Webtoons & Comics": "Webtoons & Comics",
  "Animações & Séries": "Animation & Series",
  "Animes da Temporada": "Seasonal Animes",
  "Acompanhe estreias semanais, trailers e episódios com dublagem e legendas em português.": "Follow weekly premieres, trailers, and episodes with multi-language audio and subtitles.",
  "Ver todos os animes": "View all animes",
  "Streaming & Entretenimento": "Streaming & Entertainment",
  "Grandes produções cinematográficas, clássicos premiados e séries aclamadas pela crítica.": "Major film productions, award-winning classics, and critically acclaimed series.",
  "Explorar Catálogo de Cinema": "Explore Cinema Catalog",
  "Pesquisa & Ciência": "Research & Science",
  "Artigos Científicos e Acadêmicos": "Scientific & Academic Articles",
  "Jornalismo Wotho": "Wotho Journalism",
  "Últimas notícias globais": "Latest Global News",
  "Cultura, ciência, tecnologia, literatura e grandes ideias em reportagens diretas": "Culture, science, technology, literature, and big ideas in direct reporting",
  "Ver todas as notícias": "View all news",
  "Biblioteca Digital Wotho": "Wotho Digital Library",
  "Livros em destaque": "Featured Books",
  "Títulos selecionados para ler direto no navegador, sem download": "Selected titles to read directly in your browser, no download required",
  "Explorar todo o catálogo": "Explore full catalog",
  "Ver todos": "View all",
  "Ver tudo": "View all",
  "Ver mais": "See more",
  "Ler notícia": "Read news",
  "Ler agora": "Read now",
  "Ler livro": "Read book",
  "Ler Livro": "Read Book",

  // Booking Component
  "Reservas": "Reservations",
  "Reserve seu livro": "Reserve your book",
  "Reservar livro": "Reserve book",
  "Escolha o título, confirme seus dados e libere a leitura online": "Choose the title, confirm your details, and unlock online reading",
  "Livro": "Book",
  "Selecione um livro": "Select a book",
  "Tipo de acesso": "Access type",
  "Selecione o acesso": "Select access",
  "Livro completo": "Full book",
  "Presente para alguém": "Gift for someone",
  "Clube de leitura": "Book club",
  "Continuar": "Continue",
  "Resumo": "Summary",
  "Selecione um livro para ver o resumo da reserva.": "Select a book to view the reservation summary.",
  "Nome completo": "Full name",
  "Telefone": "Phone",
  "E-mail": "Email",
  "Observação (opcional)": "Notes (optional)",
  "Como prefere pagar?": "How do you prefer to pay?",
  "Voltar": "Back",
  "Enviando...": "Submitting...",
  "Confirmar reserva": "Confirm reservation",
  "Reserva registrada": "Reservation registered",
  "Reserva registrada!": "Reservation registered!",
  "Assim que o pagamento for confirmado, o livro aparece liberado na sua estante.": "Once confirmed, the book will be unlocked in your bookshelf.",
  "Acesso": "Access",
  "Nome": "Name",
  "Valor": "Price",
  "Nova reserva": "New reservation",
  "Escolha um livro e o tipo de acesso": "Please choose a book and access type",
  "Preencha nome, telefone e e-mail": "Please fill in name, phone, and email",
  "Informe um e-mail válido": "Please enter a valid email",
  "Entre na sua conta para concluir a reserva": "Sign in to your account to complete the reservation",

  // News Page & News Article
  "Portal de Notícias Wotho": "Wotho News Portal",
  "Buscar notícias por título ou assunto...": "Search news by title or topic...",
  "Buscar notícias, temas ou fontes...": "Search news, topics or sources...",
  "Pesquisar notícias...": "Search news...",
  "Atualizar Notícias": "Refresh News",
  "Sincronizando...": "Syncing...",
  "Atualizar feeds de notícias agora": "Refresh news feeds now",
  "Ordenar": "Sort by",
  "Mais recentes": "Most recent",
  "Mais Recentes": "Most Recent",
  "Mais antigas": "Oldest first",
  "Mais Antigas": "Oldest First",
  "Arquivo Permanente Ativo:": "Permanent Archive Active:",
  "Histórico:": "Archive:",
  "Todos os anos": "All years",
  "Todos os meses": "All months",
  "Janeiro": "January",
  "Fevereiro": "February",
  "Março": "March",
  "Abril": "April",
  "Maio": "May",
  "Junho": "June",
  "Julho": "July",
  "Agosto": "August",
  "Setembro": "September",
  "Outubro": "October",
  "Novembro": "November",
  "Dezembro": "December",
  "Limpar filtros": "Clear filters",
  "Limpar": "Clear",
  "Nenhuma notícia encontrada": "No news articles found",
  "Nenhuma notícia encontrada para os filtros selecionados.": "No news found for the selected filters.",
  "Tente ajustar os filtros ou pesquisar por outro termo.": "Try adjusting your filters or searching for another term.",
  "Carregando mais notícias...": "Loading more news...",
  "Carregar mais notícias": "Load more news",
  "Você chegou ao fim do arquivo selecionado.": "You have reached the end of the selected archive.",
  "Caso tenha perdido": "In Case You Missed It",
  "Destaques Recentes": "Recent Highlights",
  "Ler matéria completa": "Read full article",
  "Ler artigo": "Read article",
  "Todas as Notícias": "All News",
  "Voltar para todas as notícias": "Back to all news",
  "Notícia não encontrada.": "News article not found.",
  "Continue Lendo": "Keep Reading",
  "Mais Notícias do Dia": "More News Today",
  "Editar Publicação": "Edit Publication",
  "Compartilhar:": "Share:",
  "Compartilhar": "Share",
  "Resumo Editorial": "Editorial Summary",
  "Reportagem Especial": "Special Report",
  "Por": "By",
  "Fonte:": "Source:",
  "Fonte Original": "Original Source",

  // News Categories
  "Todas": "All",
  "Todos": "All",
  "Tudo": "All",
  "Futebol": "Football",
  "Basquete": "Basketball",
  "Desporto": "Sports",
  "Esportes": "Sports",
  "Geopolítica": "Geopolitics",
  "Política": "Politics",
  "Anime & Mangá": "Anime & Manga",
  "Animes & Mangá": "Anime & Manga",
  "Tecnologia": "Technology",
  "Tecnologias": "Technology",
  "Moda": "Fashion",
  "Jogos": "Gaming",
  "Games": "Gaming",
  "Cultura": "Culture",
  "Economia": "Economy",
  "Mercado": "Market",
  "Ciência": "Science",
  "Entretenimento": "Entertainment",
  "Educação": "Education",
  "Literatura": "Literature",
  "Mundo": "World",
  "Geral": "General",
  "Destaques": "Featured",
  "Destaque": "Featured",
  "Últimas Notícias": "Latest News",
  "Mais Lidas": "Most Read",
  "Plantão": "Breaking News",
  "Tempo Real": "Live Updates",

  // Books, Webtoons, Animes, Cinema Pages
  "Catálogo": "Catalog",
  "Catálogo de Livros": "Book Catalog",
  "Biblioteca Digital": "Digital Library",
  "Ler Online": "Read Online",
  "Leitura Online": "Online Reading",
  "Baixar PDF": "Download PDF",
  "Download Grátis": "Free Download",
  "Grátis": "Free",
  "Gratuito": "Free",
  "Domínio Público": "Public Domain",
  "Obra Clássica": "Classic Work",
  "Autor Clássico": "Classic Author",
  "Capítulos": "Chapters",
  "Capítulo": "Chapter",
  "Sinopse": "Synopsis",
  "Descrição": "Description",
  "Detalhes": "Details",
  "Avaliação": "Rating",
  "Gêneros": "Genres",
  "Gênero": "Genre",
  "Lançamento": "Release",
  "Status": "Status",
  "Completo": "Completed",
  "Em Lançamento": "Ongoing",
  "Assistir Agora": "Watch Now",
  "Assistir": "Watch",
  "Episódios": "Episodes",
  "Episódio": "Episode",
  "Temporada": "Season",
  "Temporadas": "Seasons",
  "Filmes": "Movies",
  "Filme": "Movie",
  "Séries": "Series",
  "Série": "Series",
  "Dublado": "Dubbed",
  "Legendado": "Subtitled",
  "Áudio": "Audio",
  "Idioma": "Language",
  "Português": "Portuguese",
  "Inglês": "English",
  "Japonês": "Japanese",
  "Espanhol": "Spanish",
  "Francês": "French",
  "Servidor Unificado": "Unified Server",
  "Reprodução Automática": "Auto Play",
  "Próximo Episódio": "Next Episode",
  "Episódio Anterior": "Previous Episode",
  "Adicionar à Biblioteca": "Add to Library",
  "Salvo na Biblioteca": "Saved in Library",
  "Favoritos": "Favorites",
  "Histórico de Leitura": "Reading History",
  "Recomendações": "Recommendations",
  "Recomendado para você": "Recommended for you",
  "Desenvolvimento Pessoal": "Personal Development",
  "Finanças & Negócios": "Finance & Business",
  "Literatura Clássica": "Classic Literature",
  "Romance": "Romance",
  "Ficção Científica": "Science Fiction",
  "Fantasia": "Fantasy",
  "Filosofia": "Philosophy",
  "Filosofia e Estoicismo": "Philosophy & Stoicism",
  "Psicologia": "Psychology",
  "História": "History",
  "Biografia e Autobiografia": "Biography & Autobiography",
  "Poesia": "Poetry",
  "Dramático": "Drama",
  "Narrativa": "Narrative",
  "Didáticos e Técnicos": "Academic & Technical",
  "Religiosos/Espiritual": "Religion & Spirituality",
  "Estratégia": "Strategy",
  "Clássicos": "Classics",

  // Cookie Consent & Terms Gate
  "Este site usa cookies": "This website uses cookies",
  "Usamos cookies essenciais para o funcionamento da plataforma. Scripts de análise e marketing só são carregados depois do seu consentimento (LGPD/GDPR). Saiba mais na":
    "We use essential cookies to keep the platform running. Analytics and marketing scripts are only loaded after your consent (GDPR/LGPD). Learn more in our",
  "Necessários (sempre ativos)": "Strictly necessary (always active)",
  "Análise de uso": "Usage analytics",
  "Marketing": "Marketing",
  "Aceitar todos": "Accept all",
  "Apenas essenciais": "Essential only",
  "Guardar escolhas": "Save preferences",
  "Personalizar": "Customize",
  "Termos e privacidade": "Terms & Privacy",
  "Para continuar a usar a Wotho precisa de aceitar os nossos Termos de Uso e a Política de Privacidade. Este aceite fica registado com data e hora.":
    "To continue using Wotho, please accept our Terms of Use and Privacy Policy. Your acceptance is recorded with a timestamp.",
  "Li e aceito os": "I have read and accept the",
  "e a": "and the",
  "A guardar…": "Saving…",
  "Aceitar e continuar": "Accept and continue",

  // Footer & Institutional
  "Livros, notícias globais, streaming e webtoons, com um espaço para acompanhar as últimas novidades sobre cultura, literatura e grandes ideias.":
    "Books, global news, streaming, and webtoons, with a curated space to follow the latest in culture, literature, and big ideas.",
  "Páginas": "Pages",
  "Sobre": "About",
  "Sobre nós": "About Us",
  "Sobre Nós": "About Us",
  "Sobre a Wotho": "About Wotho",
  "Fale conosco": "Contact Us",
  "Formulário de Contato": "Contact Form",
  "Seg - Sex: 9h - 18h": "Mon - Fri: 9am - 6pm",
  "Mapa do Site": "Sitemap",
  "Contato": "Contact",
  "Termos": "Terms",
  "Termos de Uso": "Terms of Use",
  "Privacidade": "Privacy",
  "Política de Privacidade": "Privacy Policy",
  "© 2026 Wotho. Todos os direitos reservados.": "© 2026 Wotho. All rights reserved.",
  "Todos os direitos reservados.": "All rights reserved.",
  "Literatura & Jornalismo": "Literature & Journalism",
  "Navegação": "Navigation",
  "Institucional": "Institutional",
  "Legal": "Legal",
  "Salvar": "Save",
  "Cancelar": "Cancel",
  "Fechar": "Close",
  "Confirmar": "Confirm",
};

// Reverse Dictionary (English -> Portuguese) for restoring or translating English labels into Portuguese
export const EN_TO_PT_DICTIONARY: Record<string, string> = Object.fromEntries(
  Object.entries(PT_TO_EN_DICTIONARY).map(([pt, en]) => [en, pt])
);

const LOWER_PT_TO_EN: Map<string, string> = new Map(
  Object.entries(PT_TO_EN_DICTIONARY).map(([k, v]) => [k.trim().toLowerCase(), v])
);

const LOWER_EN_TO_PT: Map<string, string> = new Map(
  Object.entries(PT_TO_EN_DICTIONARY).map(([pt, en]) => [en.trim().toLowerCase(), pt])
);

// Persistent Memory + LocalStorage Translation Cache (keyed by `${targetLang}:${trimmedText}`)
const memoryTranslationCache = new Map<string, string>();

function loadTranslationCacheFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_TRANSLATION_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string") {
          memoryTranslationCache.set(k, v);
        }
      }
    }
  } catch {
    // ignore storage errors
  }
}

let saveCacheTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSaveTranslationCache() {
  if (typeof window === "undefined") return;
  if (saveCacheTimer) clearTimeout(saveCacheTimer);
  saveCacheTimer = setTimeout(() => {
    try {
      const entries = Array.from(memoryTranslationCache.entries()).slice(-3000);
      const obj: Record<string, string> = {};
      for (const [k, v] of entries) obj[k] = v;
      localStorage.setItem(STORAGE_TRANSLATION_CACHE_KEY, JSON.stringify(obj));
    } catch {
      // ignore quota errors
    }
  }, 1000);
}

loadTranslationCacheFromStorage();

export function isLusophoneCountry(countryCode: string): boolean {
  if (!countryCode) return false;
  return LUSOPHONE_COUNTRY_CODES.has(countryCode.trim().toUpperCase());
}

/**
 * Heuristic check to detect whether a text is likely written in Portuguese vs English
 */
function looksLikePortuguese(text: string): boolean {
  if (/[ãõçáéíóúâêôà]/i.test(text)) return true;
  if (/\b(não|para|com|uma|pelos|pelas|sobre|após|durante|também|estão|foram|será|mais|muito|todos|todas|notícias|capítulo|edição|leitura|materias|matérias)\b/i.test(text)) {
    return true;
  }
  return false;
}

function looksLikeEnglish(text: string): boolean {
  if (/[ãõç]/i.test(text)) return false;
  if (/\b(the|and|with|from|that|this|have|will|after|about|their|would|could|should|into|over|between|against|during|without|within|through|new|news|world|report|first|year|years)\b/i.test(text)) {
    return true;
  }
  return false;
}

/**
 * Translates UI strings and common date/time/count patterns synchronously in 0ms
 */
export function translateTextSync(text: string, lang: AppLanguage = "en"): string {
  if (!text) return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  const cacheKey = `${lang}:${trimmed}`;

  if (lang === "pt") {
    if (EN_TO_PT_DICTIONARY[trimmed]) {
      return text.replace(trimmed, EN_TO_PT_DICTIONARY[trimmed]);
    }
    const lowerPt = LOWER_EN_TO_PT.get(trimmed.toLowerCase());
    if (lowerPt && trimmed.length < 40) {
      return text.replace(trimmed, lowerPt);
    }
    const cachedPt = memoryTranslationCache.get(cacheKey);
    if (cachedPt) {
      return text.replace(trimmed, cachedPt);
    }
    let outPt = trimmed;
    outPt = outPt.replace(/(\d+)\s*min\s+read\b/gi, "$1 min de leitura");
    return outPt !== trimmed ? text.replace(trimmed, outPt) : text;
  }

  // Target language is 'en':
  // 1. Direct dictionary match
  if (PT_TO_EN_DICTIONARY[trimmed]) {
    return text.replace(trimmed, PT_TO_EN_DICTIONARY[trimmed]);
  }
  const lowerMatch = LOWER_PT_TO_EN.get(trimmed.toLowerCase());
  if (lowerMatch) {
    return text.replace(trimmed, lowerMatch);
  }

  // 2. Strip leading symbols like "✦ Futebol"
  if (trimmed.startsWith("✦ ")) {
    const rest = trimmed.slice(2).trim();
    const restTrans = PT_TO_EN_DICTIONARY[rest] || LOWER_PT_TO_EN.get(rest.toLowerCase());
    if (restTrans) {
      return text.replace(trimmed, `✦ ${restTrans}`);
    }
  }

  // 3. Cached neural translation
  const cached = memoryTranslationCache.get(cacheKey) || memoryTranslationCache.get(trimmed);
  if (cached) {
    return text.replace(trimmed, cached);
  }

  // 4. Pattern-based instant translations (relative time, reading time, dates, archive banner, counts)
  let out = trimmed;

  // Archive banner in News.tsx: "1124 matérias preservadas no histórico imutável (sem expiração ou links quebrados)"
  out = out.replace(
    /(\d+)\s*mat[ée]rias?\s+preservadas?\s+no\s+hist[óo]rico\s+imut[áa]vel\s*\(sem\s+expira[çc][ãa]o\s+ou\s+links?\s+quebrados?\)/gi,
    "$1 articles preserved in the immutable archive (never expires, zero broken links)"
  );

  // "X min de leitura" -> "X min read"
  out = out.replace(/(\d+)\s*min(?:utos?)?\s+de\s+leitura/gi, "$1 min read");
  // "há X min" / "há Xh" / "há X dias"
  out = out.replace(/^há\s+(\d+)\s*min(?:utos?)?$/i, "$1m ago");
  out = out.replace(/^há\s+(\d+)\s*h(?:oras?)?$/i, "$1h ago");
  out = out.replace(/^há\s+(\d+)\s*d(?:ias?)?$/i, "$1d ago");
  out = out.replace(/^agora(?:\s+mesmo)?$/i, "Just now");
  out = out.replace(/^ontem$/i, "Yesterday");
  out = out.replace(/^hoje$/i, "Today");

  // Portuguese formatted dates: "14 de novembro de 2026" or "14 de nov. de 2026"
  const ptMonths: Record<string, string> = {
    janeiro: "January",
    "jan.": "Jan",
    jan: "Jan",
    fevereiro: "February",
    "fev.": "Feb",
    fev: "Feb",
    março: "March",
    marco: "March",
    "mar.": "Mar",
    mar: "Mar",
    abril: "April",
    "abr.": "Apr",
    abr: "Apr",
    maio: "May",
    "mai.": "May",
    mai: "May",
    junho: "June",
    "jun.": "Jun",
    jun: "Jun",
    julho: "July",
    "jul.": "Jul",
    jul: "Jul",
    agosto: "August",
    "ago.": "Aug",
    ago: "Aug",
    setembro: "September",
    "set.": "Sep",
    set: "Sep",
    outubro: "October",
    "out.": "Oct",
    out: "Oct",
    novembro: "November",
    "nov.": "Nov",
    nov: "Nov",
    dezembro: "December",
    "dez.": "Dec",
    dez: "Dec",
  };

  out = out.replace(
    /\b(\d{1,2})\s+de\s+([a-zç.]+)(?:\s+de\s+(\d{4}))?/gi,
    (full, day, monthRaw, year) => {
      const m = ptMonths[String(monthRaw).toLowerCase()];
      if (!m) return full;
      return year ? `${m} ${day}, ${year}` : `${m} ${day}`;
    }
  );

  // "Capítulo X" / "Parte X" / "Episódio X" / "Temporada X"
  out = out.replace(/\bCap[íi]tulo\s+(\d+|[IVXLCDM]+)\b/gi, "Chapter $1");
  out = out.replace(/\bEpis[óo]dio\s+(\d+)\b/gi, "Episode $1");
  out = out.replace(/\bTemporada\s+(\d+)\b/gi, "Season $1");
  out = out.replace(/\bParte\s+(\d+|[IVXLCDM]+)\b/gi, "Part $1");

  return out !== trimmed ? text.replace(trimmed, out) : text;
}

const SEARCH_CRAWLER_UA_REGEX =
  /googlebot|google-inspectiontool|storebot-google|adsbot-google|apis-google|mediapartners-google|googleother|bingbot|bingpreview|msnbot|adidxbot|duckduckbot|baiduspider|yandexbot|slurp|applebot|facebookexternalhit|twitterbot|linkedinbot|oai-searchbot|chatgpt-user|gptbot|claudebot|perplexitybot|lighthouse|chrome-lighthouse|pagespeed|gtmetrix|ptst|headlesschrome/i;

export function isSearchEngineCrawler(): boolean {
  if (typeof navigator === "undefined") return false;
  try {
    const ua = navigator.userAgent || "";
    if (SEARCH_CRAWLER_UA_REGEX.test(ua)) return true;
  } catch {
    // ignore
  }
  return false;
}

/**
 * Translates a single string synchronously via dictionary fallback without hitting external translate.googleapis.com from the browser
 */
async function translateSingleClientFallback(text: string, targetLang: AppLanguage): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const sync = translateTextSync(text, targetLang);
  if (sync && sync !== text) {
    memoryTranslationCache.set(`${targetLang}:${trimmed}`, sync.trim());
    scheduleSaveTranslationCache();
    return sync;
  }
  return text;
}

/**
 * Translates an array of strings to targetLang ('en' or 'pt') using /api/translate with per-item fallback
 */
export async function translateBatchToLanguage(
  texts: string[],
  targetLang: AppLanguage = "en"
): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  const results: string[] = new Array(texts.length);
  const toFetchIndices: number[] = [];
  const toFetchTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const raw = texts[i] || "";
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length <= 1 || /^[\d\s.,:/\-+%$€£@#&*()[\]{}|\\<>!?~`"'+=•✦]+$/.test(trimmed)) {
      results[i] = raw;
      continue;
    }

    const syncAttempt = translateTextSync(raw, targetLang);
    const cacheKey = `${targetLang}:${trimmed}`;

    if (targetLang === "en") {
      if (
        PT_TO_EN_DICTIONARY[trimmed] ||
        LOWER_PT_TO_EN.has(trimmed.toLowerCase()) ||
        memoryTranslationCache.has(cacheKey) ||
        memoryTranslationCache.has(trimmed)
      ) {
        results[i] = syncAttempt;
        continue;
      }
      if (syncAttempt !== raw && trimmed.length < 35) {
        results[i] = syncAttempt;
        continue;
      }
    } else {
      // targetLang === 'pt'
      if (
        EN_TO_PT_DICTIONARY[trimmed] ||
        LOWER_EN_TO_PT.has(trimmed.toLowerCase()) ||
        memoryTranslationCache.has(cacheKey)
      ) {
        results[i] = syncAttempt;
        continue;
      }
      // If text is already Portuguese, no need to call translation API
      if (looksLikePortuguese(trimmed) && !looksLikeEnglish(trimmed)) {
        results[i] = raw;
        continue;
      }
    }

    toFetchIndices.push(i);
    toFetchTexts.push(trimmed);
  }

  if (toFetchTexts.length === 0) {
    return results;
  }

  // Deduplicate identical strings
  const uniqueTexts = Array.from(new Set(toFetchTexts));
  const translatedUniqueMap = new Map<string, string>();

  // Send in chunks of 30 strings to /api/translate so requests resolve rapidly
  const CHUNK_SIZE = 30;
  const chunks: string[][] = [];
  for (let c = 0; c < uniqueTexts.length; c += CHUNK_SIZE) {
    chunks.push(uniqueTexts.slice(c, c + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map(async (chunkStrings) => {
      try {
        const resp = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texts: chunkStrings,
            targetLang,
            sourceLang: "auto",
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data?.translations) && data.translations.length === chunkStrings.length) {
            for (let u = 0; u < chunkStrings.length; u++) {
              const orig = chunkStrings[u];
              const trans = String(data.translations[u] || orig).trim();
              translatedUniqueMap.set(orig, trans);
              memoryTranslationCache.set(`${targetLang}:${orig}`, trans);
            }
            scheduleSaveTranslationCache();
            return;
          }
        }
      } catch {
        // Fallback below
      }

      // Direct client fallback if /api/translate failed
      await Promise.all(
        chunkStrings.map(async (orig) => {
          const trans = await translateSingleClientFallback(orig, targetLang);
          translatedUniqueMap.set(orig, trans);
        })
      );
    })
  );

  for (let j = 0; j < toFetchIndices.length; j++) {
    const idx = toFetchIndices[j];
    const origTrimmed = toFetchTexts[j];
    const trans = translatedUniqueMap.get(origTrimmed) || translateTextSync(origTrimmed, targetLang);
    results[idx] = texts[idx].replace(origTrimmed, trans);
  }

  return results;
}

export async function translateBatchToEnglish(texts: string[]): Promise<string[]> {
  return translateBatchToLanguage(texts, "en");
}

/**
 * Synchronous initial country & language detection (Timezone + URL params + saved preference)
 */
function getInitialGeoState(): GeoInfo {
  if (typeof window === "undefined") {
    return {
      countryCode: "US",
      countryName: "International",
      isLusophone: false,
      language: "en",
      detectionSource: "ssr_default",
      isManualOverride: false,
    };
  }

  // 1. Check URL query parameter (?lang=en, ?lang=pt, ?country=NO, ?country=BR)
  try {
    const params = new URLSearchParams(window.location.search);
    const countryParam = (params.get("country") || "").trim().toUpperCase();
    const langParam = (params.get("lang") || "").trim().toLowerCase();

    if (countryParam && /^[A-Z]{2}$/.test(countryParam)) {
      const lusophone = isLusophoneCountry(countryParam);
      const lang: AppLanguage =
        langParam === "en" || langParam === "pt" ? (langParam as AppLanguage) : lusophone ? "pt" : "en";
      const info: GeoInfo = {
        countryCode: countryParam,
        countryName: COUNTRY_DISPLAY_NAMES[countryParam]?.en || countryParam,
        isLusophone: lusophone,
        language: lang,
        detectionSource: "url_query",
        isManualOverride: true,
      };
      localStorage.setItem(STORAGE_OVERRIDE_KEY, JSON.stringify(info));
      return info;
    }

    if (langParam === "en" || langParam === "pt") {
      const code = langParam === "en" ? "NO" : "BR";
      const info: GeoInfo = {
        countryCode: code,
        countryName: COUNTRY_DISPLAY_NAMES[code]?.en || code,
        isLusophone: langParam === "pt",
        language: langParam as AppLanguage,
        detectionSource: "url_query",
        isManualOverride: true,
      };
      localStorage.setItem(STORAGE_OVERRIDE_KEY, JSON.stringify(info));
      return info;
    }
  } catch {
    // ignore URL parse error
  }

  // 2. Always preserve canonical Portuguese (pt-BR) for Search Engine Crawlers (Googlebot, Bingbot, InspectionTool)
  // even when they crawl from US data centers (America/Los_Angeles / en-US).
  if (isSearchEngineCrawler()) {
    return {
      countryCode: "BR",
      countryName: "Brasil",
      isLusophone: true,
      language: "pt",
      detectionSource: "seo_crawler_canonical_pt",
      isManualOverride: false,
    };
  }

  // 3. Check manual user override in localStorage
  try {
    const rawOverride = localStorage.getItem(STORAGE_OVERRIDE_KEY);
    if (rawOverride) {
      const parsed = JSON.parse(rawOverride);
      if (parsed && (parsed.language === "en" || parsed.language === "pt")) {
        return {
          ...parsed,
          isManualOverride: true,
        };
      }
    }
  } catch {
    // ignore
  }

  // 3. Synchronous Timezone & Browser Locale Heuristic
  try {
    const navLang = (navigator.language || "").toLowerCase();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const tzCountry = TIMEZONE_TO_COUNTRY[tz];

    // Explicit Norwegian timezone or locale -> English
    if (tz === "Europe/Oslo" || navLang.startsWith("nb") || navLang.startsWith("nn") || navLang.endsWith("-no")) {
      return {
        countryCode: "NO",
        countryName: "Norway",
        isLusophone: false,
        language: "en",
        detectionSource: `timezone_or_locale (${tz || navLang})`,
        isManualOverride: false,
      };
    }

    // If browser locale is Portuguese or timezone is a Lusophone country -> Portuguese (0 translation overhead)
    if (navLang.startsWith("pt") || (tzCountry && isLusophoneCountry(tzCountry))) {
      const code =
        tzCountry && isLusophoneCountry(tzCountry)
          ? tzCountry
          : navLang.includes("pt-pt")
          ? "PT"
          : navLang.includes("pt-ao")
          ? "AO"
          : navLang.includes("pt-mz")
          ? "MZ"
          : "BR";
      return {
        countryCode: code,
        countryName: COUNTRY_DISPLAY_NAMES[code]?.en || code,
        isLusophone: true,
        language: "pt",
        detectionSource: "lusophone_locale_or_tz",
        isManualOverride: false,
      };
    }

    // Check cached automatic geolocation from current session only for non-Lusophone locales
    const rawCached = sessionStorage.getItem(STORAGE_GEO_CACHE_KEY);
    if (rawCached) {
      const parsed = JSON.parse(rawCached);
      if (
        parsed &&
        parsed.countryCode &&
        parsed.detectionSource !== "geojs_ip" &&
        (parsed.language === "en" || parsed.language === "pt")
      ) {
        return {
          ...parsed,
          isManualOverride: false,
        };
      }
    }

    if (tzCountry) {
      const lusophone = isLusophoneCountry(tzCountry);
      return {
        countryCode: tzCountry,
        countryName: COUNTRY_DISPLAY_NAMES[tzCountry]?.en || tzCountry,
        isLusophone: lusophone,
        language: lusophone ? "pt" : "en",
        detectionSource: `timezone (${tz})`,
        isManualOverride: false,
      };
    }

    if (
      tz.startsWith("Europe/") ||
      tz.startsWith("Australia/") ||
      tz.startsWith("Pacific/") ||
      tz.startsWith("Asia/")
    ) {
      const code = tz.includes("Oslo") ? "NO" : "US";
      return {
        countryCode: code,
        countryName: COUNTRY_DISPLAY_NAMES[code]?.en || "International",
        isLusophone: false,
        language: "en",
        detectionSource: `timezone_region (${tz})`,
        isManualOverride: false,
      };
    }
  } catch {
    // ignore
  }

  return {
    countryCode: "BR",
    countryName: "Brasil",
    isLusophone: true,
    language: "pt",
    detectionSource: "default_lusophone",
    isManualOverride: false,
  };
}

const GeoLanguageContext = createContext<GeoLanguageContextValue>({
  language: "pt",
  geo: {
    countryCode: "BR",
    countryName: "Brasil",
    isLusophone: true,
    language: "pt",
    detectionSource: "default",
    isManualOverride: false,
  },
  isDetecting: false,
  isTranslating: false,
  setLanguageManual: () => {},
  resetToAutoGeo: async () => {},
  t: (text) => text,
  translateAsync: async (text) => text,
  translateBatchAsync: async (texts) => texts,
});

// Extend Text and Element nodes to remember original strings and translated strings per language
interface TranslatableTextNode extends Text {
  __wothoOrigText?: string;
  __wothoTranslatedEn?: string;
  __wothoTranslatedPt?: string;
}

interface TranslatableElement extends HTMLElement {
  __wothoOrigPlaceholder?: string;
  __wothoOrigTitle?: string;
  __wothoOrigAriaLabel?: string;
}

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "SVG",
  "PATH",
  "IFRAME",
  "VIDEO",
  "AUDIO",
  "CANVAS",
  "TEXTAREA",
]);

export const GeoLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [geo, setGeo] = useState<GeoInfo>(() => getInitialGeoState());
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isTranslating] = useState<boolean>(false);

  const syncLanguageSideEffects = useCallback((lang: AppLanguage) => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
      document.documentElement.setAttribute("data-wotho-lang", lang);
    }
    try {
      localStorage.setItem("worscoi_cinema_language", lang);
    } catch {
      // ignore
    }
  }, []);

  const detectIpGeolocation = useCallback(
    async (forceResetOverride = false) => {
      if (typeof window === "undefined") return;
      if (isSearchEngineCrawler()) return;

      if (!forceResetOverride) {
        try {
          if (localStorage.getItem(STORAGE_OVERRIDE_KEY)) {
            return;
          }
        } catch {}
      }

      // Fast path for Lusophone users: if browser language is Portuguese or timezone is Lusophone,
      // do not let proxy/server IP lookups override their native Portuguese experience.
      try {
        const navLang = (navigator.language || "").toLowerCase();
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        const tzCountry = TIMEZONE_TO_COUNTRY[tz];
        if (
          (navLang.startsWith("pt") || (tzCountry && isLusophoneCountry(tzCountry))) &&
          tz !== "Europe/Oslo" &&
          !navLang.endsWith("-no")
        ) {
          return;
        }
      } catch {}

      setIsDetecting(true);
      try {
        const resp = await fetch("/api/geo", {
          headers: { Accept: "application/json" },
        });

        let detectedCode = "";
        let detectedName = "";
        let source = "api_geo";

        if (resp.ok) {
          const data = await resp.json();
          if (
            data &&
            typeof data.countryCode === "string" &&
            data.countryCode.length === 2 &&
            data.detectionSource !== "default_international" &&
            data.detectionSource !== "default_lusophone" &&
            data.detectionSource !== "accept_language"
          ) {
            detectedCode = data.countryCode.toUpperCase();
            detectedName = data.countryName || "";
            source = data.detectionSource || "api_geo";
          }
        }

        if (detectedCode) {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
          if (tz === "Europe/Oslo" && isLusophoneCountry(detectedCode) === false) {
            detectedCode = "NO";
            detectedName = "Norway";
          }

          const lusophone = isLusophoneCountry(detectedCode);
          const nextLang: AppLanguage = lusophone ? "pt" : "en";
          const nextGeo: GeoInfo = {
            countryCode: detectedCode,
            countryName: COUNTRY_DISPLAY_NAMES[detectedCode]?.en || detectedName || detectedCode,
            isLusophone: lusophone,
            language: nextLang,
            detectionSource: source,
            isManualOverride: false,
          };

          setGeo(nextGeo);
          syncLanguageSideEffects(nextLang);
          try {
            sessionStorage.setItem(STORAGE_GEO_CACHE_KEY, JSON.stringify(nextGeo));
          } catch {}
        }
      } catch {
        // Keep initial timezone/locale geo state
      } finally {
        setIsDetecting(false);
      }
    },
    [syncLanguageSideEffects]
  );

  useEffect(() => {
    syncLanguageSideEffects(geo.language);
    void detectIpGeolocation(false);
  }, [detectIpGeolocation, syncLanguageSideEffects]);

  const setLanguageManual = useCallback(
    (lang: AppLanguage, simulatedCountry?: string) => {
      const code = simulatedCountry
        ? simulatedCountry.toUpperCase()
        : lang === "en"
        ? isLusophoneCountry(geo.countryCode)
          ? "NO"
          : geo.countryCode || "NO"
        : isLusophoneCountry(geo.countryCode)
        ? geo.countryCode
        : "BR";

      const lusophone = isLusophoneCountry(code);
      const nextGeo: GeoInfo = {
        countryCode: code,
        countryName: COUNTRY_DISPLAY_NAMES[code]?.en || code,
        isLusophone: lusophone,
        language: lang,
        detectionSource: "manual_selection",
        isManualOverride: true,
      };

      setGeo(nextGeo);
      syncLanguageSideEffects(lang);
      try {
        localStorage.setItem(STORAGE_OVERRIDE_KEY, JSON.stringify(nextGeo));
      } catch {}
    },
    [geo.countryCode, syncLanguageSideEffects]
  );

  const resetToAutoGeo = useCallback(async () => {
    try {
      localStorage.removeItem(STORAGE_OVERRIDE_KEY);
      sessionStorage.removeItem(STORAGE_GEO_CACHE_KEY);
    } catch {}
    const initial = getInitialGeoState();
    setGeo({ ...initial, isManualOverride: false });
    syncLanguageSideEffects(initial.language);
    await detectIpGeolocation(true);
  }, [detectIpGeolocation, syncLanguageSideEffects]);

  const hasTranslatedDomRef = React.useRef(false);

  // Automatic Whole-DOM Real-Time Adaptation Engine for the User's Active Language ('en' or 'pt')
  useEffect(() => {
    if (typeof document === "undefined") return;

    const activeLang = geo.language;

    // Fast path: when language is default Portuguese ('pt') and DOM was never mutated into 'en',
    // skip full-DOM TreeWalker and MutationObserver completely (0% background CPU overhead).
    if (activeLang === "pt") {
      if (hasTranslatedDomRef.current) {
        hasTranslatedDomRef.current = false;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n = walker.nextNode() as TranslatableTextNode | null;
        while (n) {
          if (n.__wothoOrigText !== undefined && n.nodeValue !== n.__wothoOrigText) {
            n.nodeValue = n.__wothoOrigText;
          }
          n = walker.nextNode() as TranslatableTextNode | null;
        }
        const attrEls = document.body.querySelectorAll<TranslatableElement>("[placeholder], [title], [aria-label]");
        attrEls.forEach((el) => {
          if (el.__wothoOrigPlaceholder) el.setAttribute("placeholder", el.__wothoOrigPlaceholder);
          if (el.__wothoOrigTitle) el.setAttribute("title", el.__wothoOrigTitle);
          if (el.__wothoOrigAriaLabel) el.setAttribute("aria-label", el.__wothoOrigAriaLabel);
        });
      }
      return;
    }

    hasTranslatedDomRef.current = true;
    let isCancelled = false;
    const pendingNodes = new Map<TranslatableTextNode, string>();
    let batchTimer: ReturnType<typeof setTimeout> | null = null;
    let mutationTimer: ReturnType<typeof setTimeout> | null = null;
    const queuedRoots = new Set<Node>();

    const flushPendingTranslations = async () => {
      if (isCancelled || pendingNodes.size === 0) return;
      const entries = Array.from(pendingNodes.entries());
      pendingNodes.clear();

      try {
        const MICRO_BATCH = 24;
        for (let b = 0; b < entries.length; b += MICRO_BATCH) {
          if (isCancelled) break;
          const slice = entries.slice(b, b + MICRO_BATCH);
          const rawStrings = slice.map(([, str]) => str);
          const translatedStrings = await translateBatchToLanguage(rawStrings, activeLang);
          if (isCancelled) break;

          for (let i = 0; i < slice.length; i++) {
            const [textNode, origStr] = slice[i];
            const transStr = translatedStrings[i];
            if (transStr && transStr !== origStr && textNode.isConnected) {
              textNode.__wothoTranslatedEn = transStr;
              textNode.nodeValue = transStr;
            }
          }
        }
      } catch {
        // ignore
      }
    };

    const scheduleFlush = () => {
      if (batchTimer) clearTimeout(batchTimer);
      batchTimer = setTimeout(() => {
        void flushPendingTranslations();
      }, 60);
    };

    const processTextNode = (textNode: TranslatableTextNode) => {
      const currentVal = textNode.nodeValue || "";
      if (textNode.__wothoTranslatedEn && currentVal === textNode.__wothoTranslatedEn) {
        return;
      }

      const parent = textNode.parentElement;
      if (!parent) return;
      if (SKIP_TAGS.has(parent.tagName)) return;
      if (parent.closest("[data-no-translate='true']")) return;

      const trimmed = currentVal.trim();
      if (!trimmed || trimmed.length <= 1) return;
      if (/^[\d\s.,:/\-+%$€£@#&*()[\]{}|\\<>!?~`"'+=•✦]+$/.test(trimmed)) return;

      if (
        textNode.__wothoOrigText === undefined ||
        (currentVal !== textNode.__wothoOrigText &&
          currentVal !== textNode.__wothoTranslatedEn &&
          currentVal !== textNode.__wothoTranslatedPt)
      ) {
        textNode.__wothoOrigText = currentVal;
        textNode.__wothoTranslatedEn = undefined;
        textNode.__wothoTranslatedPt = undefined;
      }

      const sourceText = textNode.__wothoOrigText;
      const sourceTrimmed = sourceText.trim();
      if (!sourceTrimmed) return;

      if (textNode.__wothoTranslatedEn) {
        if (textNode.nodeValue !== textNode.__wothoTranslatedEn) {
          textNode.nodeValue = textNode.__wothoTranslatedEn;
        }
        return;
      }

      // 1. Check synchronous dictionary or cache first (0ms latency)
      const syncResult = translateTextSync(sourceText, "en");
      if (syncResult !== sourceText) {
        textNode.__wothoTranslatedEn = syncResult;
        if (textNode.nodeValue !== syncResult) {
          textNode.nodeValue = syncResult;
        }
        if (
          PT_TO_EN_DICTIONARY[sourceTrimmed] ||
          LOWER_PT_TO_EN.has(sourceTrimmed.toLowerCase()) ||
          memoryTranslationCache.has(`en:${sourceTrimmed}`) ||
          memoryTranslationCache.has(sourceTrimmed)
        ) {
          return;
        }
      }

      // 2. Queue for neural translation if it contains words
      if (/[a-zA-ZáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]{2,}/.test(sourceTrimmed)) {
        pendingNodes.set(textNode, sourceText);
        scheduleFlush();
      }
    };

    const processElementAttributes = (el: TranslatableElement) => {
      if (el.closest && el.closest("[data-no-translate='true']")) return;

      const placeholder = el.getAttribute("placeholder");
      if (placeholder && placeholder.trim()) {
        if (!el.__wothoOrigPlaceholder) el.__wothoOrigPlaceholder = placeholder;
        const syncEn = translateTextSync(el.__wothoOrigPlaceholder, "en");
        if (syncEn !== el.__wothoOrigPlaceholder) {
          el.setAttribute("placeholder", syncEn);
        }
      }

      const titleAttr = el.getAttribute("title");
      if (titleAttr && titleAttr.trim()) {
        if (!el.__wothoOrigTitle) el.__wothoOrigTitle = titleAttr;
        const syncTitle = translateTextSync(el.__wothoOrigTitle, activeLang);
        if (syncTitle !== titleAttr) el.setAttribute("title", syncTitle);
      }

      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.trim()) {
        if (!el.__wothoOrigAriaLabel) el.__wothoOrigAriaLabel = ariaLabel;
        const syncAria = translateTextSync(el.__wothoOrigAriaLabel, activeLang);
        if (syncAria !== ariaLabel) el.setAttribute("aria-label", syncAria);
      }
    };

    const scanSubtree = (root: Node) => {
      if (!root || !root.isConnected) return;
      if (root.nodeType === Node.TEXT_NODE) {
        processTextNode(root as TranslatableTextNode);
        return;
      }
      if (root.nodeType === Node.ELEMENT_NODE) {
        processElementAttributes(root as TranslatableElement);
      }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n = walker.nextNode() as TranslatableTextNode | null;
      while (n) {
        processTextNode(n);
        n = walker.nextNode() as TranslatableTextNode | null;
      }
      if (root instanceof HTMLElement || root instanceof Document) {
        const attrEls = root.querySelectorAll<TranslatableElement>("[placeholder], [title], [aria-label]");
        attrEls.forEach(processElementAttributes);
      }
    };

    // Initial full-page scan when in English mode
    scanSubtree(document.body);

    // Debounced MutationObserver for new route/component mounts in English mode
    const observer = new MutationObserver((mutations) => {
      if (isCancelled) return;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((added) => {
            queuedRoots.add(added);
          });
        }
      }
      if (queuedRoots.size > 0 && !mutationTimer) {
        mutationTimer = setTimeout(() => {
          mutationTimer = null;
          if (isCancelled) return;
          const roots = Array.from(queuedRoots);
          queuedRoots.clear();
          for (const r of roots) {
            scanSubtree(r);
          }
        }, 120);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      isCancelled = true;
      if (batchTimer) clearTimeout(batchTimer);
      if (mutationTimer) clearTimeout(mutationTimer);
      observer.disconnect();
    };
  }, [geo.language]);

  const t = useCallback(
    (text: string) => {
      return translateTextSync(text, geo.language);
    },
    [geo.language]
  );

  const translateAsync = useCallback(
    async (text: string, targetLang?: AppLanguage) => {
      const lang = targetLang || geo.language;
      if (!text) return text;
      const [res] = await translateBatchToLanguage([text], lang);
      return res || text;
    },
    [geo.language]
  );

  const translateBatchAsync = useCallback(
    async (texts: string[], targetLang?: AppLanguage) => {
      const lang = targetLang || geo.language;
      if (!texts.length) return texts;
      return translateBatchToLanguage(texts, lang);
    },
    [geo.language]
  );

  const value = useMemo<GeoLanguageContextValue>(
    () => ({
      language: geo.language,
      geo,
      isDetecting,
      isTranslating,
      setLanguageManual,
      resetToAutoGeo,
      t,
      translateAsync,
      translateBatchAsync,
    }),
    [geo, isDetecting, isTranslating, setLanguageManual, resetToAutoGeo, t, translateAsync, translateBatchAsync]
  );

  return <GeoLanguageContext.Provider value={value}>{children}</GeoLanguageContext.Provider>;
};

export const useGeoLanguage = () => useContext(GeoLanguageContext);

/**
 * Reactive Hook that automatically translates an array of News/Content items
 * to the user's active language ('en' or 'pt') at the React state level
 */
export function useTranslatedNewsItems<
  T extends { id?: string; slug?: string; title?: string; excerpt?: string | null; category?: string | null }
>(items: T[]): T[] {
  const { language, translateBatchAsync, t } = useGeoLanguage();
  const [translatedMap, setTranslatedMap] = useState<Record<string, { title: string; excerpt: string }>>({});
  const requestedKeysRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (language === "pt" || !items || items.length === 0) return;

    let cancelled = false;
    const toTranslate: { key: string; title: string; excerpt: string }[] = [];

    for (const item of items) {
      const itemId = item.id || item.slug || item.title || "";
      if (!itemId) continue;
      const key = `${language}:${itemId}`;
      if (requestedKeysRef.current.has(key)) continue;
      const rawTitle = (item.title || "").trim();
      const rawExcerpt = (item.excerpt || "").trim();
      if (!rawTitle) continue;
      requestedKeysRef.current.add(key);
      toTranslate.push({ key, title: rawTitle, excerpt: rawExcerpt });
    }

    if (toTranslate.length === 0) return;

    const batchPayload: string[] = [];
    for (const entry of toTranslate) {
      batchPayload.push(entry.title);
      batchPayload.push(entry.excerpt);
    }

    translateBatchAsync(batchPayload, language)
      .then((res) => {
        if (cancelled || !res || res.length !== batchPayload.length) return;
        const updates: Record<string, { title: string; excerpt: string }> = {};
        for (let i = 0; i < toTranslate.length; i++) {
          const entry = toTranslate[i];
          updates[entry.key] = {
            title: res[i * 2] || entry.title,
            excerpt: res[i * 2 + 1] || entry.excerpt,
          };
        }
        setTranslatedMap((prev) => ({ ...prev, ...updates }));
      })
      .catch(() => {
        for (const entry of toTranslate) {
          requestedKeysRef.current.delete(entry.key);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [items, language, translateBatchAsync]);

  return useMemo(() => {
    if (!items || items.length === 0 || language === "pt") return items;
    return items.map((item) => {
      const key = `${language}:${item.id || item.slug || item.title || ""}`;
      const trans = translatedMap[key];
      const translatedCategory = item.category ? t(item.category) : item.category;
      if (!trans) {
        return {
          ...item,
          title: item.title ? t(item.title) : item.title,
          excerpt: item.excerpt ? t(item.excerpt) : item.excerpt,
          category: translatedCategory,
        };
      }
      return {
        ...item,
        title: trans.title || item.title,
        excerpt: trans.excerpt || item.excerpt,
        category: translatedCategory,
      };
    });
  }, [items, language, translatedMap, t]);
}
