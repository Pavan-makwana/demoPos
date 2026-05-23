import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "../firebase";
import { OrderItem, MenuItem, InventoryItem } from "../../types/schema";
import { deductInventory } from "./inventoryService";

interface CheckoutPayload {
  tenantId: string;
  cart: OrderItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  orderType: "dine_in" | "takeaway";
  tableNumber: string;
  paymentMethod: "cash" | "upi" | "card";
  transactionId?: string | null;
  activeOrderId?: string | null;
  customer?: { name: string; phone: string | null } | null;
  discount?: { type: string; value: number; amount: number } | null;
  amountTendered?: number;
  changeGiven?: number;
}

type CheckoutResponse =
  | { success: true; orderId: string }
  | { success: false; error: any };

export async function processCheckout(
  payload: CheckoutPayload,
): Promise<CheckoutResponse> {
  try {
    let resolvedTenantId = payload.tenantId;

    // Fallback 1: If tenantId is not provided, try to find it from the first item in the cart
    if (!resolvedTenantId && payload.cart && payload.cart.length > 0) {
      try {
        const menuRef = doc(db, "menus", payload.cart[0].itemId);
        const menuSnap = await getDoc(menuRef);
        if (menuSnap.exists()) {
          resolvedTenantId = menuSnap.data().tenantId || null;
        }
      } catch (err) {
        console.error("Failed to fallback fetch tenantId from menu item:", err);
      }
    }

    // Fallback 2: Try from activeOrderId if we are updating an existing order
    if (!resolvedTenantId && payload.activeOrderId) {
      try {
        const orderRef = doc(db, "orders", payload.activeOrderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          resolvedTenantId = orderSnap.data().tenantId || null;
        }
      } catch (err) {
        console.error("Failed to fallback fetch tenantId from order doc:", err);
      }
    }

    // Fallback 3: Default fallback if still unresolved
    if (!resolvedTenantId) {
      resolvedTenantId = "newkappscorner";
    }

    const orderData = {
      tenantId: resolvedTenantId,
      items: payload.cart,
      subtotal: payload.subtotal,
      taxAmount: payload.taxAmount,
      total: payload.total,
      orderType: payload.orderType,
      tableNumber: payload.orderType === "dine_in" ? payload.tableNumber : null,
      status: "completed",
      paymentStatus: "paid",
      cashierId: "admin_1",
      customer: payload.customer || null,
      discount: payload.discount || null,
      payment: {
        method: payload.paymentMethod,
        transactionId: payload.transactionId || null,
        amountPaid: payload.total,
        amountTendered: payload.amountTendered !== undefined ? payload.amountTendered : payload.total,
        changeGiven: payload.changeGiven !== undefined ? payload.changeGiven : 0,
      },
    };

    let finalOrderId = payload.activeOrderId;

    if (payload.activeOrderId) {
      const orderRef = doc(db, "orders", payload.activeOrderId);
      const existingSnap = await getDoc(orderRef);
      if (!existingSnap.exists()) throw new Error("Order not found");

      const existingData = existingSnap.data();
      const existingItems = existingData.items || [];
      const existingItemIds = existingItems.map((i: any) => i.cartItemId);

      const newlyAddedItems = payload.cart.filter(
        (i: any) => !existingItemIds.includes(i.cartItemId)
      );

      const currentQueue = existingData.unpreparedItems || [];
      const updatedQueue = [...currentQueue, ...newlyAddedItems];

      const updatedKitchenStatus = 
        updatedQueue.length > 0 ? "pending" : (existingData.kitchenStatus || "ready");
      const updatedServeStatus = 
        updatedQueue.length > 0 ? "cooking" : (existingData.serveStatus || "served");

      await updateDoc(orderRef, { 
        ...orderData, 
        unpreparedItems: updatedQueue,
        kitchenStatus: updatedKitchenStatus,
        serveStatus: updatedServeStatus,
        updatedAt: serverTimestamp() 
      });
      await deductInventory(payload.cart);
    } else {
      const newOrderData = { 
        ...orderData, 
        kitchenStatus: "pending", 
        unpreparedItems: payload.cart, 
        serveStatus: "cooking",
        createdAt: serverTimestamp() 
      };
      const docRef = await addDoc(collection(db, "orders"), newOrderData);
      finalOrderId = docRef.id;
      await deductInventory(payload.cart);
    }


    if (payload.customer && payload.customer.phone) {
      const usersRef = collection(db, "customers");
      const qUser = query(usersRef, where("phone", "==", payload.customer.phone), where("tenantId", "==", resolvedTenantId));
      const userSnap = await getDocs(qUser);
      if (userSnap.empty) {
        await addDoc(usersRef, {
          tenantId: resolvedTenantId, name: payload.customer.name, phone: payload.customer.phone, totalVisits: 1, totalSpent: payload.total, lastVisit: serverTimestamp(), createdAt: serverTimestamp(),
        });
      } else {
        const userDocRef = doc(db, "customers", userSnap.docs[0].id);
        await updateDoc(userDocRef, {
          name: payload.customer.name, totalVisits: increment(1), totalSpent: increment(payload.total), lastVisit: serverTimestamp(),
        });
      }
    }

    if (payload.paymentMethod === "cash") {
      const shiftQ = query(collection(db, "shifts"), where("tenantId", "==", resolvedTenantId), where("status", "==", "open"));
      const shiftSnap = await getDocs(shiftQ);
      if (!shiftSnap.empty) {
        const shiftRef = doc(db, "shifts", shiftSnap.docs[0].id);
        await updateDoc(shiftRef, { totalCashSales: increment(payload.total) });
      }
    }

    return { success: true, orderId: finalOrderId! };
  } catch (error) {
    console.error("Error processing checkout: ", error);
    return { success: false, error };
  }
}

