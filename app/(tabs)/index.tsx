import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calculator,
  ArrowRightLeft,
  Trash2,
  Search,
  X,
  Star,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Coins,
  Scale,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import {
  getItems,
  saveCalculation,
  getCalculations,
  clearCalculations as clearCalcStorage,
  getRecentItemsWithData,
  addRecentItem,
  type Item,
  type Calculation,
} from '@/utils/storage';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlassCard } from '@/components/GlassCard';
import { SkeletonCard, SkeletonLoader } from '@/components/SkeletonLoader';
import { CategoryBadge } from '@/components/CategoryPicker';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

type CalculationMode = 'price' | 'weight';

const { width: screenWidth } = Dimensions.get('window');

// Main Calculator Tab Component
export default function CalculatorTab() {
  const { theme } = useTheme();
  const { impact, notification, selection } = useHaptics();
  const { t } = useTranslation();

  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [mode, setMode] = useState<CalculationMode>('price');
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isItemSelectionExpanded, setIsItemSelectionExpanded] = useState(false);

  // Refs
  const inputRef = React.useRef<TextInput>(null);

  // Animation values
  const resultScale = useSharedValue(0);
  const errorOpacity = useSharedValue(0);
  const resultGlow = useSharedValue(0);

  const loadData = async () => {
    try {
      const [loadedItems, loadedCalcs, loadedRecent] = await Promise.all([
        getItems(),
        getCalculations(),
        getRecentItemsWithData(),
      ]);

      setItems(loadedItems);
      setFilteredItems(loadedItems);
      setCalculations(loadedCalcs);
      setRecentItems(loadedRecent);

      // Update selected item if it exists
      if (selectedItem) {
        const updatedSelectedItem = loadedItems.find(item => item.id === selectedItem.id);
        if (updatedSelectedItem) {
          setSelectedItem(updatedSelectedItem);
        } else if (loadedItems.length > 0) {
          setSelectedItem(loadedItems[0]);
        } else {
          setSelectedItem(null);
        }
      } else if (loadedItems.length > 0 && !selectedItem) {
        setSelectedItem(loadedItems[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedItem?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    notification('success');
  };

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
    errorOpacity.value = withTiming(inputError ? 1 : 0, { duration: 300 });
  }, [inputError, errorOpacity]);

  // Animate result appearance
  useEffect(() => {
    if (result !== null) {
      resultScale.value = withSpring(1, { damping: 12, stiffness: 150 });
      resultGlow.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.5, { duration: 500 })
      );
    } else {
      resultScale.value = withTiming(0, { duration: 200 });
      resultGlow.value = 0;
    }
  }, [result, resultScale, resultGlow]);

  const handleItemSelect = async (item: Item) => {
    selection();
    setSelectedItem(item);
    setSearchQuery('');
    setInputError(null);
    await addRecentItem(item.id);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Auto-Calculation Effect
  useEffect(() => {
    if (!selectedItem || !inputValue.trim()) {
      setResult(null);
      return;
    }

    const input = parseFloat(inputValue);
    if (isNaN(input) || input <= 0) {
      setResult(null);
      return;
    }

    let calculatedResult: number;
    if (mode === 'price') {
      calculatedResult = input * selectedItem.pricePerKg;
    } else {
      calculatedResult = input / selectedItem.pricePerKg;
    }

    setResult(calculatedResult);

    // Optional: Save only on significant changes or separate action to avoid spamming storage
    // For now, we'll skip auto-saving every keystroke to persistent storage 
    // to prevent performance issues. We could add a "Save" button or debounce this.
  }, [inputValue, selectedItem, mode]);

  // Smart Focus Effect
  useEffect(() => {
    if (selectedItem && !isItemSelectionExpanded) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [selectedItem, isItemSelectionExpanded]);

  // Manual save for history
  const saveCurrentCalculation = async () => {
    if (result !== null && selectedItem && inputValue) {
      impact('medium');
      await saveCalculation({
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        mode,
        input: parseFloat(inputValue),
        result,
        perKgPrice: selectedItem.pricePerKg,
      });
      await addRecentItem(selectedItem.id);
      const updatedCalcs = await getCalculations();
      setCalculations(updatedCalcs);
      notification('success');
    }
  };

  const handleClearCalculations = async () => {
    impact('heavy');
    await clearCalcStorage();
    setCalculations([]);
  };

  const switchMode = () => {
    selection();
    setMode(mode === 'price' ? 'weight' : 'price');
    setInputValue('');
    setInputError(null);
    setResult(null);
  };

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;
  const formatWeight = (weight: number) => `${weight.toFixed(3)} kg`;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Get favorite items
  const favoriteItems = items.filter(item => item.isFavorite);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={theme.gradients.background}
          style={styles.gradient}
        >
          <StatusBar style={theme.isDark ? "light" : "dark"} />
          <View style={styles.loadingContainer}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={theme.gradients.background}
          style={styles.gradient}
        >
          <StatusBar style={theme.isDark ? "light" : "dark"} />
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={theme.gradients.primary}
                style={styles.emptyIconGradient}
              >
                <Calculator size={48} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>{t('calculator.empty.title')}</Text>
            <Text style={styles.emptyDescription}>
              {t('calculator.empty.description')}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.background}
        style={styles.gradient}
      >
        <StatusBar style={theme.isDark ? "light" : "dark"} />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <Text style={styles.title}>{t('calculator.title')}</Text>
              <View style={styles.headerActions}>
                <LanguageSwitcher compact />
                <ThemeToggle />
              </View>
            </View>
          </Animated.View>

          {/* 1. Unified Dashboard Card */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)}>
            <GlassCard style={styles.dashboardCard}>
              {/* Mode Toggle Row - At Top */}
              <View style={styles.modeToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    mode === 'price' && styles.modeToggleButtonActive,
                    mode === 'price' && styles.modeToggleButtonCost
                  ]}
                  onPress={() => { if (mode !== 'price') switchMode(); }}
                  activeOpacity={0.7}
                >
                  <Coins size={18} color={mode === 'price' ? '#FFF' : theme.colors.textMuted} />
                  <Text style={[
                    styles.modeToggleText,
                    mode === 'price' && styles.modeToggleTextActive
                  ]}>{t('calculator.mode.calculateCost')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    mode === 'weight' && styles.modeToggleButtonActive,
                    mode === 'weight' && styles.modeToggleButtonQuantity
                  ]}
                  onPress={() => { if (mode !== 'weight') switchMode(); }}
                  activeOpacity={0.7}
                >
                  <Scale size={18} color={mode === 'weight' ? '#FFF' : theme.colors.textMuted} />
                  <Text style={[
                    styles.modeToggleText,
                    mode === 'weight' && styles.modeToggleTextActive
                  ]}>{t('calculator.mode.calculateQuantity')}</Text>
                </TouchableOpacity>
              </View>

              {/* Item Selector */}
              <TouchableOpacity
                style={styles.itemSelectorRow}
                onPress={() => setIsItemSelectionExpanded(true)}
              >
                <Text style={styles.dashboardLabel}>{t('calculator.item')}</Text>
                {selectedItem ? (
                  <View>
                    <Text style={styles.dashboardItemName} numberOfLines={1}>{selectedItem.name}</Text>
                    <Text style={styles.dashboardItemPrice}>{formatCurrency(selectedItem.pricePerKg)}/{t('calculator.input.kg')}</Text>
                  </View>
                ) : (
                  <Text style={styles.dashboardPlaceholder}>{t('calculator.tapToSelect')}</Text>
                )}
              </TouchableOpacity>

              {/* Body: Massive Input */}
              <View style={styles.dashboardBody}>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.dashboardInput,
                    mode === 'price' ? styles.textPrice : styles.textWeight
                  ]}
                  value={inputValue}
                  onChangeText={(text) => {
                    setInputValue(text);
                    if (inputError) setInputError(null);
                  }}
                  placeholder={mode === 'price' ? '0.00' : '0'}
                  placeholderTextColor={theme.colors.textMuted + '40'} // More subtle placeholder
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
                <Text style={styles.dashboardInputUnit}>
                  {mode === 'price' ? t('calculator.input.kg') : t('calculator.input.rupees')}
                </Text>
              </View>

              {/* Footer: Result */}
              <View style={styles.dashboardFooter}>
                <Text style={styles.dashboardResultLabel}>
                  {mode === 'price' ? t('calculator.result.totalCost') : t('calculator.result.totalQuantity')}
                </Text>
                {result !== null ? (
                  <Animated.View style={styles.resultRow} entering={FadeIn}>
                    <Text style={[
                      styles.dashboardResultValue,
                      mode === 'price' ? styles.textPrice : styles.textWeight
                    ]}>
                      {mode === 'price' ? formatCurrency(result) : formatWeight(result)}
                    </Text>
                    <TouchableOpacity onPress={saveCurrentCalculation} style={styles.saveButton}>
                      <Text style={styles.saveButtonText}>{t('calculator.actions.saveCalculation')}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ) : (
                  <Text style={styles.dashboardResultPlaceholder}>-</Text>
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* 3. Favorites Section (Moved Outside) */}
          {favoriteItems.length > 0 && (
            <Animated.View entering={FadeInDown.duration(500).delay(400)} layout={Layout.springify()}>
              <View style={styles.favoritesOutsideContainer}>
                <Text style={styles.sectionTitleCompact}>{t('calculator.favorites')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.compactFavoritesList}
                >
                  {favoriteItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.compactFavoriteItem,
                        selectedItem?.id === item.id && styles.compactFavoriteItemSelected,
                      ]}
                      onPress={() => handleItemSelect(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.compactFavoriteName,
                        selectedItem?.id === item.id && styles.compactFavoriteNameSelected,
                      ]} numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </Animated.View>
          )}

          {/* 4. Collapsible Item Selection */}
          <Animated.View entering={FadeInDown.duration(500).delay(400)} layout={Layout.springify()}>
            <GlassCard style={styles.card}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => {
                  selection();
                  setIsItemSelectionExpanded(!isItemSelectionExpanded);
                }}
              >
                <View style={styles.collapsibleTitleRow}>
                  <Search size={18} color={theme.colors.text} />
                  <Text style={styles.cardTitleNoMargin}>{t('calculator.selectItem')}</Text>
                </View>
                {isItemSelectionExpanded ? (
                  <ChevronUp size={20} color={theme.colors.textMuted} />
                ) : (
                  <ChevronDown size={20} color={theme.colors.textMuted} />
                )}
              </TouchableOpacity>

              {isItemSelectionExpanded && (
                <Animated.View entering={FadeIn.duration(300)}>


                  {/* Search Bar */}
                  <View style={styles.searchContainer}>
                    <Search size={20} color={theme.colors.textMuted} />
                    <TextInput
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder={t('calculator.searchItems')}
                      placeholderTextColor={theme.colors.textMuted}
                      returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                        <X size={18} color={theme.colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Items Grid */}
                  <View style={styles.itemsGrid}>
                    {filteredItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.itemCard,
                          selectedItem?.id === item.id && styles.itemCardSelected
                        ]}
                        onPress={() => {
                          handleItemSelect(item);
                          setIsItemSelectionExpanded(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.itemCardHeader}>
                          <Text style={[
                            styles.itemCardName,
                            selectedItem?.id === item.id && styles.itemCardNameSelected
                          ]} numberOfLines={1}>{item.name}</Text>
                          {item.isFavorite && (
                            <Star size={12} color={theme.colors.favorite} fill={theme.colors.favorite} />
                          )}
                        </View>
                        <Text style={[
                          styles.itemCardPrice,
                          selectedItem?.id === item.id && styles.itemCardPriceSelected
                        ]}>{formatCurrency(item.pricePerKg)}/kg</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {filteredItems.length === 0 && searchQuery.trim() !== '' && (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>{t('calculator.noItemsFound', { query: searchQuery })}</Text>
                    </View>
                  )}
                </Animated.View>
              )}
            </GlassCard>
          </Animated.View>



          {/* 6. Recent Items */}
          {!isItemSelectionExpanded && recentItems.length > 0 && (
            <Animated.View entering={FadeInDown.duration(500).delay(600)} layout={Layout.springify()}>
              <GlassCard style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Clock size={18} color={theme.colors.textMuted} />
                  <Text style={styles.cardTitle}>{t('calculator.recentlyUsed')}</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.compactFavoritesList}
                >
                  {recentItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.compactFavoriteItem,
                        selectedItem?.id === item.id && styles.compactFavoriteItemSelected,
                      ]}
                      onPress={() => handleItemSelect(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.compactFavoriteName,
                        selectedItem?.id === item.id && styles.compactFavoriteNameSelected,
                      ]}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </GlassCard>
            </Animated.View>
          )}

          {/* 7. Calculation History */}
          {calculations.length > 0 && (
            <Animated.View entering={FadeInUp.duration(500)} layout={Layout.springify()}>
              <GlassCard style={styles.card}>
                <View style={styles.historyHeader}>
                  <Text style={styles.cardTitle}>{t('calculator.recentCalculations')}</Text>
                  <TouchableOpacity onPress={handleClearCalculations}>
                    <Trash2 size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
                {calculations.slice(0, 10).map((calc) => (
                  <View key={calc.id} style={styles.historyItem}>
                    <View style={styles.historyItemHeader}>
                      <Text style={styles.historyItemName}>{calc.itemName}</Text>
                      <Text style={styles.historyItemTime}>
                        {formatTime(calc.timestamp)}
                      </Text>
                    </View>
                    <Text style={styles.historyItemDetails}>
                      {calc.mode === 'price'
                        ? `${formatWeight(calc.input)} → ${formatCurrency(calc.result)}`
                        : `${formatCurrency(calc.input)} → ${formatWeight(calc.result)}`
                      }
                    </Text>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </LinearGradient>
    </View >
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    paddingTop: 100,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginLeft: 32,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  horizontalList: {
    paddingRight: 20,
    gap: 10,
  },
  quickSelectItem: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
  },
  recentItem: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  quickSelectItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
  },
  quickSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  quickSelectNameSelected: {
    color: theme.colors.primary,
  },
  quickSelectPrice: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  quickSelectPriceSelected: {
    color: theme.colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
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
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedItemCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedItemInfo: {
    alignItems: 'center',
    gap: 6,
  },
  selectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedItemName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedItemPrice: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  itemCard: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 14,
    padding: 14,
    margin: 6,
    minWidth: (screenWidth - 80) / 2 - 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  itemCardNameSelected: {
    color: theme.colors.primary,
  },
  itemCardPrice: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  itemCardPriceSelected: {
    color: theme.colors.primary,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: theme.colors.textMuted,
    fontSize: 15,
  },
  modeSwitch: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  modeSwitchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  modeSwitchText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modeSwitchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  inputError: {
    borderColor: theme.colors.error,
    backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
  },
  errorContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: '500',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 42,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  resultDetails: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resultDetailText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontWeight: '500',
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
    marginBottom: 4,
  },
  historyItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  historyItemTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  historyItemDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomPadding: {
    height: 100,
  },
  // New Styles
  topRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  topRowCardLeft: {
    flex: 1,
    margin: 0,
    padding: 16,
  },
  topRowCardRight: {
    width: '40%',
    padding: 0, // content handles padding
  },
  topRowLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  compactSelectedInfo: {
    justifyContent: 'center',
  },
  compactSelectedName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  compactSelectedPrice: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  compactSelectedPlaceholder: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  compactModeSwitch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  compactModeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  compactModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cardTitleNoMargin: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  collapsibleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Compact Result Styles
  compactResultCard: {
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  compactResultGradient: {
    padding: 12,
  },

  // New Layout Styles
  inputResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  resultWrapper: {
    flex: 1,
    alignItems: 'flex-end',
  },
  inputLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  compactInput: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 52,
  },
  inputPrice: {
    color: '#10B981', // Green for Price input
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
  },
  inputWeight: {
    color: '#6366F1', // Indigo for Weight input
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
  },
  calculateActionBtn: {
    marginTop: 18, // Align with input field roughly
  },
  calculateActionGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  // Result Styles
  resultValueCompact: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  resultPlaceholder: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textMuted,
  },
  // Favorites Outside
  favoritesOutsideContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleCompact: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Dashboard Styles
  dashboardCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: 24,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  // Mode Toggle Row - Segmented Control Style
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  modeToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  modeToggleButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  modeToggleButtonCost: {
    backgroundColor: '#10B981',
  },
  modeToggleButtonQuantity: {
    backgroundColor: '#6366F1',
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  modeToggleTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  itemSelectorRow: {
    marginBottom: 16,
  },
  dashboardItemSelector: {
    flex: 1,
  },
  dashboardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 4,
    letterSpacing: 1,
  },
  dashboardItemName: {
    fontSize: 26,
    fontWeight: '800', // Ultrabold
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  dashboardItemPrice: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dashboardPlaceholder: {
    fontSize: 18,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  dashboardModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30, // Fully rounded
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dashboardModeTogglePrice: {
    backgroundColor: '#10B981', // Solid Emerald
  },
  dashboardModeToggleWeight: {
    backgroundColor: '#6366F1', // Solid Indigo
  },
  dashboardModeTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF', // White text on solid background
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dashboardBody: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 16,
    paddingVertical: 12,
  },
  dashboardInput: {
    fontSize: 64, // Even Bigger
    fontWeight: '800',
    color: theme.colors.text,
    minWidth: 120,
    textAlign: 'center',
    letterSpacing: -3,
    includeFontPadding: false,
  },
  dashboardInputUnit: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginLeft: 8,
    marginBottom: 8, // Align baseline
  },
  dashboardFooter: {
    backgroundColor: theme.colors.surfaceVariant,
    marginHorizontal: -24,
    marginBottom: -24,
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  dashboardResultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dashboardResultValue: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
  },
  dashboardResultPlaceholder: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textMuted,
  },
  resultRow: {
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  textPrice: {
    color: '#10B981', // Green Text
    textShadowColor: 'rgba(16, 185, 129, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  textWeight: {
    color: '#6366F1', // Indigo Text
    textShadowColor: 'rgba(99, 102, 241, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  // Recycled
  compactFavoritesList: {
    paddingRight: 20,
    gap: 12,
  },
  compactFavoriteItem: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactFavoriteItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10', // 10% opacity primary
    borderWidth: 2,
  },
  compactFavoriteName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  compactFavoriteNameSelected: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
});