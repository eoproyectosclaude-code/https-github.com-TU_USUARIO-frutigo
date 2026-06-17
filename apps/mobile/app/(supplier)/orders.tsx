import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { formatUsd, type Order } from '@frutigo/shared';
import { Badge, Card, fontSize, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api } from '../../src/services/api';

const STATUS_COLOR: Record<string, string> = {
  PAGADO: '#22C55E',
  PENDIENTE_PAGO: '#F6C615',
  EN_RUTA: '#3B82F6',
  ENTREGADO: '#1B7A4B',
  CANCELADO: '#EF4444',
};

export default function SupplierOrdersScreen() {
  const { theme, locale } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.supplier
      .orders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.background }}
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      ListEmptyComponent={
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontFamily: typography.body }}>
          {locale === 'es' ? 'Aún no hay pedidos con tus productos.' : 'No orders with your products yet.'}
        </Text>
      }
      renderItem={({ item }) => (
        <Card theme={theme}>
          <View style={styles.header}>
            <Text style={[styles.ref, { color: theme.colors.text }]}>{item.reference}</Text>
            <Badge label={item.status} color={STATUS_COLOR[item.status] ?? theme.colors.textMuted} />
          </View>
          <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs, marginTop: 4 }}>
            {item.lines.length} {locale === 'es' ? 'líneas' : 'lines'} · {item.segment}
          </Text>
          <Text style={[styles.total, { color: theme.colors.primary }]}>
            {formatUsd(item.totals?.totalUsd ?? (item as any).totalUsd ?? 0, locale)}
          </Text>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontFamily: typography.subtitle, fontSize: fontSize.md },
  total: { fontFamily: typography.title, fontSize: fontSize.lg, marginTop: spacing.sm },
});
