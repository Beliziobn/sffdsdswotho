import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { BookOpen, Layers, ArrowRight, ArrowLeft, CheckCircle, User, Phone, Mail, Tag } from "lucide-react";
import { useBooks } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

const Booking = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: books = [] } = useBooks();
  const available = books.filter((b) => b.published);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [bookId, setBookId] = useState("");
  const [format, setFormat] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const selectedBook = available.find((b) => b.id === bookId);

  const handleStep1Continue = () => {
    if (!bookId || !format) {
      toast.error("Escolha um livro e o tipo de acesso");
      return;
    }
    setDirection(1);
    setStep(2);
  };

  const handleStep2Back = () => {
    setDirection(-1);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!name || !phone || !email) {
      toast.error("Preencha nome, telefone e e-mail");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Informe um e-mail válido");
      return;
    }
    if (!user) {
      toast.error("Entre na sua conta para concluir a reserva");
      navigate("/auth");
      return;
    }
    if (!selectedBook) return;

    setSubmitting(true);
    const { error } = await supabase.from("purchases").insert({
      user_id: user.id,
      book_id: selectedBook.id,
      amount_cents: selectedBook.price_cents,
      currency: selectedBook.currency,
      status: "pending",
    });
    setSubmitting(false);

    if (error) {
      toast.error("Não foi possível registrar a reserva");
      return;
    }

    toast.success("Reserva registrada!");
    setDirection(1);
    setStep(3);
  };

  const handleReset = () => {
    setDirection(-1);
    setStep(1);
    setBookId("");
    setFormat("");
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
  };

  return (
    <section id="booking" className="py-32 lg:py-40 bg-accent/20" ref={ref}>
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">Reservas</span>
          <h2 className="text-2xl md:text-3xl font-light mb-4 text-foreground tracking-tight">Reserve seu livro</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto font-light">
            Escolha o título, confirme seus dados e libere a leitura online
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="p-8 lg:p-10 shadow-soft border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step ? "w-8 bg-primary" : s < step ? "w-4 bg-primary/50" : "w-4 bg-border"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <Label
                          htmlFor="book"
                          className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal"
                        >
                          <BookOpen className="h-3 w-3" />
                          Livro
                        </Label>
                        <Select value={bookId} onValueChange={setBookId}>
                          <SelectTrigger id="book" className="rounded-md text-sm font-light">
                            <SelectValue placeholder="Selecione um livro" />
                          </SelectTrigger>
                          <SelectContent>
                            {available.map((book) => (
                              <SelectItem key={book.id} value={book.id}>
                                {book.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="format"
                          className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal"
                        >
                          <Layers className="h-3 w-3" />
                          Tipo de acesso
                        </Label>
                        <Select value={format} onValueChange={setFormat}>
                          <SelectTrigger id="format" className="rounded-md text-sm font-light">
                            <SelectValue placeholder="Selecione o acesso" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completo">Livro completo</SelectItem>
                            <SelectItem value="presente">Presente para alguém</SelectItem>
                            <SelectItem value="clube">Clube de leitura</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-4">
                        <Button
                          size="default"
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal"
                          onClick={handleStep1Continue}
                        >
                          Continuar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal">
                        <Tag className="h-3 w-3" />
                        Resumo
                      </Label>
                      <div className="rounded-md border border-border bg-secondary/30 p-5">
                        {selectedBook ? (
                          <div className="flex gap-4">
                            <img
                              src={selectedBook.cover_url || "/placeholder.svg"}
                              alt={selectedBook.title}
                              loading="lazy"
                              className="w-20 h-28 object-cover rounded-sm"
                            />
                            <div>
                              <p className="text-sm font-normal text-foreground tracking-tight">{selectedBook.title}</p>
                              <p className="text-xs text-muted-foreground font-light mt-1">{selectedBook.author}</p>
                              <p className="text-xl font-light text-foreground mt-3">
                                {formatPrice(selectedBook.price_cents, selectedBook.currency)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground font-light">
                            Selecione um livro para ver o resumo da reserva.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="space-y-6 max-w-md mx-auto">
                    <div>
                      <Label
                        htmlFor="name"
                        className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal"
                      >
                        <User className="h-3 w-3" />
                        Nome completo
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Maria Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-md text-sm font-light"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="phone"
                        className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal"
                      >
                        <Phone className="h-3 w-3" />
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+244 900 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="rounded-md text-sm font-light"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal"
                      >
                        <Mail className="h-3 w-3" />
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="maria@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-md text-sm font-light"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="notes"
                        className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal"
                      >
                        <Tag className="h-3 w-3" />
                        Observação (opcional)
                      </Label>
                      <Input
                        id="notes"
                        type="text"
                        placeholder="Como prefere pagar?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="rounded-md text-sm font-light"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-md text-[11px] uppercase tracking-wider font-normal"
                        onClick={handleStep2Back}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal"
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? "Enviando..." : "Confirmar reserva"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="text-center max-w-md mx-auto py-6">
                    <CheckCircle className="h-10 w-10 text-primary mx-auto mb-6 stroke-[1.25]" />
                    <h3 className="text-xl font-light text-foreground tracking-tight mb-3">Reserva registrada</h3>
                    <p className="text-sm text-muted-foreground font-light mb-8">
                      Assim que o pagamento for confirmado, o livro aparece liberado na sua estante.
                    </p>

                    <div className="rounded-md border border-border bg-secondary/30 p-6 text-left space-y-3 mb-8">
                      <div className="flex justify-between text-xs font-light">
                        <span className="text-muted-foreground">Livro</span>
                        <span className="text-foreground">{selectedBook?.title}</span>
                      </div>
                      <div className="flex justify-between text-xs font-light">
                        <span className="text-muted-foreground">Acesso</span>
                        <span className="text-foreground capitalize">{format}</span>
                      </div>
                      <div className="flex justify-between text-xs font-light">
                        <span className="text-muted-foreground">Nome</span>
                        <span className="text-foreground">{name}</span>
                      </div>
                      <div className="flex justify-between text-xs font-light">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="text-foreground">
                          {selectedBook ? formatPrice(selectedBook.price_cents, selectedBook.currency) : "-"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-md text-[11px] uppercase tracking-wider font-normal"
                        onClick={handleReset}
                      >
                        Nova reserva
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal"
                        onClick={() => navigate("/biblioteca")}
                      >
                        Minha estante
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default Booking;
