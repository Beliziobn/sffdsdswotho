import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const PurchaseSuccess = () => {
  const [params] = useSearchParams();
  const qc = useQueryClient();

  useEffect(() => {
    // The webhook confirms the payment server-side; refresh once it lands.
    const timers = [1500, 4000, 8000].map((ms) =>
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["content-purchases"] });
        qc.invalidateQueries({ queryKey: ["owns-content"] });
        qc.invalidateQueries({ queryKey: ["owned-contents"] });
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [qc]);

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
          <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-6" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">Pagamento</span>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-4">Compra concluída</h1>
          <p className="text-sm text-muted-foreground font-light mb-8">
            O acesso é liberado automaticamente assim que o pagamento é confirmado pelo nosso servidor. Isso costuma
            levar apenas alguns segundos.
          </p>
          {params.get("session_id") && (
            <p className="text-[11px] text-muted-foreground font-light mb-8 break-all">
              Referência: {params.get("session_id")}
            </p>
          )}
          <Button
            asChild
            className="rounded-full text-[11px] uppercase tracking-wider font-normal bg-primary text-primary-foreground px-6"
          >
            <Link to="/biblioteca">
              Ir para a minha estante
              <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default PurchaseSuccess;
