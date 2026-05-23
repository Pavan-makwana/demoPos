import { FiPlus } from "react-icons/fi";
import { MenuItem } from "../../types/schema";
import { CATEGORY_COLORS } from "./MenuGrid";

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  colorIdx: number;
}

export default function MenuItemCard({
  item,
  onAdd,
  colorIdx,
}: MenuItemCardProps) {
  const color = CATEGORY_COLORS[colorIdx];

  return (
    <button
      onClick={() => onAdd(item)}
      className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-ring hover:bg-hover hover:shadow-lg active:scale-95"
    >
      {/* Item name */}
      <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
        {item.name}
      </p>

      {/* Price + add icon */}
      <div className="flex items-center justify-between">
        <span className={`text-base font-bold ${color.header}`}>
          ₹{item.price}
        </span>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 ${color.tab} ${color.tabText}`}
        >
          <FiPlus size={13} />
        </span>
      </div>
    </button>
  );
}
