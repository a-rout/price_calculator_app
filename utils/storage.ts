import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item, Calculation, Category } from '@/types';

const ITEMS_STORAGE_KEY = '@price_calculator_items';
const CALCULATIONS_STORAGE_KEY = '@price_calculator_calculations';
const RECENT_ITEMS_KEY = '@price_calculator_recent_items';

// Migration function to add new fields to existing items
const migrateItem = (item: any): Item => {
  return {
    id: item.id,
    name: item.name,
    pricePerKg: item.pricePerKg,
    isFavorite: item.isFavorite ?? false,
    category: item.category ?? 'other',
    lastUsed: item.lastUsed ?? undefined,
  };
};

// ==================== ITEMS ====================

export const getItems = async (): Promise<Item[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(ITEMS_STORAGE_KEY);
    if (jsonValue != null) {
      const rawItems = JSON.parse(jsonValue);
      // Migrate items to new format
      return rawItems.map(migrateItem);
    }

    // Return default items if none exist
    const defaultItems: Item[] = [
      { id: '1', name: 'Rice', pricePerKg: 75.50, isFavorite: true, category: 'groceries' },
      { id: '2', name: 'Wheat Flour', pricePerKg: 45.80, isFavorite: false, category: 'groceries' },
      { id: '3', name: 'Sugar', pricePerKg: 55.20, isFavorite: true, category: 'groceries' },
      { id: '4', name: 'Onions', pricePerKg: 35.00, isFavorite: false, category: 'vegetables' },
      { id: '5', name: 'Tomatoes', pricePerKg: 40.00, isFavorite: false, category: 'vegetables' },
      { id: '6', name: 'Potatoes', pricePerKg: 25.00, isFavorite: false, category: 'vegetables' },
    ];

    await saveItems(defaultItems);
    return defaultItems;
  } catch (error) {
    console.error('Error loading items:', error);
    return [];
  }
};

export const saveItems = async (items: Item[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(items);
    await AsyncStorage.setItem(ITEMS_STORAGE_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving items:', error);
  }
};

export const addItem = async (name: string, pricePerKg: number, category: Category = 'other'): Promise<Item> => {
  const items = await getItems();
  const newItem: Item = {
    id: Date.now().toString(),
    name,
    pricePerKg,
    isFavorite: false,
    category,
  };
  items.push(newItem);
  await saveItems(items);
  return newItem;
};

export const updateItem = async (id: string, updates: Partial<Item>): Promise<void> => {
  try {
    const items = await getItems();
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    await saveItems(updatedItems);
  } catch (error) {
    console.error('Error updating item:', error);
  }
};

export const deleteItem = async (id: string): Promise<void> => {
  try {
    const items = await getItems();
    const filteredItems = items.filter(item => item.id !== id);
    await saveItems(filteredItems);
  } catch (error) {
    console.error('Error deleting item:', error);
  }
};

export const toggleFavorite = async (id: string): Promise<void> => {
  const items = await getItems();
  const item = items.find(i => i.id === id);
  if (item) {
    await updateItem(id, { isFavorite: !item.isFavorite });
  }
};

export const getFavoriteItems = async (): Promise<Item[]> => {
  const items = await getItems();
  return items.filter(item => item.isFavorite);
};

export const getItemsByCategory = async (category: Category): Promise<Item[]> => {
  const items = await getItems();
  return items.filter(item => item.category === category);
};

// ==================== CALCULATIONS HISTORY ====================

export const getCalculations = async (): Promise<Calculation[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(CALCULATIONS_STORAGE_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return [];
  } catch (error) {
    console.error('Error loading calculations:', error);
    return [];
  }
};

export const saveCalculation = async (calculation: Omit<Calculation, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const calculations = await getCalculations();
    const newCalculation: Calculation = {
      ...calculation,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    // Keep only last 50 calculations
    const updated = [newCalculation, ...calculations.slice(0, 49)];
    await AsyncStorage.setItem(CALCULATIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving calculation:', error);
  }
};

export const clearCalculations = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CALCULATIONS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing calculations:', error);
  }
};

// ==================== RECENT ITEMS ====================

const MAX_RECENT_ITEMS = 5;

export const getRecentItems = async (): Promise<string[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(RECENT_ITEMS_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return [];
  } catch (error) {
    console.error('Error loading recent items:', error);
    return [];
  }
};

export const addRecentItem = async (itemId: string): Promise<void> => {
  try {
    const recentIds = await getRecentItems();
    // Remove if already exists and add to front
    const filtered = recentIds.filter(id => id !== itemId);
    const updated = [itemId, ...filtered].slice(0, MAX_RECENT_ITEMS);
    await AsyncStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));

    // Also update the item's lastUsed timestamp
    await updateItem(itemId, { lastUsed: Date.now() });
  } catch (error) {
    console.error('Error saving recent item:', error);
  }
};

export const getRecentItemsWithData = async (): Promise<Item[]> => {
  const recentIds = await getRecentItems();
  const allItems = await getItems();
  const recentItems: Item[] = [];

  for (const id of recentIds) {
    const item = allItems.find(i => i.id === id);
    if (item) {
      recentItems.push(item);
    }
  }

  return recentItems;
};

// Re-export types for convenience
export type { Item, Calculation, Category };