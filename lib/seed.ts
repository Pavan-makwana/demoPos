import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export async function seedDatabase() {
  try {
    const tenantId = "newkappscorner"; 

    // 1. DANGEROUS: WIPE EXISTING DATA CLEAN
    const collectionsToClear = ["categories", "menus", "inventory"];
    for (const colName of collectionsToClear) {
      const q = query(
        collection(db, colName),
        where("tenantId", "==", tenantId),
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    console.log("Old data wiped. Building Kapp's Corner stockroom...");

    // 2. CREATE DIGITAL STOCKROOM (Specific to Kapp's Corner Menu)
    const inventoryData = {
      // Dairy & Basics
      milk: { name: "Full Cream Milk", unit: "ml", currentStock: 20000, threshold: 2000, tenantId },
      cheese: { name: "Cheese (Mozzarella/Processed)", unit: "g", currentStock: 10000, threshold: 1000, tenantId },
      butter: { name: "Butter", unit: "g", currentStock: 5000, threshold: 500, tenantId },
      paneer: { name: "Fresh Paneer", unit: "g", currentStock: 5000, threshold: 1000, tenantId },

      // Breads & Bases
      bread: { name: "Sandwich Bread", unit: "pcs", currentStock: 200, threshold: 20, tenantId },
      pizza_base: { name: "Pizza Base", unit: "pcs", currentStock: 150, threshold: 20, tenantId },
      
      // Groceries & Produce
      wheat_flour: { name: "Wheat Flour (Atta)", unit: "g", currentStock: 15000, threshold: 3000, tenantId },
      potatoes: { name: "Potatoes (Aloo)", unit: "g", currentStock: 10000, threshold: 2000, tenantId },
      mixed_veg: { name: "Mixed Vegetables", unit: "g", currentStock: 8000, threshold: 1000, tenantId },
      mushroom: { name: "Mushrooms", unit: "g", currentStock: 3000, threshold: 500, tenantId },

      // Noodles & Chinese
      maggi_pkt: { name: "Maggi Packets", unit: "pcs", currentStock: 200, threshold: 30, tenantId },
      noodles: { name: "Hakka Noodles (Raw)", unit: "g", currentStock: 10000, threshold: 1000, tenantId },
      rice: { name: "Basmati Rice", unit: "g", currentStock: 15000, threshold: 2000, tenantId },
      chinese_sauces: { name: "Chinese Sauces (Mix)", unit: "ml", currentStock: 5000, threshold: 500, tenantId },

      // Beverages & Shakes
      tea_leaves: { name: "Special Tea Leaves", unit: "g", currentStock: 2000, threshold: 300, tenantId },
      coffee_classic: { name: "Nescafe Classic", unit: "g", currentStock: 1000, threshold: 200, tenantId },
      coffee_gold: { name: "Nescafe Gold", unit: "g", currentStock: 1000, threshold: 200, tenantId },
      sugar: { name: "Sugar", unit: "g", currentStock: 10000, threshold: 1000, tenantId },
      mango_pulp: { name: "Mango Pulp", unit: "ml", currentStock: 3000, threshold: 500, tenantId },
      pineapple_crush: { name: "Pineapple Crush", unit: "ml", currentStock: 3000, threshold: 500, tenantId },
      kaju: { name: "Cashews (Kaju)", unit: "g", currentStock: 2000, threshold: 300, tenantId },
      anjeer: { name: "Figs (Anjeer)", unit: "g", currentStock: 1500, threshold: 200, tenantId },
    };

    const invIds: Record<string, string> = {};
    for (const [key, data] of Object.entries(inventoryData)) {
      const docRef = await addDoc(collection(db, "inventory"), data);
      invIds[key] = docRef.id;
    }

    console.log("Stockroom built. Building Categories...");

    // 3. CREATE KAPP'S CORNER CATEGORIES
    const catData = {
      paratha: { name: "Paratha/Naan", order: 1, tenantId },
      pizza: { name: "Pizza", order: 2, tenantId },
      sandwich: { name: "Grilled Sandwich", order: 3, tenantId },
      maggi: { name: "Maggi Noodles", order: 4, tenantId },
      chinese: { name: "Chinese", order: 5, tenantId },
      hot_bev: { name: "Hot Beverages", order: 6, tenantId },
      shake: { name: "Milk Shake", order: 7, tenantId },
    };

    const catIds: Record<string, string> = {};
    for (const [key, data] of Object.entries(catData)) {
      const docRef = await addDoc(collection(db, "categories"), data);
      catIds[key] = docRef.id;
    }

    console.log("Categories built. Linking Smart Menu Items...");

    // 4. CREATE KAPP'S CORNER MENU ITEMS (WITH SMART RECIPES)
    const menuData = [
      // --- PARATHA / NAAN ---
      { name: "Aloo Paratha", categoryId: catIds.paratha, price: 160, isAvailable: true, tenantId, recipe: [{ materialId: invIds.wheat_flour, quantity: 100 }, { materialId: invIds.potatoes, quantity: 80 }] },
      { name: "Mix Veg Paratha", categoryId: catIds.paratha, price: 160, isAvailable: true, tenantId, recipe: [{ materialId: invIds.wheat_flour, quantity: 100 }, { materialId: invIds.mixed_veg, quantity: 60 }] },
      { name: "Panner Paratha", categoryId: catIds.paratha, price: 180, isAvailable: true, tenantId, recipe: [{ materialId: invIds.wheat_flour, quantity: 100 }, { materialId: invIds.paneer, quantity: 60 }] },

      // --- PIZZA ---
      { name: "Only Cheese Pizza", categoryId: catIds.pizza, price: 150, isAvailable: true, tenantId, recipe: [{ materialId: invIds.pizza_base, quantity: 1 }, { materialId: invIds.cheese, quantity: 80 }] },
      { name: "Mexican Pizza", categoryId: catIds.pizza, price: 150, isAvailable: true, tenantId, recipe: [{ materialId: invIds.pizza_base, quantity: 1 }, { materialId: invIds.cheese, quantity: 60 }, { materialId: invIds.mixed_veg, quantity: 40 }] },
      { name: "Italian Pizza", categoryId: catIds.pizza, price: 150, isAvailable: true, tenantId, recipe: [{ materialId: invIds.pizza_base, quantity: 1 }, { materialId: invIds.cheese, quantity: 60 }] },
      { name: "American Pizza", categoryId: catIds.pizza, price: 150, isAvailable: true, tenantId, recipe: [{ materialId: invIds.pizza_base, quantity: 1 }, { materialId: invIds.cheese, quantity: 60 }] },
      { name: "Mushroom Pizza", categoryId: catIds.pizza, price: 200, isAvailable: true, tenantId, recipe: [{ materialId: invIds.pizza_base, quantity: 1 }, { materialId: invIds.cheese, quantity: 60 }, { materialId: invIds.mushroom, quantity: 50 }] },
      { name: "Panner Pizza", categoryId: catIds.pizza, price: 200, isAvailable: true, tenantId, recipe: [{ materialId: invIds.pizza_base, quantity: 1 }, { materialId: invIds.cheese, quantity: 60 }, { materialId: invIds.paneer, quantity: 50 }] },
      { name: "Kapp's Special Pizza", categoryId: catIds.pizza, price: 300, isAvailable: true, tenantId, recipe: [{ materialId: invIds.pizza_base, quantity: 1 }, { materialId: invIds.cheese, quantity: 100 }, { materialId: invIds.paneer, quantity: 40 }, { materialId: invIds.mushroom, quantity: 30 }] },

      // --- GRILLED SANDWICH ---
      { name: "Only Cheese Grilled", categoryId: catIds.sandwich, price: 150, isAvailable: true, tenantId, recipe: [{ materialId: invIds.bread, quantity: 2 }, { materialId: invIds.cheese, quantity: 50 }, { materialId: invIds.butter, quantity: 15 }] },
      { name: "Mushroom Sandwich", categoryId: catIds.sandwich, price: 150, isAvailable: true, tenantId, recipe: [{ materialId: invIds.bread, quantity: 2 }, { materialId: invIds.mushroom, quantity: 40 }, { materialId: invIds.butter, quantity: 15 }] },
      { name: "Kapp's Sandwich", categoryId: catIds.sandwich, price: 170, isAvailable: true, tenantId, recipe: [{ materialId: invIds.bread, quantity: 3 }, { materialId: invIds.cheese, quantity: 40 }, { materialId: invIds.mixed_veg, quantity: 30 }] },
      { name: "Veg. Grilled", categoryId: catIds.sandwich, price: 170, isAvailable: true, tenantId, recipe: [{ materialId: invIds.bread, quantity: 2 }, { materialId: invIds.mixed_veg, quantity: 50 }, { materialId: invIds.butter, quantity: 15 }] },
      { name: "Panner Sandwich", categoryId: catIds.sandwich, price: 200, isAvailable: true, tenantId, recipe: [{ materialId: invIds.bread, quantity: 2 }, { materialId: invIds.paneer, quantity: 50 }, { materialId: invIds.butter, quantity: 15 }] },
      { name: "Kapp's Special Jumbo", categoryId: catIds.sandwich, price: 300, isAvailable: true, tenantId, recipe: [{ materialId: invIds.bread, quantity: 4 }, { materialId: invIds.cheese, quantity: 80 }, { materialId: invIds.paneer, quantity: 40 }] },

      // --- MAGGI NOODLES ---
      { name: "Masala Maggi", categoryId: catIds.maggi, price: 80, isAvailable: true, tenantId, recipe: [{ materialId: invIds.maggi_pkt, quantity: 1 }] },
      { name: "Garlic Maggi", categoryId: catIds.maggi, price: 110, isAvailable: true, tenantId, recipe: [{ materialId: invIds.maggi_pkt, quantity: 1 }] },
      { name: "Vegetable Maggi", categoryId: catIds.maggi, price: 160, isAvailable: true, tenantId, recipe: [{ materialId: invIds.maggi_pkt, quantity: 1 }, { materialId: invIds.mixed_veg, quantity: 50 }] },

      // --- CHINESE ---
      { name: "Manchurian (Dry/Gravy)", categoryId: catIds.chinese, price: 200, isAvailable: true, tenantId, recipe: [{ materialId: invIds.mixed_veg, quantity: 100 }, { materialId: invIds.chinese_sauces, quantity: 30 }] },
      { name: "Hakka Noodles", categoryId: catIds.chinese, price: 200, isAvailable: true, tenantId, recipe: [{ materialId: invIds.noodles, quantity: 150 }, { materialId: invIds.chinese_sauces, quantity: 20 }] },
      { name: "Fried Rice", categoryId: catIds.chinese, price: 200, isAvailable: true, tenantId, recipe: [{ materialId: invIds.rice, quantity: 150 }, { materialId: invIds.chinese_sauces, quantity: 20 }] },
      { name: "Singapuri Fried Rice", categoryId: catIds.chinese, price: 230, isAvailable: true, tenantId, recipe: [{ materialId: invIds.rice, quantity: 150 }, { materialId: invIds.paneer, quantity: 30 }] },
      { name: "Panner Chilly (Dry/Gravy)", categoryId: catIds.chinese, price: 250, isAvailable: true, tenantId, recipe: [{ materialId: invIds.paneer, quantity: 100 }, { materialId: invIds.chinese_sauces, quantity: 40 }] },
      { name: "Schezwan Rice (Panner)", categoryId: catIds.chinese, price: 250, isAvailable: true, tenantId, recipe: [{ materialId: invIds.rice, quantity: 150 }, { materialId: invIds.paneer, quantity: 40 }] },
      { name: "Schezwan Noodles (Panner)", categoryId: catIds.chinese, price: 250, isAvailable: true, tenantId, recipe: [{ materialId: invIds.noodles, quantity: 150 }, { materialId: invIds.paneer, quantity: 40 }] },

      // --- HOT BEVERAGES ---
      { name: "Special Tea", categoryId: catIds.hot_bev, price: 50, isAvailable: true, tenantId, recipe: [{ materialId: invIds.tea_leaves, quantity: 5 }, { materialId: invIds.milk, quantity: 80 }, { materialId: invIds.sugar, quantity: 10 }] },
      { name: "Black Lemon Tea", categoryId: catIds.hot_bev, price: 60, isAvailable: true, tenantId, recipe: [{ materialId: invIds.tea_leaves, quantity: 3 }, { materialId: invIds.sugar, quantity: 15 }] },
      { name: "Black Coffee (Nescafe Classic)", categoryId: catIds.hot_bev, price: 60, isAvailable: true, tenantId, recipe: [{ materialId: invIds.coffee_classic, quantity: 5 }, { materialId: invIds.sugar, quantity: 10 }] },
      { name: "Espresso Coffee (Nescafe Gold)", categoryId: catIds.hot_bev, price: 100, isAvailable: true, tenantId, recipe: [{ materialId: invIds.coffee_gold, quantity: 8 }] },

      // --- MILK SHAKE ---
      { name: "Mango Shake", categoryId: catIds.shake, price: 150, isAvailable: true, tenantId, recipe: [{ materialId: invIds.mango_pulp, quantity: 50 }, { materialId: invIds.milk, quantity: 200 }, { materialId: invIds.sugar, quantity: 15 }] },
      { name: "Pineapple Shake", categoryId: catIds.shake, price: 150, isAvailable: true, tenantId, recipe: [{ materialId: invIds.pineapple_crush, quantity: 40 }, { materialId: invIds.milk, quantity: 200 }, { materialId: invIds.sugar, quantity: 15 }] },
      { name: "Kaju Mango", categoryId: catIds.shake, price: 200, isAvailable: true, tenantId, recipe: [{ materialId: invIds.mango_pulp, quantity: 40 }, { materialId: invIds.kaju, quantity: 30 }, { materialId: invIds.milk, quantity: 200 }] },
      { name: "Kaju Anjeer", categoryId: catIds.shake, price: 200, isAvailable: true, tenantId, recipe: [{ materialId: invIds.kaju, quantity: 25 }, { materialId: invIds.anjeer, quantity: 25 }, { materialId: invIds.milk, quantity: 200 }, { materialId: invIds.sugar, quantity: 10 }] }
    ];

    for (const item of menuData) {
      await addDoc(collection(db, "menus"), item);
    }

    console.log("Database perfectly seeded with Kapp's Corner menu and inventory!");
    return true;
  } catch (error) {
    console.error("Seeding failed:", error);
    return false;
  }
}