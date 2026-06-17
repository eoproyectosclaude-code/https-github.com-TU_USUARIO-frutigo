import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, fontSize, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api, type ForecastItem } from '../../src/services/api';

export default function ForecastScreen() {
  const { theme, locale } = useApp();
  const [items, setItems] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.supplier.forecast().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
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
      data={items}
      keyExtractor={(i) => i.productId}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      ListHeaderComponent={
        <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs, marginBottom: spacing.sm }}>
          {locale === 'es'
            ? 'Estimación de demanda del próximo período según tu histórico de ventas pagadas.'
            : 'Next-period demand estimate based on your paid sales history.'}
        </Text>
      }
      ListEmptyComponent={
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontFamily: typography.body }}>
          {locale === 'es' ? 'Aún no hay datos suficientes.' : 'Not enough data yet.'}
        </Text>
      }
      renderItem={({ item }) => {
        const trendIcon = item.trendPerPeriod > 0 ? '📈' : item.trendPerPeriod < 0 ? '📉' : '➡️';
        return (
          <Card theme={theme}>
            <View style={styles.row}>
              <Text style={{ color: theme.colors.text, fontFamily: typography.subtitle, fontSize: fontSize.md }}>
                {locale === 'es' ? item.nameEs : item.nameEn}
              </Text>
              <Badge
                label={`${Math.round(item.confidence * 100)}%`}
                color={item.confidence >= 0.5 ? theme.colors.success : theme.colors.accent}
                textColor={item.confidence >= 0.5 ? '#fff' : '#11203A'}
              />
            </View>
            <Text style={{ color: theme.colors.primary, fontFamily: typography.title, fontSize: fontSize.xl, marginTop: 4 }}>
              {item.projectedNextPeriod}{' '}
              <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
                {locale === 'es' ? 'uds. estimadas' : 'est. units'}
              </Text>
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs, marginTop: 2 }}>
              {trendIcon} {locale === 'es' ? 'Tendencia' : 'Trend'}: {item.trendPerPeriod > 0 ? '+' : ''}{item.trendPerPeriod}/período · {locale === 'es' ? 'confianza' : 'confidence'} {Math.round(item.confidence * 100)}%
            </Text>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
