import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User as UserIcon, Globe, Check, RotateCcw } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import brandLogo from "@/assets/worscoi-stylized-logo.png";
import { useGeoLanguage, COUNTRY_DISPLAY_NAMES } from "@/lib/geoLanguage";

interface NavigationProps {
  variant?: "default" | "dark";
}

const Navigation = ({ variant = "default" }: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGeoMenuOpen, setIsGeoMenuOpen] = useState(false);
  const geoMenuRef = useRef<HTMLDivElement | null>(null);
  const isDark = variant === "dark";
  const { language, geo, isTranslating, setLanguageManual, resetToAutoGeo, t } = useGeoLanguage();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (geoMenuRef.current && !geoMenuRef.current.contains(e.target as Node)) {
        setIsGeoMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  const handleProfileAction = () => {
    navigate("/perfil");
  };

  const navItems = [
    { label: t("Livros"), href: "/livros" },
    { label: t("Webtoons"), href: "/webtoons" },
    { label: t("Animes"), href: "/animes" },
    { label: t("Cinema"), href: "/cinema" },
    { label: t("Notícias"), href: "/noticias" },
  ];

  const lightText = isMobileMenuOpen || isDark || !isScrolled;
  const countryMeta = COUNTRY_DISPLAY_NAMES[geo.countryCode] || {
    en: geo.countryName || geo.countryCode,
    pt: geo.countryName || geo.countryCode,
    flag: geo.isLusophone ? "🇧🇷" : "🌍",
  };

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
        <div className="flex items-center justify-between gap-6">
          <Link to="/" className="whitespace-nowrap shrink-0" data-no-translate="true">
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

          <div className="hidden md:flex items-center gap-8" data-no-translate="true">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
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

          <div className="hidden md:flex items-center gap-2.5 shrink-0" data-no-translate="true">
            {/* Geolocation & Language Switcher */}
            <div className="relative" ref={geoMenuRef}>
              <button
                type="button"
                onClick={() => setIsGeoMenuOpen((prev) => !prev)}
                className={`h-8 px-3 rounded-full text-[11px] uppercase tracking-wider font-medium backdrop-blur-md border border-white/25 transition-all flex items-center gap-1.5 ${
                  isDark || !isScrolled
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-accent/70 text-foreground hover:bg-accent"
                }`}
                title={
                  language === "en"
                    ? `Region: ${countryMeta.en} (${geo.countryCode}) • Language: English`
                    : `Região: ${countryMeta.pt} (${geo.countryCode}) • Idioma: Português`
                }
              >
                <Globe className={`h-3.5 w-3.5 ${isTranslating ? "animate-spin text-emerald-400" : ""}`} />
                <span>{countryMeta.flag}</span>
                <span>{language.toUpperCase()}</span>
              </button>

              <AnimatePresence>
                {isGeoMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card text-card-foreground shadow-xl p-2 z-50"
                  >
                    <div className="px-3 py-2 border-b border-border/60 mb-1">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        {language === "en" ? "Geolocation & Language" : "Geolocalização & Idioma"}
                      </p>
                      <p className="text-xs text-foreground mt-0.5 font-medium flex items-center gap-1.5">
                        <span>{countryMeta.flag}</span>
                        <span>
                          {language === "en" ? countryMeta.en : countryMeta.pt} ({geo.countryCode})
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                        {geo.isLusophone
                          ? language === "en"
                            ? "Lusophone region (English override)"
                            : "País lusófono detectado → Português"
                          : language === "en"
                          ? "Non-Lusophone country → Auto English"
                          : "Região internacional (Português manual)"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setLanguageManual("en", geo.isLusophone ? "NO" : geo.countryCode);
                        setIsGeoMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                        language === "en"
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🌍</span>
                        <span>English (International / NO)</span>
                      </span>
                      {language === "en" && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLanguageManual("pt", geo.isLusophone ? geo.countryCode : "BR");
                        setIsGeoMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors mt-0.5 ${
                        language === "pt"
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🇧🇷</span>
                        <span>Português (CPLP / Lusofonia)</span>
                      </span>
                      {language === "pt" && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLanguageManual("en", "NO");
                        setIsGeoMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mt-0.5"
                    >
                      <span className="flex items-center gap-2">
                        <span>🇳🇴</span>
                        <span>
                          {language === "en" ? "Simulate Norway (Oslo -> EN)" : "Simular Noruega (Oslo -> EN)"}
                        </span>
                      </span>
                      {geo.countryCode === "NO" && language === "en" && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-semibold">
                          NO
                        </span>
                      )}
                    </button>

                    {geo.isManualOverride && (
                      <button
                        type="button"
                        onClick={() => {
                          void resetToAutoGeo();
                          setIsGeoMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 mt-1 pt-2 border-t border-border/60 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>
                          {language === "en" ? "Restore automatic geolocation" : "Restaurar geolocalização automática"}
                        </span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
              {t("Meu Perfil")}
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden" data-no-translate="true">
            <button
              type="button"
              onClick={() =>
                setLanguageManual(
                  language === "en" ? "pt" : "en",
                  language === "en" ? "BR" : "NO"
                )
              }
              className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium border border-white/25 flex items-center gap-1 ${
                lightText ? "text-white bg-white/10" : "text-foreground bg-accent/70"
              }`}
            >
              <span>{countryMeta.flag}</span>
              <span>{language.toUpperCase()}</span>
            </button>

            <button
              className={`${lightText ? "text-white" : "text-foreground"}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
              exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`md:hidden mt-6 pb-4 -mx-6 px-6 rounded-b-xl ${isDark || !isScrolled ? "bg-foreground" : "bg-card"}`}
              data-no-translate="true"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`block py-3 text-[11px] uppercase tracking-wider font-normal smooth-hover hover:opacity-60 ${
                    isDark || !isScrolled ? "text-white" : "text-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/15">
                <button
                  type="button"
                  onClick={() => {
                    setLanguageManual("en", "NO");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex-1 py-2 px-3 rounded-full text-[10px] uppercase tracking-wider border text-center transition-colors ${
                    language === "en"
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : isDark || !isScrolled
                      ? "border-white/25 text-white/80"
                      : "border-border text-foreground"
                  }`}
                >
                  🇳🇴 English (EN)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguageManual("pt", "BR");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex-1 py-2 px-3 rounded-full text-[10px] uppercase tracking-wider border text-center transition-colors ${
                    language === "pt"
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : isDark || !isScrolled
                      ? "border-white/25 text-white/80"
                      : "border-border text-foreground"
                  }`}
                >
                  🇧🇷 Português (PT)
                </button>
              </div>

              <Button
                variant="outline"
                className={`w-full mt-3 rounded-full text-[11px] uppercase tracking-wider font-normal backdrop-blur-md border border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] px-5 flex items-center justify-center gap-1.5 ${
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
                {t("Meu Perfil")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navigation;
