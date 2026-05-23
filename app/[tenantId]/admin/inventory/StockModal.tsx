import { useState, useEffect } from "react";
interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  existingItem: any | null;
}
export default function StockModal({
  isOpen,
  onClose,
  onSave,
  existingItem,
}: StockModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    unit: "g",
    currentStock: "",
    threshold: "",
    expiryDate: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (existingItem) {
      setFormData({
        name: existingItem.name,
        unit: existingItem.unit,
        currentStock: existingItem.currentStock.toString(),
        threshold: existingItem.threshold.toString(),
        expiryDate: existingItem.expiryDate || "",
      });
    } else {
      setFormData({ name: "", unit: "g", currentStock: "", threshold: "", expiryDate: "" });
    }
  }, [existingItem, isOpen]);
  if (!isOpen) return null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({
      name: formData.name,
      unit: formData.unit,
      currentStock: Number(formData.currentStock),
      threshold: Number(formData.threshold),
      expiryDate: formData.expiryDate || null,
    });
    setIsSaving(false);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm font-['DM_Sans',sans-serif]">
      
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl sm:p-8">
        
        <h2 className="mb-6 text-2xl font-black text-foreground ">
          
          {existingItem ? "Update Stock Item" : "Add Raw Material"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              Material Name
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary "
              placeholder="e.g. Arabica Coffee Beans"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            
            <div>
              
              <label className="mb-1 block text-sm font-semibold text-muted-foreground">
                Measurement Unit
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary "
              >
                
                <option value="g">Grams (g)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="pcs">Pieces (pcs)</option>
              </select>
            </div>
            <div>
              
              <label className="mb-1 block text-sm font-semibold text-muted-foreground">
                Current Stock
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.1"
                value={formData.currentStock}
                onChange={(e) =>
                  setFormData({ ...formData, currentStock: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary "
                placeholder="5000"
              />
            </div>
          </div>
          <div>
            
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              Low Stock Alert Threshold
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.1"
              value={formData.threshold}
              onChange={(e) =>
                setFormData({ ...formData, threshold: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary "
              placeholder="e.g. Alert me when below 500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary "
            />
          </div>
          <div className="mt-8 flex gap-3 pt-4 border-t border-border ">
            
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
              
              {isSaving ? "Saving..." : "Save Material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
