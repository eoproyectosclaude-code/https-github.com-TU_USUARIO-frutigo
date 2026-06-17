import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatUsd } from '@frutigo/shared';
import { Card, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api, type AdminDashboard } from '../../src/services/api';

export default function AdminDashboardScreen() {
  const { theme, locale } = useApp();
  const router = useRouter();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .dashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const metrics = [
    { label: 'GMV', value: formatUsd(data?.gmvUsd ?? 0, locale), icon: '📊' },
    { label: locale === 'es' ? 'Ingreso plataforma' : 'Platform revenue', value: formatUsd(data?.platformRevenueUsd ?? 0, locale), icon: '💵' },
    { label: locale === 'es' ? 'Pedidos pagados' : 'Paid orders', value: String(data?.paidOrders ?? 0), icon: '✅' },
    { label: locale === 'es' ? 'Pedidos totales' : 'Total orders', value: String(data?.totalOrders ?? 0), icon: '🧾' },
    { label: locale === 'es' ? 'Proveedores' : 'Suppliers', value: String(data?.suppliers ?? 0), icon: '🌾' },
    { label: locale === 'es' ? 'Por verificar' : 'Pending', value: String(data?.pendingSuppliers ?? 0), icon: '⏳' },
  ];

  const actions = [
    { label: locale === 'es' ? 'Verificar proveedores' : 'Verify suppliers', icon: '✔️', go: '/(admin)/suppliers' },
    { label: locale === 'es' ? 'Conciliar pagos' : 'Reconcile payments', icon: '💳', go: '/(admin)/payments' },
  ];

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.grid}>
        {metrics.map((m) => (
          <Card key={m.label} theme={theme} style={styles.metric}>
            <Text style={{ fontSize: 22 }}>{m.icon}</Text>
            <Text style={[styles.value, { color: theme.colors.primary }]}>{m.value}</Text>
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
  value: { fontFamily: typography.title, fontSize: fontSize.lg },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1 },
  actionLabel: { flex: 1, fontFamily: typography.bodyMedium, fontSize: fontSize.md },
});
