import { Instagram, Facebook, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import brandLogo from "@/assets/worscoi-stylized-logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-20 lg:py-24">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col gap-10 lg:gap-12">
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <img
                src={brandLogo}
                alt="Worsco"
                width={24}
                height={24}
                className="h-6 w-6 object-contain brightness-0 invert"
              />
              <span className="text-sm font-normal tracking-wide">orsco</span>
            </div>
            <p className="text-background/70 text-xs font-light leading-relaxed max-w-xs">
              Livros, notícias globais, streaming e webtoons, com um espaço para acompanhar as últimas novidades sobre cultura, literatura e grandes ideias.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">Páginas</h4>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
              <li>
                <Link to="/" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/livros" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Livros
                </Link>
              </li>
              <li>
                <Link to="/webtoons" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Webtoons
                </Link>
              </li>
              <li>
                <Link to="/animes" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Animes
                </Link>
              </li>
              <li>
                <Link to="/cinema" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Cinema & Séries
                </Link>
              </li>
              <li>
                <Link to="/noticias" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Notícias
                </Link>
              </li>
              <li>
                <Link to="/biblioteca" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Minha estante
                </Link>
              </li>
              <li>
                <a href="/#booking" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Reservar livro
                </a>
              </li>
              <li>
                <Link to="/sobre" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Contato
                </Link>
              </li>
              <li>
                <Link to="/termos" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">Fale conosco</h4>
            <div className="flex flex-col gap-2 mb-8">
              <Link
                to="/contato"
                className="text-background/70 hover:text-background smooth-hover text-xs font-light flex items-center gap-2"
              >
                <Mail className="h-3 w-3" />
                Formulário de Contato
              </Link>
              <a
                href="mailto:ola@worscoi.com"
                className="text-background/70 hover:text-background smooth-hover text-xs font-light flex items-center gap-2"
              >
                <Mail className="h-3 w-3" />
                ola@worscoi.com
              </a>
              <p className="text-background/70 text-xs font-light">Seg - Sex: 9h - 18h</p>
            </div>

            <h4 className="text-sm font-medium mb-4">Siga-nos</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="text-background/70 hover:text-background smooth-hover" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="text-background/70 hover:text-background smooth-hover" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 mt-12 text-center text-background/50 text-xs font-light">
          <p>&copy; 2026 Worsco. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
