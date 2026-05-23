"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { MdOutlineTableRestaurant } from "react-icons/md";
import { FiUsers, FiClock, FiCheckCircle } from "react-icons/fi";
import { RiShoppingBag3Line } from "react-icons/ri"; // <-- NEW IMPORT
import { useCartStore } from "../../lib/store";
import { useAuth } from "../../lib/AuthContext";

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TableSelectorModal({
  isOpen,
  onClose,
}: TableSelectorModalProps) {
  const [zones, setZones] = useState<string[]>([]);
  const [activeZone, setActiveZone] = useState("");
  const [tables, setTables] = useState<any[]>([]);
  const [activeTabs, setActiveTabs] = useState<Record<string, any>>({});
  
  // NEW: State to hold floating takeaway orders
  const [takeawayOrders, setTakeawayOrders] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // Quick Action Modal State for Waiters
  const [selectedBlueTable, setSelectedBlueTable] = useState<any | null>(null);

  const { setTableNumber, setActiveOrder } = useCartStore();
  const { tenantId } = useAuth();

  useEffect(() => {
    if (!isOpen || !tenantId) return;

    // 1. Fetch the Floor Plan Layout
    const fetchLayout = async () => {
      const planSnap = await getDoc(doc(db, "floorplans", tenantId));
      if (planSnap.exists()) {
        const data = planSnap.data();
        setZones(data.zones || []);
        setActiveZone(data.zones?.[0] || "");
        setTables(data.tables || []);
      }
    };

    // 2. Listen for "Open" Orders (Running Tabs & Takeaways)
    const q = query(
      collection(db, "orders"),
      where("tenantId", "==", tenantId),
      where("status", "==", "pending"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const openOrders: Record<string, any> = {};
      const takeaways: any[] = []; // Temporary array for takeaways

      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter into either Takeaways or Dine-In Tables
        if (data.orderType === "takeaway") {
          takeaways.push({ id: doc.id, ...data });
        } else if (data.tableNumber) {
          openOrders[data.tableNumber] = { id: doc.id, ...data };
        }
      });
      
      setActiveTabs(openOrders);
      setTakeawayOrders(takeaways); // Save takeaways to state
      setLoading(false);
    });

    fetchLayout();
    return () => unsubscribe();
  }, [isOpen, tenantId]);

  if (!isOpen) return null;

  // --- DINE IN LOGIC ---
  const handleTableSelect = (table: any) => {
    const runningTab = activeTabs[table.number];

    if (runningTab) {
      // Traffic Light Logic: If food is ready, intercept to let waiter serve it!
      if (runningTab.serveStatus === "ready_for_pickup") {
        setSelectedBlueTable({ table, runningTab });
        return;
      }

      // Otherwise, load their existing bill into the cart
      setActiveOrder(runningTab.id, runningTab.items, table.number, "dine_in");
    } else {
      // If table is GREEN (Empty), just set the table number for a new order
      setTableNumber(table.number);
    }
    onClose();
  };

  // Waiter clicks "I delivered the food"
  const markAsServed = async () => {
    if (!selectedBlueTable) return;
    const orderRef = doc(db, "orders", selectedBlueTable.runningTab.id);
    await updateDoc(orderRef, { serveStatus: "served" }); // Turns table Purple
    setSelectedBlueTable(null);
  };

  // Waiter decides to add more food instead of marking served right now
  const addMoreItemsToBlueTable = () => {
    if (!selectedBlueTable) return;
    setActiveOrder(
      selectedBlueTable.runningTab.id,
      selectedBlueTable.runningTab.items,
      selectedBlueTable.table.number,
      "dine_in"
    );
    setSelectedBlueTable(null);
    onClose();
  };

  // --- TAKEAWAY LOGIC ---
  const handleTakeawaySelect = (order: any) => {
    // Instantly loads the takeaway order into the cart so you can hit "Settle Bill"
    setActiveOrder(order.id, order.items, "", "takeaway");
    onClose();
  };

  const currentZoneTables = tables.filter((t) => t.zone === activeZone);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm font-['DM_Sans',sans-serif]">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-card shadow-2xl border border-border flex flex-col max-h-[90vh]">
        
        {/* Header & Traffic Light Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-muted p-6 gap-4 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Live Service Hub</h2>
            <div className="mt-2 flex gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                Empty
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                Cooking
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                Ready
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-black"></div>
                Eating
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-secondary px-4 py-2 font-bold text-secondary-foreground hover:opacity-90 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-border p-4 bg-muted shrink-0">
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={`rounded-lg px-4 py-2 font-bold transition-all ${
                activeZone === zone
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto p-6 bg-card">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-primary">
              Loading Floorplan...
            </div>
          ) : (
            <>
              {/* THE FLOORPLAN GRID */}
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-8">
                {currentZoneTables.map((table) => {
                  const tabData = activeTabs[table.number];

                  // Traffic Light Colors
                  let tableStyle =
                    "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"; // Default Green
                  let pulse = "";

                  if (tabData) {
                    if (tabData.serveStatus === "ready_for_pickup") {
                      tableStyle =
                        "border-blue-500 bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]";
                      pulse = "animate-pulse";
                    } else if (tabData.serveStatus === "served") {
                      tableStyle =
                        "border-foreground/20 bg-foreground/10 text-foreground";
                    } else {
                      tableStyle =
                        "border-amber-500 bg-amber-500/10 text-amber-400"; // Cooking
                    }
                  }

                  return (
                    <button
                      key={table.id}
                      onClick={() => handleTableSelect(table)}
                      className={`relative flex h-24 flex-col items-center justify-center rounded-2xl border-2 transition-all hover:scale-105 ${tableStyle}`}
                    >
                      <MdOutlineTableRestaurant
                        className={`mb-1 text-3xl opacity-80 ${pulse}`}
                      />
                      <span className="font-black text-foreground">
                        {table.number}
                      </span>

                      {tabData && (
                        <span className="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-bold text-foreground shadow-sm">
                          ₹{tabData.total.toFixed(0)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* NEW: TAKEAWAY QUEUE */}
              {takeawayOrders.length > 0 && (
                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="mb-4 text-lg font-bold text-foreground flex items-center gap-2">
                    <RiShoppingBag3Line className="text-purple-400" /> Takeaway Queue
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {takeawayOrders.map(order => {
                      const isReady = order.serveStatus === 'ready_for_pickup';
                      return (
                        <button
                          key={order.id}
                          onClick={() => handleTakeawaySelect(order)}
                          className={`flex items-center gap-4 rounded-xl border-2 px-5 py-3 transition-all hover:scale-105 ${
                            isReady 
                              ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse'
                              : 'border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                          }`}
                        >
                          <div className="text-left">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order #{order.id.slice(-4).toUpperCase()}</p>
                            <p className="text-lg font-black text-foreground">₹{order.total.toFixed(0)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Intercept Modal for Waiter (When table is BLUE) */}
      {selectedBlueTable && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-muted p-6 shadow-2xl border border-primary/30">
            <h3 className="text-xl font-black text-foreground mb-2">
              Food is Ready!
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Table {selectedBlueTable.table.number}'s food is waiting at the
              kitchen counter.
            </p>

            <div className="space-y-3">
              <button
                onClick={markAsServed}
                className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 flex justify-center items-center gap-2"
              >
                <FiCheckCircle size={18} /> I have served this table
              </button>
              <button
                onClick={addMoreItemsToBlueTable}
                className="w-full rounded-xl bg-secondary py-3.5 font-bold text-secondary-foreground hover:opacity-90"
              >
                Open Tab (Add more items)
              </button>
              <button
                onClick={() => setSelectedBlueTable(null)}
                className="w-full text-sm font-semibold text-muted-foreground hover:text-foreground pt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}