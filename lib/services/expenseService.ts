import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export async function addExpense(
  description: string,
  amount: number,
  category: string,
  tenantId: string,
  paymentMethod: string = "cash",
) {
  try {
    const expenseData = {
      tenantId,
      description,
      amount,
      category,
      date: serverTimestamp(),
      cashierId: "admin_1",
      paymentMethod,
    };

    const docRef = await addDoc(collection(db, "expenses"), expenseData);
    return { success: true, expenseId: docRef.id };
  } catch (error) {
    console.error("Error adding expense: ", error);
    return { success: false, error };
  }
}
