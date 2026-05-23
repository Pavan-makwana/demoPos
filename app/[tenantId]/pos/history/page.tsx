"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { printReceipt } from "../../../../lib/thermal-printer";
import { FiLoader, FiClipboard } from "react-icons/fi";
import { useAuth } from "../../../../lib/AuthContext";

import HistoryTopBar from "./HistoryTopBar";
import HistoryTableRow from "./HistoryTableRow";

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [tableFilter, setTableFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const { tenantId } = useAuth();

  useEffect(() => {
    if (!tenantId) return;
    const q = query(
      collection(db, "orders"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        // THIS IS THE MAGIC LINE: It instantly hides unpaid running tabs!
        .filter((order: any) => order.paymentStatus === "paid"); 

      setOrders(fetchedOrders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const handleReprint = (order: any) => {
    printReceipt({
      orderId: order.id,
      cart: order.items,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      total: order.total,
      paymentMethod: order.payment?.method || "unknown",
    });
  };

  const getFilteredOrders = () => {
    let result = [...orders];

    // 1. Order type filter
    if (orderTypeFilter !== "all") {
      result = result.filter((o) => o.orderType === orderTypeFilter);
    }

    // 2. Table number filter (only meaningful for dine_in)
    if (orderTypeFilter === "dine_in" && tableFilter.trim() !== "") {
      const q = tableFilter.toLowerCase();
      result = result.filter(
        (o) => o.tableNumber && o.tableNumber.toLowerCase().includes(q),
      );
    }

    // 3. Payment filter
    if (paymentFilter !== "all") {
      result = result.filter((o) => o.payment?.method === paymentFilter);
    }

    return result;
  };

  const displayedOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <FiLoader size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background p-4 md:p-8 font-['DM_Sans',sans-serif]">
      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <FiClipboard size={20} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
              Order Ledger
            </h1>
            <p className="text-xs text-muted-foreground">
              Filter by order type, table, or payment
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-bold text-primary">
          {displayedOrders.length} Orders Found
        </span>
      </div>

      <HistoryTopBar
        tableFilter={tableFilter}
        setTableFilter={setTableFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        orderTypeFilter={orderTypeFilter}
        setOrderTypeFilter={setOrderTypeFilter}
      />

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-semibold">Order ID</th>
                <th className="px-5 py-4 font-semibold">Time</th>
                <th className="px-5 py-4 font-semibold">Type</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 font-semibold text-right">Total</th>
                <th className="px-5 py-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.map((order) => (
                <HistoryTableRow
                  key={order.id}
                  order={order}
                  handleReprint={handleReprint}
                />
              ))}

              {displayedOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    No matching orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}