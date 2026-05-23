import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface CategoriesTableProps {
  categories: any[];
  onEdit: (category: any) => void;
  onDelete: (id: string, name: string) => void;
}

export default function CategoriesTable({ categories, onEdit, onDelete }: CategoriesTableProps) {
  // Sort categories by their 'order' value before displaying
  const sortedCategories = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[500px] text-left text-sm">
        <thead className="border-b border-border bg-muted text-muted-foreground">
          <tr>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs">Category Name</th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs text-center">Display Order</th>
            <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedCategories.map((category) => (
            <tr key={category.id} className="transition-colors hover:bg-muted">
              <td className="p-4 font-bold text-foreground">{category.name}</td>
              <td className="p-4 font-medium text-muted-foreground text-center">{category.order || 0}</td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onEdit(category)} className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-primary/20 hover:text-primary">
                    <FiEdit2 />
                  </button>
                  <button onClick={() => onDelete(category.id, category.name)} className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-rose-100 hover:text-rose-600">
                    <FiTrash2 />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {categories.length === 0 && (
            <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No categories found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}