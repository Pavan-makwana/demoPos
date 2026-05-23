import { FiX, FiActivity, FiDollarSign } from "react-icons/fi";
import { MdOutlineTableRestaurant } from "react-icons/md";

interface ViewActiveOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
  tableNumber: string;
}

export default function ViewActiveOrderModal({
  isOpen,
  onClose,
  order,
  tableNumber,
}: ViewActiveOrderModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl sm:p-8 font-['DM_Sans',sans-serif]">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <MdOutlineTableRestaurant size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">Table {tableNumber}</h2>
              <p className="text-xs font-semibold text-rose-500">Occupied • Active Order</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 bg-muted p-4 rounded-2xl border border-border">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
              Kitchen Status
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-foreground capitalize">
              <FiActivity size={14} className="text-amber-500 animate-pulse" />
              {order.kitchenStatus || "Pending"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
              Payment Status
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-foreground capitalize">
              <FiDollarSign size={14} className="text-amber-500" />
              {order.paymentStatus || "Pending"}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Items Ordered ({order.items?.length || 0})
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {order.items?.map((item: any, idx: number) => (
              <div
                key={item.cartItemId || idx}
                className="flex items-center justify-between bg-background p-3 rounded-xl border border-border/50 text-sm"
              >
                <div>
                  <p className="font-bold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{item.price} × {item.quantity}
                  </p>
                </div>
                <span className="font-extrabold text-foreground">₹{item.subtotal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-border pt-4 space-y-2 mb-6">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span>₹{order.subtotal?.toFixed(2)}</span>
          </div>
          {order.taxAmount > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Taxes & GST (18%)</span>
              <span>₹{order.taxAmount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 text-lg font-black text-foreground border-t border-border">
            <span>Total Bill</span>
            <span>₹{order.total?.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          Close Ticket
        </button>
      </div>
    </div>
  );
}
