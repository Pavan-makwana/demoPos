import { create } from "zustand";
import { OrderItem, MenuItem } from "../types/schema";

// Extend OrderItem to include notes without breaking your existing schema
export type CartItem = OrderItem & { cartItemId: string; notes?: string };

// 1. The Interface
interface CartState {
  cart: CartItem[];
  subtotal: number;
  taxAmount: number; // 18% GST
  total: number;
  orderType: "dine_in" | "takeaway";
  tableNumber: string;
  activeOrderId: string | null; // NEW: Tracks running tabs

  // Actions
  setOrderType: (type: "dine_in" | "takeaway") => void;
  setTableNumber: (table: string) => void;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateItemNote: (itemId: string, note: string) => void; // For kitchen instructions
  setActiveOrder: (
    orderId: string,
    existingCart: CartItem[],
    table: string,
    type: "dine_in" | "takeaway"
  ) => void; // Loads running tabs
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const TAX_RATE = 0;

export const useCartStore = create<CartState>((set) => ({
  cart: [],
  subtotal: 0,
  taxAmount: 0,
  total: 0,
  orderType: "dine_in",
  tableNumber: "",
  activeOrderId: null, // Starts with no active order

  // Automatically clear table number if they switch to takeaway
  setOrderType: (type) =>
    set({ orderType: type, tableNumber: type === "takeaway" ? "" : "" }),

  setTableNumber: (table) => set({ tableNumber: table }),

  addItem: (item) =>
    set((state) => {
      const existingItem = state.cart.find((i) => i.itemId === item.id);
      let newCart;

      if (existingItem) {
        newCart = state.cart.map((i) =>
          i.itemId === item.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.price,
              }
            : i,
        );
      } else {
        newCart = [
          ...state.cart,
          {
            cartItemId: `${item.id}-${Date.now()}`, // <-- FIXED: TypeScript error goes away!
            itemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            subtotal: item.price,
            notes: "", // Initialize with empty notes
          },
        ];
      }

      const newSubtotal = newCart.reduce((sum, i) => sum + i.subtotal, 0);
      const newTax = newSubtotal * TAX_RATE;

      return {
        cart: newCart,
        subtotal: newSubtotal,
        taxAmount: newTax,
        total: newSubtotal + newTax,
      };
    }),

  removeItem: (itemId) =>
    set((state) => {
      const existingItem = state.cart.find((i) => i.itemId === itemId);
      if (!existingItem) return state;

      let newCart;
      if (existingItem.quantity > 1) {
        newCart = state.cart.map((i) =>
          i.itemId === itemId
            ? {
                ...i,
                quantity: i.quantity - 1,
                subtotal: (i.quantity - 1) * i.price,
              }
            : i,
        );
      } else {
        newCart = state.cart.filter((i) => i.itemId !== itemId);
      }

      const newSubtotal = newCart.reduce((sum, i) => sum + i.subtotal, 0);
      const newTax = newSubtotal * TAX_RATE;

      return {
        cart: newCart,
        subtotal: newSubtotal,
        taxAmount: newTax,
        total: newSubtotal + newTax,
      };
    }),

  // Action to add/update kitchen notes for a specific item
  updateItemNote: (itemId, note) =>
    set((state) => {
      const newCart = state.cart.map((i) =>
        i.itemId === itemId ? { ...i, notes: note } : i,
      );
      return { cart: newCart };
    }),

  updateItemQuantity: (itemId, quantity) =>
    set((state) => {
      let newCart;
      if (quantity <= 0) {
        newCart = state.cart.filter((i) => i.itemId !== itemId);
      } else {
        newCart = state.cart.map((i) =>
          i.itemId === itemId
            ? {
                ...i,
                quantity: quantity,
                subtotal: quantity * i.price,
              }
            : i,
        );
      }

      const newSubtotal = newCart.reduce((sum, i) => sum + i.subtotal, 0);
      const newTax = newSubtotal * TAX_RATE;

      return {
        cart: newCart,
        subtotal: newSubtotal,
        taxAmount: newTax,
        total: newSubtotal + newTax,
      };
    }),

  // Action to load an existing open tab into the POS
  setActiveOrder: (orderId, existingCart, table,type) =>
    set((state) => {
      const newSubtotal = existingCart.reduce((sum, i) => sum + i.subtotal, 0);
      const newTax = newSubtotal * TAX_RATE;

      return {
        activeOrderId: orderId,
        cart: existingCart,
        tableNumber: table,
        orderType: type,
        subtotal: newSubtotal,
        taxAmount: newTax,
        total: newSubtotal + newTax,
      };
    }),

  // Reset everything including running tab data
  clearCart: () =>
    set({
      cart: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      tableNumber: "",
      orderType: "dine_in",
      activeOrderId: null,
    }),
}));
