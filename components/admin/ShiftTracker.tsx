"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { FiTrendingUp, FiTrendingDown, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../../lib/AuthContext";

export default function ShiftTracker() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const { tenantId } = useAuth();

  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, "shifts"),
      where("tenantId", "==", tenantId),
      orderBy("startTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setShifts(data);
    });

    return () => unsubscribe();
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, "expenses"),
      where("tenantId", "==", tenantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setExpenses(data);
    });

    return () => unsubscribe();
  }, [tenantId]);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 font-['DM_Sans',sans-serif]">
      <h2 className="mb-6 text-xl font-black text-foreground">Shift & Cash Ledger</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Date & Time</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Starting Float</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Cash Sales</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Cash Expenses</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Expected</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Counted</th>
              <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Discrepancy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shifts.map((shift) => {
              // Calculate cash expenses for this shift
              let cashExpenses = 0;
              if (shift.status === "open") {
                const shiftStart = shift.startTime?.toDate ? shift.startTime.toDate().getTime() : 0;
                cashExpenses = expenses
                  .filter((exp) => {
                    const expTime = exp.createdAt?.toDate 
                      ? exp.createdAt.toDate().getTime() 
                      : (exp.date?.toDate ? exp.date.toDate().getTime() : 0);
                    const isCash = !exp.paymentMethod || exp.paymentMethod === "cash";
                    return isCash && expTime >= shiftStart;
                  })
                  .reduce((sum, exp) => sum + (exp.amount || 0), 0);
              } else {
                cashExpenses = shift.totalCashExpenses || 0;
              }

              const expected = shift.startingCash + (shift.totalCashSales || 0) - cashExpenses;
              const counted = shift.actualEndingCash || 0;
              // Discrepancy: Counted minus Expected. (Negative means cash is missing)
              const discrepancy = counted - expected; 
              
              const dateObj = shift.startTime?.toDate();
              
              return (
                <tr key={shift.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap text-sm sm:text-base">
                    {dateObj ? dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold uppercase ${shift.status === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                      {shift.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 tabular-nums text-sm sm:text-base font-semibold whitespace-nowrap">₹{shift.startingCash.toFixed(2)}</td>
                  <td className="px-4 py-4 tabular-nums text-emerald-500 font-bold text-sm sm:text-base whitespace-nowrap">+₹{(shift.totalCashSales || 0).toFixed(2)}</td>
                  <td className="px-4 py-4 tabular-nums text-rose-500 font-bold text-sm sm:text-base whitespace-nowrap">-₹{cashExpenses.toFixed(2)}</td>
                  <td className="px-4 py-4 tabular-nums font-extrabold text-foreground text-sm sm:text-base whitespace-nowrap">₹{expected.toFixed(2)}</td>
                  
                  {shift.status === 'open' ? (
                    <>
                      <td className="px-4 py-4 text-muted-foreground italic whitespace-nowrap text-sm sm:text-base">Pending</td>
                      <td className="px-4 py-4 text-right text-muted-foreground italic whitespace-nowrap text-sm sm:text-base">Pending</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-4 tabular-nums font-extrabold text-sm sm:text-base whitespace-nowrap">₹{counted.toFixed(2)}</td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 font-black tabular-nums text-sm sm:text-base ${discrepancy < 0 ? 'text-red-500' : discrepancy > 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
                          {discrepancy < 0 ? <FiTrendingDown /> : discrepancy > 0 ? <FiTrendingUp /> : <FiCheckCircle />}
                          ₹{Math.abs(discrepancy).toFixed(2)}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}