"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useCartStore } from "../../lib/store";
import { processCheckout, saveRunningTab } from "../../lib/actions";
import { useAuth } from "../../lib/AuthContext";
import { FiShoppingCart } from "react-icons/fi";
import toast from "react-hot-toast";

import CheckoutModal from "./CheckoutModal";
import TableSelectorModal from "./TableSelectorModal";

import CartHeader from "./cart/CartHeader";
import CartItemRow from "./cart/CartItemRow";
import CartFooter from "./cart/CartFooter";

interface CartSidebarProps {
  onClose: () => void;
  mobileSheet?: boolean;
  isCheckoutOpen?: boolean;
  setIsCheckoutOpen?: (val: boolean) => void;
}

export default function CartSidebar({
  onClose,
  mobileSheet = false,
  isCheckoutOpen,
  setIsCheckoutOpen,
}: CartSidebarProps) {
  const {
    cart,
    subtotal,
    taxAmount,
    total,
    removeItem,
    updateItemNote,
    clearCart,
    orderType,
    setOrderType,
    tableNumber,
    activeOrderId,
  } = useCartStore();
  const [localCheckoutOpen, setLocalCheckoutOpen] = useState(false);
  const isCheckoutModalOpen = isCheckoutOpen !== undefined ? isCheckoutOpen : localCheckoutOpen;
  const setIsCheckoutModalOpen = setIsCheckoutOpen !== undefined ? setIsCheckoutOpen : setLocalCheckoutOpen;

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const params = useParams();
  const routeTenantId = params?.tenantId as string;
  const { tenantId: authTenantId } = useAuth();
  const tenantId = routeTenantId || authTenantId;

  // Sends to kitchen without taking payment (Running Tab)
  const handleSendToKitchen = async () => {
    // Optional: Start a loading toast
    const toastId = toast.loading("Sending to kitchen...");
    const payload = {
      tenantId,
      activeOrderId,
      cart,
      subtotal,
      taxAmount,
      total,
      orderType,
      tableNumber,
    };

    const result = await saveRunningTab(payload);

    if (result.success) {
      // Update the loading toast to a success toast
      toast.success("Sent to kitchen! Table is now active.", { id: toastId });
      clearCart();
      if (mobileSheet) {
        setTimeout(onClose, 500); // Close sheet slightly faster now
      }
    } else {
      // Update the loading toast to an error toast
      toast.error("Failed to send to kitchen.", { id: toastId });
    }
  };

  return (
    <div
      className={[
        "flex flex-col font-['DM_Sans',sans-serif]",
        mobileSheet
          ? "h-full w-full"
          : "h-full w-80 border-l border-border bg-card xl:w-96",
      ].join(" ")}
    >
      <CartHeader
        orderType={orderType}
        setOrderType={setOrderType}
        tableNumber={tableNumber}
        onOpenTableSelector={() => setIsTableModalOpen(true)}
        mobileSheet={mobileSheet}
      />

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FiShoppingCart size={22} />
            </div>
            <p className="text-sm">Cart is empty</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {cart.map((item) => (
              <CartItemRow
                key={item.cartItemId}
                item={item}
                removeItem={removeItem}
                updateNote={updateItemNote}
              />
            ))}
          </div>
        )}
      </div>

      <CartFooter
        subtotal={subtotal}
        taxAmount={taxAmount}
        total={total}
        cartLength={cart.length}
        orderType={orderType}
        tableNumber={tableNumber}
        activeOrderId={activeOrderId}
        onSendToKitchen={handleSendToKitchen}
        onSettleBill={() => setIsCheckoutModalOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => {
          setIsCheckoutModalOpen(false);
          if (mobileSheet) onClose();
        }}
      />

      <TableSelectorModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />
    </div>
  );
}
