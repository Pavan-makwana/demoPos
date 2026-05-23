import { FiCreditCard, FiPrinter } from "react-icons/fi";

interface CartFooterProps {
  subtotal: number;
  taxAmount: number;
  total: number;
  cartLength: number;
  orderType: string;
  tableNumber: string;
  activeOrderId: string | null;
  onSendToKitchen: () => void;
  onSettleBill: () => void;
}

export default function CartFooter({
  subtotal,
  taxAmount,
  total,
  cartLength,
  orderType,
  tableNumber,
  activeOrderId,
  onSendToKitchen,
  onSettleBill,
}: CartFooterProps) {
  const isDisabled =
    cartLength === 0 || (orderType === "dine_in" && !tableNumber);

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="mb-4 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">₹{subtotal.toFixed(2)}</span>
        </div>
        {taxAmount > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>GST (18%)</span>
            <span className="tabular-nums">₹{taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-dark">
          <span>Total</span>
          <span className="tabular-nums">₹{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* Sends ticket to KDS and saves to DB, keeps payment pending */}
        <button
          onClick={onSendToKitchen}
          disabled={isDisabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-900/30 transition-all hover:bg-amber-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
        >
          <FiPrinter size={16} />
          {activeOrderId ? "UPDATE KITCHEN TICKET" : "SEND TO KITCHEN"}
        </button>

        {/* Opens the payment modal to close the tab */}
        <button
          onClick={onSettleBill}
          disabled={isDisabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
        >
          <FiCreditCard size={17} />
          SETTLE BILL (₹{total.toFixed(2)})
        </button>
      </div>
    </div>
  );
}
