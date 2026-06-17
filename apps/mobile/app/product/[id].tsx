import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  PRODUCTS,
  SUPPLIERS,
  UNIT_DEFINITIONS,
  priceForUnit,
  formatUsd,
  type SaleUnit,
} from '@frutigo/shared';
import { Badge, Button, Price, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { useCart } from '../../src/store/cart';

const UNIT_ORDER: SaleUnit[] = ['KG', 'HALF_QUINTAL', 'QUINTAL'];

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, locale, t } = useApp();
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const [unit, setUnit] = useState<SaleUnit>('KG');

  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.colors.text }}>Producto no encontrado</Text>
      </View>
    );
  }

  const supplier = SUPPLIERS.find((s) => s.id === product.supplierId);
  const price = priceForUnit(product, unit);
  const name = locale === 'es' ? product.nameEs : product.nameEn;
  const desc = locale === 'es' ? product.descriptionEs : product.descriptionEn;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Image source={{ uri: product.imageUrl }} style={styles.hero} />
        <View style={styles.body}>
          <View style={styles.badges}>
            {product.certifications.map((c) => (
              <Badge key={c} label={c} color={theme.colors.secondary} />
            ))}
            {product.shipProvisioning ? (
              <Badge label="⚓ Ship Provisioning" color={theme.colors.accent} textColor="#11203A" />
            ) : null}
          </View>

          <Text style={[styles.name, { color: theme.colors.text }]}>{name}</Text>
          <Text style={[styles.origin, { color: theme.colors.textMuted }]}>
            📍 {product.province} · ⭐ {product.ratingAvg} ({product.ratingCount})
          </Text>

          {supplier ? (
            <View style={styles.supplierRow}>
              <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body }}>
                {supplier.name}
              </Text>
              {supplier.verified ? (
                <Badge label={`✓ ${t.common.verified}`} color={theme.colors.success} />
              ) : null}
            </View>
          ) : null}

          <Text style={[styles.desc, { color: theme.colors.text }]}>{desc}</Text>

          {/* Selector de unidad */}
          <Text style={[styles.label, { color: theme.colors.text }]}>{t.catalog.selectUnit}</Text>
          <View style={styles.unitRow}>
            {UNIT_ORDER.map((u) => {
              const p = priceForUnit(product, u);
              if (!p) return null;
              const active = unit === u;
              const def = UNIT_DEFINITIONS[u];
              return (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[
                    styles.unitChip,
                    {
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? theme.colors.primary + '15' : theme.colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.unitLabel, { color: theme.colors.text }]}>
                    {locale === 'es' ? def.labelEs : def.labelEn}
                  </Text>
                  <Text style={{ color: theme.colors.primary, fontFamily: typography.subtitle }}>
                    {formatUsd(p.priceUsd, locale)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Barra inferior de compra */}
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        {price ? <Price amountUsd={price.priceUsd} theme={theme} size="lg" /> : <View />}
        <Button
          label={t.common.addToCart}
          theme={theme}
          style={{ flex: 1, marginLeft: spacing.lg }}
          onPress={() => {
            addItem(product, unit, 1);
            router.push('/(tabs)/cart');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', height: 260, backgroundColor: '#ddd' },
  body: { padding: spacing.lg, gap: spacing.sm },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  name: { fontFamily: typography.display, fontSize: fontSize.xxl },
  origin: { fontFamily: typography.body, fontSize: fontSize.sm },
  supplierRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  desc: { fontFamily: typography.body, fontSize: fontSize.md, lineHeight: 22, marginTop: 4 },
  label: { fontFamily: typography.subtitle, fontSize: fontSize.md, marginTop: spacing.md },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitChip: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  unitLabel: { fontFamily: typography.body, fontSize: fontSize.xs, textAlign: 'center' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
  },
});
