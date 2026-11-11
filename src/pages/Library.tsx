import { Link, Navigate } from "react-router-dom";
import { BookOpen, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBooks, usePurchases } from "@/hooks/useCatalog";
import { formatPrice } from "@/lib/format";

const Library = () => {
  const { user, loading } = useAuth();
  const { data: purchases = [], isLoading } = usePurchases();
  const { data: books = [] } = useBooks();

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const rows = purchases.map((p) => ({ purchase: p, book: books.find((b) => b.id === p.book_id) }));
  const owned = rows.filter((r) => r.purchase.status === "paid");
  const pending = rows.filter((r) => r.purchase.status === "pending");

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="mx-auto max-w-6xl px-5 py-14">
        <span className="eyebrow">Sua conta</span>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Minha biblioteca</h1>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <div className="mt-10 rounded-sm border border-border bg-card p-10 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Você ainda não comprou nenhum livro.
            </p>
            <Button asChild className="mt-6">
              <Link to="/livros">Explorar catálogo</Link>
            </Button>
          </div>
        ) : (
          <>
            {owned.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-xl">Liberados para leitura</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {owned.map(({ purchase, book }) => (
                    <div key={purchase.id} className="flex items-center justify-between gap-4 rounded-sm border border-border bg-card p-4">
                      <div>
                        <p className="font-display">{book?.title ?? "Livro"}</p>
                        <p className="text-sm text-muted-foreground">{book?.author}</p>
                      </div>
                      <Button asChild size="sm">
                        <Link to={`/ler/${purchase.book_id}`}>Ler</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {pending.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display text-xl">Pagamentos em análise</h2>
                <div className="mt-5 space-y-3">
                  {pending.map(({ purchase, book }) => (
                    <div key={purchase.id} className="flex items-center justify-between gap-4 rounded-sm border border-border bg-secondary/40 p-4">
                      <div>
                        <p className="font-display">{book?.title ?? "Livro"}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(purchase.amount_cents, purchase.currency)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /> Aguardando confirmação
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Library;
