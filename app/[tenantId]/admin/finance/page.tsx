"use client";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { FiPlus, FiLoader, FiAlertTriangle, FiDownload } from "react-icons/fi";
import FinanceStats from "./FinanceStats";
import FinanceTable from "./FinanceTable";
import FinanceModal from "./FinanceModal";
import DayWiseTable from "./DayWiseTable";
import { useAuth } from "../../../../lib/AuthContext";
import { syncMenuItemAvailability } from "../../../../lib/actions";
import * as XLSX from "xlsx";

export default function FinanceManager() {
  const { tenantId, features } = useAuth();

  if (features && features.analytics === false) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground text-center p-6 font-['DM_Sans',sans-serif]">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 mb-2">
          <FiAlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-black text-rose-600">Module Disabled</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          The Sales Analytics & Financials module has been deactivated for your workspace by the SaaS Super Admin.
        </p>
      </div>
    );
  }

  const [expenses, setExpenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "year" | "all">("all");
  const categories = [
    { id: "supplies", label: "Raw Materials & Supplies" },
    { id: "payroll", label: "Staff Payroll" },
    { id: "utilities", label: "Rent & Utilities" },
    { id: "marketing", label: "Marketing & Ads" },
    { id: "maintenance", label: "Maintenance & Repairs" },
  ];

  useEffect(() => {
    if (!tenantId) return;

    const qExpenses = query(
      collection(db, "expenses"),
      where("tenantId", "==", tenantId),
      orderBy("date", "desc"),
    );
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const qOrders = query(
      collection(db, "orders"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc")
    );
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const qInv = query(
      collection(db, "inventory"),
      where("tenantId", "==", tenantId)
    );
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      setInventoryItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubExpenses();
      unsubOrders();
      unsubInv();
    };
  }, [tenantId]);
  const handleDelete = async (id: string, description: string) => {
    if (window.confirm(`Delete expense: ${description}?`)) {
      const expenseRef = doc(db, "expenses", id);
      const expenseSnap = await getDoc(expenseRef);
      if (expenseSnap.exists()) {
        const expenseData = expenseSnap.data();
        await deleteDoc(expenseRef);

        if (!expenseData.paymentMethod || expenseData.paymentMethod === "cash") {
          const shiftQ = query(
            collection(db, "shifts"),
            where("tenantId", "==", tenantId),
            where("status", "==", "open")
          );
          const shiftSnap = await getDocs(shiftQ);
          if (!shiftSnap.empty) {
            const shiftRef = doc(db, "shifts", shiftSnap.docs[0].id);
            const shiftStart = shiftSnap.docs[0].data().startTime;
            const expenseDate = expenseData.date;
            if (expenseDate && shiftStart && expenseDate.toDate().getTime() >= shiftStart.toDate().getTime()) {
              const batch = writeBatch(db);
              batch.update(shiftRef, {
                totalCashExpenses: increment(-expenseData.amount)
              });
              await batch.commit();
            }
          }
        }
      }
    }
  };
  const handleAddExpense = async (data: {
    description: string;
    amount: number;
    category: string;
    date: string;
    isInventoryPurchase?: boolean;
    inventoryItemId?: string | null;
    quantity?: number | null;
    billImageUrl?: string | null;
    paymentMethod?: string;
  }) => {
    if (!tenantId) return;

    const batch = writeBatch(db);

    // Step 1: Add the expense
    const expenseRef = doc(collection(db, "expenses"));
    batch.set(expenseRef, {
      tenantId,
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: Timestamp.fromDate(new Date(data.date)),
      createdAt: Timestamp.now(),
      isInventoryPurchase: data.isInventoryPurchase || false,
      inventoryItemId: data.inventoryItemId || null,
      quantity: data.quantity || null,
      billImageUrl: data.billImageUrl || null,
      paymentMethod: data.paymentMethod || "cash",
    });

    // Step 2: Auto increment stock level of raw material if checked
    if (data.isInventoryPurchase && data.inventoryItemId && data.quantity) {
      const invRef = doc(db, "inventory", data.inventoryItemId);
      batch.update(invRef, {
        currentStock: increment(data.quantity),
      });
    }

    // Step 3: Update open shift total cash expenses dynamically if cash
    if (!data.paymentMethod || data.paymentMethod === "cash") {
      const shiftQ = query(
        collection(db, "shifts"),
        where("tenantId", "==", tenantId),
        where("status", "==", "open")
      );
      const shiftSnap = await getDocs(shiftQ);
      if (!shiftSnap.empty) {
        const shiftRef = doc(db, "shifts", shiftSnap.docs[0].id);
        batch.update(shiftRef, {
          totalCashExpenses: increment(data.amount)
        });
      }
    }

    await batch.commit();
    await syncMenuItemAvailability(tenantId);
  };
  const filterByTimeframe = (items: any[], dateField: string = "date") => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return items.filter((item) => {
      if (timeFilter === "all") return true;
      const timestamp = item[dateField];
      if (!timestamp) return false;
      const dateVal = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const time = dateVal.getTime();

      if (timeFilter === "today") {
        return time >= startOfToday.getTime();
      } else if (timeFilter === "week") {
        return time >= startOfWeek.getTime();
      } else if (timeFilter === "month") {
        return time >= startOfMonth.getTime();
      } else if (timeFilter === "year") {
        return time >= startOfYear.getTime();
      }
      return true;
    });
  };

  const filteredExpenses = filterByTimeframe(expenses, "date");
  const filteredOrders = filterByTimeframe(orders, "createdAt");

  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + (exp.amount || 0),
    0,
  );
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const netProfit = totalRevenue - totalExpenses;

  const handleExportSheet = () => {
    const summaryData = [
      { Metric: "Timeframe Filter", Value: timeFilter.toUpperCase() },
      { Metric: "Total Revenue", Value: totalRevenue },
      { Metric: "Total Orders Count", Value: totalOrdersCount },
      { Metric: "Total Expenses Outflow", Value: totalExpenses },
      { Metric: "Total Expenses Count", Value: filteredExpenses.length },
      { Metric: "Net Profit / Loss", Value: netProfit },
      { Metric: "Export Date", Value: new Date().toLocaleString() }
    ];

    const expensesSheetData = filteredExpenses.map(exp => {
      const expDate = exp.date?.toDate 
        ? exp.date.toDate().toLocaleString() 
        : new Date(exp.date).toLocaleString();
      return {
        "Expense ID": exp.id,
        "Description": exp.description,
        "Category": exp.category,
        "Amount": exp.amount,
        "Payment Method": exp.paymentMethod || "cash",
        "Date": expDate,
        "Inventory Purchase": exp.isInventoryPurchase ? "YES" : "NO",
      };
    });

    const salesSheetData = filteredOrders.map(order => {
      const orderDate = order.createdAt?.toDate 
        ? order.createdAt.toDate().toLocaleString() 
        : new Date(order.createdAt).toLocaleString();
      return {
        "Order ID": order.id,
        "Customer Name": order.customer?.name || "Walk-in",
        "Phone": order.customer?.phone || "N/A",
        "Subtotal": order.subtotal || 0,
        "Tax Amount": order.taxAmount || 0,
        "Total Paid": order.total || 0,
        "Payment Method": order.payment?.method?.toUpperCase() || "N/A",
        "Date": orderDate
      };
    });

    const wb = XLSX.utils.book_new();
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    
    const wsExpenses = XLSX.utils.json_to_sheet(expensesSheetData);
    XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");
    
    const wsSales = XLSX.utils.json_to_sheet(salesSheetData);
    XLSX.utils.book_append_sheet(wb, wsSales, "Sales & Revenue");

    XLSX.writeFile(wb, `FinancialReport_${timeFilter}_${new Date().getTime()}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <FiLoader className="animate-spin text-2xl text-primary" />
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto bg-background p-4 md:p-8 ">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            Financials
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your daily cash outflow and operating expenses.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:w-auto">
          <button
            onClick={handleExportSheet}
            className="flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-4 py-3 text-sm sm:text-base font-bold text-foreground transition-all hover:bg-muted active:scale-[0.98] cursor-pointer w-full sm:w-auto"
          >
            <FiDownload className="text-base sm:text-lg" /> Export Sheet
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm sm:text-base font-bold text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.98] cursor-pointer w-full sm:w-auto"
          >
            <FiPlus className="text-lg sm:text-xl" /> Log Expense
          </button>
        </div>
      </div>
      {/* Time Range Filter Tabs */}
      <div 
        className="mb-6 flex overflow-x-auto max-w-full gap-2 rounded-2xl bg-card p-1.5 border border-border shadow-sm w-full sm:w-fit whitespace-nowrap [&::-webkit-scrollbar]:hidden"
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        {[
          { id: "today", label: "Today" },
          { id: "week", label: "This Week" },
          { id: "month", label: "This Month" },
          { id: "year", label: "This Year" },
          { id: "all", label: "All Time" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTimeFilter(tab.id as any)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 outline-none cursor-pointer shrink-0 ${timeFilter === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <FinanceStats
        totalExpenses={totalExpenses}
        expenseCount={filteredExpenses.length}
        totalRevenue={totalRevenue}
        totalOrdersCount={totalOrdersCount}
        netProfit={netProfit}
      />
      <DayWiseTable orders={filteredOrders} expenses={filteredExpenses} />

      <div className="mb-4 text-lg font-black text-foreground">Recent Expenses</div>
      <FinanceTable
        expenses={filteredExpenses}
        categories={categories}
        onDelete={handleDelete}
      />
      <FinanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddExpense}
        categories={categories}
        inventoryItems={inventoryItems}
      />
    </div>
  );
}
