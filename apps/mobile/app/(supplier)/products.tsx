import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { priceForUnit, formatUsd, type Product } from '@frutigo/shared';
import { Badge, Button, Card, fontSize, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api } from '../../src/services/api';

export default function SupplierProductsScreen() {
  const { theme, locale } = useApp();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.supplier
      .products()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListEmptyComponent={
          <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontFamily: typography.body }}>
            {locale === 'es' ? 'Aún no tienes productos. Crea el primero.' : 'No products yet. Create your first.'}
          </Text>
        }
        renderItem={({ item }) => {
          const kg = priceForUnit(item, 'KG');
          const minStock = Math.min(...item.prices.map((p) => p.stock));
          return (
            <Pressable onPress={() => router.push({ pathname: '/(supplier)/product-edit', params: { id: item.id } })}>
              <Card theme={theme} padded={false} style={styles.card}>
                <View style={styles.row}>
                  <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
                  <View style={{ flex: 1, padding: spacing.md, gap: 4 }}>
                    <Text style={[styles.name, { color: theme.colors.text }]}>
                      {locale === 'es' ? item.nameEs : item.nameEn}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
                      {kg ? formatUsd(kg.priceUsd, locale) + '/kg' : ''} · {item.prices.length} {locale === 'es' ? 'unidades' : 'units'}
                    </Text>
                    {minStock <= 5 ? (
                      <Badge label={locale === 'es' ? `Stock bajo: ${minStock}` : `Low stock: ${minStock}`} color={theme.colors.danger} />
                    ) : null}
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
      <View style={{ padding: spacing.lg }}>
        <Button
          label={locale === 'es' ? '➕ Nuevo producto' : '➕ New product'}
          theme={theme}
          onPress={() => router.push('/(supplier)/product-edit')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 84, height: 84, backgroundColor: '#ddd' },
  name: { fontFamily: typography.subtitle, fontSize: fontSize.md },
});
