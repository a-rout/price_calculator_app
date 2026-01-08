import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import {
    ShoppingBag,
    Leaf,
    Apple,
    Milk,
    Beef,
    Flame,
    CupSoda,
    Package,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';
import { Category, CATEGORIES } from '@/types';

interface CategoryPickerProps {
    selectedCategory: Category;
    onSelectCategory: (category: Category) => void;
    compact?: boolean;
}

const CATEGORY_ICONS: Record<Category, any> = {
    groceries: ShoppingBag,
    vegetables: Leaf,
    fruits: Apple,
    dairy: Milk,
    meat: Beef,
    spices: Flame,
    beverages: CupSoda,
    other: Package,
};

/**
 * Category picker component with pill-style buttons
 */
export const CategoryPicker: React.FC<CategoryPickerProps> = ({
    selectedCategory,
    onSelectCategory,
    compact = false,
}) => {
    const { theme } = useTheme();
    const { selection } = useHaptics();

    const handleSelect = (category: Category) => {
        selection();
        onSelectCategory(category);
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            {CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category.id;
                const IconComponent = CATEGORY_ICONS[category.id];

                return (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.pill,
                            compact && styles.pillCompact,
                            {
                                backgroundColor: isSelected
                                    ? theme.colors.primary
                                    : theme.isDark
                                        ? 'rgba(255, 255, 255, 0.1)'
                                        : 'rgba(0, 0, 0, 0.05)',
                                borderColor: isSelected
                                    ? theme.colors.primary
                                    : theme.colors.border,
                            },
                        ]}
                        onPress={() => handleSelect(category.id)}
                        activeOpacity={0.7}
                    >
                        <IconComponent
                            size={compact ? 14 : 16}
                            color={isSelected ? '#FFFFFF' : theme.colors.textMuted}
                        />
                        {!compact && (
                            <Text
                                style={[
                                    styles.label,
                                    {
                                        color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
                                    },
                                ]}
                            >
                                {category.label}
                            </Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

interface CategoryBadgeProps {
    category: Category;
    size?: 'small' | 'medium';
}

/**
 * Single category badge
 */
export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
    category,
    size = 'small',
}) => {
    const { theme } = useTheme();
    const categoryInfo = CATEGORIES.find((c) => c.id === category);
    const IconComponent = CATEGORY_ICONS[category];

    const badgeColors: Record<Category, string> = {
        groceries: '#F59E0B',
        vegetables: '#10B981',
        fruits: '#F97316',
        dairy: '#3B82F6',
        meat: '#EF4444',
        spices: '#EC4899',
        beverages: '#8B5CF6',
        other: '#6B7280',
    };

    return (
        <View
            style={[
                styles.badge,
                size === 'small' ? styles.badgeSmall : styles.badgeMedium,
                { backgroundColor: `${badgeColors[category]}20` },
            ]}
        >
            <IconComponent
                size={size === 'small' ? 12 : 14}
                color={badgeColors[category]}
            />
            <Text
                style={[
                    styles.badgeLabel,
                    size === 'small' ? styles.badgeLabelSmall : styles.badgeLabelMedium,
                    { color: badgeColors[category] },
                ]}
            >
                {categoryInfo?.label || 'Other'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 4,
        gap: 8,
        flexDirection: 'row',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        gap: 8,
    },
    pillCompact: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        gap: 4,
    },
    badgeSmall: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    badgeMedium: {
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    badgeLabel: {
        fontWeight: '600',
    },
    badgeLabelSmall: {
        fontSize: 11,
    },
    badgeLabelMedium: {
        fontSize: 13,
    },
});

export default CategoryPicker;
