import { FiEdit2, FiTrash2 } from "react-icons/fi";

interface CombosTableProps {
  combos: any[];
  allItems: any[];
  onEdit: (combo: any) => void;
  onDelete: (id: string, name: string) => void;
}

export default function CombosTable({
  combos,
  allItems,
  onEdit,
  onDelete,
}: CombosTableProps) {
  
  const getItemNames = (itemIds: string[]) => {
    if (!itemIds || itemIds.length === 0) return "No items";
    return itemIds
      .map((id) => allItems.find((i) => i.id === id)?.name || "Unknown Item")
      .join(" + ");
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="border-b border-border bg-muted text-muted-foreground">
          <tr>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs">
              Combo / Offer Name
            </th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs">
              Included Food Items
            </th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs">
              Combo Price
            </th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {combos.map((combo) => (
            <tr key={combo.id} className="transition-colors hover:bg-muted">
              <td className="p-4 font-bold text-foreground">
                {combo.name}
              </td>
              <td className="p-4 font-medium text-muted-foreground">
                {getItemNames(combo.itemIds)}
              </td>
              <td className="p-4 font-bold text-primary">
                ₹{combo.price}
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(combo)}
                    className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(combo.id, combo.name)}
                    className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {combos.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-muted-foreground">
                No combos or packages created yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
