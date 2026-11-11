import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Tv,
  Newspaper,
  BookOpen,
  Sparkles,
  Layers,
  ShieldCheck,
  Compass,
  ArrowRight,
  Mail,
  Zap,
  Globe,
  Film,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import brandLogo from "@/assets/worscoi-stylized-logo.png";

const PILLARS = [
  {
    icon: Tv,
    title: "Streaming de Animes & Cultura Visual",
    description:
      "Catálogo cuidadosamente selecionado de grandes séries de anime com fichas completas, episódios, trailers oficiais em alta definição e leitor de mangás integrado para você mergulhar na história completa.",
    href: "/animes",
    actionLabel: "Explorar Animes",
    accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Newspaper,
    title: "Portal de Notícias Globais",
    description:
      "Cobertura editorial diária e independente cobrindo cultura pop, literatura, tecnologia, futebol, cinema, negócios e os principais acontecimentos mundiais com matérias completas e curadoria atenta.",
    href: "/noticias",
    actionLabel: "Ler Notícias",
    accent: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  {
    icon: Layers,
    title: "Webtoons em Scroll Vertical",
    description:
      "Histórias em quadrinhos e webtoons com leitura contínua e fluida de cima a baixo, otimizada para smartphones e computadores, com artes em alta resolução e narrativa cativante.",
    href: "/webtoons",
    actionLabel: "Ler Webtoons",
    accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: BookOpen,
    title: "Biblioteca Digital no Navegador",
    description:
      "Acesso instantâneo a bestsellers contemporâneos de desenvolvimento pessoal, clássicos universais em texto integral, material didático completo para o ENEM e artigos científicos de fronteira.",
    href: "/livros",
    actionLabel: "Ver Catálogo",
    accent: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
];

const VALUES = [
  {
    title: "Zero Atrito",
    desc: "Leia livros, assista animes e acompanhe reportagens diretamente no seu navegador, sem necessidade de downloads pesados ou cadastros burocráticos.",
  },
  {
    title: "Alta Performance",
    desc: "Plataforma construída para carregar em frações de segundo, com navegação responsiva e suporte total a temas escuros confortáveis aos olhos.",
  },
  {
    title: "Curadoria Responsável",
    desc: "Conteúdos editoriais estruturados, reportagens com fontes verificadas e acervo literário com edições integrais e fidedignas.",
  },
  {
    title: "Acessibilidade Universal",
    desc: "Design pensado para leitores e espectadores em qualquer dispositivo: smartphones, tablets ou desktops, com controle de tipografia e modo leitura.",
  },
];

export const About = () => {
  useEffect(() => {
    document.title = "Sobre a Wotho — Plataforma de Streaming, Notícias e Leitura";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Livros, notícias globais, streaming e webtoons, com um espaço para acompanhar as últimas novidades sobre cultura, literatura e grandes ideias."
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation variant="dark" />

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-background border-b border-border/40">
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs uppercase tracking-wider font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Manifesto & Identidade Wotho
            </div>

            <div className="flex items-center justify-center gap-2.5 my-2">
              <img
                src={brandLogo}
                alt="Wotho"
                width={40}
                height={40}
                className="h-10 w-10 object-contain brightness-0 invert"
              />
              <span className="text-3xl sm:text-4xl font-normal tracking-tight text-white">
                otho
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
              O ponto de encontro entre <span className="text-emerald-400 font-normal">leitura</span>,{" "}
              <span className="text-sky-400 font-normal">streaming</span> e{" "}
              <span className="text-amber-400 font-normal">notícias globais</span>.
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 font-light leading-relaxed max-w-2xl mx-auto">
              A <strong>Wotho</strong> nasceu com o propósito de conectar mentes curiosas ao melhor da cultura mundial. 
              Unimos em um só ambiente o streaming de animes, quadrinhos verticais (webtoons), cinema e séries, jornalismo atualizado 
              e um acervo robusto de livros digitais para ler online no navegador.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4 flex-wrap">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-7 text-xs uppercase tracking-wider">
                <Link to="/noticias">
                  Ver Notícias
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-7 text-xs uppercase tracking-wider border-zinc-700 text-zinc-200 hover:bg-zinc-800">
                <Link to="/animes">Explorar Streaming</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Pillars */}
      <section className="py-20 md:py-28 container mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center mb-16 space-y-3">
          <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-medium">
            Nossa Proposta
          </span>
          <h2 className="text-2xl sm:text-4xl font-light tracking-tight text-foreground">
            Os Quatro Pilares da Wotho
          </h2>
          <p className="text-sm text-muted-foreground font-light">
            Desenvolvida para oferecer entretenimento, conhecimento e informação crítica com estética refinada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card
                key={pillar.title}
                className="p-8 border border-border/80 bg-card/60 hover:border-primary/50 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${pillar.accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-border/60">
                  <Button asChild variant="ghost" size="sm" className="px-0 text-xs font-normal text-foreground group-hover:text-primary gap-1.5">
                    <Link to={pillar.href}>
                      {pillar.actionLabel}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-secondary/20 border-y border-border/50">
        <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
          <div className="max-w-2xl mb-12 space-y-2">
            <span className="text-[11px] uppercase tracking-widest text-primary font-medium">
              Princípios
            </span>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">
              Por que a Wotho é diferente
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {VALUES.map((val, idx) => (
              <div key={val.title} className="space-y-2 border-l-2 border-emerald-500/50 pl-5">
                <span className="text-[11px] font-mono text-muted-foreground/70">0{idx + 1}</span>
                <h4 className="text-base font-medium text-foreground">{val.title}</h4>
                <p className="text-xs text-muted-foreground font-light leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ready to Connect Call to Action */}
      <section className="py-20 container mx-auto px-6 lg:px-12 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-2xl sm:text-3xl font-light text-foreground tracking-tight">
            Quer falar com a equipe ou sugerir conteúdos?
          </h3>
          <p className="text-sm text-muted-foreground font-light">
            Estamos sempre abertos a sugestões de obras, feedback sobre a plataforma e propostas de parcerias editoriais.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button asChild className="rounded-full px-6 text-xs uppercase tracking-wider">
              <Link to="/contato">
                <Mail className="mr-2 h-3.5 w-3.5" />
                Fale Conosco
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6 text-xs uppercase tracking-wider">
              <Link to="/mapa-do-site">Mapa do Site</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Schema.org AboutPage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "Sobre a Wotho",
            description:
              "Livros, notícias globais, streaming e webtoons, com um espaço para acompanhar as últimas novidades sobre cultura, literatura e grandes ideias.",
            url: "https://wotho.vercel.app/sobre",
            mainEntity: {
              "@type": "Organization",
              name: "Wotho",
              url: "https://wotho.vercel.app/",
              logo: "https://wotho.vercel.app/favicon-512x512.png",
            },
          }),
        }}
      />

      <Footer />
    </div>
  );
};

export default About;
