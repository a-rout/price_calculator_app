// Category types for organizing items
export type Category = 
  | 'groceries'
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'meat'
  | 'spices'
  | 'beverages'
  | 'other';

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'groceries', label: 'Groceries', icon: 'shopping-bag' },
  { id: 'vegetables', label: 'Vegetables', icon: 'leaf' },
  { id: 'fruits', label: 'Fruits', icon: 'apple' },
  { id: 'dairy', label: 'Dairy', icon: 'milk' },
  { id: 'meat', label: 'Meat', icon: 'beef' },
  { id: 'spices', label: 'Spices', icon: 'flame' },
  { id: 'beverages', label: 'Beverages', icon: 'cup-soda' },
  { id: 'other', label: 'Other', icon: 'package' },
];

export const getCategoryLabel = (category: Category): string => {
  return CATEGORIES.find(c => c.id === category)?.label || 'Other';
};

// Enhanced Item interface
export interface Item {
  id: string;
  name: string;
  pricePerKg: number;
  isFavorite: boolean;
  category: Category;
  lastUsed?: number; // timestamp
}

// Calculation history entry
export interface Calculation {
  id: string;
  itemId: string;
  itemName: string;
  mode: 'price' | 'weight';
  input: number;
  result: number;
  perKgPrice: number;
  timestamp: number;
}

// Export/Import data format
export interface ExportData {
  version: string;
  exportedAt: string;
  items: Item[];
  calculations: Calculation[];
}
