import { Link } from "react-router-dom";
import {
  BookOpen,
  Compass,
  FileCode,
  Film,
  Layers,
  Newspaper,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ANIMES_DATA } from "@/lib/animes";
import { BASE_CURATED_WEBTOONS } from "@/lib/webtoons";
import { CINEMA_CATALOG } from "@/lib/cinema";
import { NEWS_CATEGORIES } from "@/lib/news";

const MAIN_PAGES = [
  { path: "/", title: "Página Inicial", desc: "Apresentação geral, livros em destaque e últimas notícias." },
  { path: "/livros", title: "Catálogo de Livros Digitais", desc: "Bestsellers modernos, didáticos para o ENEM e artigos científicos." },
  { path: "/webtoons", title: "Webtoons & Comics", desc: "Séries ilustradas em formato scroll com alta resolução." },
  { path: "/animes", title: "Portal de Animes", desc: "Fichas completas, episódios, trailers e leitura de mangás vinculados." },
  { path: "/cinema", title: "Cinema & Séries", desc: "Catálogo de filmes e séries com player imersivo, temporadas e alta definição." },
  { path: "/noticias", title: "Portal de Notícias", desc: "Cobertura diária de cultura, futebol, mercado, tecnologia e entretenimento." },
  { path: "/biblioteca", title: "Minha Estante", desc: "Acesse seus livros salvos, títulos adquiridos e histórico de leitura." },
  { path: "/para-voce", title: "Recomendações Personalizadas", desc: "Sugestões de leitura baseadas nos seus interesses." },
  { path: "/continuar-lendo", title: "Continuar Leitura", desc: "Retome suas leituras exatamente de onde parou." },
  { path: "/buscar", title: "Busca Global", desc: "Pesquise por títulos, autores, gêneros ou notícias." },
  { path: "/sobre", title: "Sobre a Wotho", desc: "Manifesto, valores, proposta editorial e pilares da plataforma." },
  { path: "/contato", title: "Contato e Atendimento", desc: "Canais diretos, formulário para dúvidas e sugestões, e FAQ." },
  { path: "/termos", title: "Termos de Uso", desc: "Condições gerais de navegação e utilização da plataforma." },
  { path: "/privacidade", title: "Política de Privacidade", desc: "Diretrizes de proteção de dados e privacidade dos usuários." },
];

const CANONICAL_BOOKS = [
  { id: "mod-habitos-atomicos", title: "Hábitos Atômicos", author: "James Clear" },
  { id: "mod-psicologia-financeira", title: "A Psicologia Financeira", author: "Morgan Housel" },
  { id: "mod-pai-rico-pai-pobre", title: "Pai Rico, Pai Pobre", author: "Robert T. Kiyosaki" },
  { id: "mod-1984-orwell", title: "1984", author: "George Orwell" },
  { id: "mod-homem-mais-rico-babilonia", title: "O Homem Mais Rico da Babilônia", author: "George S. Clason" },
  { id: "mod-antifragil", title: "Antifrágil", author: "Nassim Nicholas Taleb" },
  { id: "mod-comece-pelo-porque", title: "Comece Pelo Porquê", author: "Simon Sinek" },
  { id: "mod-em-busca-de-sentido", title: "Em Busca de Sentido", author: "Viktor Frankl" },
  { id: "mod-essencialismo", title: "Essencialismo", author: "Greg McKeown" },
  { id: "mod-as-48-leis-do-poder", title: "As 48 Leis do Poder", author: "Robert Greene" },
  { id: "mod-manual-de-epicteto", title: "Manual de Epicteto", author: "Epicteto" },
  { id: "mod-meditacoes-marco-aurelio", title: "Meditações", author: "Marco Aurélio" },
  { id: "mod-os-segredos-da-mente-milionaria", title: "Os Segredos da Mente Milionária", author: "T. Harv Eker" },
  { id: "mod-mindset", title: "Mindset: A Nova Psicologia do Sucesso", author: "Carol S. Dweck" },
  { id: "mod-pedagogia-da-autonomia", title: "Pedagogia da Autonomia", author: "Paulo Freire" },
  { id: "mod-o-poder-do-habito", title: "O Poder do Hábito", author: "Charles Duhigg" },
  { id: "mod-rapido-e-devagar", title: "Rápido e Devagar", author: "Daniel Kahneman" },
  { id: "mod-roube-como-um-artista", title: "Roube Como um Artista", author: "Austin Kleon" },
  { id: "mod-sobre-a-brevidade-da-vida", title: "Sobre a Brevidade da Vida", author: "Sêneca" },
];

const CURRICULAR_AND_SCIENTIFIC = [
  { id: "cur-matematica-enem", title: "Matemática e Suas Tecnologias (ENEM)" },
  { id: "cur-fisica-enem", title: "Física Geral e Teórica (ENEM)" },
  { id: "cur-quimica-enem", title: "Química Orgânica e Inorgânica (ENEM)" },
  { id: "cur-biologia-enem", title: "Biologia Celular e Genética (ENEM)" },
  { id: "cur-historia-enem", title: "História Geral e do Brasil (ENEM)" },
  { id: "cur-redacao-enem", title: "Redação Dissertativa-Argumentativa (ENEM)" },
  { id: "sci-astrofisica-jwst", title: "Astrofísica: Observações do James Webb Space Telescope" },
  { id: "sci-quantica-computacao", title: "Computação Quântica e Supressão de Ruídos" },
  { id: "sci-crispr-cas9", title: "Engenharia Genética com CRISPR-Cas9" },
  { id: "sci-neurociencia-plasticidade", title: "Neurociência e Plasticidade Sináptica" },
];

const SiteMapPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-6 lg:px-12 py-12 lg:py-20 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary text-xs uppercase tracking-wider font-medium">
              <Compass className="h-4 w-4" />
              Índice Canônico da Plataforma
            </div>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
              Mapa do Site (Sitemap)
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl font-light">
              Navegue por todas as páginas canônicas, catálogos de livros digitais, webtoons, animes e acervo jornalístico estruturado da Wotho.
            </p>
          </div>

          <Button asChild variant="outline" size="sm" className="rounded-full text-xs self-start md:self-auto gap-2">
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
              <FileCode className="h-3.5 w-3.5 text-primary" />
              Acessar sitemap.xml Oficial
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </Button>
        </div>

        {/* Section 1: Páginas Principais */}
        <section className="mb-14">
          <h2 className="text-xl font-normal text-foreground mb-5 flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Páginas Principais e Institucionais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MAIN_PAGES.map((page) => (
              <Card key={page.path} className="p-4 hover:border-primary/50 transition-colors bg-card/60">
                <Link to={page.path} className="block group">
                  <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                    {page.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2 font-light">
                    {page.desc}
                  </div>
                  <span className="text-[10px] text-primary/80 mt-2 block font-mono">
                    {page.path}
                  </span>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 2: Livros Digitais Canônicos */}
        <section className="mb-14">
          <h2 className="text-xl font-normal text-foreground mb-5 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Obras e Bestsellers Modernos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CANONICAL_BOOKS.map((book) => (
              <Link
                key={book.id}
                to={`/livros/${book.id}`}
                className="p-3.5 rounded-lg border border-border bg-card/40 hover:bg-card hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{book.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{book.author}</div>
                </div>
                <span className="text-[10px] text-muted-foreground/70 font-mono mt-2">
                  /livros/{book.id}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 3: Material Curricular & Artigos Científicos */}
        <section className="mb-14">
          <h2 className="text-xl font-normal text-foreground mb-5 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Material Didático & Artigos Científicos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CURRICULAR_AND_SCIENTIFIC.map((item) => (
              <Link
                key={item.id}
                to={`/livros/${item.id}`}
                className="p-3.5 rounded-lg border border-border bg-card/40 hover:bg-card hover:border-primary/50 transition-all"
              >
                <div className="text-sm font-medium text-foreground">{item.title}</div>
                <span className="text-[10px] text-muted-foreground/70 font-mono mt-1 block">
                  /livros/{item.id}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 4: Webtoons & Quadrinhos */}
        <section className="mb-14">
          <h2 className="text-xl font-normal text-foreground mb-5 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Webtoons e Séries Ilustradas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {BASE_CURATED_WEBTOONS.map((wt) => (
              <Link
                key={wt.id}
                to={`/webtoon/${wt.id}`}
                className="p-3 rounded-lg border border-border bg-card/40 hover:bg-card hover:border-primary/50 transition-all text-xs font-medium text-foreground truncate"
                title={wt.title}
              >
                {wt.title}
              </Link>
            ))}
          </div>
        </section>

        {/* Section 5: Animes da Temporada */}
        <section className="mb-14">
          <h2 className="text-xl font-normal text-foreground mb-5 flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            Animes e Mangás Vinculados
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ANIMES_DATA.map((anime) => (
              <Link
                key={anime.id}
                to={`/animes/${anime.id}`}
                className="p-3 rounded-lg border border-border bg-card/40 hover:bg-card hover:border-primary/50 transition-all text-xs font-medium text-foreground truncate"
                title={anime.title}
              >
                {anime.title}
              </Link>
            ))}
          </div>
        </section>

        {/* Section 5.1: Cinema & Séries */}
        <section className="mb-14">
          <h2 className="text-xl font-normal text-foreground mb-5 flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            Cinema & Séries
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CINEMA_CATALOG.map((item) => (
              <Link
                key={item.id}
                to={`/cinema/${item.id}`}
                className="p-3 rounded-lg border border-border bg-card/40 hover:bg-card hover:border-primary/50 transition-all text-xs font-medium text-foreground truncate flex items-center justify-between"
                title={item.title}
              >
                <span className="truncate">{item.title}</span>
                <span className="text-[10px] text-muted-foreground ml-2 uppercase font-mono">
                  {item.type === "filme" ? "Filme" : "Série"}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 6: Editorias de Notícias */}
        <section className="mb-14">
          <h2 className="text-xl font-normal text-foreground mb-5 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            Editorias do Portal de Notícias
          </h2>
          <div className="flex flex-wrap gap-2">
            {NEWS_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/noticias?categoria=${encodeURIComponent(cat.toLowerCase())}`}
                className="px-3.5 py-1.5 rounded-full border border-border bg-card hover:border-primary/50 text-xs text-foreground font-light transition-all"
              >
                {cat}
              </Link>
            ))}
          </div>
        </section>

        {/* Footer info box */}
        <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground leading-relaxed">
          <div className="flex items-center gap-2 font-medium text-foreground mb-1">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Padrão de Indexação e Protocolo Sitemaps
          </div>
          <p>
            Todas as URLs deste índice correspondem a rotas canônicas verificadas, com metadados sincronizados, links diretos e suporte a leitura instantânea no navegador. Os arquivos XML canônicos são gerados em conformidade com as diretrizes do Google Search Console.
          </p>
          <div className="flex flex-wrap gap-4 mt-3 text-[11px] font-mono">
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">/sitemap.xml</a>
            <a href="/sitemap-index.xml" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">/sitemap-index.xml</a>
            <a href="/news-sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">/news-sitemap.xml</a>
            <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">/rss.xml</a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SiteMapPage;
