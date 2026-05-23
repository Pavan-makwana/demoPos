"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, limit } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { openShift, closeShift } from "../../../../lib/actions";
import { FiLock, FiUnlock } from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";
import { useAuth } from "../../../../lib/AuthContext";
import { toast } from "react-hot-toast";

export default function ShiftPage() {
  const [activeShift, setActiveShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Input states
  const [startingCash, setStartingCash] = useState<string>("");
  const [endingCash, setEndingCash] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { tenantId } = useAuth();

  // 1. Listen for any OPEN shifts for this cafe
  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, "shifts"),
      where("tenantId", "==", tenantId),
      where("status", "==", "open"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveShift({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActiveShift(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  const handleOpenShift = async () => {
    if (!startingCash || isNaN(Number(startingCash)) || Number(startingCash) < 0) {
      return toast.error("Enter a valid non-negative starting float");
    }
    if (!tenantId) return toast.error("Tenant ID is missing.");
    setIsProcessing(true);
    const result = await openShift(Number(startingCash), "admin_1", tenantId);
    if (result.success) {
      setStartingCash("");
      toast.success("Shift Opened Successfully.");
    } else {
      toast.error("Failed to open shift.");
    }
    setIsProcessing(false);
  };

  const handleCloseShift = async () => {
    if (!endingCash || isNaN(Number(endingCash)) || Number(endingCash) < 0) {
      return toast.error("Enter actual non-negative cash in drawer");
    }
    if (!tenantId) return toast.error("Tenant ID is missing.");
    setIsProcessing(true);
    const result = await closeShift(tenantId, activeShift.id, Number(endingCash), activeShift.startTime);
    if (result.success) {
      setEndingCash("");
      toast.success("Shift Closed Successfully. End of day report generated.");
    } else {
      toast.error("Failed to close shift.");
    }
    setIsProcessing(false);
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center bg-background text-primary">Loading Register...</div>;
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-4 font-['DM_Sans',sans-serif]">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        
        {/* Header */}
        <div className={`p-8 text-center border-b ${activeShift ? "bg-primary/10 border-primary/20 text-foreground" : "bg-muted border-border text-foreground"}`}>
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border ${activeShift ? "bg-primary/20 border-primary/30 text-primary" : "bg-background border-border text-muted-foreground"}`}>
            {activeShift ? <FiUnlock className="text-3xl" /> : <FiLock className="text-3xl" />}
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {activeShift ? "Register is Open" : "Register is Closed"}
          </h2>
          <p className={`mt-1 text-sm font-medium ${activeShift ? "text-primary" : "text-muted-foreground"}`}>
            {activeShift ? `Opened at ${activeShift.startTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Start a new shift to begin billing."}
          </p>
        </div>

        {/* Action Body */}
        <div className="p-8">
          {!activeShift ? (
            // --- OPEN SHIFT FORM ---
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Starting Float (Cash in Drawer)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <TbCurrencyRupee className="text-xl text-muted-foreground" />
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    value={startingCash}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (Number(val) < 0) return;
                      setStartingCash(val);
                    }}
                    className="block w-full rounded-xl border border-border bg-muted p-4 pl-12 text-2xl font-black text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <button
                onClick={handleOpenShift}
                disabled={isProcessing}
                className="w-full rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-70"
              >
                {isProcessing ? "Processing..." : "OPEN REGISTER"}
              </button>
            </div>
          ) : (
            // --- CLOSE SHIFT FORM & LIVE STATS ---
            <div className="space-y-6">
              {/* Live Tracking Cards */}
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-border bg-muted p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Starting Float</p>
                  <p className="text-2xl font-black text-foreground tabular-nums">₹{activeShift.startingCash.toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Count Actual Cash to Close
                </label>
                <div className="relative mb-4">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <TbCurrencyRupee className="text-xl text-muted-foreground" />
                  </div>
                  <input
                    type="number"
                    placeholder="Actual counted cash..."
                    min="0"
                    value={endingCash}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (Number(val) < 0) return;
                      setEndingCash(val);
                    }}
                    className="block w-full rounded-xl border border-border bg-muted p-4 pl-12 text-2xl font-black text-foreground outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <button
                  onClick={handleCloseShift}
                  disabled={isProcessing}
                  className="w-full rounded-xl bg-rose-600 py-4 text-lg font-bold text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.98] disabled:opacity-70"
                >
                  {isProcessing ? "Processing..." : "CLOSE REGISTER"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}