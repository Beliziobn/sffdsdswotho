import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const slideTimer = setInterval(nextSlide, SLIDE_DURATION);
    return () => clearInterval(slideTimer);
  }, [nextSlide, currentSlide]);

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

      <div className="absolute bottom-8 left-6 md:left-12 lg:left-16 right-6 md:right-12 lg:right-16 z-10 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="flex-1 h-[2px] bg-white/30 overflow-hidden cursor-pointer"
            aria-label={`Ir para o slide ${index + 1}`}
          >
            <div
              key={`${index}-${currentSlide === index ? "active" : "idle"}`}
              className={`h-full bg-white ${
                index === currentSlide
                  ? "w-full transition-all duration-[5000ms] ease-linear"
                  : index < currentSlide
                  ? "w-full"
                  : "w-0"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
};

export default Hero;
