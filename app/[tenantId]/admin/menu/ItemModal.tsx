import { useState, useEffect } from "react";
interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  existingItem: any | null;
  categories: any[];
  allItems: any[];
}
export default function ItemModal({
  isOpen,
  onClose,
  onSave,
  existingItem,
  categories,
  allItems,
}: ItemModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    categoryId: "",
    isAvailable: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (existingItem) {
      setFormData({
        name: existingItem.name,
        price: existingItem.price.toString(),
        categoryId: existingItem.categoryId,
        isAvailable: existingItem.isAvailable,
      });
    } else {
      setFormData({
        name: "",
        price: "",
        categoryId: categories[0]?.id || "",
        isAvailable: true,
      });
    }
  }, [existingItem, categories, isOpen]);
  if (!isOpen) return null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({
      name: formData.name,
      price: Number(formData.price),
      categoryId: formData.categoryId,
      isAvailable: formData.isAvailable,
    });
    setIsSaving(false);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl sm:p-8">
        
        <h2 className="mb-6 text-2xl font-black text-foreground ">
          
          {existingItem ? "Edit Item" : "Add New Item"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              Item Name
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary "
              placeholder="e.g. Mocha Frappe"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            
            <div>
              
              <label className="mb-1 block text-sm font-semibold text-muted-foreground">
                Price (₹)
              </label>
              <input
                required
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary "
                placeholder="150"
              />
            </div>
            <div>
              
              <label className="mb-1 block text-sm font-semibold text-muted-foreground">
                Category
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary "
              >
                
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) =>
                setFormData({ ...formData, isAvailable: e.target.checked })
              }
              className="h-5 w-5 rounded border-border text-primary focus:ring-ring"
            />
            <label
              htmlFor="isAvailable"
              className="font-semibold text-foreground "
            >
              Item is available for sale
            </label>
          </div>


          <div className="mt-8 flex gap-3 pt-4">
            
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-muted py-3.5 font-bold text-foreground hover:opacity-90 "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-70"
            >
              
              {isSaving ? "Saving..." : "Save Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
