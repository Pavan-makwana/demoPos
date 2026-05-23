"use client";

import { FiSearch } from "react-icons/fi";

interface MenuSearchAndSortProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortOrder: "none" | "low_to_high" | "high_to_low";
  setSortOrder: (order: "none" | "low_to_high" | "high_to_low") => void;
}

export default function MenuSearchAndSort({
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
}: MenuSearchAndSortProps) {
  return (
    <div className="px-5 mt-4 space-y-3 font-['DM_Sans',sans-serif]">
      <div className="relative">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-all font-semibold shadow-sm"
        />
        <FiSearch className="absolute left-3.5 top-3.5 text-muted-foreground" size={16} />
      </div>

      {/* Sort Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap">Sort Price:</span>
        <button
          onClick={() => setSortOrder(sortOrder === "low_to_high" ? "none" : "low_to_high")}
          className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
            sortOrder === "low_to_high"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          Low to High
        </button>
        <button
          onClick={() => setSortOrder(sortOrder === "high_to_low" ? "none" : "high_to_low")}
          className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
            sortOrder === "high_to_low"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          High to Low
        </button>
      </div>
    </div>
  );
}
