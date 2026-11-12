import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import heroLibrary from "@/assets/hero-library.jpg";
import heroReading from "@/assets/hero-reading.jpg";
import heroNews from "@/assets/hero-news.jpg";

const slides = [
  { image: heroLibrary, alt: "Biblioteca digital Wotho com estantes de livros" },
  { image: heroReading, alt: "Leitura digital de livros e artigos no navegador na Wotho" },
  { image: heroNews, alt: "Portal de notícias globais e jornalismo editorial da Wotho" },
];

const SLIDE_DURATION = 5000;

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + 100 / (SLIDE_DURATION / 50);
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, [nextSlide]);

  return (
    <section className="relative h-screen min-h-[620px] w-full overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].alt}
            width={1920}
            height={1080}
            loading="eager"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/25" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-20 left-6 right-6 md:left-12 lg:left-16 md:right-12 lg:right-16 z-10 text-white max-w-3xl">
        <div className="mb-4 flex items-center gap-2.5 text-white/90">
          <BookOpen className="w-5 h-5 text-white stroke-[1.5]" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-medium">
            Plataforma Cultural Wotho
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-left leading-[1.1]">
          Wotho — Livros, notícias globais, streaming e webtoons
        </h1>

        <p className="mt-4 text-sm sm:text-base text-white/85 font-light max-w-2xl leading-relaxed">
          Leia livros digitais completos no navegador, acompanhe a cobertura jornalística global em tempo real, assista a filmes, séries e animes em streaming e explore webtoons em leitura vertical.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/livros"
            className="inline-flex items-center gap-2.5 bg-white text-zinc-950 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium tracking-wide hover:bg-white/90 transition-colors"
          >
            Explorar Livros
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/noticias"
            className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white border border-white/25 px-4 py-2.5 rounded-full text-xs sm:text-sm font-light hover:bg-white/25 transition-colors"
          >
            Notícias Globais
          </Link>
          <Link
            to="/cinema"
            className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white border border-white/25 px-4 py-2.5 rounded-full text-xs sm:text-sm font-light hover:bg-white/25 transition-colors"
          >
            Streaming
          </Link>
          <Link
            to="/webtoons"
            className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white border border-white/25 px-4 py-2.5 rounded-full text-xs sm:text-sm font-light hover:bg-white/25 transition-colors"
          >
            Webtoons
          </Link>
          <button
            type="button"
            onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 text-white/90 hover:text-white px-3 py-2.5 text-xs sm:text-sm font-light underline underline-offset-4 transition-colors"
          >
            Reservar para ler
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-6 md:left-12 lg:left-16 right-6 md:right-12 lg:right-16 z-10 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="flex-1 h-[2px] bg-white/30 overflow-hidden cursor-pointer"
            aria-label={`Ir para o slide ${index + 1}`}
          >
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width: index === currentSlide ? `${progress}%` : index < currentSlide ? "100%" : "0%",
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
};

export default Hero;
