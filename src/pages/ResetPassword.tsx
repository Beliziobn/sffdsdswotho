import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { logAudit, passwordStrength } from "@/lib/security";
import brandIcon from "@/assets/worscoi-icon.png";

const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter ao menos 8 caracteres")
  .max(72)
  .regex(/[A-Za-z]/, "A senha precisa conter letras")
  .regex(/\d/, "A senha precisa conter pelo menos um número");

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const strength = useMemo(() => passwordStrength(password), [password]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = passwordSchema.safeParse(password);
    if (!check.success) {
      toast({ title: "Senha insegura", description: check.error.errors[0].message, variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Não foi possível redefinir", description: error.message, variant: "destructive" });
      return;
    }
    void logAudit("password_changed");
    toast({ title: "Senha atualizada", description: "Já pode usar a nova senha." });
    navigate("/biblioteca");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-foreground">
          <img src={brandIcon} alt="Worscoi" width={28} height={28} className="h-7 w-7 rounded-md" />
          <span className="text-base font-normal tracking-wide">Worscoi</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--soft-shadow)]">
          <h1 className="text-xl font-light text-foreground">Definir nova senha</h1>
          <p className="mt-1 text-xs font-light text-muted-foreground">
            {ready ? "Escolha uma senha forte para a sua conta." : "A validar o link de recuperação…"}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs uppercase tracking-wider text-muted-foreground">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                maxLength={72}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              {password.length > 0 && (
                <div className="pt-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className={`h-1 flex-1 rounded-full ${i < strength.score ? "bg-primary" : "bg-border"}`} />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] font-light text-muted-foreground">Força da senha: {strength.label}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs uppercase tracking-wider text-muted-foreground">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                maxLength={72}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <Button type="submit" disabled={loading || !ready} className="w-full rounded-full text-[11px] uppercase tracking-wider">
              {loading ? "A guardar…" : "Guardar nova senha"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
