import { useState, useEffect } from "react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  existingCategory: any | null;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  existingCategory,
}: CategoryModalProps) {
  const [formData, setFormData] = useState({ name: "", order: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingCategory) {
      setFormData({
        name: existingCategory.name,
        order: existingCategory.order?.toString() || "0",
      });
    } else {
      setFormData({ name: "", order: "0" });
    }
  }, [existingCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({ name: formData.name, order: Number(formData.order) });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl sm:p-8">
        <h2 className="mb-6 text-2xl font-black text-foreground ">
          
          {existingCategory ? "Edit Category" : "Add Category"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              Category Name
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary "
              placeholder="e.g. Summer Specials"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              Display Order (Lower = First)
            </label>
            <input
              required
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary "
              placeholder="0"
            />
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
              
              {isSaving ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
