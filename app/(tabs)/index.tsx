import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Calculator, ArrowRightLeft, Trash2, Search, X } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { getItems, type Item } from '@/utils/storage';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';

type CalculationMode = 'price' | 'weight';

interface Calculation {
  id: string;
  item: string;
  mode: CalculationMode;
  input: number;
  result: number;
  perKgPrice: number;
  timestamp: Date;
}

const { width: screenWidth } = Dimensions.get('window');

export default function CalculatorTab() {
  const { theme } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [mode, setMode] = useState<CalculationMode>('price');
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [calculations, setCalculations] = useState<Calculation[]>([]);

  // Animation values
  const resultScale = useSharedValue(0);
  const errorOpacity = useSharedValue(0);

  const loadItems = async () => {
    const loadedItems = await getItems();
    setItems(loadedItems);
    setFilteredItems(loadedItems);
    
    // Update selected item if it exists in the new list
    if (selectedItem) {
      const updatedSelectedItem = loadedItems.find(item => item.id === selectedItem.id);
      if (updatedSelectedItem) {
        setSelectedItem(updatedSelectedItem);
      } else if (loadedItems.length > 0) {
        // If selected item was deleted, select the first available item
        setSelectedItem(loadedItems[0]);
      } else {
        // No items available
        setSelectedItem(null);
      }
    } else if (loadedItems.length > 0 && !selectedItem) {
      // No item selected but items are available
      setSelectedItem(loadedItems[0]);
    }
  };

  // Load items when component mounts
  useEffect(() => {
    loadItems();
  }, []);

  // Reload items whenever the tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [selectedItem?.id])
  );

  // Filter items based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  // Animate error messages
  useEffect(() => {
    if (inputError) {
      errorOpacity.value = withTiming(1, { duration: 300 });
    } else {
      errorOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [inputError, errorOpacity]);

  // Animate result appearance
  useEffect(() => {
    if (result !== null) {
      resultScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    } else {
      resultScale.value = withTiming(0, { duration: 200 });
    }
  }, [result, resultScale]);

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    setSearchQuery(''); // Clear search when item is selected
    setInputError(null); // Clear any input errors
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const calculate = () => {
    // Clear previous errors
    setInputError(null);

    if (!selectedItem) {
      setInputError('Please select an item first');
      return;
    }

    if (!inputValue.trim()) {
      setInputError('Please enter a value');
      return;
    }

    const input = parseFloat(inputValue);
    if (isNaN(input)) {
      setInputError('Please enter a valid number');
      return;
    }

    if (input <= 0) {
      setInputError('Please enter a positive number');
      return;
    }

    let calculatedResult: number;
    if (mode === 'price') {
      // Calculate total price from weight
      calculatedResult = input * selectedItem.pricePerKg;
    } else {
      // Calculate weight from desired price
      calculatedResult = input / selectedItem.pricePerKg;
    }

    setResult(calculatedResult);

    // Add to calculation history
    const newCalculation: Calculation = {
      id: Date.now().toString(),
      item: selectedItem.name,
      mode,
      input,
      result: calculatedResult,
      perKgPrice: selectedItem.pricePerKg,
      timestamp: new Date(),
    };

    setCalculations(prev => [newCalculation, ...prev.slice(0, 9)]); // Keep only last 10
  };

  const clearCalculations = () => {
    setCalculations([]);
  };

  const switchMode = () => {
    setMode(mode === 'price' ? 'weight' : 'price');
    setInputValue('');
    setInputError(null);
    setResult(null);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(3)} kg`;
  };

  const errorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: errorOpacity.value,
    transform: [{ translateY: errorOpacity.value * -5 }],
  }));

  const resultAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultScale.value,
  }));

  const styles = createStyles(theme);

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        <View style={styles.emptyState}>
          <Calculator size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Items Available</Text>
          <Text style={styles.emptyDescription}>
            Add items with their per KG prices in the Items tab to start calculating.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Price Calculator</Text>
              <Text style={styles.subtitle}>Calculate price or weight for your items</Text>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {/* Item Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Item</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={20} color={theme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search items..."
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <X size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Selected Item Display */}
          {selectedItem && (
            <View style={styles.selectedItemContainer}>
              <Text style={styles.selectedItemLabel}>Selected:</Text>
              <View style={styles.selectedItemCard}>
                <View style={styles.selectedItemInfo}>
                  <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
                  <Text style={styles.selectedItemPrice}>
                    {formatCurrency(selectedItem.pricePerKg)}/kg
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Items Grid */}
          <View style={styles.itemsGrid}>
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  selectedItem?.id === item.id && styles.itemCardSelected
                ]}
                onPress={() => handleItemSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.itemCardName,
                  selectedItem?.id === item.id && styles.itemCardNameSelected
                ]}>{item.name}</Text>
                <Text style={[
                  styles.itemCardPrice,
                  selectedItem?.id === item.id && styles.itemCardPriceSelected
                ]}>{formatCurrency(item.pricePerKg)}/kg</Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredItems.length === 0 && searchQuery.trim() !== '' && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No items found for "{searchQuery}"</Text>
            </View>
          )}
        </View>

        {/* Mode Switch */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calculation Mode</Text>
          <TouchableOpacity style={styles.modeSwitch} onPress={switchMode}>
            <View style={styles.modeSwitchContent}>
              <Text style={styles.modeSwitchText}>
                {mode === 'price' ? 'Weight → Price' : 'Price → Weight'}
              </Text>
              <ArrowRightLeft size={20} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Input Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Enter {mode === 'price' ? 'Weight (kg)' : 'Desired Price (₹)'}
          </Text>
          <TextInput
            style={[
              styles.input,
              inputError && styles.inputError
            ]}
            value={inputValue}
            onChangeText={(text) => {
              setInputValue(text);
              if (inputError) setInputError(null); // Clear error on input change
            }}
            placeholder={mode === 'price' ? '0.000' : '0.00'}
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          
          {/* Inline Error Message */}
          {inputError && (
            <Animated.View style={[styles.errorContainer, errorAnimatedStyle]}>
              <Text style={styles.errorText}>{inputError}</Text>
            </Animated.View>
          )}
          
          <TouchableOpacity style={styles.calculateButton} onPress={calculate}>
            <Text style={styles.calculateButtonText}>Calculate</Text>
          </TouchableOpacity>
        </View>

        {/* Result Section */}
        {result !== null && (
          <Animated.View style={[styles.card, resultAnimatedStyle]}>
            <Text style={styles.cardTitle}>Result</Text>
            <View style={styles.resultContainer}>
              <Text style={styles.resultValue}>
                {mode === 'price' ? formatCurrency(result) : formatWeight(result)}
              </Text>
              <Text style={styles.resultLabel}>
                {mode === 'price' ? 'Total Price' : 'Required Weight'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Calculation History */}
        {calculations.length > 0 && (
          <View style={styles.card}>
            <View style={styles.historyHeader}>
              <Text style={styles.cardTitle}>Recent Calculations</Text>
              <TouchableOpacity onPress={clearCalculations}>
                <Trash2 size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
            {calculations.map((calc) => (
              <View key={calc.id} style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyItemName}>{calc.item}</Text>
                  <Text style={styles.historyItemTime}>
                    {calc.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.historyItemDetails}>
                  {calc.mode === 'price' ? formatWeight(calc.input) : formatCurrency(calc.input)} → {' '}
                  {calc.mode === 'price' ? formatCurrency(calc.result) : formatWeight(calc.result)}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  selectedItemContainer: {
    marginBottom: 16,
  },
  selectedItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  selectedItemCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedItemInfo: {
    alignItems: 'center',
  },
  selectedItemName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.surface,
    marginBottom: 4,
  },
  selectedItemPrice: {
    fontSize: 14,
    color: theme.isDark ? theme.colors.surface : '#BFDBFE',
    fontWeight: '600',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  itemCard: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    margin: 6,
    minWidth: (screenWidth - 80) / 2 - 12, // Responsive width for 2 columns
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.isDark ? theme.colors.surface : '#EBF4FF',
  },
  itemCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  itemCardNameSelected: {
    color: theme.colors.primary,
  },
  itemCardPrice: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  itemCardPriceSelected: {
    color: theme.colors.primary,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  modeSwitch: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    borderWidth: theme.isDark ? 1 : 0,
    borderColor: theme.colors.border,
  },
  modeSwitchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeSwitchText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  input: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  inputError: {
    borderColor: theme.colors.error,
    backgroundColor: theme.isDark ? '#2D1B1B' : '#FEF2F2',
  },
  errorContainer: {
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
  },
  calculateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultValue: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  historyItemTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  historyItemDetails: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  bottomPadding: {
    height: 40,
  },
});