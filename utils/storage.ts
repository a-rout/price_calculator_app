import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Item {
  id: string;
  name: string;
  pricePerKg: number;
}

const ITEMS_STORAGE_KEY = '@price_calculator_items';

export const getItems = async (): Promise<Item[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(ITEMS_STORAGE_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    
    // Return default items if none exist
    const defaultItems: Item[] = [
      { id: '1', name: 'Rice', pricePerKg: 75.50 },
      { id: '2', name: 'Wheat Flour', pricePerKg: 45.80 },
      { id: '3', name: 'Sugar', pricePerKg: 55.20 },
      { id: '4', name: 'Onions', pricePerKg: 35.00 },
      { id: '5', name: 'Tomatoes', pricePerKg: 40.00 },
      { id: '6', name: 'Potatoes', pricePerKg: 25.00 },
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

export const addItem = async (name: string, pricePerKg: number): Promise<void> => {
  try {
    const items = await getItems();
    const newItem: Item = {
      id: Date.now().toString(),
      name,
      pricePerKg,
    };
    items.push(newItem);
    await saveItems(items);
  } catch (error) {
    console.error('Error adding item:', error);
  }
};

export const updateItem = async (id: string, name: string, pricePerKg: number): Promise<void> => {
  try {
    const items = await getItems();
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, name, pricePerKg } : item
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