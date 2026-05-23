'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { FiPlus, FiLoader, FiDatabase } from 'react-icons/fi';
import ItemsTable from './ItemsTable';
import CategoriesTable from './CategoriesTable';
import CombosTable from './CombosTable';
import ItemModal from './ItemModal';
import CategoryModal from './CategoryModal';
import ComboModal from './ComboModal';
import { useAuth } from '../../../../lib/AuthContext';
import { toast } from 'react-hot-toast';
// import { seedDatabase } from '../../../../lib/seed';


export default function MenuManager() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [bestSellersTimeFilter, setBestSellersTimeFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'combos'>('items');
  const [isSeeding, setIsSeeding] = useState(false);

  // Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<any | null>(null);
  
  const { tenantId } = useAuth();

  // Fetch Data
  useEffect(() => {
    if (!tenantId) return;

    const itemsQ = query(collection(db, 'menus'), where('tenantId', '==', tenantId));
    const catsQ = query(collection(db, 'categories'), where('tenantId', '==', tenantId));
    const combosQ = query(collection(db, 'combos'), where('tenantId', '==', tenantId));
    const ordersQ = query(collection(db, 'orders'), where('tenantId', '==', tenantId));

    const unsubItems = onSnapshot(itemsQ, (snapshot) => {
      setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCats = onSnapshot(catsQ, (snapshot) => {
      setCategories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCombos = onSnapshot(combosQ, (snapshot) => {
      setCombos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubOrders = onSnapshot(ordersQ, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubItems();
      unsubCats();
      unsubCombos();
      unsubOrders();
    };
  }, [tenantId]);

  const filterByTimeframe = (items: any[], dateField: string = "createdAt") => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return items.filter((item) => {
      if (bestSellersTimeFilter === "all") return true;
      const timestamp = item[dateField];
      if (!timestamp) return false;
      const dateVal = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const time = dateVal.getTime();
      
      if (bestSellersTimeFilter === "today") {
        return time >= startOfToday.getTime();
      } else if (bestSellersTimeFilter === "week") {
        return time >= startOfWeek.getTime();
      } else if (bestSellersTimeFilter === "month") {
        return time >= startOfMonth.getTime();
      } else if (bestSellersTimeFilter === "year") {
        return time >= startOfYear.getTime();
      }
      return true;
    });
  };

  const getTopSelling = () => {
    const filteredOrders = filterByTimeframe(orders, "createdAt");
    const itemCounts: Record<string, { name: string; count: number }> = {};
    
    filteredOrders.forEach((order) => {
      const itemsList = order.items || [];
      itemsList.forEach((item: any) => {
        if (!item.itemId || !item.name) return;
        if (!itemCounts[item.itemId]) {
          itemCounts[item.itemId] = { name: item.name, count: 0 };
        }
        itemCounts[item.itemId].count += item.quantity || 0;
      });
    });

    return Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const topSelling = getTopSelling();

  // --- SEED DATABASE HANDLER ---
  // const handleSeedData = async () => {
  //   if (window.confirm("WARNING: This will wipe the current menu and load the Kapp's Corner seed data. Are you sure?")) {
  //     setIsSeeding(true);
  //     try {
  //       const success = await seedDatabase();
  //       if (success) {
  //         alert("Database successfully seeded with Kapp's Corner data!");
  //       } else {
  //         alert("Failed to seed database. Check the console.");
  //       }
  //     } catch (error) {
  //       console.error("Seeding error:", error);
  //       alert("An error occurred during seeding.");
  //     } finally {
  //       setIsSeeding(false);
  //     }
  //   }
  // };

  // --- ITEM HANDLERS ---
  const handleSaveItem = async (data: any) => {
    if (!tenantId) return;
    const payload = { tenantId, ...data };
    try {
      if (editingItem) await updateDoc(doc(db, 'menus', editingItem.id), payload);
      else await addDoc(collection(db, 'menus'), payload);
      setIsItemModalOpen(false);
      toast.success("Item saved successfully!");
    } catch (error) {
      toast.error('Error saving item');
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await deleteDoc(doc(db, 'menus', id));
    }
  };

  const handleToggleItemStatus = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'menus', id), { isAvailable: !currentStatus });
  };

  // --- CATEGORY HANDLERS ---
  const handleSaveCategory = async (data: any) => {
    if (!tenantId) return;
    const payload = { tenantId, ...data };
    try {
      if (editingCategory) await updateDoc(doc(db, 'categories', editingCategory.id), payload);
      else await addDoc(collection(db, 'categories'), payload);
      setIsCategoryModalOpen(false);
      toast.success("Category saved successfully!");
    } catch (error) {
      toast.error('Error saving category');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const hasItems = items.some((item) => item.categoryId === id);
    if (hasItems) {
      toast.error(`Cannot delete ${name}. Please reassign or delete its menu items first.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  // --- COMBO HANDLERS ---
  const handleSaveCombo = async (data: any) => {
    if (!tenantId) return;
    const payload = { tenantId, ...data };
    try {
      if (editingCombo) await updateDoc(doc(db, 'combos', editingCombo.id), payload);
      else await addDoc(collection(db, 'combos'), payload);
      setIsComboModalOpen(false);
      toast.success("Combo saved successfully!");
    } catch (error) {
      toast.error('Error saving combo');
    }
  };

  const handleDeleteCombo = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete combo: ${name}?`)) {
      await deleteDoc(doc(db, 'combos', id));
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <FiLoader className="animate-spin text-2xl text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background p-4 md:p-8 font-['DM_Sans',sans-serif]">
      
      {/* Top Dashboard Widgets */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* High Selling Items Widget */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-black text-foreground">Top 5 Best Sellers</h2>
            <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-xl border border-border/50">
              {([
                { id: "today", label: "Today" },
                { id: "week", label: "Week" },
                { id: "month", label: "Month" },
                { id: "year", label: "Year" },
                { id: "all", label: "All" },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBestSellersTimeFilter(tab.id)}
                  className={`rounded-lg px-3 py-1 text-[10px] font-black transition-all outline-none cursor-pointer ${
                    bestSellersTimeFilter === tab.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3.5">
            {topSelling.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{item.count} sold</span>
              </div>
            ))}
            {topSelling.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No order data available yet.</p>
            )}
          </div>
        </div>
        
        {/* Quick Menu Summary Widget */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground mb-4">Menu Quick Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-muted p-4 text-center">
                <p className="text-2xl font-black text-foreground">{items.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Total Items</p>
              </div>
              <div className="rounded-xl bg-muted p-4 text-center">
                <p className="text-2xl font-black text-foreground">{categories.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Categories</p>
              </div>
              <div className="rounded-xl bg-muted p-4 text-center">
                <p className="text-2xl font-black text-foreground">{combos.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Combos</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50 text-[11px] font-medium text-muted-foreground flex justify-between items-center">
            <span>Dynamic updates from real-time database</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </div>

      {/* Header & Tabs */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-t border-border/50 pt-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl font-black text-foreground sm:text-3xl">Menu Manager</h1>
            {/* DEV SEED BUTTON */}
            {/* <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-500 transition-all hover:bg-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSeeding ? <FiLoader className="animate-spin" /> : <FiDatabase />}
              {isSeeding ? "Seeding..." : "Load Kapp's Menu"}
            </button> */}
            
          </div>
          <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit border border-border/50">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'items'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Menu Items
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'categories'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('combos')}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'combos'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Combos & Offers
            </button>
          </div>
        </div>
        
        {activeTab === 'items' ? (
          <button
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
          >
            <FiPlus className="text-xl" /> Add Item
          </button>
        ) : activeTab === 'categories' ? (
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
          >
            <FiPlus className="text-xl" /> Add Category
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingCombo(null);
              setIsComboModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
          >
            <FiPlus className="text-xl" /> Add Combo
          </button>
        )}
      </div>

      {/* Render Active Tab */}
      {activeTab === 'items' ? (
        <ItemsTable
          items={items}
          categories={categories}
          onEdit={(item) => {
            setEditingItem(item);
            setIsItemModalOpen(true);
          }}
          onDelete={handleDeleteItem}
          onToggleStatus={handleToggleItemStatus}
        />
      ) : activeTab === 'categories' ? (
        <CategoriesTable
          categories={categories}
          onEdit={(cat) => {
            setEditingCategory(cat);
            setIsCategoryModalOpen(true);
          }}
          onDelete={handleDeleteCategory}
        />
      ) : (
        <CombosTable
          combos={combos}
          allItems={items}
          onEdit={(combo) => {
            setEditingCombo(combo);
            setIsComboModalOpen(true);
          }}
          onDelete={handleDeleteCombo}
        />
      )}

      {/* Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        existingItem={editingItem}
        categories={categories}
        allItems={items}
      />
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        existingCategory={editingCategory}
      />
      <ComboModal
        isOpen={isComboModalOpen}
        onClose={() => setIsComboModalOpen(false)}
        onSave={handleSaveCombo}
        existingCombo={editingCombo}
        allItems={items}
      />
    </div>
  );
}