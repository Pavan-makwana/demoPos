import { FiPlus, FiMinus } from "react-icons/fi";

interface MenuItemCardProps {
  item: any;
  cartItem: any | undefined;
  onAdd: (item: any) => void;
  onRemove: (itemId: string) => void;
}

export default function MenuItemCard({
  item,
  cartItem,
  onAdd,
  onRemove,
}: MenuItemCardProps) {
  return (
    <div className="flex gap-4 rounded-3xl bg-card p-4 shadow-sm border border-border">
      <div className="h-24 w-24 shrink-0 rounded-2xl bg-muted flex items-center justify-center text-3xl">
        ☕ {/* Placeholder for food image */}
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-bold text-foreground leading-tight">
            {item.name}
          </h3>
          <p className="text-sm font-black text-primary mt-1">₹{item.price}</p>
        </div>

        <div className="flex justify-end">
          {cartItem ? (
            <div className="flex items-center gap-3 bg-primary/10 rounded-xl p-1 border border-primary/20">
              <button
                onClick={() => onRemove(item.id)}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-card text-primary shadow-sm hover:bg-primary/20"
              >
                <FiMinus />
              </button>
              <span className="font-bold w-4 text-center text-sm">
                {cartItem.quantity}
              </span>
              <button
                onClick={() => onAdd(item)}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm hover:opacity-90"
              >
                <FiPlus />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(item)}
              className="rounded-xl bg-card border-2 border-border px-6 py-2 text-sm font-bold text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              ADD +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
