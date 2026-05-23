import { useState, useEffect } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";
interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (menuItemId: string, recipe: any[]) => Promise<void>;
  menuItem: any | null;
  rawMaterials: any[];
}
export default function RecipeModal({
  isOpen,
  onClose,
  onSave,
  menuItem,
  rawMaterials,
}: RecipeModalProps) {
  const [recipe, setRecipe] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (menuItem) {
      setRecipe(menuItem.recipe || []);
    } else {
      setRecipe([]);
    }
  }, [menuItem, isOpen]);
  if (!isOpen || !menuItem) return null;
  const handleAddIngredient = () => {
    if (rawMaterials.length === 0)
      return toast.error("Please add Raw Materials to your Stockroom first!");
    setRecipe([...recipe, { materialId: rawMaterials[0].id, quantity: "" }]);
  };
  const handleRemoveIngredient = (index: number) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };
  const handleIngredientChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updated = [...recipe];
    updated[index][field] = field === "quantity" ? Number(value) : value;
    setRecipe(updated);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(menuItem.id, recipe);
    setIsSaving(false);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm font-['DM_Sans',sans-serif]">
      
      <div className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl sm:p-8">
        
        <h2 className="mb-2 text-2xl font-black text-foreground ">
          Recipe Builder
        </h2>
        <p className="mb-6 text-sm font-semibold text-primary ">
          Configuring: {menuItem.name}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
            
            {recipe.map((ingredient, index) => {
              const selectedMaterial = rawMaterials.find(
                (rm) => rm.id === ingredient.materialId,
              );
              const unit = selectedMaterial ? selectedMaterial.unit : "";
              return (
                <div
                  key={index}
                  className="flex items-end gap-2 bg-muted p-3 rounded-xl border border-border "
                >
                  
                  <div className="flex-1">
                    
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                      Ingredient
                    </label>
                    <select
                      required
                      value={ingredient.materialId}
                      onChange={(e) =>
                        handleIngredientChange(
                          index,
                          "materialId",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-input p-2 outline-none text-sm"
                    >
                      
                      {rawMaterials.map((rm) => (
                        <option key={rm.id} value={rm.id}>
                          {rm.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                      Qty ({unit})
                    </label>
                    <input
                      required
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={ingredient.quantity}
                      onChange={(e) =>
                        handleIngredientChange(
                          index,
                          "quantity",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-input p-2 outline-none text-sm"
                      placeholder="15"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="h-[38px] w-[38px] flex items-center justify-center rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 mb-[1px]"
                  >
                    
                    <FiTrash2 size={16} />
                  </button>
                </div>
              );
            })}
            {recipe.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No ingredients linked yet.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            
            <FiPlus /> Add Ingredient
          </button>
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
              
              {isSaving ? "Saving..." : "Save Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
