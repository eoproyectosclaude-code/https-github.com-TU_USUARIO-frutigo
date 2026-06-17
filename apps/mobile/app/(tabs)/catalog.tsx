import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { type ProductCategory } from '@frutigo/shared';
import { fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { ProductCard } from '../../src/components/ProductCard';
import { useCatalog } from '../../src/hooks/useCatalog';

const FILTERS: { key: ProductCategory | 'ALL'; es: string; en: string }[] = [
  { key: 'ALL', es: 'Todas', en: 'All' },
  { key: 'FRUTAS', es: 'Frutas', en: 'Fruits' },
  { key: 'VERDURAS', es: 'Verduras', en: 'Vegetables' },
  { key: 'LEGUMBRES', es: 'Legumbres', en: 'Legumes' },
  { key: 'TUBERCULOS', es: 'Tubérculos', en: 'Tubers' },
];

export default function CatalogScreen() {
  const { theme, locale, t } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ProductCategory | 'ALL'>('ALL');
  const { products, loading } = useCatalog();

  const data = useMemo(() => {
    return products.filter((p) => {
      const matchCat = filter === 'ALL' || p.category === filter;
      const name = (locale === 'es' ? p.nameEs : p.nameEn).toLowerCase();
      const matchQuery = name.includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, query, filter, locale]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.common.search}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.search,
            { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border },
          ]}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(f) => f.key}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}
        renderItem={({ item }) => {
          const active = filter === item.key;
          return (
            <Pressable
              onPress={() => setFilter(item.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? '#fff' : theme.colors.text,
                  fontFamily: typography.bodyMedium,
                  fontSize: fontSize.sm,
                }}
              >
                {locale === 'es' ? item.es : item.en}
              </Text>
            </Pressable>
          );
        }}
      />

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: spacing.lg - 4 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard product={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
  search: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    fontFamily: typography.body,
    fontSize: fontSize.md,
  },
  filterRow: { maxHeight: 48, marginBottom: spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  gridItem: { width: '50%', padding: 4 },
});
