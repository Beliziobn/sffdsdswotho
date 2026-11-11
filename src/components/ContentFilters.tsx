import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, X } from "lucide-react";
import type { ContentFilters, SortKey } from "@/hooks/useContentFeed";

export interface FilterOptions {
  categories: string[];
  tags: string[];
  languages: string[];
  formats: string[];
  years: number[];
}

/** Keeps the filter state in the URL so any view is shareable. */
export const useUrlFilters = (defaults: Partial<ContentFilters> = {}) => {
  const [params, setParams] = useSearchParams();

  const filters: ContentFilters = useMemo(
    () => ({
      ...defaults,
      sort: (params.get("sort") as SortKey) ?? defaults.sort ?? "recent",
      category: params.get("categoria") ?? "all",
      language: params.get("idioma") ?? "all",
      format: params.get("formato") ?? "all",
      tags: params.get("tags") ? params.get("tags")!.split(",").filter(Boolean) : undefined,
      minRating: params.get("nota") ? Number(params.get("nota")) : undefined,
      year: params.get("ano") ? Number(params.get("ano")) : undefined,
      maxPriceCents: params.get("preco") ? Number(params.get("preco")) : undefined,
      maxReadTime: params.get("tempo") ? Number(params.get("tempo")) : undefined,
      free: params.get("gratis") === "1" || undefined,
      q: params.get("q") ?? undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params],
  );

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(params);
      if (!value || value === "all" || value === "") next.delete(key);
      else next.set(key, value);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);
  const hasFilters = Array.from(params.keys()).length > 0;

  return { filters, setFilter, clear, hasFilters, params };
};

interface Props {
  options: FilterOptions;
  showPrice?: boolean;
}

const ContentFiltersBar = ({ options, showPrice = true }: Props) => {
  const { setFilter, clear, hasFilters, params } = useUrlFilters();
  const value = (key: string) => params.get(key) ?? "all";

  return (
    <div className="mb-10 space-y-4">
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => setFilter("q", e.target.value)}
          placeholder="Buscar por título, autor ou tema"
          className="pl-9 text-sm font-light"
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={params.get("sort") ?? "recent"} onValueChange={(v) => setFilter("sort", v)}>
            <SelectTrigger className="w-[170px] text-sm font-light">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="popular">Mais populares</SelectItem>
              <SelectItem value="rating">Melhor avaliados</SelectItem>
              <SelectItem value="price-low">Preço: menor primeiro</SelectItem>
              <SelectItem value="price-high">Preço: maior primeiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {options.categories.length > 0 && (
          <Select value={value("categoria")} onValueChange={(v) => setFilter("categoria", v)}>
            <SelectTrigger className="w-[170px] text-sm font-light">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {options.categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {options.tags.length > 0 && (
          <Select value={params.get("tags") ?? "all"} onValueChange={(v) => setFilter("tags", v)}>
            <SelectTrigger className="w-[150px] text-sm font-light">
              <SelectValue placeholder="Gênero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os gêneros</SelectItem>
              {options.tags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {options.languages.length > 0 && (
          <Select value={value("idioma")} onValueChange={(v) => setFilter("idioma", v)}>
            <SelectTrigger className="w-[130px] text-sm font-light">
              <SelectValue placeholder="Idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os idiomas</SelectItem>
              {options.languages.map((l) => (
                <SelectItem key={l} value={l}>
                  {l.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {options.formats.length > 0 && (
          <Select value={value("formato")} onValueChange={(v) => setFilter("formato", v)}>
            <SelectTrigger className="w-[130px] text-sm font-light">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os formatos</SelectItem>
              {options.formats.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={params.get("nota") ?? "all"} onValueChange={(v) => setFilter("nota", v)}>
          <SelectTrigger className="w-[150px] text-sm font-light">
            <SelectValue placeholder="Avaliação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer avaliação</SelectItem>
            <SelectItem value="3">3+ estrelas</SelectItem>
            <SelectItem value="4">4+ estrelas</SelectItem>
            <SelectItem value="4.5">4.5+ estrelas</SelectItem>
          </SelectContent>
        </Select>

        {options.years.length > 0 && (
          <Select value={params.get("ano") ?? "all"} onValueChange={(v) => setFilter("ano", v)}>
            <SelectTrigger className="w-[120px] text-sm font-light">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer ano</SelectItem>
              {options.years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={params.get("tempo") ?? "all"} onValueChange={(v) => setFilter("tempo", v)}>
          <SelectTrigger className="w-[160px] text-sm font-light">
            <SelectValue placeholder="Tempo de leitura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer duração</SelectItem>
            <SelectItem value="10">Até 10 min</SelectItem>
            <SelectItem value="30">Até 30 min</SelectItem>
            <SelectItem value="120">Até 2 h</SelectItem>
          </SelectContent>
        </Select>

        {showPrice && (
          <Select value={params.get("gratis") === "1" ? "free" : (params.get("preco") ?? "all")} onValueChange={(v) => {
            if (v === "free") {
              setFilter("preco", undefined);
              setFilter("gratis", "1");
            } else {
              setFilter("gratis", undefined);
              setFilter("preco", v === "all" ? undefined : v);
            }
          }}>
            <SelectTrigger className="w-[150px] text-sm font-light">
              <SelectValue placeholder="Preço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer preço</SelectItem>
              <SelectItem value="free">Grátis</SelectItem>
              <SelectItem value="2000">Até 20</SelectItem>
              <SelectItem value="5000">Até 50</SelectItem>
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-[11px] uppercase tracking-wider font-normal text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
};

export default ContentFiltersBar;
