import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  Clock,
  Send,
  HelpCircle,
  CheckCircle2,
  Phone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

const SUBJECTS = [
  "Dúvidas Gerais sobre a Plataforma",
  "Sugestão de Livro, Webtoon ou Anime",
  "Pauta / Sugestão para o Portal de Notícias",
  "Parcerias Editoriais & Imprensa",
  "Reportar Falha Técnica ou Bug",
  "Outro Assunto",
];

const FAQS = [
  {
    q: "O acesso aos conteúdos e leitura na Worsco é gratuito?",
    a: "Sim! Grande parte do acervo de bestsellers, artigos acadêmicos do ENEM, webtoons e notícias está disponível para leitura livre diretamente no navegador, sem necessidade de assinaturas obrigatórias.",
  },
  {
    q: "Como funciona o streaming de animes e a leitura de mangás?",
    a: "No portal de animes da Worsco, você encontra trailers em alta definição, episódios selecionados e uma aba dedicada para leitura dos capítulos correspondentes de mangá com atualização ao vivo.",
  },
  {
    q: "Posso sugerir livros ou pautas para a redação?",
    a: "Com certeza! Utilize o formulário desta página selecionando a opção 'Sugestão de Livro, Webtoon ou Anime' ou 'Pauta / Sugestão para o Portal de Notícias'. Nossa equipe editorial avalia semanalmente todas as contribuições da comunidade.",
  },
  {
    q: "A Worsco funciona em dispositivos móveis?",
    a: "Sim, a plataforma foi desenvolvida com arquitetura Mobile-First e PWA. Ela funciona perfeitamente em qualquer smartphone Android, iOS, tablet ou computador através do navegador, adaptando o tamanho das fontes e temas visuais.",
  },
];

export const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Contato — Fale com a Worsco";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Entre em contato com a equipe da Worsco para dúvidas, sugestões de conteúdo, parcerias editoriais ou suporte técnico."
      );
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      toast.error("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    setIsSubmitting(true);

    // Simulate sending with natural response
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Mensagem enviada com sucesso! A equipe Worsco responderá em até 24 horas.");
    }, 700);
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setMessage("");
    setSubject(SUBJECTS[0]);
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation variant="dark" />

      {/* Hero Header */}
      <section className="relative pt-36 pb-16 md:pt-44 md:pb-24 bg-gradient-to-b from-zinc-950 via-zinc-900 to-background border-b border-border/40">
        <div className="container mx-auto px-6 lg:px-12 text-center space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs uppercase tracking-wider font-medium">
            <MessageSquare className="h-3.5 w-3.5" />
            Central de Atendimento Worsco
          </div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
            Fale Conosco
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed">
            Dúvidas, sugestões de obras, pautas jornalísticas ou parcerias editoriais. 
            Envie sua mensagem e nossa equipe retornará prontamente.
          </p>
        </div>
      </section>

      {/* Contact Content Grid */}
      <main className="py-16 md:py-24 container mx-auto px-6 lg:px-12 flex-1">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Direct Info & Channels */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-primary font-medium">
                Canais Diretos
              </span>
              <h2 className="text-2xl font-light tracking-tight text-foreground mt-1 mb-3">
                Como podemos ajudar?
              </h2>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                Você pode nos enviar uma mensagem através do formulário ao lado ou entrar em contato direto por e-mail.
              </p>
            </div>

            <div className="space-y-4">
              <Card className="p-5 border border-border/70 bg-card/60 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">E-mail Editorial & Suporte</h4>
                  <p className="text-xs text-muted-foreground font-light mt-0.5">
                    Para todas as dúvidas e correspondências:
                  </p>
                  <a
                    href="mailto:ola@worscoi.com"
                    className="text-xs text-primary font-medium hover:underline mt-1 inline-block"
                  >
                    ola@worscoi.com
                  </a>
                </div>
              </Card>

              <Card className="p-5 border border-border/70 bg-card/60 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">Horário de Funcionamento</h4>
                  <p className="text-xs text-muted-foreground font-light mt-0.5">
                    Segunda a Sexta-feira: 09:00 às 18:00 (Horário de Brasília)
                  </p>
                  <span className="text-[11px] text-emerald-500 font-medium mt-1 inline-block">
                    ● Atendimento online ativo
                  </span>
                </div>
              </Card>

              <Card className="p-5 border border-border/70 bg-card/60 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">Privacidade e Dados</h4>
                  <p className="text-xs text-muted-foreground font-light mt-0.5">
                    Seus dados são protegidos em conformidade com as diretrizes da LGPD.
                  </p>
                  <Link to="/privacidade" className="text-xs text-primary hover:underline mt-1 inline-block">
                    Ver política de privacidade
                  </Link>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8 border border-border/80 bg-card/80 shadow-soft">
              {isSubmitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground">Mensagem Enviada!</h3>
                  <p className="text-xs text-muted-foreground font-light max-w-sm mx-auto leading-relaxed">
                    Agradecemos pelo seu contato. Nossa equipe já recebeu sua mensagem e responderá no e-mail informado o mais rápido possível.
                  </p>
                  <div className="pt-4">
                    <Button onClick={handleReset} variant="outline" size="sm" className="rounded-full text-xs">
                      Enviar outra mensagem
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium text-foreground">Envie uma Mensagem</h3>
                    <p className="text-xs text-muted-foreground font-light">
                      Preencha os campos abaixo com seus dados para falar conosco.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Nome completo <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Carlos Mendes"
                        className="text-xs bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Seu E-mail <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: seuemail@exemplo.com"
                        className="text-xs bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Assunto da Mensagem</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {SUBJECTS.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Mensagem <span className="text-rose-500">*</span>
                    </label>
                    <Textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Descreva detalhadamente sua dúvida, sugestão ou proposta..."
                      className="text-xs bg-background border-border resize-y min-h-[120px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-xs uppercase tracking-wider font-normal h-10"
                  >
                    {isSubmitting ? (
                      "Enviando mensagem..."
                    ) : (
                      <>
                        <Send className="mr-2 h-3.5 w-3.5" />
                        Enviar Mensagem para a Worsco
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20 pt-16 border-t border-border/60">
          <div className="text-center space-y-2 mb-10">
            <span className="text-[11px] uppercase tracking-widest text-primary font-medium">
              Tira-Dúvidas
            </span>
            <h3 className="text-2xl font-light tracking-tight text-foreground">
              Perguntas Frequentes
            </h3>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((faq, idx) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${idx}`}
                className="border border-border/70 rounded-lg px-4 bg-card/40"
              >
                <AccordionTrigger className="text-xs sm:text-sm font-medium hover:text-primary text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground font-light leading-relaxed pt-1 pb-3">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>

      {/* Schema.org ContactPage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Contato — Fale com a Worsco",
            description:
              "Entre em contato com a equipe da Worsco para dúvidas, sugestões de conteúdo, parcerias editoriais ou suporte técnico.",
            url: "https://worsco.vercel.app/contato",
            mainEntity: {
              "@type": "Organization",
              name: "Worsco",
              url: "https://worsco.vercel.app/",
              logo: "https://worsco.vercel.app/favicon-512x512.png",
              contactPoint: {
                "@type": "ContactPoint",
                email: "ola@worscoi.com",
                contactType: "customer service",
                availableLanguage: "Portuguese",
              },
            },
          }),
        }}
      />

      <Footer />
    </div>
  );
};

export default Contact;
