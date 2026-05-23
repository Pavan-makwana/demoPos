interface CategoryScrollerProps {
  categories: any[];
  activeCategory: string;
  setActiveCategory: (id: string) => void;
}

export default function CategoryScroller({
  categories,
  activeCategory,
  setActiveCategory,
}: CategoryScrollerProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md px-5 py-4 flex gap-3 overflow-x-auto scrollbar-hide shadow-sm border-b border-border">
      <button
        onClick={() => setActiveCategory("All")}
        className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
          activeCategory === "All"
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-card text-muted-foreground border border-border hover:bg-muted"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setActiveCategory(cat.id)}
          className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
            activeCategory === cat.id
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card text-muted-foreground border border-border hover:bg-muted"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
