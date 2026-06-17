import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { Badge, Card, fontSize, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api, type AdminSupplier } from '../../src/services/api';

export default function AdminSuppliersScreen() {
  const { theme, locale } = useApp();
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api.admin
      .suppliers()
      .then(setSuppliers)
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  }, []);

  async function toggle(s: AdminSupplier) {
    setBusy(s.id);
    const next = !s.verified;
    // Optimista
    setSuppliers((prev) => prev.map((x) => (x.id === s.id ? { ...x, verified: next } : x)));
    try {
      await api.admin.verifySupplier(s.id, next);
    } catch {
      setSuppliers((prev) => prev.map((x) => (x.id === s.id ? { ...x, verified: !next } : x)));
    } finally {
      setBusy(null);
    }
  }

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
      data={suppliers}
      keyExtractor={(s) => s.id}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      renderItem={({ item }) => (
        <Card theme={theme}>
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text>
              <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
                {item.type} · {item.province} · {item.products} {locale === 'es' ? 'productos' : 'products'}
              </Text>
              {item.verified ? (
                <Badge label={locale === 'es' ? '✓ Verificado' : '✓ Verified'} color={theme.colors.success} />
              ) : (
                <Badge label={locale === 'es' ? 'Por verificar' : 'Pending'} color={theme.colors.accent} textColor="#11203A" />
              )}
            </View>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Switch
                value={item.verified}
                onValueChange={() => toggle(item)}
                disabled={busy === item.id}
                trackColor={{ true: theme.colors.success }}
              />
              <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: typography.body }}>
                {locale === 'es' ? 'Verificar' : 'Verify'}
              </Text>
            </View>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontFamily: typography.subtitle, fontSize: fontSize.md },
});
