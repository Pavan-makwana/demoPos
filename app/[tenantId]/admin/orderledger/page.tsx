'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { FiDownload, FiSearch, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../../../../lib/AuthContext';
import * as XLSX from 'xlsx';

export default function OrderLedgerPage() {
  const [fullOrders, setFullOrders] = useState<any[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { tenantId } = useAuth();

  const getStartTime = (filter: string) => {
    const now = new Date();
    if (filter === 'today') {
      now.setHours(0, 0, 0, 0);
    } else if (filter === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      now.setDate(diff);
      now.setHours(0, 0, 0, 0);
    } else if (filter === 'month') {
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
    } else if (filter === 'year') {
      now.setMonth(0, 1);
      now.setHours(0, 0, 0, 0);
    }
    return now;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!tenantId) return;
      setLoading(true);

      try {
        const startTime = getStartTime(timeFilter);
        const q = query(
          collection(db, 'orders'),
          where('tenantId', '==', tenantId),
          where('createdAt', '>=', Timestamp.fromDate(startTime))
        );
        const snapshot = await getDocs(q);
        const orders: any[] = [];

        snapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() });
        });

        // Sort orders chronologically (newest first)
        const sortedOrders = [...orders].sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        setFullOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching order ledger:', error);
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    fetchOrders();
  }, [tenantId, timeFilter]);

  const handleExport = () => {
    const data: any[] = [];
    fullOrders.forEach(order => {
      const orderDate = order.createdAt?.toDate 
        ? order.createdAt.toDate().toLocaleString() 
        : new Date(order.createdAt).toLocaleString();

      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          data.push({
            'Order ID': order.id,
            'Customer Name': order.customer?.name || 'Walk-in',
            'Phone': order.customer?.phone || 'N/A',
            'Item Name': item.name,
            'Quantity': item.quantity,
            'Total Revenue': order.total || 0,
            'Payment Method': order.payment?.method?.toUpperCase() || 'N/A',
            'Date': orderDate
          });
        });
      } else {
        data.push({
          'Order ID': order.id,
          'Customer Name': order.customer?.name || 'Walk-in',
          'Phone': order.customer?.phone || 'N/A',
          'Item Name': 'N/A',
          'Quantity': 0,
          'Total Revenue': order.total || 0,
          'Payment Method': order.payment?.method?.toUpperCase() || 'N/A',
          'Date': orderDate
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `OrderLedger_${timeFilter}_${new Date().getTime()}.xlsx`);
  };

  const filteredOrders = fullOrders.filter((order) => {
    const search = orderSearchQuery.toLowerCase();
    const orderIdMatches = order.id.toLowerCase().includes(search);
    const customerNameMatches = order.customer?.name?.toLowerCase().includes(search);
    const customerPhoneMatches = order.customer?.phone?.includes(search);
    const itemsMatch = order.items?.some((i: any) => i.name.toLowerCase().includes(search));
    return orderIdMatches || customerNameMatches || customerPhoneMatches || itemsMatch;
  });

  if (isInitialLoad) {
    return <div className="flex h-screen items-center justify-center bg-background text-primary font-bold">Loading Order Ledger...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8 font-['DM_Sans',sans-serif]">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground">Order Ledger</h1>
          <p className="text-muted-foreground">Chronological list of all orders processed</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-xl border border-border bg-card">
            {(['today', 'week', 'month', 'year'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${
                  timeFilter === t
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 font-bold text-foreground transition-colors hover:bg-muted"
          >
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Ledger Table Section */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-xs">
            <FiSearch className="absolute left-3.5 top-3.5 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search ID, customer or item..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-input pl-10 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Date & Time</th>
                <th className="px-4 py-3 font-semibold">Customer Details</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Payment Details</th>
                <th className="px-4 py-3 font-semibold text-right">Order Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => {
                const dateObj = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                const itemsText = order.items?.map((i: any) => `${i.name} (x${i.quantity})`).join(', ') || 'N/A';
                const isCash = order.payment?.method === 'cash';
                const tendered = order.payment?.amountTendered;
                const change = order.payment?.changeGiven;

                return (
                  <tr key={order.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-4 font-mono text-xs font-bold text-primary uppercase">
                      #{order.id.slice(-6)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground font-medium">
                      {!dateObj || isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">{order.customer?.name || 'Walk-in Customer'}</div>
                      {order.customer?.phone && <div className="text-xs text-muted-foreground">{order.customer.phone}</div>}
                    </td>
                    <td className="px-4 py-4 max-w-xs truncate font-medium text-foreground" title={itemsText}>
                      {itemsText}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase ${
                          order.payment?.method === 'cash' ? 'bg-emerald-500/10 text-emerald-500' :
                          order.payment?.method === 'upi' ? 'bg-indigo-500/10 text-indigo-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {order.payment?.method || 'N/A'}
                        </span>
                        {isCash && tendered !== undefined && change !== undefined && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            (Tend: ₹{tendered} / Change: ₹{change})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-black text-foreground tabular-nums">
                      ₹{(order.total || 0).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-medium">
                    No matching orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
