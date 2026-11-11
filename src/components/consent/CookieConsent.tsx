import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCookieConsent } from "@/hooks/useConsent";

const CookieConsent = () => {
  const { decided, save } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  return (
    <AnimatePresence>
      {!decided && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[200] p-4 sm:p-6"
          role="dialog"
          aria-label="Consentimento de cookies"
        >
          <div className="container mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 shadow-[var(--hover-shadow)]">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <h2 className="text-sm font-medium text-foreground">Este site usa cookies</h2>
                <p className="mt-2 text-xs font-light leading-relaxed text-muted-foreground">
                  Usamos cookies essenciais para o funcionamento da plataforma. Scripts de análise e marketing
                  só são carregados depois do seu consentimento (LGPD/GDPR). Saiba mais na{" "}
                  <Link to="/privacidade" className="underline underline-offset-2">
                    Política de Privacidade
                  </Link>
                  .
                </p>

                <AnimatePresence initial={false}>
                  {showSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 space-y-3 overflow-hidden"
                    >
                      <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
                        <span className="text-xs text-foreground">Necessários (sempre ativos)</span>
                        <Switch checked disabled aria-label="Cookies necessários" />
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
                        <span className="text-xs text-foreground">Análise de uso</span>
                        <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Cookies de análise" />
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
                        <span className="text-xs text-foreground">Marketing</span>
                        <Switch checked={marketing} onCheckedChange={setMarketing} aria-label="Cookies de marketing" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button size="sm" className="rounded-full px-6 text-[11px] uppercase tracking-wider" onClick={() => save({ analytics: true, marketing: true })}>
                    Aceitar todos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full px-6 text-[11px] uppercase tracking-wider"
                    onClick={() => (showSettings ? save({ analytics, marketing }) : save({ analytics: false, marketing: false }))}
                  >
                    {showSettings ? "Guardar escolhas" : "Apenas essenciais"}
                  </Button>
                  {!showSettings && (
                    <button
                      type="button"
                      onClick={() => setShowSettings(true)}
                      className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      Personalizar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
