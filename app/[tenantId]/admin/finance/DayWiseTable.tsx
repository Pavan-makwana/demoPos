import { useMemo } from 'react';

interface DayWiseTableProps {
  orders: any[];
  expenses: any[];
}

export default function DayWiseTable({ orders, expenses }: DayWiseTableProps) {
  const dayWiseData = useMemo(() => {
    const data: Record<string, { date: string; revenue: number; ordersCount: number; expenses: number; profit: number }> = {};

    orders.forEach(order => {
      const dateObj = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      if (!dateObj || isNaN(dateObj.getTime())) return;
      const d = dateObj.toISOString().split('T')[0];
      if (!data[d]) data[d] = { date: d, revenue: 0, ordersCount: 0, expenses: 0, profit: 0 };
      data[d].revenue += order.total || 0;
      data[d].ordersCount += 1;
    });

    expenses.forEach(exp => {
      // "date" for expenses is a timestamp or date string from the form.
      // Since we store it using `Timestamp.fromDate(new Date(data.date))` in page.tsx, it's a Firestore Timestamp.
      const dateObj = exp.date?.toDate ? exp.date.toDate() : new Date(exp.date);
      if (!dateObj || isNaN(dateObj.getTime())) return;
      const d = dateObj.toISOString().split('T')[0];
      if (!data[d]) data[d] = { date: d, revenue: 0, ordersCount: 0, expenses: 0, profit: 0 };
      data[d].expenses += exp.amount || 0;
    });

    Object.values(data).forEach(day => {
      day.profit = day.revenue - day.expenses;
    });

    return Object.values(data).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, expenses]);

  return (
    <div className="mb-8 rounded-2xl border border-border bg-card shadow-sm overflow-hidden overflow-x-auto">
      <div className="border-b border-border p-4 bg-muted/50">
        <h2 className="text-lg font-black text-foreground">Day-Wise Performance</h2>
      </div>
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="border-b border-border bg-muted text-muted-foreground">
          <tr>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs">Date</th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs text-center">Orders</th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Revenue</th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Expenses</th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Net Profit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {dayWiseData.map((day) => (
            <tr key={day.date} className="transition-colors hover:bg-muted">
              <td className="p-4 font-medium text-muted-foreground">
                {new Date(day.date).toLocaleDateString()}
              </td>
              <td className="p-4 text-center font-bold text-foreground">
                {day.ordersCount}
              </td>
              <td className="p-4 text-right font-black text-emerald-600">
                + ₹{day.revenue.toFixed(2)}
              </td>
              <td className="p-4 text-right font-black text-rose-600">
                - ₹{day.expenses.toFixed(2)}
              </td>
              <td className={`p-4 text-right font-black ${day.profit >= 0 ? 'text-primary' : 'text-rose-600'}`}>
                ₹{day.profit.toFixed(2)}
              </td>
            </tr>
          ))}
          {dayWiseData.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-muted-foreground">
                No transactions recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
