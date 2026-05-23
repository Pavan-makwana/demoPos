"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { submitCustomerOrder, simulatePaymentWebhook } from "../../../../lib/actions";
import { FiLoader, FiAlertTriangle } from "react-icons/fi";
import { toast } from "react-hot-toast";

import CustomerHeader from "../../../../components/customer/CustomerHeader";
import CategoryScroller from "../../../../components/customer/CategoryScroller";
import MenuItemCard from "../../../../components/customer/MenuItemCard";
import CustomerCartModal from "../../../../components/customer/CustomerCartModal";
import MenuSearchAndSort from "../../../../components/customer/MenuSearchAndSort";
import PaymentGatewayModal from "../../../../components/customer/PaymentGatewayModal";

export default function CustomerMenu() {
  const params = useParams();
  const tableNumber = params.tableNumber as string;
  const tenantId = params.tenantId as string;

  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"none" | "low_to_high" | "high_to_low">("none");

  // Customer Local Cart
  const [cart, setCart] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [qrMenuDisabled, setQrMenuDisabled] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!tenantId) return;

      try {
        const docSnap = await getDoc(doc(db, "tenants", tenantId));
        if (docSnap.exists()) {
          const tenantData = docSnap.data();
          if (tenantData.features && tenantData.features.qrMenu === false) {
            setQrMenuDisabled(true);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error checking qrMenu flag:", err);
      }

      const catsSnap = await getDocs(
        query(collection(db, "categories"), where("tenantId", "==", tenantId)),
      );
      const fetchedCats = catsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const itemsSnap = await getDocs(
        query(
          collection(db, "menus"),
          where("tenantId", "==", tenantId),
          where("isAvailable", "==", true),
        ),
      );
      const fetchedItems = itemsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setCategories(fetchedCats);
      setMenuItems(fetchedItems);
      setLoading(false);
    };
    fetchMenu();
  }, [tenantId]);

  // Listen to Inventory Real-Time for Stock Checks
  useEffect(() => {
    if (!tenantId) return;
    const q = query(
      collection(db, "inventory"),
      where("tenantId", "==", tenantId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInventory(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [tenantId]);

  // Helper to check stock
  const checkStockForCart = (itemToAdd: any) => {
    const required: Record<string, number> = {};

    cart.forEach((cartItem) => {
      const orig = menuItems.find((m) => m.id === cartItem.itemId);
      if (orig && orig.recipe) {
        orig.recipe.forEach((ing: any) => {
          required[ing.materialId] = (required[ing.materialId] || 0) + (ing.quantity * cartItem.quantity);
        });
      }
    });

    const targetItem = menuItems.find((m) => m.id === itemToAdd.id || m.id === itemToAdd.itemId);
    if (targetItem && targetItem.recipe) {
      targetItem.recipe.forEach((ing: any) => {
        required[ing.materialId] = (required[ing.materialId] || 0) + ing.quantity;
      });
    }

    for (const matId of Object.keys(required)) {
      const needed = required[matId];
      const invItem = inventory.find((inv) => inv.id === matId);
      if (invItem) {
        const threshold = invItem.threshold || 0;
        if (needed > invItem.currentStock - threshold) {
          return { available: false, limitingMaterialName: invItem.name };
        }
      }
    }
    return { available: true };
  };

  // Cart Handlers
  const addToCart = (item: any) => {
    const { available, limitingMaterialName } = checkStockForCart(item);
    if (!available) {
      toast.error(`Insufficient Stock: Not enough ${limitingMaterialName} to add this item.`);
      return;
    }
    const targetId = item.id || item.itemId;
    const existing = cart.find((i) => i.itemId === targetId);
    if (existing) {
      setCart(
        cart.map((i) =>
          i.itemId === targetId
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.price,
              }
            : i,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          cartItemId: `${targetId}-${Date.now()}`,
          itemId: targetId,
          name: item.name,
          price: item.price,
          quantity: 1,
          subtotal: item.price,
          notes: "",
        },
      ]);
    }
  };

  const removeFromCart = (itemId: string) => {
    const existing = cart.find((i) => i.itemId === itemId);
    if (existing.quantity > 1) {
      setCart(
        cart.map((i) =>
          i.itemId === itemId
            ? {
                ...i,
                quantity: i.quantity - 1,
                subtotal: (i.quantity - 1) * i.price,
              }
            : i,
        ),
      );
    } else {
      setCart(cart.filter((i) => i.itemId !== itemId));
    }
    if (cart.length === 1) setIsCartOpen(false);
  };

  const updateNote = (itemId: string, note: string) => {
    setCart(cart.map((i) => (i.itemId === itemId ? { ...i, notes: note } : i)));
  };

  // Math
  const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const taxAmount = subtotal * 0;
  const total = subtotal + taxAmount;

  const handleOrder = async (paymentMethod: 'cash' | 'upi') => {
    if (!tenantId) {
      toast.error("Store ID is missing. Please contact staff.");
      return;
    }
    setIsSubmitting(true);
    
    if (paymentMethod === 'upi') {
      setShowPaymentGateway(true);
    }

    const result = await submitCustomerOrder(tenantId, tableNumber, cart, {
      subtotal,
      taxAmount,
      total,
    }, paymentMethod);

    if (result.success) {
      if (paymentMethod === 'upi') {
        // Simulate payment gateway delay and webhook
        setTimeout(async () => {
          if (result.orderId) await simulatePaymentWebhook(result.orderId);
          setShowPaymentGateway(false);
          setCart([]);
          setIsCartOpen(false);
          setOrderSuccess(true);
          setTimeout(() => setOrderSuccess(false), 5000);
          setIsSubmitting(false);
        }, 3000);
      } else {
        setCart([]);
        setIsCartOpen(false);
        setOrderSuccess(true);
        setTimeout(() => setOrderSuccess(false), 5000);
        setIsSubmitting(false);
      }
    } else {
      toast.error("Something went wrong. Please call a waiter.");
      setShowPaymentGateway(false);
      setIsSubmitting(false);
    }
  };

  if (qrMenuDisabled) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground text-center p-6 font-['DM_Sans',sans-serif]">
        <div className="h-16 w-16 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center border border-red-500/20 mb-2">
          <FiAlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-black text-red-600">Ordering Unavailable</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Table self-ordering is currently deactivated or suspended for this establishment. Please place your order directly with the waiter.
        </p>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <FiLoader className="animate-spin text-3xl text-primary" />
      </div>
    );

  const getFilteredItems = () => {
    let items = [...menuItems];
    if (activeCategory !== "All") {
      items = items.filter((item) => item.categoryId === activeCategory);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(q));
    }
    if (sortOrder === "low_to_high") {
      items.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "high_to_low") {
      items.sort((a, b) => b.price - a.price);
    }
    return items;
  };

  const currentItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-background font-['DM_Sans',sans-serif] pb-24">
      <CustomerHeader tableNumber={tableNumber} orderSuccess={orderSuccess} />

      <CategoryScroller
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <MenuSearchAndSort
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      <div className="p-5 space-y-4">
        {currentItems.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            cartItem={cart.find((i) => i.itemId === item.id)}
            onAdd={addToCart}
            onRemove={removeFromCart}
          />
        ))}
        {currentItems.length === 0 && (
          <p className="text-center text-muted-foreground py-10">
            No items available in this category.
          </p>
        )}
      </div>

      <CustomerCartModal
        cart={cart}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onUpdateNote={updateNote}
        subtotal={subtotal}
        taxAmount={taxAmount}
        total={total}
        onOrder={handleOrder}
        isSubmitting={isSubmitting}
      />

      <PaymentGatewayModal isOpen={showPaymentGateway} />

      {/* Global Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes bounce-short { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-short { animation: bounce-short 2s infinite ease-in-out; }
        @keyframes fade-in-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-down { animation: fade-in-down 0.4s ease-out; }
      `,
        }}
      />
    </div>
  );
}
