import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { MenuItem, InventoryItem } from "../../types/schema";

export async function deductInventory(cartItems: any[]) {
  try {
    for (const cartItem of cartItems) {
      const menuRef = doc(db, "menus", cartItem.itemId);
      const menuSnap = await getDoc(menuRef);

      if (menuSnap.exists()) {
        const recipe = menuSnap.data().recipe;

        if (recipe && recipe.length > 0) {
          for (const ingredient of recipe) {
            const totalDeduction = ingredient.quantity * cartItem.quantity;
            const inventoryRef = doc(db, "inventory", ingredient.materialId);

            await updateDoc(inventoryRef, {
              currentStock: increment(-totalDeduction),
            });
          }
        }
      }
    }

    if (cartItems.length > 0) {
      const menuRef = doc(db, "menus", cartItems[0].itemId);
      const menuSnap = await getDoc(menuRef);
      if (menuSnap.exists()) {
        const tId = menuSnap.data().tenantId;
        if (tId) {
          await syncMenuItemAvailability(tId);
        }
      }
    }
  } catch (error) {
    console.error("Failed to deduct inventory:", error);
  }
}

export async function syncMenuItemAvailability(tenantId: string) {
  try {
    // 1. Fetch all inventory items
    const invSnap = await getDocs(
      query(collection(db, "inventory"), where("tenantId", "==", tenantId))
    );
    const inventory = invSnap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as InventoryItem));

    // 2. Fetch all menu items
    const menuSnap = await getDocs(
      query(collection(db, "menus"), where("tenantId", "==", tenantId))
    );

    // 3. For each menu item, check if it relies on an out-of-stock ingredient
    const batch = writeBatch(db);
    let updatedCount = 0;

    menuSnap.docs.forEach((docSnap) => {
      const menuData = docSnap.data() as MenuItem;
      const recipe = menuData.recipe || [];

      if (recipe.length === 0) return;

      let shouldBeAvailable = true;
      for (const ingredient of recipe) {
        const invItem = inventory.find((item) => item.id === ingredient.materialId);
        const threshold = invItem && invItem.threshold !== undefined ? invItem.threshold : 0;
        if (!invItem || invItem.currentStock <= threshold) {
          shouldBeAvailable = false;
          break;
        }
      }

      if (menuData.isAvailable !== shouldBeAvailable) {
        batch.update(docSnap.ref, { isAvailable: shouldBeAvailable });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Error syncing menu availability:", error);
  }
}
