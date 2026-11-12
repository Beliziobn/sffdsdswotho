import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "404 — Página não encontrada | Wotho";
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.remove();
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, nofollow");
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-5 pt-28 pb-20">
        <div className="text-center max-w-lg">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Erro 404
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-light tracking-tight">
            Página não encontrada
          </h1>
          <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
            O endereço <span className="font-mono text-foreground">{location.pathname}</span> não existe ou foi movido na plataforma Wotho.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              Voltar à página inicial
            </Link>
            <Link
              to="/livros"
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 text-xs hover:bg-accent transition-colors"
            >
              Livros
            </Link>
            <Link
              to="/noticias"
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 text-xs hover:bg-accent transition-colors"
            >
              Notícias
            </Link>
            <Link
              to="/cinema"
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 text-xs hover:bg-accent transition-colors"
            >
              Streaming
            </Link>
            <Link
              to="/webtoons"
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 text-xs hover:bg-accent transition-colors"
            >
              Webtoons
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
