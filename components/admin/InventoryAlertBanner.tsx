'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FiAlertTriangle, FiClock } from 'react-icons/fi';
import { useAuth } from '../../lib/AuthContext';

export default function InventoryAlertBanner() {
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const { tenantId } = useAuth();

  useEffect(() => {
    if (!tenantId) return;

    const invQ = query(collection(db, 'inventory'), where('tenantId', '==', tenantId));
    
    const unsub = onSnapshot(invQ, (snapshot) => {
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      const lowStock: any[] = [];
      const expiring: any[] = [];

      snapshot.docs.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() } as any;

        if (item.currentStock <= item.threshold) {
          lowStock.push(item);
        }

        if (item.expiryDate) {
          const expiryDate = new Date(item.expiryDate);
          if (expiryDate <= sevenDaysFromNow) {
            expiring.push(item);
          }
        }
      });

      setLowStockItems(lowStock);
      setExpiringItems(expiring);
    });

    return () => unsub();
  }, [tenantId]);

  if (lowStockItems.length === 0 && expiringItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 flex flex-col gap-4">
      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm transition-all">
          <FiAlertTriangle className="text-2xl flex-shrink-0" />
          <div>
            <h4 className="font-bold">Low Stock Warning</h4>
            <p className="text-sm opacity-90">
              {lowStockItems.map(i => i.name).join(', ')} {lowStockItems.length > 1 ? 'are' : 'is'} running low. Please reorder soon.
            </p>
          </div>
        </div>
      )}

      {expiringItems.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 shadow-sm transition-all">
          <FiClock className="text-2xl flex-shrink-0" />
          <div>
            <h4 className="font-bold">Expiry Warning</h4>
            <p className="text-sm opacity-90">
              {expiringItems.map(i => i.name).join(', ')} {expiringItems.length > 1 ? 'are' : 'is'} expiring within 7 days!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
