"use client";

import { useEffect, useState } from "react";
import MenuGrid from "../../../components/pos/MenuGrid";
import CartSidebar from "../../../components/pos/CartSidebar";
import { useCartStore } from "../../../lib/store";
import { FiShoppingCart, FiX, FiLoader, FiLock, FiPlay } from "react-icons/fi";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../lib/AuthContext";
import { openShift } from "../../../lib/actions";
import { toast } from "react-hot-toast";

import CheckoutModal from "../../../components/pos/CheckoutModal";

export default function POSPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cart, setActiveOrder } = useCartStore();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const { tenantId, user } = useAuth();
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [startingCash, setStartingCash] = useState("");
  const [isOpeningShift, setIsOpeningShift] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  // Listen to order items marked as ready in the kitchen to show toasts
  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, "orders"),
      where("tenantId", "==", tenantId),
      where("status", "==", "pending")
    );

    let isInitial = true;
    const preparedIds = new Set<string>();

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const order = change.doc.data();
        const orderId = change.doc.id;
        const tableInfo = order.orderType === "dine_in" ? `Table ${order.tableNumber}` : "Takeaway";
        
        const items = order.items || [];
        items.forEach((item: any) => {
          const uniqueKey = `${orderId}-${item.cartItemId || item.itemId}`;
          
          if (item.prepared) {
            if (!isInitial && !preparedIds.has(uniqueKey)) {
              toast.success(`${item.name} for ${tableInfo} is ready for pickup!`, {
                duration: 5000,
                style: {
                  background: '#10B981',
                  color: '#fff',
                  fontWeight: 'bold',
                }
              });
            }
            preparedIds.add(uniqueKey);
          } else {
            preparedIds.delete(uniqueKey);
          }
        });
      });
      isInitial = false;
    });

    return () => unsub();
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    const q = query(
      collection(db, "shifts"),
      where("tenantId", "==", tenantId),
      where("status", "==", "open")
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setActiveShift({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setActiveShift(null);
      }
      setLoadingShift(false);
    });
    return () => unsub();
  }, [tenantId]);

  // Listen to pending desk payments
  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, "orders"),
      where("tenantId", "==", tenantId),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.paymentStatus === "unpaid" || data.paymentStatus === "pending") {
          list.push({ id: doc.id, ...data });
        }
      });
      // Sort by createdAt descending
      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setPendingPayments(list);
    });

    return () => unsub();
  }, [tenantId]);

  const handleSettlePendingOrder = (order: any) => {
    setActiveOrder(
      order.id,
      order.items || [],
      order.tableNumber || "",
      order.orderType || "dine_in"
    );
    setIsCheckoutOpen(true);
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;
    setIsOpeningShift(true);
    try {
      const res = await openShift(Number(startingCash) || 0, user.uid, tenantId);
      if (!res.success) {
        toast.error("Failed to start register. Please try again.");
      } else {
        toast.success("Register unlocked!");
      }
    } catch (err) {
      toast.error("Error starting shift.");
    } finally {
      setIsOpeningShift(false);
    }
  };

  if (loadingShift) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <FiLoader className="animate-spin text-3xl text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-background font-['DM_Sans',sans-serif]">
      {/* ── Register Shift Lock Overlay ── */}
      {!activeShift && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl text-center sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 animate-pulse">
              <FiLock size={28} />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">Register Locked</h2>
            <p className="text-sm font-semibold text-muted-foreground mb-6">
              There is no active shift open for this register. Enter your starting cash float to unlock the POS and start taking orders.
            </p>
            <form onSubmit={handleStartShift} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Starting Cash Float (₹)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 2000"
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                  className="w-full rounded-xl border border-border bg-input p-3 text-sm text-foreground focus:border-primary outline-none font-bold"
                />
              </div>
              <button
                type="submit"
                disabled={isOpeningShift}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {isOpeningShift ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <>
                    <FiPlay /> Open Shift & Unlock POS
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Pending Desk Payments Bar ── */}
      {pendingPayments.length > 0 && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 shrink-0 animate-fade-in-down">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider shrink-0">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            Desk Payments Pending ({pendingPayments.length})
          </div>
          <div 
            className="flex overflow-x-auto max-w-full gap-2 py-1.5 [&::-webkit-scrollbar]:hidden w-full"
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
            {pendingPayments.map((order) => (
              <div
                key={order.id}
                className="bg-card border border-border rounded-xl px-3 py-1.5 flex items-center gap-3 shadow-sm hover:border-amber-500/50 transition-all shrink-0"
              >
                <div className="text-left leading-none">
                  <p className="text-[11px] font-bold text-foreground whitespace-nowrap">
                    {order.orderType === "dine_in"
                      ? `Table ${order.tableNumber || "N/A"}`
                      : `Takeaway #${order.id.slice(-4).toUpperCase()}`}
                  </p>
                  <p className="text-xs font-black text-amber-600 dark:text-amber-400 mt-1 whitespace-nowrap">
                    ₹{order.total?.toFixed(0)}
                  </p>
                </div>
                <button
                  onClick={() => handleSettlePendingOrder(order)}
                  className="rounded-lg bg-amber-500 px-3 py-1 text-[11px] font-black text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
                >
                  Settle Bill
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Split Content Area */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* ── Menu Grid (always visible, full width on mobile) ── */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <MenuGrid />
        </div>

        {/* ── Cart Sidebar: hidden on mobile, visible on md+ ── */}
        <div className="hidden md:flex">
          <CartSidebar
            onClose={() => {}}
            isCheckoutOpen={isCheckoutOpen}
            setIsCheckoutOpen={setIsCheckoutOpen}
          />
        </div>
      </div>

      {/*  MOBILE ONLY*/}

      {/* Floating Cart Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-5 z-40 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-900/40 transition-transform active:scale-95 md:hidden"
      >
        <FiShoppingCart size={18} />
        <span>View Order</span>
        {totalItems > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-black text-emerald-700">
            {totalItems}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl border-t border-border bg-card transition-transform duration-300 ease-out md:hidden h-[85dvh] ${
          isCartOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-secondary" />
        </div>

        {/* Sheet header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-bold text-foreground">Current Order</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Cart content */}
        <div className="flex-1 min-h-0">
          <CartSidebar
            onClose={() => setIsCartOpen(false)}
            mobileSheet
            isCheckoutOpen={isCheckoutOpen}
            setIsCheckoutOpen={setIsCheckoutOpen}
          />
        </div>
      </div>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </div>
  );
}
