import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { formatUsd } from '@frutigo/shared';
import { Badge, Card, fontSize, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api, type AdminPayment } from '../../src/services/api';

const STATUS_COLOR: Record<string, string> = {
  COMPLETADO: '#22C55E',
  AUTORIZADO: '#3B82F6',
  PENDIENTE: '#F6C615',
  FALLIDO: '#EF4444',
  REEMBOLSADO: '#64748B',
};

export default function AdminPaymentsScreen() {
  const { theme, locale } = useApp();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .payments()
      .then(setPayments)
      .catch(() => setPayments([]))
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
      data={payments}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
      ListEmptyComponent={
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontFamily: typography.body }}>
          {locale === 'es' ? 'Aún no hay pagos registrados.' : 'No payments yet.'}
        </Text>
      }
      renderItem={({ item }) => (
        <Card theme={theme}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ref, { color: theme.colors.text }]}>{item.reference}</Text>
              <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
                {item.method} · {item.segment}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={[styles.amount, { color: theme.colors.primary }]}>
                {formatUsd(item.amountUsd, locale)}
              </Text>
              <Badge label={item.status} color={STATUS_COLOR[item.status] ?? theme.colors.textMuted} />
            </View>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  ref: { fontFamily: typography.subtitle, fontSize: fontSize.md },
  amount: { fontFamily: typography.title, fontSize: fontSize.md },
});
