import { CATEGORY_COLORS } from "./MenuGrid";

interface CategoryTabsProps {
  categories: any[];
  activeCategory: string;
  setActiveCategory: (categoryId: string) => void;
  colorMap: Record<string, number>;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  setActiveCategory,
  colorMap,
}: CategoryTabsProps) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 scrollbar-hide mt-3">
      {/* All Items tab — neutral blue */}
      <button
        onClick={() => setActiveCategory("All")}
        className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
          activeCategory === "All"
            ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
            : "bg-muted text-muted-foreground hover:bg-hover hover:text-foreground border border-border"
        }`}
      >
        All Items
      </button>

      {categories.map((cat) => {
        const idx = colorMap[cat.id] ?? 0;
        const color = CATEGORY_COLORS[idx];
        const active = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              active
                ? `${color.tab} ${color.tabText} shadow-md`
                : "bg-muted text-muted-foreground hover:bg-hover hover:text-foreground border border-border"
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
