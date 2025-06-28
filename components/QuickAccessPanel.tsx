import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  Clock, 
  TrendingUp,
  Pin,
  PinOff
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  getItems, 
  getFrequentlyUsedItems, 
  toggleItemPin, 
  trackItemUsage,
  type Item,
  type ItemUsage 
} from '@/utils/storage';

interface QuickAccessPanelProps {
  selectedItem: Item | null;
  onItemSelect: (item: Item) => void;
  onUsageUpdate?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(320, screenWidth * 0.85);

export function QuickAccessPanel({ selectedItem, onItemSelect, onUsageUpdate }: QuickAccessPanelProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [frequentItems, setFrequentItems] = useState<{ item: Item; usage: ItemUsage }[]>([]);
  const [slideAnim] = useState(new Animated.Value(-PANEL_WIDTH));
  const [overlayOpacity] = useState(new Animated.Value(0));

  const styles = createStyles(theme);

  useEffect(() => {
    loadFrequentItems();
  }, []);

  const loadFrequentItems = async () => {
    try {
      const items = await getItems();
      const frequent = await getFrequentlyUsedItems(items);
      setFrequentItems(frequent);
    } catch (error) {
      console.error('Error loading frequent items:', error);
    }
  };

  const togglePanel = () => {
    const toValue = isOpen ? -PANEL_WIDTH : 0;
    const overlayValue = isOpen ? 0 : 0.5;

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(overlayOpacity, {
        toValue: overlayValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setIsOpen(!isOpen);
  };

  const handleItemSelect = async (item: Item) => {
    try {
      await trackItemUsage(item.id);
      onItemSelect(item);
      onUsageUpdate?.();
      await loadFrequentItems(); // Refresh the list
      togglePanel(); // Close panel after selection
    } catch (error) {
      console.error('Error selecting item:', error);
    }
  };

  const handleTogglePin = async (itemId: string, event: any) => {
    event.stopPropagation();
    try {
      await toggleItemPin(itemId);
      await loadFrequentItems();
      onUsageUpdate?.();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getUsageLabel = (usage: ItemUsage) => {
    if (usage.isPinned) return 'Pinned';
    if (usage.count === 0) return 'New';
    if (usage.count === 1) return '1 use';
    return `${usage.count} uses`;
  };

  const getUsageIcon = (usage: ItemUsage) => {
    if (usage.isPinned) return Star;
    if (usage.count >= 10) return TrendingUp;
    return Clock;
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <Animated.View
          style={[
            styles.overlay,
            { opacity: overlayOpacity }
          ]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            onPress={togglePanel}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Toggle Button */}
      <TouchableOpacity
        style={[
          styles.toggleButton,
          isOpen && styles.toggleButtonOpen
        ]}
        onPress={togglePanel}
        activeOpacity={0.8}
      >
        {isOpen ? (
          <ChevronLeft size={24} color={theme.colors.surface} strokeWidth={2.5} />
        ) : (
          <ChevronRight size={24} color={theme.colors.surface} strokeWidth={2.5} />
        )}
      </TouchableOpacity>

      {/* Slide Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.panelHeader}>
          <View style={styles.headerContent}>
            <TrendingUp size={24} color={theme.colors.primary} strokeWidth={2} />
            <Text style={styles.panelTitle}>Quick Access</Text>
          </View>
          <Text style={styles.panelSubtitle}>
            {frequentItems.length} frequently used items
          </Text>
        </View>

        <ScrollView 
          style={styles.itemsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.itemsListContent}
        >
          {frequentItems.length > 0 ? (
            frequentItems.map(({ item, usage }) => {
              const UsageIcon = getUsageIcon(usage);
              const isSelected = selectedItem?.id === item.id;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.quickItem,
                    isSelected && styles.quickItemSelected,
                    usage.isPinned && styles.quickItemPinned
                  ]}
                  onPress={() => handleItemSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickItemContent}>
                    <View style={styles.quickItemHeader}>
                      <View style={styles.quickItemInfo}>
                        <Text style={[
                          styles.quickItemName,
                          isSelected && styles.quickItemNameSelected
                        ]}>
                          {item.name}
                        </Text>
                        <Text style={[
                          styles.quickItemPrice,
                          isSelected && styles.quickItemPriceSelected
                        ]}>
                          {formatCurrency(item.pricePerKg)}/kg
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={[
                          styles.pinButton,
                          usage.isPinned && styles.pinButtonActive
                        ]}
                        onPress={(e) => handleTogglePin(item.id, e)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {usage.isPinned ? (
                          <PinOff size={16} color={theme.colors.warning} strokeWidth={2} />
                        ) : (
                          <Pin size={16} color={theme.colors.textMuted} strokeWidth={2} />
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.quickItemFooter}>
                      <View style={styles.usageIndicator}>
                        <UsageIcon 
                          size={14} 
                          color={usage.isPinned ? theme.colors.warning : theme.colors.textMuted} 
                          strokeWidth={2}
                        />
                        <Text style={[
                          styles.usageText,
                          usage.isPinned && styles.usageTextPinned
                        ]}>
                          {getUsageLabel(usage)}
                        </Text>
                      </View>
                      
                      {usage.count > 0 && (
                        <Text style={styles.lastUsedText}>
                          {usage.lastUsed.toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {isSelected && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Clock size={48} color={theme.colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No Recent Items</Text>
              <Text style={styles.emptyDescription}>
                Items you use frequently will appear here for quick access.
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
    zIndex: 998,
  },
  overlayTouchable: {
    flex: 1,
  },
  toggleButton: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -28,
    width: 56,
    height: 56,
    backgroundColor: theme.colors.primary,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  toggleButtonOpen: {
    backgroundColor: theme.colors.secondary,
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: theme.colors.surface,
    zIndex: 999,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderRightWidth: theme.isDark ? 1 : 0,
    borderRightColor: theme.colors.border,
  },
  panelHeader: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surfaceVariant,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginLeft: 12,
  },
  panelSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginLeft: 36,
  },
  itemsList: {
    flex: 1,
  },
  itemsListContent: {
    padding: 16,
  },
  quickItem: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  quickItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.isDark ? theme.colors.surface : '#EBF4FF',
  },
  quickItemPinned: {
    borderColor: theme.colors.warning,
    backgroundColor: theme.isDark ? '#2D2A1F' : '#FFFBEB',
  },
  quickItemContent: {
    padding: 16,
  },
  quickItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quickItemInfo: {
    flex: 1,
  },
  quickItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  quickItemNameSelected: {
    color: theme.colors.primary,
  },
  quickItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  quickItemPriceSelected: {
    color: theme.colors.primary,
  },
  pinButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pinButtonActive: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  quickItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginLeft: 6,
    fontWeight: '500',
  },
  usageTextPinned: {
    color: theme.colors.warning,
  },
  lastUsedText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  selectedIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});