import { FiEdit2, FiTrash2, FiCheck, FiX } from "react-icons/fi";
interface ItemsTableProps {
  items: any[];
  categories: any[];
  onEdit: (item: any) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}
export default function ItemsTable({
  items,
  categories,
  onEdit,
  onDelete,
  onToggleStatus,
}: ItemsTableProps) {
  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || "Unknown";
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden overflow-x-auto">
      
      <table className="w-full min-w-[700px] text-left text-sm">
        
        <thead className="border-b border-border bg-muted text-muted-foreground ">
          
          <tr>
            
            <th className="p-4 font-semibold uppercase tracking-wider text-xs">
              Item Name
            </th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs">
              Category
            </th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs">
              Price
            </th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs text-center">
              Status
            </th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border ">
          
          {items.map((item) => (
            <tr
              key={item.id}
              className="transition-colors hover:bg-muted"
            >
              
              <td className="p-4 font-bold text-foreground ">
                {item.name}
              </td>
              <td className="p-4 font-medium text-muted-foreground ">
                {getCategoryName(item.categoryId)}
              </td>
              <td className="p-4 font-bold text-primary ">₹{item.price}</td>
              <td className="p-4 text-center">
                
                <button
                  onClick={() => onToggleStatus(item.id, item.isAvailable)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${item.isAvailable ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 " : "bg-rose-100 text-rose-700 hover:bg-rose-200 "}`}
                >
                  
                  {item.isAvailable ? (
                    <>
                      <FiCheck /> Available
                    </>
                  ) : (
                    <>
                      <FiX /> Sold Out
                    </>
                  )}
                </button>
              </td>
              <td className="p-4 text-right">
                
                <div className="flex justify-end gap-2">
                  
                  <button
                    onClick={() => onEdit(item)}
                    className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-primary/20 hover:text-primary"
                  >
                    
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => onDelete(item.id, item.name)}
                    className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-rose-100 hover:text-rose-600"
                  >
                    
                    <FiTrash2 />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-muted-foreground">
                No items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
