import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatUsd } from '@frutigo/shared';
import { Card, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api, type SupplierDashboard } from '../../src/services/api';

export default function SupplierDashboardScreen() {
  const { theme, locale } = useApp();
  const router = useRouter();
  const [data, setData] = useState<SupplierDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.supplier
      .dashboard()
      .then(setData)
      .catch(() => setData({ products: 0, paidOrders: 0, revenueUsd: 0, lowStockProducts: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: locale === 'es' ? 'Productos' : 'Products', value: String(data?.products ?? 0), icon: '🥬' },
    { label: locale === 'es' ? 'Pedidos pagados' : 'Paid orders', value: String(data?.paidOrders ?? 0), icon: '✅' },
    { label: locale === 'es' ? 'Ingresos' : 'Revenue', value: formatUsd(data?.revenueUsd ?? 0, locale), icon: '💰' },
    { label: locale === 'es' ? 'Stock bajo' : 'Low stock', value: String(data?.lowStockProducts ?? 0), icon: '⚠️' },
  ];

  const actions = [
    { label: locale === 'es' ? 'Mis productos' : 'My products', icon: '📦', go: '/(supplier)/products' },
    { label: locale === 'es' ? 'Pedidos recibidos' : 'Incoming orders', icon: '🧾', go: '/(supplier)/orders' },
    { label: locale === 'es' ? 'Predicción de demanda' : 'Demand forecast', icon: '📈', go: '/(supplier)/forecast' },
    { label: locale === 'es' ? 'Nuevo producto' : 'New product', icon: '➕', go: '/(supplier)/product-edit' },
  ];

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <View style={styles.grid}>
        {metrics.map((m) => (
          <Card key={m.label} theme={theme} style={styles.metric}>
            <Text style={{ fontSize: 24 }}>{m.icon}</Text>
            <Text style={[styles.metricValue, { color: theme.colors.primary }]}>{m.value}</Text>
            <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
              {m.label}
            </Text>
          </Card>
        ))}
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        {actions.map((a) => (
          <Pressable
            key={a.go}
            onPress={() => router.push(a.go as never)}
            style={[styles.action, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Text style={{ fontSize: 20 }}>{a.icon}</Text>
            <Text style={[styles.actionLabel, { color: theme.colors.text }]}>{a.label}</Text>
            <Text style={{ color: theme.colors.textMuted }}>›</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { width: '47%', alignItems: 'flex-start', gap: 4 },
  metricValue: { fontFamily: typography.title, fontSize: fontSize.xl },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  actionLabel: { flex: 1, fontFamily: typography.bodyMedium, fontSize: fontSize.md },
});
