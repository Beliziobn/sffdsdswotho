import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Heart,
  MessageSquare,
  ThumbsUp,
  Trash2,
  Lock,
  Sparkles,
  Check,
  Send,
  Edit2,
  CornerDownRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  ItemMediaType,
  UserReview,
  getItemAdores,
  getItemReviews,
  getItemStats,
  saveUserReview,
  deleteUserReview,
  toggleItemAdore,
  toggleLikeReview,
} from "@/lib/reviewsStore";

interface CommunityReviewsProps {
  itemId: string;
  itemType: ItemMediaType;
  itemTitle: string;
  defaultRating?: number;
  defaultRatingCount?: number;
  className?: string;
}

const STATUS_TAGS_MAP: Record<ItemMediaType, string[]> = {
  anime: ["Obra-prima", "Assisti tudo", "Acompanhando", "Recomendo muito", "Gostei bastante"],
  manga: ["Obra-prima", "Terminei de ler", "Lendo no momento", "Recomendo muito", "Arte impecável"],
  book: ["Obra-prima", "Terminei de ler", "Lendo no momento", "Recomendo muito", "Leitura profunda"],
  webtoon: ["Obra-prima", "Capítulos em dia", "Acompanhando", "Recomendo muito", "Arte incrível"],
};

export const CommunityReviews = ({
  itemId,
  itemType,
  itemTitle,
  defaultRating = 4.8,
  defaultRatingCount = 120,
  className = "",
}: CommunityReviewsProps) => {
  const { user, isAdmin } = useAuth();

  const [reviews, setReviews] = useState<UserReview[]>(() => getItemReviews(itemId, itemType));
  const [adoreState, setAdoreState] = useState(() => getItemAdores(itemId, user?.id));
  const [sortOrder, setSortOrder] = useState<"recent" | "top" | "likes">("recent");

  // Review Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [statusTag, setStatusTag] = useState<string>(STATUS_TAGS_MAP[itemType][0]);
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Sync reviews and adores on updates
  useEffect(() => {
    const handleUpdate = () => {
      setReviews(getItemReviews(itemId, itemType));
      setAdoreState(getItemAdores(itemId, user?.id));
    };

    window.addEventListener("worscoi_reviews_updated", handleUpdate);
    return () => window.removeEventListener("worscoi_reviews_updated", handleUpdate);
  }, [itemId, itemType, user?.id]);

  useEffect(() => {
    setReviews(getItemReviews(itemId, itemType));
    setAdoreState(getItemAdores(itemId, user?.id));
  }, [itemId, itemType, user?.id]);

  // Check if current user already reviewed
  const userExistingReview = useMemo(() => {
    if (!user) return null;
    return reviews.find((r) => r.userId === user.id) || null;
  }, [reviews, user]);

  const stats = useMemo(() => {
    return getItemStats(itemId, itemType, defaultRating, defaultRatingCount);
  }, [itemId, itemType, reviews, defaultRating, defaultRatingCount]);

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    if (sortOrder === "top") {
      list.sort((a, b) => b.rating - a.rating || b.likesCount - a.likesCount);
    } else if (sortOrder === "likes") {
      list.sort((a, b) => b.likesCount - a.likesCount);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [reviews, sortOrder]);

  const handleToggleAdore = async () => {
    if (!user) {
      toast.info("Faça login para adorar esta obra!", {
        description: "Entre na sua conta para salvar em seus adoros e deixar suas avaliações.",
      });
      return;
    }

    const next = await toggleItemAdore(itemId, itemType, itemTitle, user.id);
    setAdoreState(next);
    if (next.userAdored) {
      toast.success(`Você adorou "${itemTitle}"!`, {
        description: "Adicionado aos seus títulos favoritos.",
      });
    } else {
      toast.info(`Removido dos seus adoros.`);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("É necessário fazer login para enviar uma avaliação.");
      return;
    }

    if (!comment.trim()) {
      toast.error("Por favor, escreva um comentário sobre o que achou da obra.");
      return;
    }

    setSubmitting(true);
    try {
      const displayName =
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Leitor Wotho";

      await saveUserReview({
        itemId,
        itemType,
        itemTitle,
        user: {
          id: user.id,
          name: displayName,
        },
        rating,
        comment,
        statusTag,
        existingReviewId: editingReviewId || undefined,
      });

      setComment("");
      setEditingReviewId(null);
      setReviews(getItemReviews(itemId, itemType));
      toast.success(
        editingReviewId
          ? "Sua avaliação foi atualizada com sucesso!"
          : "Sua avaliação foi publicada e salva no banco de dados!"
      );
    } catch {
      toast.error("Não foi possível salvar a avaliação.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (rev: UserReview) => {
    setEditingReviewId(rev.id);
    setRating(rev.rating);
    setComment(rev.comment);
    if (rev.statusTag) setStatusTag(rev.statusTag);
  };

  const handleDeleteClick = async (reviewId: string) => {
    if (!user) return;
    const ok = await deleteUserReview(reviewId, user.id, isAdmin);
    if (ok) {
      setReviews(getItemReviews(itemId, itemType));
      if (editingReviewId === reviewId) {
        setEditingReviewId(null);
        setComment("");
      }
      toast.success("Avaliação excluída com sucesso.");
    }
  };

  const handleLikeComment = (reviewId: string) => {
    if (!user) {
      toast.info("Faça login para curtir comentários da comunidade.");
      return;
    }
    toggleLikeReview(reviewId, user.id);
    setReviews(getItemReviews(itemId, itemType));
  };

  const getMediaLabel = () => {
    switch (itemType) {
      case "anime":
        return "este anime";
      case "manga":
        return "este mangá";
      case "book":
        return "este livro";
      case "webtoon":
        return "este webtoon";
    }
  };

  return (
    <div className={`mt-16 pt-10 border-t border-border ${className}`}>
      {/* Header & Global Score Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 mb-8 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] uppercase tracking-widest text-primary font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Comunidade & Crítica Wotho
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">
            Avaliações, Comentários & Adoros
          </h2>
          <p className="text-xs text-muted-foreground font-light mt-1">
            Veja a opinião de quem já assistiu ou leu, deixe sua nota e compartilhe suas impressões.
          </p>
        </div>

        {/* Global Rating & Adore Action Button */}
        <div className="flex items-center gap-4 self-start md:self-center">
          <div className="flex items-center gap-3 bg-secondary/50 border border-border px-4 py-2.5 rounded-2xl shadow-sm">
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-lg font-semibold text-foreground">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground font-light">/ 5.0</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-light block">
                {stats.totalReviews} avaliações
              </span>
            </div>

            <div className="h-8 w-px bg-border" />

            {/* Botão Adorar */}
            <button
              type="button"
              onClick={handleToggleAdore}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                adoreState.userAdored
                  ? "bg-rose-500/15 border border-rose-500/40 text-rose-500 font-medium scale-105"
                  : "bg-background border border-border hover:border-rose-300 text-muted-foreground hover:text-rose-500"
              }`}
              title={adoreState.userAdored ? "Você adorou esta obra!" : "Adorar esta obra"}
            >
              <Heart
                className={`h-4 w-4 transition-transform ${
                  adoreState.userAdored ? "fill-rose-500 text-rose-500 scale-110" : ""
                }`}
              />
              <div className="text-left leading-none">
                <span className="text-xs font-semibold block">
                  {adoreState.totalAdores}
                </span>
                <span className="text-[9px] uppercase tracking-wider block opacity-80">
                  {adoreState.userAdored ? "Adorado" : "Adoros"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Review Submission Area */}
      <div className="mb-12">
        {user ? (
          <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-medium text-foreground tracking-tight flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>
                    {editingReviewId || userExistingReview
                      ? "Atualizar sua Avaliação & Comentário"
                      : `Deixar sua Avaliação sobre ${itemTitle}`}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground font-light mt-0.5">
                  Conectado como <strong>{user.user_metadata?.display_name || user.email}</strong>
                </p>
              </div>

              {/* Status Tag Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {STATUS_TAGS_MAP[itemType].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setStatusTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                      statusTag === tag
                        ? "bg-primary text-white font-medium"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Sua Nota:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating ?? rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                        title={`${star} Estrela${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            active
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30 hover:text-amber-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-xs font-semibold text-foreground">
                    {hoverRating ?? rating} / 5
                    <span className="text-muted-foreground font-normal ml-1">
                      (
                      {(hoverRating ?? rating) === 5
                        ? "Excelente / Obra-prima"
                        : (hoverRating ?? rating) === 4
                        ? "Muito bom"
                        : (hoverRating ?? rating) === 3
                        ? "Bom"
                        : (hoverRating ?? rating) === 2
                        ? "Regular"
                        : "Fraco"}
                      )
                    </span>
                  </span>
                </div>
              </div>

              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  itemType === "anime"
                    ? "Compartilhe o que achou da animação, fidelidade, ritmo e trilha sonora..."
                    : itemType === "manga"
                    ? "O que achou do traço original, da narrativa e dos personagens?"
                    : itemType === "book"
                    ? "Escreva sua resenha ou análise crítica sobre esta obra..."
                    : "Deixe seu comentário sobre a arte dos episódios e o enredo..."
                }
                className="text-sm font-light leading-relaxed bg-background"
                required
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground font-light">
                  Sua avaliação fica salva no banco de dados e visível para toda a comunidade.
                </span>

                <div className="flex items-center gap-2">
                  {editingReviewId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingReviewId(null);
                        setComment("");
                      }}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full text-xs uppercase tracking-wider bg-primary text-white hover:bg-primary/90 px-6 h-9"
                  >
                    <Send className="h-3 w-3 mr-1.5" />
                    {submitting ? "Publicando…" : editingReviewId ? "Salvar Edição" : "Publicar Avaliação"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* Unauthenticated Gate: Prompt to Log in to Leave Review or Adore */
          <div className="p-8 rounded-2xl border border-dashed border-border bg-secondary/30 text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-foreground tracking-tight mb-1">
              Quer avaliar {getMediaLabel()} e deixar seu adoro?
            </h3>
            <p className="text-xs text-muted-foreground font-light max-w-md mb-5 leading-relaxed">
              Para garantir a autenticidade das notas e comentários da comunidade, é necessário fazer login na sua conta antes de avaliar.
            </p>
            <div className="flex items-center gap-3">
              <Button asChild className="rounded-full text-xs uppercase tracking-wider bg-primary text-white hover:bg-primary/90 px-6">
                <Link to="/auth">
                  Entrar ou Criar Conta
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full text-xs">
                <Link to="/termos" target="_blank">
                  Diretrizes da Comunidade
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Community Comments List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-medium text-foreground tracking-tight flex items-center gap-2">
            <span>Comentários dos Leitores & Espectadores ({sortedReviews.length})</span>
          </h3>

          {/* Sort Switcher */}
          <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setSortOrder("recent")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                sortOrder === "recent"
                  ? "bg-card text-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mais Recentes
            </button>
            <button
              type="button"
              onClick={() => setSortOrder("top")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                sortOrder === "top"
                  ? "bg-card text-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Melhor Avaliados
            </button>
            <button
              type="button"
              onClick={() => setSortOrder("likes")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                sortOrder === "likes"
                  ? "bg-card text-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mais Curtidos
            </button>
          </div>
        </div>

        {sortedReviews.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground font-light border border-border rounded-xl bg-card/40">
            Nenhum comentário publicado ainda. Seja o primeiro a avaliar {getMediaLabel()}!
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReviews.map((rev) => {
              const isOwner = user?.id === rev.userId;
              const hasLiked = user ? rev.likedByUsers?.includes(user.id) : false;

              return (
                <div
                  key={rev.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isOwner
                      ? "border-primary/40 bg-primary/[0.02]"
                      : "border-border bg-card shadow-soft"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                        {rev.userName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {rev.userName}
                          </span>
                          {isOwner && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                              Você
                            </span>
                          )}
                          {rev.statusTag && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                              {rev.statusTag}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-light block">
                          {new Date(rev.createdAt).toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-500 shrink-0">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/90 font-light leading-relaxed whitespace-pre-line mb-4 pl-12">
                    {rev.comment}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 pl-12 text-xs">
                    {/* Like comment button */}
                    <button
                      type="button"
                      onClick={() => handleLikeComment(rev.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                        hasLiked
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <ThumbsUp className={`h-3 w-3 ${hasLiked ? "fill-primary" : ""}`} />
                      <span>{rev.likesCount > 0 ? rev.likesCount : "Curtir"}</span>
                    </button>

                    {/* Action buttons for owner / admin */}
                    {(isOwner || isAdmin) && (
                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleEditClick(rev)}
                            className="text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            Editar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(rev.id)}
                          className="text-destructive/80 hover:text-destructive text-[11px] flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
