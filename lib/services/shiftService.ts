import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export async function openShift(startingCash: number, cashierId: string, tenantId: string) {
  try {
    const shiftData = {
      tenantId,
      cashierId,
      startingCash,
      startTime: serverTimestamp(),
      status: "open",
    };
    const docRef = await addDoc(collection(db, "shifts"), shiftData);
    return { success: true, shiftId: docRef.id };
  } catch (error) {
    console.error("Error opening shift: ", error);
    return { success: false, error };
  }
}

export async function closeShift(
  tenantId: string,
  shiftId: string,
  actualEndingCash: number,
  startTime: any,
) {
  try {
    const q = query(
      collection(db, "orders"),
      where("tenantId", "==", tenantId),
      where("createdAt", ">=", startTime),
      where("payment.method", "==", "cash"),
    );

    const snapshot = await getDocs(q);
    let totalCashSales = 0;
    snapshot.forEach((doc) => {
      totalCashSales += doc.data().total || 0;
    });

    const qExpenses = query(
      collection(db, "expenses"),
      where("tenantId", "==", tenantId),
      where("date", ">=", startTime),
    );
    const expenseSnapshot = await getDocs(qExpenses);
    let totalCashExpenses = 0;
    expenseSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.paymentMethod || data.paymentMethod === "cash") {
        totalCashExpenses += data.amount || 0;
      }
    });

    const shiftRef = doc(db, "shifts", shiftId);
    const shiftSnap = await getDoc(shiftRef);
    if (!shiftSnap.exists()) throw new Error("Shift not found");
    const startingCash = shiftSnap.data().startingCash || 0;

    const expectedEndingCash = startingCash + totalCashSales - totalCashExpenses;
    const discrepancy = actualEndingCash - expectedEndingCash;

    await updateDoc(shiftRef, {
      endTime: serverTimestamp(),
      status: "closed",
      totalCashSales,
      totalCashExpenses,
      actualEndingCash,
      discrepancy,
    });

    return { success: true };
  } catch (error) {
    console.error("Error closing shift: ", error);
    return { success: false, error };
  }
}
