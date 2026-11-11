import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const PurchaseCancelled = () => {
  const [params] = useSearchParams();
  const contentId = params.get("contentId");

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="dark" />
      <main className="pt-40 pb-32 px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto text-center"
        >
          <XCircle className="h-10 w-10 text-muted-foreground mx-auto mb-6" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">Pagamento</span>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-4">Compra cancelada</h1>
          <p className="text-sm text-muted-foreground font-light mb-8">
            Nada foi cobrado. Você pode retomar a compra quando quiser.
          </p>
          <Button
            asChild
            variant="outline"
            className="rounded-full text-[11px] uppercase tracking-wider font-normal px-6"
          >
            <Link to={contentId ? `/conteudo/${contentId}` : "/livros"}>
              Voltar ao catálogo
              <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default PurchaseCancelled;
