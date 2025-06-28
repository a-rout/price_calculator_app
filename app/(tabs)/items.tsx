import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Plus, CreditCard as Edit3, Trash2, IndianRupee } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { getItems, saveItems, deleteItem, type Item } from '@/utils/storage';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useFocusEffect } from '@react-navigation/native';

export default function ItemsTab() {
  const { theme } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Animation values
  const nameErrorOpacity = useSharedValue(0);
  const priceErrorOpacity = useSharedValue(0);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const loadedItems = await getItems();
      setItems(loadedItems);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Reload items when tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [])
  );

  // Animate error messages
  useEffect(() => {
    nameErrorOpacity.value = withTiming(nameError ? 1 : 0, { duration: 300 });
  }, [nameError, nameErrorOpacity]);

  useEffect(() => {
    priceErrorOpacity.value = withTiming(priceError ? 1 : 0, { duration: 300 });
  }, [priceError, priceErrorOpacity]);

  const validateInputs = () => {
    let isValid = true;
    
    // Clear previous errors
    setNameError(null);
    setPriceError(null);

    if (!itemName.trim()) {
      setNameError('Item name is required');
      isValid = false;
    }

    if (!itemPrice.trim()) {
      setPriceError('Price is required');
      isValid = false;
    } else {
      const price = parseFloat(itemPrice);
      if (isNaN(price)) {
        setPriceError('Please enter a valid number');
        isValid = false;
      } else if (price <= 0) {
        setPriceError('Price must be greater than 0');
        isValid = false;
      }
    }

    return isValid;
  };

  const saveItem = async () => {
    if (!validateInputs()) return;

    try {
      setIsLoading(true);
      const price = parseFloat(itemPrice);
      
      if (editingItem) {
        // Update existing item
        const updatedItems = items.map(item =>
          item.id === editingItem.id
            ? { ...item, name: itemName.trim(), pricePerKg: price }
            : item
        );
        await saveItems(updatedItems);
        setItems(updatedItems);
      } else {
        // Add new item
        const newItem: Item = {
          id: Date.now().toString(),
          name: itemName.trim(),
          pricePerKg: price,
        };
        const updatedItems = [...items, newItem];
        await saveItems(updatedItems);
        setItems(updatedItems);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = (item: Item) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(item.id),
        },
      ]
    );
  };

  const performDelete = async (itemId: string) => {
    try {
      setIsLoading(true);
      
      // Use the deleteItem function from storage which handles both items and usage data
      await deleteItem(itemId);
      
      // Update local state immediately
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
      
      // Show success feedback
      Alert.alert('Success', 'Item deleted successfully');
      
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
      
      // Reload items to ensure consistency
      await loadItems();
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.pricePerKg.toString());
    setIsAddingItem(true);
    // Clear any existing errors
    setNameError(null);
    setPriceError(null);
  };

  const resetForm = () => {
    setIsAddingItem(false);
    setEditingItem(null);
    setItemName('');
    setItemPrice('');
    setNameError(null);
    setPriceError(null);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const nameErrorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nameErrorOpacity.value,
    transform: [{ translateY: nameErrorOpacity.value * -5 }],
  }));

  const priceErrorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: priceErrorOpacity.value,
    transform: [{ translateY: priceErrorOpacity.value * -5 }],
  }));

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Manage Items</Text>
              <Text style={styles.subtitle}>Add and manage items with their per KG prices</Text>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {/* Add/Edit Item Form */}
        {isAddingItem && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={[
                  styles.input,
                  nameError && styles.inputError
                ]}
                value={itemName}
                onChangeText={(text) => {
                  setItemName(text);
                  if (nameError) setNameError(null);
                }}
                placeholder="Enter item name"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="next"
                editable={!isLoading}
              />
              {nameError && (
                <Animated.View style={[styles.errorContainer, nameErrorAnimatedStyle]}>
                  <Text style={styles.errorText}>{nameError}</Text>
                </Animated.View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price per KG (₹)</Text>
              <TextInput
                style={[
                  styles.input,
                  priceError && styles.inputError
                ]}
                value={itemPrice}
                onChangeText={(text) => {
                  setItemPrice(text);
                  if (priceError) setPriceError(null);
                }}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                editable={!isLoading}
              />
              {priceError && (
                <Animated.View style={[styles.errorContainer, priceErrorAnimatedStyle]}>
                  <Text style={styles.errorText}>{priceError}</Text>
                </Animated.View>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={resetForm}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.saveButton,
                  isLoading && styles.buttonDisabled
                ]}
                onPress={saveItem}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add')} Item
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add Item Button */}
        {!isAddingItem && (
          <TouchableOpacity
            style={[styles.addButton, isLoading && styles.buttonDisabled]}
            onPress={() => setIsAddingItem(true)}
            disabled={isLoading}
          >
            <Plus size={24} color={theme.colors.surface} />
            <Text style={styles.addButtonText}>Add New Item</Text>
          </TouchableOpacity>
        )}

        {/* Items List */}
        {items.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Items ({items.length})</Text>
            {items.map((item, index) => (
              <View key={item.id} style={[styles.itemRow, index !== items.length - 1 && styles.itemRowBorder]}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.priceContainer}>
                    <IndianRupee size={16} color={theme.colors.secondary} />
                    <Text style={styles.itemPrice}>{formatCurrency(item.pricePerKg)}/kg</Text>
                  </View>
                </View>
                
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, isLoading && styles.buttonDisabled]}
                    onPress={() => startEdit(item)}
                    disabled={isLoading}
                  >
                    <Edit3 size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, isLoading && styles.buttonDisabled]}
                    onPress={() => handleDeleteItem(item)}
                    disabled={isLoading}
                  >
                    <Trash2 size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : !isAddingItem && (
          <View style={styles.emptyState}>
            <IndianRupee size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Items Yet</Text>
            <Text style={styles.emptyDescription}>
              Add your first item with its per KG price to start using the calculator.
            </Text>
          </View>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.3 : 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: theme.isDark ? 1 : 0,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  inputError: {
    borderColor: theme.colors.error,
    backgroundColor: theme.isDark ? '#2D1B1B' : '#FEF2F2',
  },
  errorContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.colors.secondary,
  },
  saveButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: theme.colors.secondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: theme.isDark ? 1 : 0,
    borderColor: theme.colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});