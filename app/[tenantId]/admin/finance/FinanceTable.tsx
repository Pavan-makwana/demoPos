import { FiTrash2 } from "react-icons/fi";
interface FinanceTableProps {
  expenses: any[];
  categories: { id: string; label: string }[];
  onDelete: (id: string, description: string) => void;
}
export default function FinanceTable({
  expenses,
  categories,
  onDelete,
}: FinanceTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="border-b border-border bg-muted text-muted-foreground ">
          <tr>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs">
              Date
            </th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs">
              Description
            </th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs">
              Category
            </th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">
              Amount
            </th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs text-center">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border ">
          {expenses.map((expense) => (
            <tr
              key={expense.id}
              className="transition-colors hover:bg-muted"
            >
              <td className="p-4 font-medium text-muted-foreground ">
                {expense.date?.toDate().toLocaleDateString()}
              </td>
              <td className="p-4 font-bold text-foreground ">
                {expense.description}
              </td>
              <td className="p-4">
                <span className="rounded-lg bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground ">
                  {categories.find((c) => c.id === expense.category)?.label ||
                    expense.category}
                </span>
              </td>
              <td className="p-4 text-right font-black text-rose-600 ">
                - ₹{expense.amount.toFixed(2)}
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onDelete(expense.id, expense.description)}
                  className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-rose-100 hover:text-rose-600"
                >
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          ))}
          {expenses.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-muted-foreground">
                No expenses recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
