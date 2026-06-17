import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { formatUsd, type Order } from '@frutigo/shared';
import { Badge, Button, Card, fontSize, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api } from '../../src/services/api';
import { downloadAndShareReceipt } from '../../src/services/pdf';

const STATUS_COLOR: Record<string, string> = {
  PAGADO: '#22C55E',
  PENDIENTE_PAGO: '#F6C615',
  EN_RUTA: '#F26419',
  ENTREGADO: '#1B7A4B',
  CANCELADO: '#EF4444',
};

export default function OrdersScreen() {
  const { theme, locale, user } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  async function receipt(o: Order) {
    try {
      await downloadAndShareReceipt(o.id, o.reference);
    } catch (e) {
      Alert.alert(locale === 'es' ? 'Recibo' : 'Receipt', (e as Error).message);
    }
  }

  const load = useCallback(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    setLoading(true);
    api.myOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, [user]);

  useFocusEffect(useCallback(() => load(), [load]));

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ fontSize: 56 }}>📦</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {locale === 'es' ? 'Inicia sesión para ver tus pedidos' : 'Sign in to see your orders'}
        </Text>
        <Button label={locale === 'es' ? 'Iniciar sesión' : 'Sign in'} theme={theme} variant="outline" style={{ marginTop: spacing.lg }} onPress={() => router.push('/auth')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          ListEmptyComponent={
            <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontFamily: typography.body }}>
              {locale === 'es' ? 'Aún no tienes pedidos.' : 'No orders yet.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Card theme={theme}>
              <View style={styles.row}>
                <Text style={{ color: theme.colors.text, fontFamily: typography.subtitle }}>{item.reference}</Text>
                <Badge label={item.status} color={STATUS_COLOR[item.status] ?? theme.colors.textMuted} />
              </View>
              <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs, marginTop: 4 }}>
                {formatUsd((item as any).totalUsd ?? item.totals?.totalUsd ?? 0, locale)}
              </Text>
              <View style={styles.actions}>
                {item.status === 'EN_RUTA' || item.status === 'PAGADO' ? (
                  <Pressable onPress={() => router.push({ pathname: '/track', params: { orderId: item.id } })}>
                    <Text style={{ color: theme.colors.primary, fontFamily: typography.bodyMedium, fontSize: fontSize.sm }}>
                      📍 {locale === 'es' ? 'Seguir entrega ›' : 'Track ›'}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => receipt(item)}>
                  <Text style={{ color: theme.colors.primary, fontFamily: typography.bodyMedium, fontSize: fontSize.sm }}>
                    📄 {locale === 'es' ? 'Recibo PDF ›' : 'Receipt PDF ›'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { fontFamily: typography.title, fontSize: fontSize.lg, marginTop: spacing.md, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
});
