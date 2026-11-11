import { useMemo } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InfiniteContentList from "@/components/InfiniteContentList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useContentFeed } from "@/hooks/useContentFeed";
import type { ContentType } from "@/hooks/useContents";

const TYPES: Array<{ value: ContentType | "all"; label: string }> = [
  { value: "all", label: "Tudo" },
  { value: "book", label: "Livros" },
  { value: "webtoon", label: "Webtoons" },
  { value: "news", label: "Notícias" },
  { value: "academic", label: "Acadêmicos" },
];

const Search = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const type = (params.get("tipo") as ContentType | "all") ?? "all";

  const setParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all" || value === "") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const feed = useContentFeed({ q, type, sort: "popular" });
  const items = useMemo(() => feed.data?.pages.flatMap((p) => p.items) ?? [], [feed.data]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation variant="dark" />

      <main className="pt-36 pb-24 px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-10">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">Busca</span>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-6">
              O que você quer ler hoje?
            </h1>
            <div className="relative max-w-md mx-auto">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                defaultValue={q}
                onChange={(e) => setParam("q", e.target.value)}
                placeholder="Título, autor, tema…"
                className="pl-9 text-sm font-light"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {TYPES.map((t) => (
              <Button
                key={t.value}
                variant={type === t.value ? "default" : "outline"}
                size="sm"
                className="rounded-full text-[11px] uppercase tracking-wider font-normal px-5"
                onClick={() => setParam("tipo", t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          <InfiniteContentList
            items={items}
            isLoading={feed.isLoading}
            isFetchingNextPage={feed.isFetchingNextPage}
            hasNextPage={feed.hasNextPage}
            fetchNextPage={feed.fetchNextPage}
            emptyLabel={q ? "Nada encontrado para essa busca." : "Comece a escrever para buscar."}
          />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Search;
