import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ContentList } from "@/components/ContentSection";
import { Button } from "@/components/ui/button";
import bannerImage from "@/assets/hero-library.jpg";
import { useContinueReading } from "@/hooks/useRecommendations";
import { useAuth } from "@/hooks/useAuth";

const ContinueReading = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const { user } = useAuth();
  const { data: items = [], isLoading } = useContinueReading(24);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      <div className="relative w-full h-[50vh] overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0 -top-20 -bottom-20">
          <img src={bannerImage} alt="Continuar lendo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/40" />
        </motion.div>
        <div className="relative h-full flex items-end pb-16">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="text-[11px] uppercase tracking-wider text-white/70 mb-4 block">Sua leitura</span>
              <h1 className="text-3xl md:text-5xl font-light text-white tracking-tight">Continuar lendo</h1>
            </motion.div>
          </div>
        </div>
      </div>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          {!user ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-light mb-6">Entre para acompanhar seu progresso.</p>
              <Button asChild variant="outline" className="rounded-full text-[11px] uppercase tracking-wider font-normal px-6">
                <Link to="/auth">Entrar</Link>
              </Button>
            </div>
          ) : isLoading ? (
            <p className="text-center text-sm text-muted-foreground font-light">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground font-light">
              Você ainda não começou nenhuma leitura.
            </p>
          ) : (
            <ContentList items={items} showProgress />
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContinueReading;
