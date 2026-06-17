import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatUsd } from '@frutigo/shared';
import { Button, Card, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { useCart, unitLabel } from '../../src/store/cart';

export default function CartScreen() {
  const { theme, locale, t } = useApp();
  const router = useRouter();
  const { items, updateQuantity, removeItem } = useCart();
  const totals = useCart((s) => s.totals());

  if (items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ fontSize: 56 }}>🛒</Text>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t.cart.empty}</Text>
        <Text style={[styles.emptyDesc, { color: theme.colors.textMuted }]}>{t.cart.emptyDesc}</Text>
        <Button
          label={t.cart.goToCatalog}
          theme={theme}
          variant="outline"
          style={{ marginTop: spacing.lg }}
          onPress={() => router.push('/(tabs)/catalog')}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 220 }}>
        {items.map((item) => (
          <Card key={item.key} theme={theme} style={styles.itemCard} padded={false}>
            <View style={styles.itemRow}>
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              <View style={{ flex: 1, padding: spacing.md, gap: 2 }}>
                <Text style={[styles.itemName, { color: theme.colors.text }]}>
                  {locale === 'es' ? item.productNameEs : item.productNameEn}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
                  {unitLabel(item.unit, locale)} · {formatUsd(item.unitPriceUsd, locale)}
                </Text>
                <View style={styles.qtyRow}>
                  <Stepper
                    value={item.quantity}
                    onMinus={() => updateQuantity(item.key, item.quantity - 1)}
                    onPlus={() => updateQuantity(item.key, item.quantity + 1)}
                    color={theme.colors.primary}
                    textColor={theme.colors.text}
                    border={theme.colors.border}
                  />
                  <Text style={[styles.subtotal, { color: theme.colors.text }]}>
                    {formatUsd(item.subtotalUsd, locale)}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => removeItem(item.key)} style={styles.remove}>
                <Text style={{ color: theme.colors.danger, fontSize: 18 }}>✕</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Resumen + checkout */}
      <View style={[styles.summary, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <Row label={t.common.subtotal} value={formatUsd(totals.subtotalUsd, locale)} theme={theme} />
        <Row label={t.common.fee} value={formatUsd(totals.buyerFeeUsd, locale)} theme={theme} />
        <Row
          label={t.common.delivery}
          value={totals.deliveryUsd === 0 ? t.common.free : formatUsd(totals.deliveryUsd, locale)}
          theme={theme}
        />
        <Row label={t.common.tax} value={formatUsd(totals.taxUsd, locale)} theme={theme} />
        <View style={styles.divider} />
        <Row label={t.common.total} value={formatUsd(totals.totalUsd, locale)} theme={theme} bold />
        <Button
          label={t.common.checkout}
          theme={theme}
          style={{ marginTop: spacing.md }}
          onPress={() => router.push('/checkout')}
        />
      </View>
    </View>
  );
}

function Stepper(props: {
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  color: string;
  textColor: string;
  border: string;
}) {
  return (
    <View style={[styles.stepper, { borderColor: props.border }]}>
      <Pressable onPress={props.onMinus} style={styles.stepBtn}>
        <Text style={{ color: props.color, fontSize: 18, fontFamily: typography.subtitle }}>−</Text>
      </Pressable>
      <Text style={{ color: props.textColor, fontFamily: typography.bodyMedium, minWidth: 24, textAlign: 'center' }}>
        {props.value}
      </Text>
      <Pressable onPress={props.onPlus} style={styles.stepBtn}>
        <Text style={{ color: props.color, fontSize: 18, fontFamily: typography.subtitle }}>+</Text>
      </Pressable>
    </View>
  );
}

function Row({
  label,
  value,
  theme,
  bold,
}: {
  label: string;
  value: string;
  theme: { colors: { text: string; textMuted: string } };
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={{ color: bold ? theme.colors.text : theme.colors.textMuted, fontFamily: bold ? typography.title : typography.body, fontSize: bold ? fontSize.lg : fontSize.sm }}>
        {label}
      </Text>
      <Text style={{ color: theme.colors.text, fontFamily: bold ? typography.title : typography.bodyMedium, fontSize: bold ? fontSize.lg : fontSize.sm }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontFamily: typography.title, fontSize: fontSize.xl, marginTop: spacing.md },
  emptyDesc: { fontFamily: typography.body, fontSize: fontSize.sm, textAlign: 'center', marginTop: 4 },
  itemCard: { marginBottom: spacing.md, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 80, height: 80, backgroundColor: '#ddd' },
  itemName: { fontFamily: typography.subtitle, fontSize: fontSize.md },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  subtotal: { fontFamily: typography.title, fontSize: fontSize.md },
  remove: { padding: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.pill },
  stepBtn: { paddingHorizontal: 12, paddingVertical: 4 },
  summary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  divider: { height: 1, backgroundColor: '#94A3B833', marginVertical: spacing.sm },
});
