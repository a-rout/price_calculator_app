import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  CreditCard as Edit3,
  Trash2,
  IndianRupee,
  Star,

  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
  FadeIn,
  Layout,
} from 'react-native-reanimated';

import {
  getItems,
  saveItems,
  deleteItem,
  toggleFavorite,

  type Item,
  type Category,
} from '@/utils/storage';
import { CATEGORIES, getCategoryLabel } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlassCard } from '@/components/GlassCard';
import { SwipeableRow } from '@/components/SwipeableRow';
import { AnimatedEmptyState } from '@/components/AnimatedEmptyState';
import { UndoSnackbar } from '@/components/UndoSnackbar';
import { CategoryPicker, CategoryBadge } from '@/components/CategoryPicker';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { useHaptics } from '@/hooks/useHaptics';
import { useUndo } from '@/hooks/useUndo';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface GroupedItems {
  [key: string]: Item[];
}

// Main Items Tab Component
export default function ItemsTab() {
  const { theme } = useTheme();
  const { impact, notification, selection } = useHaptics();
  const { t } = useTranslation();

  const [items, setItems] = useState<Item[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('other');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Undo functionality
  const { undoItem, setForUndo, undo, canUndo, clearUndo } = useUndo<Item>({
    timeout: 5000,
    onRestore: () => notification('success'),
  });

  // Animation values
  const nameErrorOpacity = useSharedValue(0);
  const priceErrorOpacity = useSharedValue(0);

  const loadItems = async () => {
    try {
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

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
    notification('success');
  };

  // Animate error messages
  useEffect(() => {
    nameErrorOpacity.value = withTiming(nameError ? 1 : 0, { duration: 300 });
  }, [nameError, nameErrorOpacity]);

  useEffect(() => {
    priceErrorOpacity.value = withTiming(priceError ? 1 : 0, { duration: 300 });
  }, [priceError, priceErrorOpacity]);

  const validateInputs = () => {
    let isValid = true;
    setNameError(null);
    setPriceError(null);

    if (!itemName.trim()) {
      setNameError(t('items.validation.nameRequired'));
      isValid = false;
    }

    if (!itemPrice.trim()) {
      setPriceError(t('items.validation.priceRequired'));
      isValid = false;
    } else {
      const price = parseFloat(itemPrice);
      if (isNaN(price)) {
        setPriceError(t('items.validation.invalidPrice'));
        isValid = false;
      } else if (price <= 0) {
        setPriceError(t('items.validation.pricePositive'));
        isValid = false;
      }
    }

    if (!isValid) {
      notification('warning');
    }
    return isValid;
  };

  const saveItem = async () => {
    if (!validateInputs()) return;

    try {
      setIsSaving(true);
      const price = parseFloat(itemPrice);

      if (editingItem) {
        const updatedItems = items.map(item =>
          item.id === editingItem.id
            ? { ...item, name: itemName.trim(), pricePerKg: price, category: selectedCategory }
            : item
        );
        await saveItems(updatedItems);
        setItems(updatedItems);
        notification('success');
      } else {
        const newItem: Item = {
          id: Date.now().toString(),
          name: itemName.trim(),
          pricePerKg: price,
          isFavorite: false,
          category: selectedCategory,
        };
        const updatedItems = [...items, newItem];
        await saveItems(updatedItems);
        setItems(updatedItems);
        impact('medium');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
      notification('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (item: Item) => {
    Alert.alert(
      t('items.delete.title'),
      t('items.delete.message', { name: item.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => performDelete(item),
        },
      ]
    );
  };

  const performDelete = async (item: Item) => {
    try {
      // Store for undo
      setForUndo(item, 'deleted');

      // Delete immediately
      await deleteItem(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));

      impact('medium');
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
      notification('error');
    }
  };

  const handleUndo = async () => {
    const restoredItem = undo();
    if (restoredItem) {
      const updatedItems = [...items, restoredItem];
      await saveItems(updatedItems);
      setItems(updatedItems);
    }
  };

  const handleToggleFavorite = async (item: Item) => {
    selection();
    await toggleFavorite(item.id);
    setItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i
    ));
  };

  const startEdit = (item: Item) => {
    impact('light');
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.pricePerKg.toString());
    setSelectedCategory(item.category);
    setIsAddingItem(true);
    setNameError(null);
    setPriceError(null);
  };

  const resetForm = () => {
    setIsAddingItem(false);
    setEditingItem(null);
    setItemName('');
    setItemPrice('');
    setSelectedCategory('other');
    setNameError(null);
    setPriceError(null);
  };



  const toggleCategoryCollapse = (category: string) => {
    selection();
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  // Group items by category
  const groupedItems = items.reduce<GroupedItems>((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const orderA = CATEGORIES.findIndex(c => c.id === a);
    const orderB = CATEGORIES.findIndex(c => c.id === b);
    return orderA - orderB;
  });

  const nameErrorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nameErrorOpacity.value,
    transform: [{ translateY: nameErrorOpacity.value * -5 }],
  }));

  const priceErrorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: priceErrorOpacity.value,
    transform: [{ translateY: priceErrorOpacity.value * -5 }],
  }));

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={theme.gradients.background} style={styles.gradient}>
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={styles.gradient}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
                <View>
                  <View style={styles.titleRow}>
                    <Package size={24} color={theme.colors.primary} />
                    <Text style={styles.title}>{t('items.title')}</Text>
                  </View>
                  <Text style={styles.subtitle}>{t('items.subtitle')}</Text>
                </View>
                <View style={styles.headerActions}>
                  <LanguageSwitcher compact />
                  <ThemeToggle />
                </View>
              </View>


            </Animated.View>

            {/* Add/Edit Item Form */}
            {isAddingItem && (
              <Animated.View entering={FadeIn.duration(300)}>
                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {editingItem ? t('items.editItem') : t('items.addItem')}
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('items.form.itemName')}</Text>
                    <TextInput
                      style={[styles.input, nameError && styles.inputError]}
                      value={itemName}
                      onChangeText={(text) => {
                        setItemName(text);
                        if (nameError) setNameError(null);
                      }}
                      placeholder={t('items.form.itemNamePlaceholder')}
                      placeholderTextColor={theme.colors.textMuted}
                      returnKeyType="next"
                      editable={!isSaving}
                    />
                    {nameError && (
                      <Animated.View style={[styles.errorContainer, nameErrorAnimatedStyle]}>
                        <Text style={styles.errorText}>{nameError}</Text>
                      </Animated.View>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('items.form.pricePerKg')}</Text>
                    <TextInput
                      style={[styles.input, priceError && styles.inputError]}
                      value={itemPrice}
                      onChangeText={(text) => {
                        setItemPrice(text);
                        if (priceError) setPriceError(null);
                      }}
                      placeholder="0.00"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      editable={!isSaving}
                    />
                    {priceError && (
                      <Animated.View style={[styles.errorContainer, priceErrorAnimatedStyle]}>
                        <Text style={styles.errorText}>{priceError}</Text>
                      </Animated.View>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('items.form.category')}</Text>
                    <CategoryPicker
                      selectedCategory={selectedCategory}
                      onSelectCategory={setSelectedCategory}
                    />
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={resetForm}
                      disabled={isSaving}
                    >
                      <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, isSaving && styles.buttonDisabled]}
                      onPress={saveItem}
                      disabled={isSaving}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={theme.gradients.secondary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButtonGradient}
                      >
                        <Text style={styles.saveButtonText}>
                          {isSaving ? t('common.loading') : (editingItem ? t('items.form.updateItem') : t('items.form.saveItem'))}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </Animated.View>
            )}

            {/* Add Item Button */}
            {!isAddingItem && (
              <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                <TouchableOpacity
                  onPress={() => {
                    impact('light');
                    setIsAddingItem(true);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={theme.gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.addButton}
                  >
                    <Plus size={24} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>{t('items.addItem')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Items List - Grouped by Category */}
            {items.length > 0 ? (
              sortedCategories.map((category, catIndex) => {
                const categoryItems = groupedItems[category];
                const isCollapsed = collapsedCategories.has(category);
                const categoryInfo = CATEGORIES.find(c => c.id === category);

                return (
                  <Animated.View
                    key={category}
                    entering={FadeInDown.duration(500).delay(300 + catIndex * 100)}
                    layout={Layout.springify()}
                  >
                    <GlassCard style={styles.card}>
                      <TouchableOpacity
                        style={styles.categoryHeader}
                        onPress={() => toggleCategoryCollapse(category)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.categoryTitleRow}>
                          <CategoryBadge category={category as Category} size="medium" />
                          <Text style={styles.categoryCount}>
                            ({categoryItems.length})
                          </Text>
                        </View>
                        {isCollapsed ? (
                          <ChevronDown size={20} color={theme.colors.textMuted} />
                        ) : (
                          <ChevronUp size={20} color={theme.colors.textMuted} />
                        )}
                      </TouchableOpacity>

                      {!isCollapsed && categoryItems.map((item, index) => (
                        <SwipeableRow
                          key={item.id}
                          onDelete={() => performDelete(item)}
                          onEdit={() => startEdit(item)}
                        >
                          <View
                            style={[
                              styles.itemRow,
                              index !== categoryItems.length - 1 && styles.itemRowBorder
                            ]}
                          >
                            <TouchableOpacity
                              style={styles.favoriteButton}
                              onPress={() => handleToggleFavorite(item)}
                              activeOpacity={0.7}
                            >
                              <Star
                                size={20}
                                color={item.isFavorite ? theme.colors.favorite : theme.colors.textMuted}
                                fill={item.isFavorite ? theme.colors.favorite : 'transparent'}
                              />
                            </TouchableOpacity>

                            <View style={styles.itemInfo}>
                              <Text style={styles.itemName}>{item.name}</Text>
                              <View style={styles.priceContainer}>
                                <IndianRupee size={14} color={theme.colors.secondary} />
                                <Text style={styles.itemPrice}>
                                  {formatCurrency(item.pricePerKg)}/kg
                                </Text>
                              </View>
                            </View>

                            <View style={styles.itemActions}>
                              <TouchableOpacity
                                style={styles.actionIconButton}
                                onPress={() => startEdit(item)}
                              >
                                <Edit3 size={18} color={theme.colors.primary} />
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.actionIconButton}
                                onPress={() => handleDeleteItem(item)}
                              >
                                <Trash2 size={18} color={theme.colors.error} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </SwipeableRow>
                      ))}
                    </GlassCard>
                  </Animated.View>
                );
              })
            ) : !isAddingItem && (
              <AnimatedEmptyState
                title={t('items.empty.title')}
                description={t('items.empty.description')}
                icon="shopping"
                actionLabel={t('items.addItem')}
                onAction={() => {
                  impact('light');
                  setIsAddingItem(true);
                }}
              />
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Undo Snackbar */}
        <UndoSnackbar
          visible={canUndo}
          message={`"${undoItem?.data?.name}" deleted`}
          onUndo={handleUndo}
          onDismiss={clearUndo}
        />
      </LinearGradient>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
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
    paddingBottom: 16,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  card: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  addButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
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
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputError: {
    borderColor: theme.colors.error,
    backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
  },
  errorContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCount: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  favoriteButton: {
    padding: 8,
    marginRight: 8,
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
    marginLeft: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceVariant,
  },
  bottomPadding: {
    height: 100,
  },
});