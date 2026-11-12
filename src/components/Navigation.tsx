import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User as UserIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import brandLogo from "@/assets/worscoi-stylized-logo.png";

interface NavigationProps {
  variant?: "default" | "dark";
}

const Navigation = ({ variant = "default" }: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDark = variant === "dark";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  const handleProfileAction = () => {
    navigate("/perfil");
  };

  const navItems = [
    { label: "Livros", href: "/livros" },
    { label: "Webtoons", href: "/webtoons" },
    { label: "Animes", href: "/animes" },
    { label: "Cinema", href: "/cinema" },
    { label: "Notícias", href: "/noticias" },
  ];

  const lightText = isMobileMenuOpen || isDark || !isScrolled;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-400 ${
        isMobileMenuOpen
          ? "bg-foreground"
          : isDark
            ? isScrolled
              ? "bg-foreground/95 backdrop-blur-lg shadow-soft"
              : "bg-foreground"
            : isScrolled
              ? "bg-card/95 backdrop-blur-lg shadow-soft"
              : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-12 py-5">
        <div className="flex items-center justify-between gap-8">
          <Link to="/" className="whitespace-nowrap shrink-0">
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-1.5 cursor-pointer">
              <img
                src={brandLogo}
                alt="Wotho"
                width={32}
                height={32}
                className={`h-7 w-7 sm:h-8 sm:w-8 object-contain transition-all duration-300 ${
                  lightText ? "brightness-0 invert" : ""
                }`}
              />
              <span className={`text-sm sm:text-base font-normal tracking-wide ${lightText ? "text-white" : "text-foreground"}`}>
                otho
              </span>
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`text-[11px] uppercase tracking-wider font-normal smooth-hover hover:opacity-70 whitespace-nowrap shrink-0 ${
                    isDark || !isScrolled ? "text-white" : "text-foreground"
                  } ${isActive ? "underline underline-offset-4" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-full smooth-hover text-[11px] uppercase tracking-wider font-normal backdrop-blur-md border border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] px-5 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isDark || !isScrolled
                  ? "bg-white/10 text-white hover:bg-primary/80 hover:text-white hover:border-primary/80"
                  : "bg-white/20 text-foreground hover:bg-primary/80 hover:text-white hover:border-primary/80"
              }`}
              onClick={handleProfileAction}
            >
              <UserIcon className="h-3.5 w-3.5" />
              Meu Perfil
            </Button>
          </div>

          <button
            className={`md:hidden ${lightText ? "text-white" : "text-foreground"}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
              exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`md:hidden mt-6 pb-4 -mx-6 px-6 rounded-b-xl ${isDark || !isScrolled ? "bg-foreground" : "bg-card"}`}
            >
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`block py-3 text-[11px] uppercase tracking-wider font-normal smooth-hover hover:opacity-60 ${
                    isDark || !isScrolled ? "text-white" : "text-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Button
                variant="outline"
                className={`w-full mt-4 rounded-full text-[11px] uppercase tracking-wider font-normal backdrop-blur-md border border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] px-5 flex items-center justify-center gap-1.5 ${
                  isDark || !isScrolled
                    ? "bg-white/10 text-white hover:bg-primary/80 hover:text-white hover:border-primary/80"
                    : "bg-white/20 text-foreground hover:bg-primary/80 hover:text-white hover:border-primary/80"
                }`}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleProfileAction();
                }}
              >
                <UserIcon className="h-3.5 w-3.5" />
                Meu Perfil
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navigation;
