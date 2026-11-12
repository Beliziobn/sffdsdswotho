import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import Reader from "./pages/Reader";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import Library from "./pages/Library";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import ContentDetail from "./pages/ContentDetail";
import ContentReader from "./pages/ContentReader";
import WebtoonDetail from "./pages/WebtoonDetail";
import Webtoons from "./pages/Webtoons";
import WebtoonReader from "./pages/WebtoonReader";
import Animes from "./pages/Animes";
import AnimeDetail from "./pages/AnimeDetail";
import AnimeMangaReader from "./pages/AnimeMangaReader";
import Cinema from "./pages/Cinema";
import CinemaDetail from "./pages/CinemaDetail";
import ForYou from "./pages/ForYou";
import ContinueReading from "./pages/ContinueReading";
import Search from "./pages/Search";
import PurchaseSuccess from "./pages/PurchaseSuccess";
import PurchaseCancelled from "./pages/PurchaseCancelled";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import SiteMapPage from "./pages/SiteMapPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import CookieConsent from "./components/consent/CookieConsent";
import TermsGate from "./components/consent/TermsGate";
import CanonicalManager from "./components/CanonicalManager";

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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
