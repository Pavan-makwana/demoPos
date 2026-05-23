'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { FiPlus, FiLoader, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import StockModal from './StockModal';
import RecipeModal from './RecipeModal';
import { useAuth } from '../../../../lib/AuthContext';
import { syncMenuItemAvailability } from '../../../../lib/actions';

export default function InventoryManager() {
  const [activeTab, setActiveTab] = useState<'stock' | 'recipes'>('stock');

  // Data States
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any | null>(null);
  const { tenantId, features } = useAuth();

  if (features && features.inventory === false) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground text-center p-6 font-['DM_Sans',sans-serif]">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 mb-2">
          <FiAlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-black text-rose-600">Module Disabled</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          The Inventory Engine module has been deactivated for your workspace by the SaaS Super Admin.
        </p>
      </div>
    );
  }

  useEffect(() => {
    if (!tenantId) return;

    const invQ = query(collection(db, 'inventory'), where('tenantId', '==', tenantId));
    const menuQ = query(collection(db, 'menus'), where('tenantId', '==', tenantId));

    const unsubInv = onSnapshot(invQ, (snapshot) => {
      setRawMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMenu = onSnapshot(menuQ, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubInv();
      unsubMenu();
    };
  }, [tenantId]);

  const handleSaveMaterial = async (data: any) => {
    if (!tenantId) return;
    const payload = { tenantId, ...data };
    if (editingMaterial) await updateDoc(doc(db, 'inventory', editingMaterial.id), payload);
    else await addDoc(collection(db, 'inventory'), payload);
    await syncMenuItemAvailability(tenantId);
    setIsStockModalOpen(false);
  };

  const handleDeleteMaterial = async (id: string, name: string) => {
    if (window.confirm(`Delete ${name}? This might break existing recipes.`)) {
      await deleteDoc(doc(db, 'inventory', id));
    }
  };

  const handleSaveRecipe = async (menuItemId: string, recipe: any[]) => {
    await updateDoc(doc(db, 'menus', menuItemId), { recipe });
    setIsRecipeModalOpen(false);
  };

  if (loading) return <div className="flex h-full items-center justify-center"><FiLoader className="animate-spin text-2xl text-primary" /></div>;

  return (
    <div className="h-full overflow-y-auto bg-background p-4 md:p-8 font-['DM_Sans',sans-serif]">
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl mb-4">Inventory Engine</h1>
          <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit border border-border/50">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'stock' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Stockroom
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'recipes' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Recipe Builder
            </button>
          </div>
        </div>

        {activeTab === 'stock' && (
          <button
            onClick={() => {
              setEditingMaterial(null);
              setIsStockModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <FiPlus className="text-xl" /> Add Material
          </button>
        )}
      </div>

      {activeTab === 'stock' && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Material Name</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Current Stock</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs text-center">Status</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rawMaterials.map((item) => {
                const isLow = item.currentStock <= item.threshold;
                return (
                  <tr key={item.id} className="transition-colors hover:bg-muted">
                    <td className="p-4 font-bold text-foreground">{item.name}</td>
                    <td className="p-4 font-bold text-foreground">
                      {item.currentStock.toFixed(1)} {item.unit}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${isLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isLow ? <><FiAlertTriangle /> Low Stock</> : <><FiCheckCircle /> Healthy</>}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setEditingMaterial(item);
                          setIsStockModalOpen(true);
                        }}
                        className="font-semibold text-primary hover:text-primary mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(item.id, item.name)}
                        className="font-semibold text-rose-600 hover:text-rose-500"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rawMaterials.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Stockroom is empty. Add raw materials.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map(item => {
            const hasRecipe = item.recipe && item.recipe.length > 0;
            return (
              <div key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-foreground text-lg">{item.name}</h3>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${hasRecipe ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {hasRecipe ? 'Linked' : 'No Recipe'}
                    </span>
                  </div>
                  {hasRecipe ? (
                    <p className="text-xs text-muted-foreground mb-4">{item.recipe.length} ingredients configured.</p>
                  ) : (
                    <p className="text-xs text-rose-500 mb-4 flex items-center gap-1"><FiAlertTriangle /> Stock will not auto-deduct</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedMenuItem(item);
                    setIsRecipeModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-muted text-foreground font-bold text-sm hover:opacity-90 transition-colors"
                >
                  {hasRecipe ? 'Edit Recipe' : 'Build Recipe'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <StockModal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} onSave={handleSaveMaterial} existingItem={editingMaterial} />
      <RecipeModal isOpen={isRecipeModalOpen} onClose={() => setIsRecipeModalOpen(false)} onSave={handleSaveRecipe} menuItem={selectedMenuItem} rawMaterials={rawMaterials} />
    </div>
  );
}