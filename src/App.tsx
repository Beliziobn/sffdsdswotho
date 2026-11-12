import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import CookieConsent from "./components/consent/CookieConsent";
import TermsGate from "./components/consent/TermsGate";
import CanonicalManager from "./components/CanonicalManager";

const Books = lazy(() => import("./pages/Books"));
const BookDetail = lazy(() => import("./pages/BookDetail"));
const Reader = lazy(() => import("./pages/Reader"));
const News = lazy(() => import("./pages/News"));
const NewsArticle = lazy(() => import("./pages/NewsArticle"));
const Library = lazy(() => import("./pages/Library"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const ContentDetail = lazy(() => import("./pages/ContentDetail"));
const ContentReader = lazy(() => import("./pages/ContentReader"));
const WebtoonDetail = lazy(() => import("./pages/WebtoonDetail"));
const Webtoons = lazy(() => import("./pages/Webtoons"));
const WebtoonReader = lazy(() => import("./pages/WebtoonReader"));
const Animes = lazy(() => import("./pages/Animes"));
const AnimeDetail = lazy(() => import("./pages/AnimeDetail"));
const AnimeMangaReader = lazy(() => import("./pages/AnimeMangaReader"));
const Cinema = lazy(() => import("./pages/Cinema"));
const CinemaDetail = lazy(() => import("./pages/CinemaDetail"));
const ForYou = lazy(() => import("./pages/ForYou"));
const ContinueReading = lazy(() => import("./pages/ContinueReading"));
const Search = lazy(() => import("./pages/Search"));
const PurchaseSuccess = lazy(() => import("./pages/PurchaseSuccess"));
const PurchaseCancelled = lazy(() => import("./pages/PurchaseCancelled"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const SiteMapPage = lazy(() => import("./pages/SiteMapPage"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Profile = lazy(() => import("./pages/Profile"));

const SpeedInsights = () => null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SpeedInsights />
      <BrowserRouter>
        <ScrollToTop />
        <CanonicalManager />
        <CookieConsent />
        <TermsGate />
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/livros" element={<Books />} />
            <Route path="/livros/:id" element={<BookDetail />} />
            <Route path="/ler/:id" element={<Reader />} />
            <Route path="/noticias" element={<News />} />
            <Route path="/noticias/:slug" element={<NewsArticle />} />
            <Route path="/biblioteca" element={<Library />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/meu-perfil" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/conteudo/:id" element={<ContentDetail />} />
            <Route path="/leitura/:id" element={<ContentReader />} />
            <Route path="/webtoons" element={<Webtoons />} />
            <Route path="/webtoon/:id" element={<WebtoonDetail />} />
            <Route path="/webtoon/:id/ep/:episodeId" element={<WebtoonReader />} />
            <Route path="/webtoon/:id/ler/:episodeId" element={<WebtoonReader />} />
            <Route path="/webtoon/:id/ler" element={<WebtoonReader />} />
            <Route path="/animes" element={<Animes />} />
            <Route path="/animes/:id" element={<AnimeDetail />} />
            <Route path="/animes/:id/manga" element={<AnimeMangaReader />} />
            <Route path="/animes/:id/manga/:chapterId" element={<AnimeMangaReader />} />
            <Route path="/cinema" element={<Cinema />} />
            <Route path="/cinema/:id" element={<CinemaDetail />} />
            <Route path="/para-voce" element={<ForYou />} />
            <Route path="/continuar-lendo" element={<ContinueReading />} />
            <Route path="/buscar" element={<Search />} />
            <Route path="/compra/sucesso" element={<PurchaseSuccess />} />
            <Route path="/compra/cancelada" element={<PurchaseCancelled />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/mapa-do-site" element={<SiteMapPage />} />
            <Route path="/sitemap" element={<SiteMapPage />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/contacto" element={<Contact />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
