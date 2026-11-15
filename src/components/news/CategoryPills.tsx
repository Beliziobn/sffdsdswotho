import React from "react";
import {
  Layers,
  Tv,
  BookOpen,
  Smartphone,
  Library,
  Cpu,
  Gamepad2,
  Sparkles,
  Trophy,
  TrendingUp,
  Flame,
  ListOrdered,
  Landmark,
  Globe,
  Atom,
  Dribbble,
  Medal,
  Shirt,
} from "lucide-react";
import { useGeoLanguage } from "@/lib/geoLanguage";

interface Props {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  all: Layers,
  Futebol: Trophy,
  Basquete: Dribbble,
  Desportos: Medal,
  "Geopolítica": Globe,
  Animes: Tv,
  "Mangás": BookOpen,
  Webtoons: Smartphone,
  Tecnologias: Cpu,
  Moda: Shirt,
  Games: Gamepad2,
  Cultura: Sparkles,
  Livros: Library,
  Mercado: TrendingUp,
  Virais: Flame,
  Listas: ListOrdered,
  "Política": Landmark,
  Geografia: Globe,
  "Ciência": Atom,
};

/** Horizontally scrollable pill filter bar with category icons and elegant badges */
const CategoryPills = ({ categories, value, onChange }: Props) => {
  const { language, t } = useGeoLanguage();

  return (
    <div className="-mx-6 px-6 lg:mx-0 lg:px-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
      <div className="flex items-center gap-2 w-max pb-1">
        {["all", ...categories].map((c) => {
          const active = value.toLowerCase() === c.toLowerCase();
          const Icon = CATEGORY_ICONS[c] || Sparkles;

          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition-all duration-300 font-medium ${
                active
                  ? "bg-foreground text-background border-foreground shadow-sm scale-[1.02]"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent/60 hover:border-foreground/20"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "text-background" : "text-muted-foreground"}`} />
              <span>
                {c === "all"
                  ? language === "en"
                    ? "All Categories"
                    : "Todas as Categorias"
                  : t(c)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryPills;
