import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { nextStatuses, type Delivery, type DeliveryStatus } from '@frutigo/shared';
import { Badge, Button, Card, fontSize, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api } from '../../src/services/api';

const LABEL: Record<DeliveryStatus, { es: string; en: string }> = {
  ASIGNADO: { es: 'Asignado', en: 'Assigned' },
  RECOGIDO: { es: 'Marcar recogido', en: 'Mark picked up' },
  EN_RUTA: { es: 'Iniciar ruta', en: 'Start route' },
  ENTREGADO: { es: 'Marcar entregado', en: 'Mark delivered' },
  FALLIDO: { es: 'Marcar fallido', en: 'Mark failed' },
};

export default function DeliveryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, locale } = useApp();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  async function load() {
    const list = await api.delivery.mine().catch(() => [] as Delivery[]);
    setDelivery(list.find((d) => d.id === id) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    return () => {
      watchRef.current?.remove();
    };
  }, [id]);

  async function advance(status: DeliveryStatus) {
    if (!id) return;
    setBusy(true);
    try {
      const updated = await api.delivery.updateStatus(id, status);
      setDelivery((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleSharing(value: boolean) {
    if (!id) return;
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(locale === 'es' ? 'Permiso requerido' : 'Permission required', 'GPS');
        return;
      }
      setSharing(true);
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 30 },
        (pos) => {
          api.delivery.pushLocation(id, pos.coords.latitude, pos.coords.longitude).catch(() => undefined);
        },
      );
    } else {
      setSharing(false);
      watchRef.current?.remove();
      watchRef.current = null;
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }
  if (!delivery) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>{locale === 'es' ? 'Entrega no encontrada' : 'Delivery not found'}</Text>
      </View>
    );
  }

  const options = nextStatuses(delivery.status);

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Card theme={theme}>
        <View style={styles.row}>
          <Text style={{ color: theme.colors.text, fontFamily: typography.title, fontSize: fontSize.lg }}>
            {delivery.orderReference ?? (delivery as any).order?.reference ?? delivery.orderId}
          </Text>
          <Badge label={delivery.status} color={theme.colors.primary} />
        </View>
        <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.sm, marginTop: spacing.sm }}>
          🟢 {locale === 'es' ? 'Recoger en' : 'Pickup'}: {delivery.pickupAddress}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.sm }}>
          📍 {locale === 'es' ? 'Entregar en' : 'Drop-off'}: {delivery.dropoffAddress}
        </Text>
      </Card>

      {/* Compartir ubicación GPS */}
      <Card theme={theme}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontFamily: typography.subtitle, fontSize: fontSize.md }}>
              {locale === 'es' ? 'Compartir ubicación GPS' : 'Share GPS location'}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
              {locale === 'es' ? 'El comprador verá tu posición en vivo' : 'The buyer sees your live position'}
            </Text>
          </View>
          <Switch value={sharing} onValueChange={toggleSharing} trackColor={{ true: theme.colors.success }} />
        </View>
      </Card>

      {/* Avance de estado (transiciones válidas del dominio) */}
      {options.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          {options.map((s) => (
            <Button
              key={s}
              label={locale === 'es' ? LABEL[s].es : LABEL[s].en}
              theme={theme}
              variant={s === 'FALLIDO' ? 'outline' : 'primary'}
              loading={busy}
              onPress={() => advance(s)}
            />
          ))}
        </View>
      ) : (
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', fontFamily: typography.body }}>
          {locale === 'es' ? 'Entrega finalizada.' : 'Delivery finished.'}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
