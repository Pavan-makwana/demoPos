'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FiDollarSign, FiShoppingBag, FiTrendingUp, FiDownload } from 'react-icons/fi';
import Link from 'next/link';
import { useAuth } from '../../../lib/AuthContext';
import * as XLSX from 'xlsx';
import InventoryAlertBanner from '../../../components/admin/InventoryAlertBanner';

// IMPORT THE NEW SHIFT TRACKER
import ShiftTracker from '../../../components/admin/ShiftTracker';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ revenue: 0, orderCount: 0 });
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const { tenantId } = useAuth();

  // State for Dine In vs Takeaway analytics
  const [orderTypeData, setOrderTypeData] = useState<any[]>([]);
  const [dineInDemand, setDineInDemand] = useState<any[]>([]);
  const [takeawayDemand, setTakeawayDemand] = useState<any[]>([]);

  // Chart Colors
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b'];

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
    const fetchDashboardData = async () => {
      if (!tenantId) return;
      setLoading(true);

      const startTime = getStartTime(timeFilter);
      const q = query(
        collection(db, 'orders'),
        where('tenantId', '==', tenantId),
        where('createdAt', '>=', Timestamp.fromDate(startTime))
      );
      const snapshot = await getDocs(q);

      let totalRev = 0;
      let upiAmount = 0;
      let cashAmount = 0;
      let cardAmount = 0;

      let dineInRev = 0;
      let dineInOrders = 0;
      let takeawayRev = 0;
      let takeawayOrders = 0;

      const dineInItemsMap: Record<string, number> = {};
      const takeawayItemsMap: Record<string, number> = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const total = data.total || 0;
        totalRev += total;

        if (data.payment?.method === 'upi') upiAmount += total;
        else if (data.payment?.method === 'cash') cashAmount += total;
        else if (data.payment?.method === 'card') cardAmount += total;

        const type = data.orderType || 'dine_in';
        if (type === 'dine_in') {
          dineInRev += total;
          dineInOrders += 1;
        } else {
          takeawayRev += total;
          takeawayOrders += 1;
        }

        const items = data.items || [];
        items.forEach((item: any) => {
          const qty = item.quantity || 0;
          const name = item.name || 'Unknown Item';
          if (type === 'dine_in') {
            dineInItemsMap[name] = (dineInItemsMap[name] || 0) + qty;
          } else {
            takeawayItemsMap[name] = (takeawayItemsMap[name] || 0) + qty;
          }
        });
      });

      const formattedDineInDemand = Object.entries(dineInItemsMap)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const formattedTakeawayDemand = Object.entries(takeawayItemsMap)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setStats({ revenue: totalRev, orderCount: snapshot.size });
      setPaymentData([
        { name: 'UPI', value: upiAmount },
        { name: 'Cash', value: cashAmount },
        { name: 'Card', value: cardAmount },
      ]);
      setOrderTypeData([
        { name: 'Dine In', value: dineInRev, count: dineInOrders },
        { name: 'Takeaway', value: takeawayRev, count: takeawayOrders },
      ]);
      setDineInDemand(formattedDineInDemand);
      setTakeawayDemand(formattedTakeawayDemand);

      setLoading(false);
      setIsInitialLoad(false);
    };

    fetchDashboardData();
  }, [tenantId, timeFilter]);

  if (isInitialLoad) {
    return <div className="flex h-screen items-center justify-center bg-background text-primary font-bold">Loading Dashboard...</div>;
  }

  return (
    <div className={`min-h-screen bg-background p-8 font-['DM_Sans',sans-serif] transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground">Admin Overview</h1>
          <p className="text-muted-foreground">Live metrics from your restaurant</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-xl border border-border bg-card">
            {(['today', 'week', 'month', 'year'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${timeFilter === t
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          <Link
            href={`/${tenantId}/pos`}
            className="rounded-xl bg-primary px-6 py-2 font-bold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity" target='_blank'
            rel="noopener noreferrer"
          >
            Open POS
          </Link>
        </div>
      </div>

      <InventoryAlertBanner />

      {/* Top Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
            <FiDollarSign className="text-2xl" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-black text-foreground">₹{stats.revenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <FiShoppingBag className="text-2xl" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Total Orders</p>
            <p className="text-3xl font-black text-foreground">{stats.orderCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
            <FiTrendingUp className="text-2xl" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Avg. Order Value</p>
            <p className="text-3xl font-black text-foreground">
              ₹{stats.orderCount > 0 ? (stats.revenue / stats.orderCount).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts & Shift Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">

        {/* PAYMENT PIE CHART */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm xl:col-span-1">
          <h3 className="mb-6 text-xl font-black text-foreground">Payment Methods</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, value, cx, cy, midAngle, innerRadius, outerRadius }: any) => {
                    if (value === 0) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) + 20;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="currentColor" className="text-sm sm:text-base font-black text-foreground" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        ₹{Number(value).toFixed(0)}
                      </text>
                    );
                  }}
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  formatter={(value: any) => [`₹${Number(value || 0).toFixed(2)}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-sm font-bold text-foreground mt-4">
            <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#4f46e5]"></div>UPI</span>
            <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#10b981]"></div>Cash</span>
            <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#f59e0b]"></div>Card</span>
          </div>
        </div>

        {/* NEW SHIFT TRACKER WIDGET */}
        <div className="xl:col-span-2">
          <ShiftTracker />
        </div>

      </div>

      {/* Dine In vs Takeaway Comparison & Demand Section */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Dine In vs Takeaway Pie/Comparison Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm xl:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-foreground mb-1">Dine In vs Takeaway</h3>
            <p className="text-xs text-muted-foreground mb-6">Revenue and orders comparison</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl bg-muted/50 p-4 border border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dine In</p>
              <p className="text-xl font-black text-indigo-400 mt-1">₹{(orderTypeData.find(d => d.name === 'Dine In')?.value || 0).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{(orderTypeData.find(d => d.name === 'Dine In')?.count || 0)} orders</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4 border border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Takeaway</p>
              <p className="text-xl font-black text-emerald-400 mt-1">₹{(orderTypeData.find(d => d.name === 'Takeaway')?.value || 0).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{(orderTypeData.find(d => d.name === 'Takeaway')?.count || 0)} orders</p>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }: any) => {
                    if (percent === 0) return null;
                    return `${(percent * 100).toFixed(0)}%`;
                  }}
                >
                  <Cell fill="#4f46e5" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  formatter={(value: any) => [`₹${Number(value || 0).toFixed(2)}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-sm font-bold text-foreground mt-4">
            <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#4f46e5]"></div>Dine In</span>
            <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#10b981]"></div>Takeaway</span>
          </div>
        </div>

        {/* Dine In vs Takeaway Item Demand */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm xl:col-span-2">
          <div className="mb-6">
            <h3 className="text-xl font-black text-foreground">Order Items Demand</h3>
            <p className="text-xs text-muted-foreground">Most popular items by order type</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Dine In Demand List */}
            <div>
              <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                Top Dine-In Demand
              </h4>
              <div className="space-y-4">
                {dineInDemand.length > 0 ? (
                  dineInDemand.map((item, index) => {
                    const maxQty = Math.max(...dineInDemand.map(i => i.quantity), 1);
                    const pct = (item.quantity / maxQty) * 100;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-foreground flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                            {item.name}
                          </span>
                          <span className="text-primary">{item.quantity} sold</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground py-4">No dine-in items data available.</p>
                )}
              </div>
            </div>

            {/* Takeaway Demand List */}
            <div>
              <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Top Takeaway Demand
              </h4>
              <div className="space-y-4">
                {takeawayDemand.length > 0 ? (
                  takeawayDemand.map((item, index) => {
                    const maxQty = Math.max(...takeawayDemand.map(i => i.quantity), 1);
                    const pct = (item.quantity / maxQty) * 100;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-foreground flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                            {item.name}
                          </span>
                          <span className="text-emerald-500">{item.quantity} sold</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground py-4">No takeaway items data available.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}