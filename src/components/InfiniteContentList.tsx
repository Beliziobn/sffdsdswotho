import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { ContentList } from "./ContentSection";
import type { Content } from "@/hooks/useContents";

interface Props {
  items: Content[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  emptyLabel?: string;
  showProgress?: boolean;
}

/** Cursor-driven infinite grid — reuses the existing card list unchanged. */
const InfiniteContentList = ({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  emptyLabel = "Nenhum item encontrado.",
  showProgress,
}: Props) => {
  const { ref, inView } = useInView({ rootMargin: "600px 0px" });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <p className="text-center text-sm text-muted-foreground font-light py-16">Carregando…</p>;
  if (items.length === 0)
    return <p className="text-center text-sm text-muted-foreground font-light py-16">{emptyLabel}</p>;

  return (
    <>
      <ContentList items={items} showProgress={showProgress} />
      <div ref={ref} className="h-12" />
      {isFetchingNextPage && (
        <p className="text-center text-sm text-muted-foreground font-light">Carregando mais…</p>
      )}
      {!hasNextPage && items.length > 0 && (
        <p className="text-center text-[11px] uppercase tracking-wider text-muted-foreground font-light mt-6">
          Fim da lista
        </p>
      )}
    </>
  );
};

export default InfiniteContentList;
