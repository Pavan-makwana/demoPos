import { useState, useEffect } from "react";
import { FiX, FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";

interface ComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  existingCombo: any | null;
  allItems: any[];
}

export default function ComboModal({
  isOpen,
  onClose,
  onSave,
  existingCombo,
  allItems,
}: ComboModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingCombo) {
      setName(existingCombo.name || "");
      setPrice(existingCombo.price ? existingCombo.price.toString() : "");
      setSelectedItemIds(existingCombo.itemIds || []);
    } else {
      setName("");
      setPrice("");
      setSelectedItemIds([]);
    }
    setSearchQuery("");
  }, [existingCombo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemIds.length === 0) {
      toast.error("Please select at least one menu item for this combo.");
      return;
    }
    setIsSaving(true);
    await onSave({
      name,
      price: Number(price),
      itemIds: selectedItemIds,
    });
    setIsSaving(false);
  };

  const filteredItems = allItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl sm:p-8 border border-border">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-foreground">
            {existingCombo ? "Edit Combo" : "Add New Combo"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg bg-muted p-2 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              Combo Name
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary text-sm"
              placeholder="e.g. Burger & Drink Combo"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              Combo Price (₹)
            </label>
            <input
              required
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary text-sm"
              placeholder="350"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-muted-foreground">
              Select Included Items ({selectedItemIds.length} selected)
            </label>
            
            {/* Search items bar */}
            <div className="relative mb-2">
              <FiSearch className="absolute left-3 top-3 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-input p-2.5 pl-9 outline-none focus:border-primary text-xs"
              />
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3 space-y-2.5">
              {filteredItems.map((item) => {
                const isChecked = selectedItemIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedItemIds(
                            selectedItemIds.filter((id) => id !== item.id)
                          );
                        } else {
                          setSelectedItemIds([...selectedItemIds, item.id]);
                        }
                      }}
                      className="h-4.5 w-4.5 rounded border-border text-primary focus:ring-ring cursor-pointer"
                    />
                    <span className="text-sm text-foreground font-medium">
                      {item.name} <span className="text-xs text-primary font-bold">(₹{item.price})</span>
                    </span>
                  </label>
                );
              })}
              {filteredItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No menu items found.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-muted py-3.5 font-bold text-foreground hover:bg-muted/80 text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-70 text-sm transition-all cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Combo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
