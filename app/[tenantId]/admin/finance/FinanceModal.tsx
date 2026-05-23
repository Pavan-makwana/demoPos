import { useState } from 'react';
import { useAuth } from '../../../../lib/AuthContext';
import { storage } from '../../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';

interface FinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    description: string;
    amount: number;
    category: string;
    date: string;
    isInventoryPurchase?: boolean;
    inventoryItemId?: string | null;
    quantity?: number | null;
    billImageUrl?: string | null;
    paymentMethod?: string;
  }) => Promise<void>;
  categories: { id: string; label: string }[];
  inventoryItems: any[];
}

export default function FinanceModal({
  isOpen,
  onClose,
  onSave,
  categories,
  inventoryItems,
}: FinanceModalProps) {
  const { tenantId } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isInventoryPurchase, setIsInventoryPurchase] = useState(false);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState("");
  const [inventoryQty, setInventoryQty] = useState("");
  const [billImageFile, setBillImageFile] = useState<File | null>(null);
  const [purchaseUnit, setPurchaseUnit] = useState("");

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'supplies',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
  });

  if (!isOpen) return null;

  const getUnitOptions = () => {
    const item = inventoryItems.find((i) => i.id === selectedInventoryItemId);
    if (!item) return [];
    const baseUnit = (item.unit || "").toLowerCase();
    if (baseUnit === "ml") {
      return ["ml", "L"];
    }
    if (baseUnit === "g") {
      return ["g", "kg"];
    }
    return [item.unit || ""];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let billImageUrl = null;
      if (isInventoryPurchase && billImageFile && tenantId) {
        const storageRef = ref(storage, `tenants/${tenantId}/bills/${Date.now()}_${billImageFile.name}`);
        const uploadResult = await uploadBytes(storageRef, billImageFile);
        billImageUrl = await getDownloadURL(uploadResult.ref);
      }

      const qtyVal = Number(inventoryQty);
      const scaledQty = isInventoryPurchase && qtyVal
        ? (purchaseUnit === "L" || purchaseUnit === "kg" ? qtyVal * 1000 : qtyVal)
        : null;

      const finalDescription = isInventoryPurchase
        ? `${formData.description} (${inventoryQty} ${purchaseUnit})`
        : formData.description;

      await onSave({
        ...formData,
        description: finalDescription,
        amount: Number(formData.amount),
        isInventoryPurchase,
        inventoryItemId: isInventoryPurchase ? selectedInventoryItemId : null,
        quantity: scaledQty,
        billImageUrl,
      });

      // Reset on success
      setFormData({
        description: '',
        amount: '',
        category: 'supplies',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
      });
      setIsInventoryPurchase(false);
      setSelectedInventoryItemId("");
      setInventoryQty("");
      setBillImageFile(null);
      setPurchaseUnit("");
      toast.success("Expense logged successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error saving expense");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl sm:p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 text-2xl font-black text-foreground">Log Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-2xl mb-4">
            <span className="text-sm font-bold text-foreground">Inventory Purchase?</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isInventoryPurchase}
                onChange={(e) => {
                  setIsInventoryPurchase(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedInventoryItemId("");
                    setInventoryQty("");
                    setBillImageFile(null);
                    setPurchaseUnit("");
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {isInventoryPurchase && (
            <div className="space-y-4 border-l-4 border-rose-500 bg-rose-500/5 pl-4 pr-2 py-3 rounded-r-2xl border-t border-r border-b border-border/40">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Material
                </label>
                <select
                  required={isInventoryPurchase}
                  value={selectedInventoryItemId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedInventoryItemId(val);
                    const item = inventoryItems.find((item) => item.id === val);
                    if (item) {
                      setFormData((prev) => ({
                        ...prev,
                        description: `Inventory Purchase: ${item.name}`,
                        category: "supplies",
                      }));
                      setPurchaseUnit(item.unit || "");
                    } else {
                      setPurchaseUnit("");
                    }
                  }}
                  className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary text-sm font-semibold"
                >
                  <option value="">-- Choose Raw Material --</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInventoryItemId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Quantity
                    </label>
                    <div className="flex gap-2">
                      <input
                        required={isInventoryPurchase}
                        type="number"
                        min="0.1"
                        step="any"
                        value={inventoryQty}
                        onChange={(e) => setInventoryQty(e.target.value)}
                        className="w-2/3 rounded-xl border border-border bg-input p-3 outline-none focus:border-primary text-sm font-bold"
                        placeholder="Qty"
                      />
                      <select
                        value={purchaseUnit}
                        onChange={(e) => setPurchaseUnit(e.target.value)}
                        className="w-1/3 rounded-xl border border-border bg-input p-2.5 outline-none focus:border-primary text-xs font-extrabold text-rose-500 uppercase cursor-pointer"
                      >
                        {getUnitOptions().map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Bill Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setBillImageFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-muted-foreground file:mr-2 file:py-2.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 file:cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Date</label>
            <input
              required
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Description</label>
            <input
              required
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary"
              placeholder="e.g. 10 Liters Amul Milk"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Amount (₹)</label>
            <input
              required
              type="number"
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary"
              placeholder="650"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Category</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Paid Via (Payment Method)</label>
            <select
              required
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full rounded-xl border border-border bg-input p-3 outline-none focus:border-primary"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div className="mt-8 flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-muted py-3.5 font-bold text-foreground hover:opacity-90"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-rose-600 py-3.5 font-bold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}