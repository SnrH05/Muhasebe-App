// Inventory Store - Stok ve Reçete (BOM) Yönetimi
import { create } from 'zustand';

const INGREDIENTS = [
  { id: 'i1', name: 'Köfte', unit: 'gr', currentQty: 5000, criticalLevel: 1000 },
  { id: 'i2', name: 'Hamburger Ekmeği', unit: 'adet', currentQty: 100, criticalLevel: 20 },
  { id: 'i3', name: 'Tavuk Göğsü', unit: 'gr', currentQty: 4000, criticalLevel: 800 },
  { id: 'i4', name: 'Adana Kebap', unit: 'gr', currentQty: 3000, criticalLevel: 600 },
  { id: 'i5', name: 'Pizza Hamuru', unit: 'adet', currentQty: 50, criticalLevel: 10 },
  { id: 'i6', name: 'Mozzarella', unit: 'gr', currentQty: 3000, criticalLevel: 500 },
  { id: 'i7', name: 'Çay Poşeti', unit: 'adet', currentQty: 500, criticalLevel: 100 },
  { id: 'i8', name: 'Kahve (Öğütülmüş)', unit: 'gr', currentQty: 2000, criticalLevel: 400 },
  { id: 'i9', name: 'Süt', unit: 'ml', currentQty: 10000, criticalLevel: 2000 },
  { id: 'i10', name: 'Sufle Karışımı', unit: 'adet', currentQty: 30, criticalLevel: 8 },
  { id: 'i11', name: 'Patates', unit: 'gr', currentQty: 8000, criticalLevel: 1500 },
  { id: 'i12', name: 'Marul', unit: 'adet', currentQty: 40, criticalLevel: 10 },
];

// Reçeteler (BOM - Bill of Materials)
const RECIPES = {
  'm11': [ // Hamburger Menü
    { ingredientId: 'i1', qty: 150 },
    { ingredientId: 'i2', qty: 1 },
    { ingredientId: 'i11', qty: 200 },
    { ingredientId: 'i12', qty: 1 },
  ],
  'm12': [ // Tavuk Şiş
    { ingredientId: 'i3', qty: 200 },
  ],
  'm13': [ // Adana Kebap
    { ingredientId: 'i4', qty: 250 },
  ],
  'm14': [ // Köfte Ekmek
    { ingredientId: 'i1', qty: 150 },
    { ingredientId: 'i2', qty: 1 },
  ],
  'm1': [ // Çay
    { ingredientId: 'i7', qty: 1 },
  ],
  'm2': [ // Türk Kahvesi
    { ingredientId: 'i8', qty: 10 },
  ],
  'm4': [ // Latte
    { ingredientId: 'i8', qty: 15 },
    { ingredientId: 'i9', qty: 200 },
  ],
  'm16': [ // Sufle
    { ingredientId: 'i10', qty: 1 },
  ],
  'm20': [ // Margarita Pizza
    { ingredientId: 'i5', qty: 1 },
    { ingredientId: 'i6', qty: 150 },
  ],
};

export const useInventoryStore = create((set, get) => ({
  ingredients: INGREDIENTS,
  recipes: RECIPES,
  alerts: [],

  // Satış sonrası stok düşüşü (Real-time de-stocking)
  deductStock: (menuItemId, quantity) => set((state) => {
    const recipe = state.recipes[menuItemId];
    if (!recipe) return {};

    const newAlerts = [];
    const updatedIngredients = state.ingredients.map(ing => {
      const recipeItem = recipe.find(r => r.ingredientId === ing.id);
      if (!recipeItem) return ing;

      const newQty = ing.currentQty - (recipeItem.qty * quantity);
      if (newQty <= ing.criticalLevel) {
        newAlerts.push({
          id: `alert_${Date.now()}_${ing.id}`,
          ingredientName: ing.name,
          currentQty: newQty,
          criticalLevel: ing.criticalLevel,
          unit: ing.unit,
          timestamp: new Date().toISOString(),
        });
      }
      return { ...ing, currentQty: Math.max(0, newQty) };
    });

    return {
      ingredients: updatedIngredients,
      alerts: [...newAlerts, ...state.alerts],
    };
  }),

  // Stok ekleme
  addStock: (ingredientId, quantity) => set((state) => ({
    ingredients: state.ingredients.map(ing =>
      ing.id === ingredientId ? { ...ing, currentQty: ing.currentQty + quantity } : ing
    ),
  })),

  // Ürün reçetesi oluşturma/güncelleme
  setRecipe: (menuItemId, recipeData) => set((state) => ({
    recipes: {
      ...state.recipes,
      [menuItemId]: recipeData
    }
  })),

  // Yeni stok kalemi ekleme
  addIngredient: (ingredient) => set((state) => ({
    ingredients: [
      ...state.ingredients,
      { ...ingredient, id: ingredient.id || `ing_${Date.now()}`, currentQty: 0 }
    ]
  })),

  clearAlerts: () => set({ alerts: [] }),
  getCriticalItems: () => get().ingredients.filter(i => i.currentQty <= i.criticalLevel),
}));
