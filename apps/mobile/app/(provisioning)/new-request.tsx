import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PORTS, UNIT_DEFINITIONS, type Port, type Product, type SaleUnit, type Vessel } from '@frutigo/shared';
import { Button, Card, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api } from '../../src/services/api';
import { useCatalog } from '../../src/hooks/useCatalog';

interface PickLine {
  product: Product;
  unit: SaleUnit;
  quantity: number;
}

function isoIn(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString().slice(0, 16);
}

export default function NewRequestScreen() {
  const { theme, locale } = useApp();
  const router = useRouter();
  const { products } = useCatalog();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [vesselId, setVesselId] = useState<string>('');
  const [port, setPort] = useState<Port>('BALBOA');
  const [start, setStart] = useState(isoIn(24));
  const [end, setEnd] = useState(isoIn(30));
  const [lines, setLines] = useState<Record<string, PickLine>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.provisioning.vessels().then((v) => {
      setVessels(v);
      if (v[0]) setVesselId(v[0].id);
    }).catch(() => undefined);
  }, []);

  const shipProducts = useMemo(() => products.filter((p) => p.shipProvisioning), [products]);

  function setQty(product: Product, qty: number) {
    setLines((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[product.id];
      else next[product.id] = { product, unit: 'QUINTAL', quantity: qty };
      return next;
    });
  }

  async function submit() {
    const picked = Object.values(lines);
    if (!vesselId || picked.length === 0) {
      Alert.alert(locale === 'es' ? 'Faltan datos' : 'Missing data', locale === 'es' ? 'Elige buque y al menos un producto.' : 'Pick a vessel and at least one product.');
      return;
    }
    setSaving(true);
    try {
      const req = await api.provisioning.createRequest({
        vesselId,
        port,
        windowStart: new Date(start).toISOString(),
        windowEnd: new Date(end).toISOString(),
        lines: picked.map((l) => ({ productId: l.product.id, unit: l.unit, quantity: l.quantity })),
      });
      router.replace({ pathname: '/(provisioning)/manifest', params: { id: req.id } });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const input = [styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }];

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{locale === 'es' ? 'Buque' : 'Vessel'}</Text>
      <View style={styles.chips}>
        {vessels.map((v) => (
          <Chip key={v.id} active={vesselId === v.id} label={v.name} onPress={() => setVesselId(v.id)} theme={theme} />
        ))}
      </View>

      <Text style={[styles.label, { color: theme.colors.text }]}>{locale === 'es' ? 'Puerto' : 'Port'}</Text>
      <View style={styles.chips}>
        {PORTS.map((p) => (
          <Chip key={p.id} active={port === p.id} label={p.name} onPress={() => setPort(p.id)} theme={theme} />
        ))}
      </View>

      <Text style={[styles.label, { color: theme.colors.text }]}>{locale === 'es' ? 'Ventana de entrega (inicio)' : 'Delivery window (start)'}</Text>
      <TextInput value={start} onChangeText={setStart} autoCapitalize="none" style={input} placeholder="YYYY-MM-DDTHH:mm" placeholderTextColor={theme.colors.textMuted} />
      <Text style={[styles.label, { color: theme.colors.text }]}>{locale === 'es' ? 'Ventana de entrega (fin)' : 'Delivery window (end)'}</Text>
      <TextInput value={end} onChangeText={setEnd} autoCapitalize="none" style={input} placeholder="YYYY-MM-DDTHH:mm" placeholderTextColor={theme.colors.textMuted} />

      <Text style={[styles.label, { color: theme.colors.text }]}>
        {locale === 'es' ? 'Productos (en quintales)' : 'Products (in quintals)'}
      </Text>
      {shipProducts.map((p) => {
        const qty = lines[p.id]?.quantity ?? 0;
        return (
          <Card key={p.id} theme={theme}>
            <View style={styles.prodRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontFamily: typography.subtitle }}>
                  {locale === 'es' ? p.nameEs : p.nameEn}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
                  {locale === 'es' ? UNIT_DEFINITIONS.QUINTAL.labelEs : UNIT_DEFINITIONS.QUINTAL.labelEn}
                </Text>
              </View>
              <View style={[styles.stepper, { borderColor: theme.colors.border }]}>
                <Pressable onPress={() => setQty(p, qty - 1)} style={styles.stepBtn}>
                  <Text style={{ color: theme.colors.primary, fontSize: 18 }}>−</Text>
                </Pressable>
                <Text style={{ color: theme.colors.text, minWidth: 28, textAlign: 'center', fontFamily: typography.bodyMedium }}>{qty}</Text>
                <Pressable onPress={() => setQty(p, qty + 1)} style={styles.stepBtn}>
                  <Text style={{ color: theme.colors.primary, fontSize: 18 }}>+</Text>
                </Pressable>
              </View>
            </View>
          </Card>
        );
      })}

      <Button
        label={locale === 'es' ? 'Generar manifiesto' : 'Generate manifest'}
        theme={theme}
        loading={saving}
        onPress={submit}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

function Chip({ active, label, onPress, theme }: { active: boolean; label: string; onPress: () => void; theme: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <Text style={{ color: active ? '#fff' : theme.colors.text, fontFamily: typography.bodyMedium, fontSize: fontSize.sm }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: typography.subtitle, fontSize: fontSize.sm, marginTop: spacing.sm },
  input: { height: 48, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, fontFamily: typography.body, fontSize: fontSize.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  prodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.pill },
  stepBtn: { paddingHorizontal: 12, paddingVertical: 4 },
});
