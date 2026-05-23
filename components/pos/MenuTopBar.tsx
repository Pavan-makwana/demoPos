import { FiSearch, FiFilter, FiChevronDown } from "react-icons/fi";
interface MenuTopBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
}
export default function MenuTopBar({
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
}: MenuTopBarProps) {
  return (
    <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row">
      
      <div className="relative flex-1">
        
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          
          <FiSearch className="text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-xl border border-border bg-input p-2.5 pl-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="relative w-full sm:w-48">
        
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          
          <FiFilter className="text-muted-foreground" />
        </div>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="block w-full appearance-none rounded-xl border border-border bg-input p-2.5 pl-10 pr-10 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
        >
          
          <option value="default">Default Sort</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <FiChevronDown className="text-muted-foreground" size={16} />
        </div>
      </div>
    </div>
  );
}