export async function saveRunningTab(payload: any) {
  try {
    const tenantId = payload.tenantId || "newkappscorner";

    if (payload.activeOrderId) {
      const orderRef = doc(db, "orders", payload.activeOrderId);
      const existingSnap = await getDoc(orderRef);

      if (!existingSnap.exists()) throw new Error("Order not found");

      const existingData = existingSnap.data();
      const existingItems = existingData.items || [];
      const existingItemIds = existingItems.map((i: any) => i.cartItemId);

      const newlyAddedItems = payload.cart.filter(
        (i: any) => !existingItemIds.includes(i.cartItemId),
      );

      const currentQueue = existingData.unpreparedItems || [];
      const updatedQueue = [...currentQueue, ...newlyAddedItems];

      await updateDoc(orderRef, {
        items: payload.cart,
        unpreparedItems: updatedQueue,
        subtotal: payload.subtotal,
        taxAmount: payload.taxAmount,
        total: payload.total,
        kitchenStatus:
          updatedQueue.length > 0 ? "pending" : existingData.kitchenStatus,
        serveStatus:
          updatedQueue.length > 0 ? "cooking" : existingData.serveStatus,
        updatedAt: serverTimestamp(),
      });

      return { success: true, orderId: payload.activeOrderId };
    } else {
      const tabData = {
        tenantId,
        items: payload.cart,
        unpreparedItems: payload.cart,
        subtotal: payload.subtotal,
        taxAmount: payload.taxAmount,
        total: payload.total,
        orderType: payload.orderType,
        tableNumber:
          payload.orderType === "dine_in" ? payload.tableNumber : null,
        status: "pending",
        kitchenStatus: "pending",
        paymentStatus: "pending",
        serveStatus: "cooking",
        cashierId: "admin_1",
        createdAt: serverTimestamp(),
        payment: null,
      };
      const docRef = await addDoc(collection(db, "orders"), tabData);
      return { success: true, orderId: docRef.id };
    }
  } catch (error) {
    console.error("Error saving running tab:", error);
    return { success: false, error };
  }
}

export async function submitCustomerOrder(
  tenantId: string,
  tableNumber: string,
  customerCart: any[],
  totals: any,
  paymentMethod: "cash" | "upi" = "cash"
) {
  try {
    const cleanTableNumber = tableNumber ? String(tableNumber).trim() : "";
    const isTakeaway = cleanTableNumber.toLowerCase() === "takeaway";

    if (!isTakeaway && cleanTableNumber) {
      const q = query(
        collection(db, "orders"),
        where("tenantId", "==", tenantId),
        where("tableNumber", "==", cleanTableNumber),
        where("status", "==", "pending"),
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const existingOrder = snap.docs[0];
        const existingData = existingOrder.data();

        const updatedItems = [...(existingData.items || []), ...customerCart];
        const updatedUnprepared = [
          ...(existingData.unpreparedItems || []),
          ...customerCart,
        ];

        await updateDoc(doc(db, "orders", existingOrder.id), {
          items: updatedItems,
          unpreparedItems: updatedUnprepared,
          subtotal: existingData.subtotal + totals.subtotal,
          taxAmount: existingData.taxAmount + totals.taxAmount,
          total: existingData.total + totals.total,
          kitchenStatus: paymentMethod === "upi" ? "awaiting_payment" : "pending",
          paymentStatus: paymentMethod === "cash" ? "unpaid" : existingData.paymentStatus,
          serveStatus: "cooking",
          orderSource: "qr_menu",
          updatedAt: serverTimestamp(),
        });
        return { success: true, orderId: existingOrder.id };
      }
    }

    const tabData = {
      tenantId,
      items: customerCart,
      unpreparedItems: customerCart,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      orderType: isTakeaway ? "takeaway" : "dine_in",
      tableNumber: isTakeaway ? null : cleanTableNumber,
      orderSource: "qr_menu",
      status: "pending",
      kitchenStatus: paymentMethod === "upi" ? "awaiting_payment" : "pending",
      paymentStatus: paymentMethod === "cash" ? "unpaid" : "pending",
      serveStatus: "cooking",
      cashierId: "customer_qr",
      createdAt: serverTimestamp(),
      payment: null,
    };
    const docRef = await addDoc(collection(db, "orders"), tabData);
    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error("Error submitting customer order:", error);
    return { success: false, error };
  }
}

export async function simulatePaymentWebhook(orderId: string) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      paymentStatus: "paid",
      kitchenStatus: "pending",
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Webhook simulation failed:", error);
    return { success: false, error };
  }
}
