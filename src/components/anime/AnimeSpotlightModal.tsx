import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Tv, BookOpen, CornerDownLeft, Sparkles, X } from "lucide-react";
import { ANIMES_DATA, Anime } from "@/lib/animes";
import { getAnimeAmbientTheme, isOriginalAnimationWork } from "@/lib/canonBridge";

interface SpotlightResult {
  id: string;
  anime: Anime;
  mode: "anime" | "manga" | "episode";
  label: string;
  sublabel: string;
  href: string;
  badgeText: string;
}

interface AnimeSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const AnimeSpotlightModal = ({
  isOpen,
  onClose,
  initialQuery = "",
}: AnimeSpotlightModalProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [isOpen, initialQuery]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const results = useMemo<SpotlightResult[]>(() => {
    const raw = query.trim();
    const q = raw.toLowerCase();

    // Parse deep-link patterns: "one piece ep 4", "ep 4", "cap 8", "frieren cap 12"
    const epMatch = q.match(/(?:^|\s)(?:ep|epis[oó]dio|e)\s*\.?\s*(\d+)\b/i);
    const capMatch = q.match(/(?:^|\s)(?:cap|cap[ií]tulo|c|ch)\s*\.?\s*(\d+)\b/i);
    const cleanedTitleTerm = q
      .replace(/(?:^|\s)(?:ep|epis[oó]dio|e|cap|cap[ií]tulo|c|ch)\s*\.?\s*\d+\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!q) {
      // Quick curated suggestions
      return ANIMES_DATA.slice(0, 6).map((anime) => {
        const original = isOriginalAnimationWork(anime);
        return {
          id: `quick-${anime.id}`,
          anime,
          mode: "anime",
          label: anime.title,
          sublabel: `${anime.studio} · ${anime.episodesCount} eps · ★ ${anime.rating.toFixed(1)}`,
          href: `/animes/${anime.id}`,
          badgeText: original ? "Original" : "Anime & Mangá",
        };
      });
    }

    const list: SpotlightResult[] = [];
    const matchedAnimes = ANIMES_DATA.filter((anime) => {
      if (!cleanedTitleTerm) return true;
      return (
        anime.title.toLowerCase().includes(cleanedTitleTerm) ||
        anime.japaneseTitle.toLowerCase().includes(cleanedTitleTerm) ||
        anime.studio.toLowerCase().includes(cleanedTitleTerm) ||
        anime.season.toLowerCase().includes(cleanedTitleTerm) ||
        anime.genres.some((g) => g.toLowerCase().includes(cleanedTitleTerm)) ||
        anime.seasons?.some((s) => s.title.toLowerCase().includes(cleanedTitleTerm))
      );
    }).slice(0, 8);

    for (const anime of matchedAnimes) {
      if (epMatch) {
        const epNum = Math.max(1, parseInt(epMatch[1], 10));
        list.push({
          id: `ep-${anime.id}-${epNum}`,
          anime,
          mode: "episode",
          label: `${anime.title} — Episódio ${epNum}`,
          sublabel: `Ir direto para o player do Episódio ${epNum} (${anime.studio})`,
          href: `/animes/${anime.id}?tab=episodes&ep=${epNum}`,
          badgeText: `Ep. ${epNum}`,
        });
      }

      if (capMatch && !isOriginalAnimationWork(anime)) {
        const capNum = Math.max(1, parseInt(capMatch[1], 10));
        list.push({
          id: `cap-${anime.id}-${capNum}`,
          anime,
          mode: "manga",
          label: `${anime.manga?.title || anime.title} — Capítulo ${capNum}`,
          sublabel: `Abrir Mangá no Capítulo ${capNum} · ${anime.manga?.author || anime.studio}`,
          href: `/animes/${anime.id}?tab=manga&chap=${capNum}`,
          badgeText: `Cap. ${capNum}`,
        });
      }

      if (!epMatch && !capMatch) {
        const original = isOriginalAnimationWork(anime);
        const matchingSeason = anime.seasons?.find((s) =>
          s.title.toLowerCase().includes(cleanedTitleTerm)
        );
        list.push({
          id: `anime-${anime.id}`,
          anime,
          mode: "anime",
          label: anime.title,
          sublabel: matchingSeason
            ? `${matchingSeason.title} · ${anime.studio} · ★ ${anime.rating.toFixed(1)}`
            : `${anime.studio} · ${anime.episodesCount} eps · ${getAnimeAmbientTheme(anime).logline}`,
          href: matchingSeason
            ? `/animes/${anime.id}?tab=episodes&season=${matchingSeason.seasonNumber}`
            : `/animes/${anime.id}`,
          badgeText: original ? "Original" : `${anime.episodesCount} eps`,
        });
      }
    }

    return list.slice(0, 10);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  const handleNavigate = (item: SpotlightResult) => {
    onClose();
    navigate(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length ? (prev - 1 + results.length) % results.length : 0
      );
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleNavigate(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[14vh] px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Busca rápida de animes, episódios e mangás"
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-card/95 backdrop-blur-2xl border border-border shadow-2xl overflow-hidden text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Spotlight Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Buscar obra, estúdio ou salto direto (ex: "one piece ep 4", "frieren cap 8")...'
            className="flex-1 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-muted-foreground bg-accent border border-border rounded"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[58vh] overflow-y-auto divide-y divide-border/50">
          {results.length === 0 ? (
            <div className="py-12 px-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado para “{query}”. Tente buscar por título, estúdio,{" "}
              <span className="text-foreground font-medium">ep 4</span> ou{" "}
              <span className="text-foreground font-medium">cap 8</span>.
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleNavigate(item)}
                  className={`w-full px-5 py-3.5 flex items-center gap-4 text-left transition-colors ${
                    isSelected ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                >
                  <img
                    src={item.anime.cover}
                    alt={item.anime.title}
                    className="w-10 h-14 object-cover rounded-md border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.mode === "manga" ? (
                        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : item.mode === "episode" ? (
                        <Tv className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      <span className="text-sm font-medium text-foreground truncate">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.sublabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                      {item.badgeText}
                    </span>
                    <CornerDownLeft
                      className={`h-3.5 w-3.5 transition-opacity ${
                        isSelected ? "opacity-100 text-primary" : "opacity-0"
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Shortcut Footer */}
        <div className="px-5 py-2.5 bg-secondary/40 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>↑↓ Navegar</span>
            <span>↵ Abrir</span>
            <span>ESC Fechar</span>
          </div>
          <span>Dica: digite “ep 4” ou “cap 8” para salto direto</span>
        </div>
      </div>
    </div>
  );
};

export default AnimeSpotlightModal;
