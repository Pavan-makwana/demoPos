import { FiTrendingDown, FiPieChart, FiDollarSign, FiShoppingBag, FiActivity } from "react-icons/fi";

interface FinanceStatsProps {
  totalExpenses: number;
  expenseCount: number;
  totalRevenue: number;
  totalOrdersCount: number;
  netProfit: number;
}

export default function FinanceStats({
  totalExpenses,
  expenseCount,
  totalRevenue,
  totalOrdersCount,
  netProfit
}: FinanceStatsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenue */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <FiDollarSign className="text-2xl" />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-black text-foreground">₹{totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Total Orders */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <FiShoppingBag className="text-2xl" />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-black text-foreground">{totalOrdersCount}</p>
        </div>
      </div>

      {/* Total Expenses */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <FiTrendingDown className="text-2xl" />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Operating Expenses</p>
          <p className="text-2xl font-black text-foreground">₹{totalExpenses.toFixed(2)}</p>
        </div>
      </div>

      {/* Net Profit */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${netProfit >= 0 ? 'bg-primary/10 text-primary' : 'bg-rose-100 text-rose-600'}`}>
          <FiActivity className="text-2xl" />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Net Profit</p>
          <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-primary' : 'text-rose-600'}`}>
            ₹{netProfit.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
