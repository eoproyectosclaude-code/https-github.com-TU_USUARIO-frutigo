import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import type { Delivery } from '@frutigo/shared';
import { Badge, Card, fontSize, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api } from '../../src/services/api';

const STATUS_COLOR: Record<string, string> = {
  ASIGNADO: '#F2C707',
  RECOGIDO: '#3B82F6',
  EN_RUTA: '#D9A404',
  ENTREGADO: '#22C55E',
  FALLIDO: '#EF4444',
};

export default function DriverHome() {
  const { theme, locale } = useApp();
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.delivery.mine().then(setDeliveries).catch(() => setDeliveries([])).finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  async function toggleAvailable(value: boolean) {
    setAvailable(value);
    let coords: { lat?: number; lng?: number } = {};
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    }
    try {
      await api.delivery.setDriverStatus({ status: value ? 'DISPONIBLE' : 'INACTIVO', ...coords });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
      setAvailable(!value);
    }
  }

  const active = deliveries.filter((d) => d.status !== 'ENTREGADO' && d.status !== 'FALLIDO');
  const done = deliveries.filter((d) => d.status === 'ENTREGADO' || d.status === 'FALLIDO');

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Card theme={theme}>
        <View style={styles.availRow}>
          <View>
            <Text style={{ color: theme.colors.text, fontFamily: typography.subtitle, fontSize: fontSize.md }}>
              {locale === 'es' ? 'Disponibilidad' : 'Availability'}
            </Text>
            <Text style={{ color: available ? theme.colors.success : theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
              {available ? (locale === 'es' ? 'Disponible para entregas' : 'Available') : (locale === 'es' ? 'Inactivo' : 'Inactive')}
            </Text>
          </View>
          <Switch value={available} onValueChange={toggleAvailable} trackColor={{ true: theme.colors.success }} />
        </View>
      </Card>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <>
          <Text style={[styles.section, { color: theme.colors.text }]}>
            {locale === 'es' ? 'Activas' : 'Active'} ({active.length})
          </Text>
          {active.length === 0 ? (
            <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.sm }}>
              {locale === 'es' ? 'No tienes entregas asignadas.' : 'No assigned deliveries.'}
            </Text>
          ) : null}
          {active.map((d) => (
            <DeliveryCard key={d.id} d={d} theme={theme} locale={locale} onPress={() => router.push({ pathname: '/(driver)/delivery', params: { id: d.id } })} />
          ))}

          {done.length > 0 ? (
            <>
              <Text style={[styles.section, { color: theme.colors.text }]}>
                {locale === 'es' ? 'Historial' : 'History'} ({done.length})
              </Text>
              {done.map((d) => (
                <DeliveryCard key={d.id} d={d} theme={theme} locale={locale} onPress={() => router.push({ pathname: '/(driver)/delivery', params: { id: d.id } })} />
              ))}
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function DeliveryCard({ d, theme, locale, onPress }: { d: Delivery; theme: any; locale: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card theme={theme}>
        <View style={styles.cardRow}>
          <Text style={{ color: theme.colors.text, fontFamily: typography.subtitle }}>
            {d.orderReference ?? (d as any).order?.reference ?? d.orderId}
          </Text>
          <Badge label={d.status} color={STATUS_COLOR[d.status] ?? theme.colors.textMuted} />
        </View>
        <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs, marginTop: 4 }}>
          📍 {d.dropoffAddress}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  availRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { fontFamily: typography.title, fontSize: fontSize.md, marginTop: spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
