import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTermsConsent } from "@/hooks/useConsent";
import { useAuth } from "@/hooks/useAuth";

const TermsGate = () => {
  const { needsAcceptance, accept, saving } = useTermsConsent();
  const { signOut } = useAuth();
  const [checked, setChecked] = useState(false);

  return (
    <Dialog open={needsAcceptance}>
      <DialogContent className="max-w-md rounded-xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-normal">Termos e privacidade</DialogTitle>
          <DialogDescription className="text-xs font-light leading-relaxed">
            Para continuar a usar a Worscoi precisa de aceitar os nossos Termos de Uso e a Política de
            Privacidade. Este aceite fica registado com data e hora.
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-start gap-3 rounded-lg bg-secondary p-4 text-xs font-light leading-relaxed text-foreground">
          <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
          <span>
            Li e aceito os{" "}
            <Link to="/termos" className="underline underline-offset-2" target="_blank">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link to="/privacidade" className="underline underline-offset-2" target="_blank">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>

        <div className="mt-2 flex items-center gap-3">
          <Button disabled={!checked || saving} onClick={() => void accept()} className="flex-1 rounded-full text-[11px] uppercase tracking-wider">
            {saving ? "A guardar…" : "Aceitar e continuar"}
          </Button>
          <Button variant="outline" onClick={() => void signOut()} className="rounded-full text-[11px] uppercase tracking-wider">
            Sair
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsGate;
