import { useState } from "react";
import { FiTrash, FiMessageSquare } from "react-icons/fi";
import { CartItem, useCartStore } from "../../../lib/store";

interface CartItemRowProps {
  item: CartItem;
  removeItem: (itemId: string) => void;
  updateNote: (itemId: string, note: string) => void;
}

export default function CartItemRow({
  item,
  removeItem,
  updateNote,
}: CartItemRowProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const { updateItemQuantity } = useCartStore();

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted p-3 transition-colors hover:bg-hover">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="truncate text-sm font-semibold text-foreground">
            {item.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-muted-foreground">₹{item.price} ×</span>
            
            {/* Quantity Controller */}
            <div className="flex items-center gap-1 select-none">
              <button
                type="button"
                onClick={() => updateItemQuantity(item.itemId, item.quantity - 1)}
                className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-foreground hover:bg-hover text-[10px] font-black"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={item.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    updateItemQuantity(item.itemId, val);
                  }
                }}
                className="w-8 text-center rounded bg-background border border-border text-[10px] font-black py-0.5 outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => updateItemQuantity(item.itemId, item.quantity + 1)}
                className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-foreground hover:bg-hover text-[10px] font-black"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-3">
          {/* Changed text-white to text-foreground here */}
          <span className="text-sm font-bold text-foreground tabular-nums">
            ₹{item.subtotal}
          </span>

          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${item.notes ? "bg-amber-500/20 text-amber-700" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            <FiMessageSquare size={13} />
          </button>

          <button
            onClick={() => updateItemQuantity(item.itemId, 0)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-colors hover:bg-red-200"
            title="Remove item"
          >
            <FiTrash size={13} />
          </button>
        </div>
      </div>

      {/* Kitchen Note Input Dropdown */}
      {(showNoteInput || item.notes) && (
        <input
          type="text"
          placeholder="Add kitchen note (e.g. Extra spicy)..."
          value={item.notes || ""}
          onChange={(e) => updateNote(item.itemId, e.target.value)}
          className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground outline-none focus:border-primary"
        />
      )}
    </div>
  );
}