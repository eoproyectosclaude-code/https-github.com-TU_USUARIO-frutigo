import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Badge, Button, Card, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../src/providers/AppProvider';
import { api, type DeliveryTracking } from '../src/services/api';
import { subscribeTracking } from '../src/services/socket';

const STEPS = ['ASIGNADO', 'RECOGIDO', 'EN_RUTA', 'ENTREGADO'];

export default function TrackScreen() {
  const { orderId: param } = useLocalSearchParams<{ orderId?: string }>();
  const { theme, locale } = useApp();
  const [orderId, setOrderId] = useState(param ?? '');
  const [data, setData] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchTrack(id: string) {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      setData(await api.delivery.track(id));
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (param) fetchTrack(param);
    // Polling de respaldo cada 30s.
    const t = setInterval(() => {
      if (orderId) fetchTrack(orderId);
    }, 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param]);

  // Tiempo real: actualiza ubicación y estado al instante vía WebSocket.
  useEffect(() => {
    if (!orderId) return;
    const unsub = subscribeTracking(orderId, {
      onLocation: (loc) => setData((prev) => (prev ? { ...prev, lastLocation: loc } : prev)),
      onStatus: (status) => setData((prev) => (prev ? { ...prev, status } : prev)),
    });
    return unsub;
  }, [orderId]);

  const stepIndex = data ? STEPS.indexOf(data.status) : -1;

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {locale === 'es' ? 'Seguimiento de pedido' : 'Order tracking'}
      </Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={orderId}
          onChangeText={setOrderId}
          placeholder={locale === 'es' ? 'ID del pedido' : 'Order ID'}
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
        />
        <Button label={locale === 'es' ? 'Buscar' : 'Track'} theme={theme} onPress={() => fetchTrack(orderId)} style={{ paddingHorizontal: 20 }} />
      </View>

      {loading ? <ActivityIndicator color={theme.colors.primary} /> : null}
      {error ? <Text style={{ color: theme.colors.danger, fontFamily: typography.body }}>{error}</Text> : null}

      {data ? (
        <>
          <Card theme={theme}>
            <View style={styles.row}>
              <Text style={{ color: theme.colors.text, fontFamily: typography.title, fontSize: fontSize.lg }}>{data.reference}</Text>
              <Badge label={data.status} color={theme.colors.primary} />
            </View>
            {data.driver ? (
              <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.sm, marginTop: 4 }}>
                🛵 {data.driver.name} · {data.driver.vehicle}
              </Text>
            ) : null}
            {data.etaMinutes != null ? (
              <Text style={{ color: theme.colors.secondary, fontFamily: typography.subtitle, fontSize: fontSize.md, marginTop: spacing.sm }}>
                ⏱ {locale === 'es' ? 'Llega en aprox.' : 'Arrives in ~'} {data.etaMinutes} min
              </Text>
            ) : null}
          </Card>

          {/* Línea de progreso */}
          <Card theme={theme}>
            {STEPS.map((s, i) => {
              const reached = stepIndex >= i;
              return (
                <View key={s} style={styles.stepRow}>
                  <View style={[styles.dot, { backgroundColor: reached ? theme.colors.success : theme.colors.border }]} />
                  <Text style={{ color: reached ? theme.colors.text : theme.colors.textMuted, fontFamily: reached ? typography.bodyMedium : typography.body, fontSize: fontSize.sm }}>
                    {s}
                  </Text>
                </View>
              );
            })}
          </Card>

          {data.lastLocation ? (
            <Card theme={theme}>
              <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
                {locale === 'es' ? 'Última ubicación' : 'Last location'}: {data.lastLocation.lat.toFixed(5)}, {data.lastLocation.lng.toFixed(5)}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
                {new Date(data.lastLocation.at).toLocaleTimeString(locale === 'es' ? 'es-PA' : 'en-US')}
              </Text>
            </Card>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: typography.title, fontSize: fontSize.xl },
  input: { flex: 1, height: 48, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, fontFamily: typography.body, fontSize: fontSize.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  dot: { width: 14, height: 14, borderRadius: 7 },
});
