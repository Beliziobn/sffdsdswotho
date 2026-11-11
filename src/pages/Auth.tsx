import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User as UserIcon } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import brandIcon from "@/assets/worscoi-icon.png";
import { checkLoginRateLimit, logAudit, passwordStrength, recordLoginFailure } from "@/lib/security";
import { TERMS_VERSION, readCookiePreferences } from "@/hooks/useConsent";
import {
  isSpecialAdminLoggedIn,
  loginSpecialAdmin,
  verifySpecialAdminCredentials,
} from "@/lib/editorialStore";
import { signInWithGoogle } from "@/lib/firebase";

const emailSchema = z.string().trim().email("Informe um e-mail válido").max(255);
const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter ao menos 8 caracteres")
  .max(72)
  .regex(/[A-Za-z]/, "A senha precisa conter letras")
  .regex(/\d/, "A senha precisa conter pelo menos um número");

type Mode = "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const strength = useMemo(() => passwordStrength(password), [password]);
  const isSignup = mode === "signup";

  useEffect(() => {
    if (isSpecialAdminLoggedIn()) {
      navigate("/admin");
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/biblioteca");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/biblioteca");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const saveConsent = async (userId: string, userEmail: string) => {
    await supabase.from("user_consents").upsert(
      {
        user_id: userId,
        email: userEmail,
        terms_accepted: true,
        privacy_accepted: true,
        terms_version: TERMS_VERSION,
        accepted_at: new Date().toISOString(),
        cookie_preferences: (readCookiePreferences() ?? {}) as never,
      },
      { onConflict: "user_id" },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailCheck = emailSchema.safeParse(email);
    if (!emailCheck.success) {
      toast({ title: "Verifique os dados", description: emailCheck.error.errors[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Special Master Editorial Login (miguelworscoi@gmail.com / 004116)
      if (mode !== "forgot" && verifySpecialAdminCredentials(emailCheck.data, password)) {
        loginSpecialAdmin();
        void logAudit("login_success", { email: emailCheck.data });
        toast({
          title: "Acesso Editorial Mestre Concedido",
          description: "Bem-vindo ao Studio Editorial & Análise de Conteúdos, Miguel Worscoi!",
        });
        navigate("/admin");
        return;
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(emailCheck.data, {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });
        if (error) throw error;
        void logAudit("password_reset_requested", { metadata: { email: emailCheck.data } });
        toast({ title: "Verifique o seu e-mail", description: "Enviámos um link para redefinir a sua senha." });
        setMode("login");
        return;
      }

      const passwordCheck = passwordSchema.safeParse(password);
      if (!passwordCheck.success) {
        toast({ title: "Senha insegura", description: passwordCheck.error.errors[0].message, variant: "destructive" });
        return;
      }

      if (isSignup) {
        if (password !== confirmPassword) {
          toast({ title: "As senhas não coincidem", variant: "destructive" });
          return;
        }
        if (!acceptTerms) {
          toast({ title: "Aceite os termos", description: "É preciso aceitar os Termos e a Política de Privacidade.", variant: "destructive" });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: emailCheck.data,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName.trim() || emailCheck.data.split("@")[0] },
          },
        });
        if (error) {
          toast({
            title: "Não foi possível criar a conta",
            description: error.message.includes("already registered")
              ? "Este e-mail já está registado. Faça login."
              : error.message,
            variant: "destructive",
          });
          return;
        }
        if (data.user) await saveConsent(data.user.id, emailCheck.data);
        void logAudit("signup", { metadata: { email: emailCheck.data } });
        toast({
          title: "Confirme o seu e-mail",
          description: "Enviámos um link de confirmação para concluir o registo.",
        });
        return;
      }

      // login
      const limit = await checkLoginRateLimit(emailCheck.data);
      if (!limit.allowed) {
        toast({
          title: "Demasiadas tentativas",
          description: `Tente novamente em ${Math.ceil((limit.retryAfterSeconds ?? 900) / 60)} minutos.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email: emailCheck.data, password });
      if (error) {
        void recordLoginFailure(emailCheck.data);
        toast({
          title: "Não foi possível entrar",
          description: error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message,
          variant: "destructive",
        });
        return;
      }
      void logAudit("login_success", { email: emailCheck.data });
    } catch (error) {
      toast({ title: "Algo correu mal", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        void logAudit("login_success", { email: user.email || "", metadata: { provider: "google" } });
        toast({
          title: "Bem-vindo!",
          description: `Sessão iniciada como ${user.displayName || user.email}`,
        });
        navigate("/biblioteca");
        return;
      }
    } catch (err: any) {
      // Fallback to Supabase OAuth if needed
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) {
        toast({ title: "Não foi possível entrar com Google", description: err?.message || error.message, variant: "destructive" });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-6 py-20">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <Link to="/" className="mb-5 inline-flex items-center justify-center gap-2 text-foreground">
            <img src={brandIcon} alt="Wotho" width={28} height={28} className="h-7 w-7 rounded-md" />
            <span className="text-base font-normal tracking-wide">Wotho</span>
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--soft-shadow)]">
          {/* Sliding mode switch */}
          <div className="relative m-4 grid grid-cols-2 rounded-full bg-secondary p-1">
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-full bg-card shadow-[var(--soft-shadow)]"
              style={{ left: mode === "login" ? "0.25rem" : "50%" }}
            />
            <button
              type="button"
              onClick={() => setMode("login")}
              className="relative z-10 py-2 text-[11px] uppercase tracking-wider text-foreground"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="relative z-10 py-2 text-[11px] uppercase tracking-wider text-foreground"
            >
              Criar conta
            </button>
          </div>

          <div className="px-6 pb-8 pt-2">
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -24 : 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 24 : -24 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="mb-2">
                  <h1 className="text-xl font-light text-foreground">
                    {mode === "login" ? "Entrar na sua conta" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
                  </h1>
                  <p className="mt-1 text-xs font-light text-muted-foreground">
                    {mode === "login"
                      ? "Aceda aos seus livros e webtoons"
                      : mode === "signup"
                        ? "Compre livros e leia direto no navegador"
                        : "Enviamos um link seguro para o seu e-mail"}
                  </p>
                </div>

                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        value={displayName}
                        maxLength={80}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Como quer ser chamado"
                        className="pl-9"
                        autoComplete="name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      maxLength={255}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                      className="pl-9"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Senha</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        maxLength={72}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="px-9"
                        autoComplete={isSignup ? "new-password" : "current-password"}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {isSignup && password.length > 0 && (
                      <div className="pt-1">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <span
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i < strength.score ? "bg-primary" : "bg-border"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-1.5 text-[11px] font-light text-muted-foreground">
                          Força da senha: {strength.label}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="confirm" className="text-xs uppercase tracking-wider text-muted-foreground">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirm"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        maxLength={72}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>
                )}

                {isSignup && (
                  <label className="flex items-start gap-3 text-xs font-light leading-relaxed text-muted-foreground">
                    <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(v === true)} className="mt-0.5" />
                    <span>
                      Aceito os{" "}
                      <Link to="/termos" target="_blank" className="underline underline-offset-2">Termos de Uso</Link>{" "}
                      e a{" "}
                      <Link to="/privacidade" target="_blank" className="underline underline-offset-2">Política de Privacidade</Link>.
                    </span>
                  </label>
                )}

                <Button type="submit" disabled={loading} className="w-full rounded-full text-[11px] uppercase tracking-wider">
                  {loading ? "Aguarde…" : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
                </Button>

                {mode !== "forgot" && (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-border" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">ou</span>
                      <span className="h-px flex-1 bg-border" />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogle}
                      className="w-full rounded-full text-[11px] uppercase tracking-wider"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                        <path fill="#FBBC05" d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84Z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.96 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.67 2.84c.86-2.6 3.29-4.51 6.15-4.51Z" />
                      </svg>
                      Continuar com Google
                    </Button>
                  </>
                )}

                <div className="pt-2 text-center">
                  {mode === "login" ? (
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground">
                      Esqueceu a senha?
                    </button>
                  ) : (
                    <button type="button" onClick={() => setMode("login")} className="text-xs text-muted-foreground hover:text-foreground">
                      Já tem conta? Entrar
                    </button>
                  )}
                </div>
              </motion.form>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
