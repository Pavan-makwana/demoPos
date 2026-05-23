import {
  FiShoppingCart,
  FiChevronRight,
  FiPlus,
  FiMinus,
  FiLoader,
} from "react-icons/fi";

interface CustomerCartModalProps {
  cart: any[];
  isCartOpen: boolean;
  setIsCartOpen: (val: boolean) => void;
  onAdd: (item: any) => void;
  onRemove: (itemId: string) => void;
  onUpdateNote: (itemId: string, note: string) => void;
  subtotal: number;
  taxAmount: number;
  total: number;
  onOrder: (method: 'cash' | 'upi') => void;
  isSubmitting: boolean;
}

export default function CustomerCartModal({
  cart,
  isCartOpen,
  setIsCartOpen,
  onAdd,
  onRemove,
  onUpdateNote,
  subtotal,
  taxAmount,
  total,
  onOrder,
  isSubmitting,
}: CustomerCartModalProps) {
  if (cart.length === 0) return null;

  return (
    <>
      {/* Floating View Cart Button */}
      {!isCartOpen && (
        <div className="fixed bottom-6 left-0 right-0 px-5 z-40 animate-bounce-short">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full flex items-center justify-between rounded-2xl bg-primary p-4 text-primary-foreground shadow-2xl shadow-primary/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <FiShoppingCart size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-primary-foreground/80">
                  {cart.reduce((s, i) => s + i.quantity, 0)} Items
                </p>
                <p className="font-black">₹{total.toFixed(0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 font-bold text-sm bg-white/10 px-4 py-2 rounded-xl">
              View Cart <FiChevronRight />
            </div>
          </button>
        </div>
      )}

      {/* Slide-Up Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-foreground">Your Order</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-sm font-bold text-muted-foreground hover:text-foreground bg-muted px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.itemId} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{item.price} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-black text-foreground">
                        ₹{item.subtotal}
                      </p>
                      <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                        <button
                          onClick={() => onRemove(item.itemId)}
                          className="h-6 w-6 flex items-center justify-center rounded bg-card text-foreground shadow-sm"
                        >
                          <FiMinus size={12} />
                        </button>
                        <span className="font-bold text-xs w-2 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onAdd(item)}
                          className="h-6 w-6 flex items-center justify-center rounded bg-primary text-primary-foreground shadow-sm"
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Cooking Instructions */}
                  <input
                    type="text"
                    placeholder="Add cooking instructions (e.g. less sugar)..."
                    value={item.notes || ""}
                    onChange={(e) => onUpdateNote(item.itemId, e.target.value)}
                    className="w-full text-xs bg-input border border-border rounded-lg p-2 outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Taxes & GST (18%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 text-xl font-black text-foreground border-t border-border">
                <span>Grand Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => onOrder('cash')}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground shadow-xl shadow-primary/20 disabled:opacity-70 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {isSubmitting ? <FiLoader className="animate-spin" /> : "Pay at Desk"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
