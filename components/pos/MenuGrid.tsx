"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { MenuItem, InventoryItem } from "../../types/schema";
import { useCartStore } from "../../lib/store";
import { useAuth } from "../../lib/AuthContext";
import { useParams } from "next/navigation";
import { FiLoader, FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";

import MenuTopBar from "./MenuTopBar";
import CategoryTabs from "./CategoryTabs";
import MenuItemCard from "./MenuItemCard";

// Colour palette cycled per category index
export const CATEGORY_COLORS = [
  {
    tab: "bg-blue-600",
    tabText: "text-white",
    header: "text-blue-400",
    dot: "bg-blue-500",
    border: "border-blue-500/30",
  },
  {
    tab: "bg-emerald-600",
    tabText: "text-white",
    header: "text-emerald-400",
    dot: "bg-emerald-500",
    border: "border-emerald-500/30",
  },
  {
    tab: "bg-amber-500",
    tabText: "text-foreground",
    header: "text-amber-400",
    dot: "bg-amber-500",
    border: "border-amber-500/30",
  },
  {
    tab: "bg-purple-600",
    tabText: "text-white",
    header: "text-purple-400",
    dot: "bg-purple-500",
    border: "border-purple-500/30",
  },
  {
    tab: "bg-rose-600",
    tabText: "text-white",
    header: "text-rose-400",
    dot: "bg-rose-500",
    border: "border-rose-500/30",
  },
  {
    tab: "bg-cyan-600",
    tabText: "text-white",
    header: "text-cyan-400",
    dot: "bg-cyan-500",
    border: "border-cyan-500/30",
  },
  {
    tab: "bg-orange-600",
    tabText: "text-white",
    header: "text-orange-400",
    dot: "bg-orange-500",
    border: "border-orange-500/30",
  },
];

export default function MenuGrid() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sortOption, setSortOption] = useState<string>("default");

  const addItem = useCartStore((state) => state.addItem);
  const cart = useCartStore((state) => state.cart);
  const params = useParams();
  const routeTenantId = params?.tenantId as string;
  const { tenantId: authTenantId } = useAuth();
  const tenantId = routeTenantId || authTenantId;
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (!tenantId) return;

    const itemsQ = query(
      collection(db, "menus"),
      where("tenantId", "==", tenantId),
    );
    const categoriesQ = query(
      collection(db, "categories"),
      where("tenantId", "==", tenantId),
      orderBy("order", "asc"),
    );

    const unsubItems = onSnapshot(itemsQ, (snap) => {
      const items: MenuItem[] = [];
      snap.forEach((doc) =>
        items.push({ id: doc.id, ...doc.data() } as MenuItem),
      );
      setMenuItems(items);
      setLoading(false);
    });

    const unsubCats = onSnapshot(categoriesQ, (snap) => {
      const cats: any[] = [];
      snap.forEach((doc) => cats.push({ id: doc.id, ...doc.data() }));
      setCategories(cats);
    });

    const inventoryQ = query(
      collection(db, "inventory"),
      where("tenantId", "==", tenantId),
    );
    const unsubInv = onSnapshot(inventoryQ, (snap) => {
      const inv: InventoryItem[] = [];
      snap.forEach((doc) => inv.push({ id: doc.id, ...doc.data() } as unknown as InventoryItem));
      setInventory(inv);
    });

    return () => {
      unsubItems();
      unsubCats();
      unsubInv();
    };
  }, [tenantId]);

  const checkStockForCart = (itemToAdd: MenuItem) => {
    const required: Record<string, number> = {};

    cart.forEach((cartItem) => {
      const orig = menuItems.find((m) => m.id === cartItem.itemId);
      if (orig && orig.recipe) {
        orig.recipe.forEach((ing: any) => {
          required[ing.materialId] = (required[ing.materialId] || 0) + (ing.quantity * cartItem.quantity);
        });
      }
    });

    if (itemToAdd.recipe) {
      itemToAdd.recipe.forEach((ing: any) => {
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

  const handleTryAddToCart = (item: MenuItem) => {
    const { available, limitingMaterialName } = checkStockForCart(item);
    if (!available) {
      toast.error(`Insufficient Stock: Not enough ${limitingMaterialName} to add this item.`);
      return;
    }
    addItem(item);
  };

  // Build a categoryId → color index map (stable, based on order in categories array)
  const colorMap: Record<string, number> = {};
  categories.forEach((cat, i) => {
    colorMap[cat.id] = i % CATEGORY_COLORS.length;
  });

  const getFilteredAndSortedItems = () => {
    // 1. Always hide sold-out items
    let result = menuItems.filter((item) => item.isAvailable);

    // 2. Category filter
    if (activeCategory !== "All") {
      result = result.filter((item) => item.categoryId === activeCategory);
    }

    // 3. Search
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }

    // 4. Sort
    switch (sortOption) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
    return result;
  };

  const displayedItems = getFilteredAndSortedItems();

  // Group items by categoryId; preserve category order from Firestore
  const grouped: { cat: any; colorIdx: number; items: MenuItem[] }[] = [];

  if (activeCategory === "All") {
    categories.forEach((cat, i) => {
      const items = displayedItems.filter((item) => item.categoryId === cat.id);
      if (items.length > 0) {
        grouped.push({ cat, colorIdx: i % CATEGORY_COLORS.length, items });
      }
    });
    // Items with no category (safety net)
    const uncategorised = displayedItems.filter(
      (item) => !categories.find((c) => c.id === item.categoryId),
    );
    if (uncategorised.length > 0) {
      grouped.push({
        cat: { id: "__none__", name: "Uncategorised" },
        colorIdx: 0,
        items: uncategorised,
      });
    }
  } else {
    // Single category selected — still show the section header for context
    const idx = colorMap[activeCategory] ?? 0;
    const cat = categories.find((c) => c.id === activeCategory) ?? {
      id: activeCategory,
      name: "Items",
    };
    if (displayedItems.length > 0)
      grouped.push({ cat, colorIdx: idx, items: displayedItems });
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <FiLoader size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background font-['DM_Sans',sans-serif]">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 pt-4 pb-2 backdrop-blur-md lg:px-6">
        <MenuTopBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOption={sortOption}
          setSortOption={setSortOption}
        />
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          colorMap={colorMap}
        />
      </div>

      {/* Scrollable grid with category sections */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {grouped.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
            <FiSearch size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-semibold">No items match your search.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ cat, colorIdx, items }) => {
              const color = CATEGORY_COLORS[colorIdx];
              return (
                <section key={cat.id}>
                  {/* Category header */}
                  <div
                    className={`mb-3 flex items-center gap-2.5 border-b pb-2 ${color.border}`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                    <h2
                      className={`text-xs font-black uppercase tracking-widest ${color.header}`}
                    >
                      {cat.name}
                    </h2>
                    <span className="ml-auto text-[10px] font-semibold text-muted-foreground">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Items grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAdd={handleTryAddToCart}
                        colorIdx={colorIdx}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
