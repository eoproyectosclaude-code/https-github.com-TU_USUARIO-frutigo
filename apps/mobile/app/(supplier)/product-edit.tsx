import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UNIT_DEFINITIONS, type SaleUnit } from '@frutigo/shared';
import { Button, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api } from '../../src/services/api';
import { ImageSearch } from '../../src/components/ImageSearch';

const UNITS: SaleUnit[] = ['KG', 'HALF_QUINTAL', 'QUINTAL'];

interface PriceRow {
  unit: SaleUnit;
  priceUsd: string;
  stock: string;
}

export default function ProductEditScreen() {
  const { theme, locale } = useApp();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [nameEs, setNameEs] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [province, setProvince] = useState('Chiriquí');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=600');
  const [prices, setPrices] = useState<PriceRow[]>(
    UNITS.map((u) => ({ unit: u, priceUsd: '', stock: '' })),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.supplier
      .products()
      .then((list) => {
        const p = list.find((x) => x.id === id);
        if (!p) return;
        setNameEs(p.nameEs);
        setNameEn(p.nameEn);
        setProvince(p.province);
        setImageUrl(p.imageUrl);
        setPrices(
          UNITS.map((u) => {
            const pr = p.prices.find((x) => x.unit === u);
            return { unit: u, priceUsd: pr ? String(pr.priceUsd) : '', stock: pr ? String(pr.stock) : '' };
          }),
        );
      })
      .catch(() => undefined);
  }, [id]);

  function setPrice(unit: SaleUnit, field: 'priceUsd' | 'stock', value: string) {
    setPrices((prev) => prev.map((r) => (r.unit === unit ? { ...r, [field]: value } : r)));
  }

  async function save() {
    const validPrices = prices
      .filter((r) => r.priceUsd && Number(r.priceUsd) > 0)
      .map((r) => ({ unit: r.unit, priceUsd: Number(r.priceUsd), stock: Number(r.stock || 0) }));

    if (!nameEs || !nameEn || validPrices.length === 0) {
      Alert.alert(
        locale === 'es' ? 'Faltan datos' : 'Missing data',
        locale === 'es' ? 'Completa nombre y al menos un precio.' : 'Fill name and at least one price.',
      );
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await api.supplier.updateProduct(id, { nameEs, nameEn, imageUrl, prices: validPrices });
      } else {
        await api.supplier.createProduct({
          slug: nameEn.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36),
          nameEs,
          nameEn,
          category: 'VERDURAS',
          descriptionEs: nameEs,
          descriptionEn: nameEn,
          imageUrl,
          province,
          prices: validPrices,
        });
      }
      router.back();
    } catch (e) {
      Alert.alert(locale === 'es' ? 'Error' : 'Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const input = [styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }];

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
      <Label theme={theme}>{locale === 'es' ? 'Nombre (ES)' : 'Name (ES)'}</Label>
      <TextInput value={nameEs} onChangeText={setNameEs} style={input} placeholderTextColor={theme.colors.textMuted} />
      <Label theme={theme}>{locale === 'es' ? 'Nombre (EN)' : 'Name (EN)'}</Label>
      <TextInput value={nameEn} onChangeText={setNameEn} style={input} placeholderTextColor={theme.colors.textMuted} />
      <Label theme={theme}>{locale === 'es' ? 'Provincia de origen' : 'Origin province'}</Label>
      <TextInput value={province} onChangeText={setProvince} style={input} placeholderTextColor={theme.colors.textMuted} />

      <Label theme={theme}>{locale === 'es' ? 'Imagen del producto (Google)' : 'Product image (Google)'}</Label>
      <ImageSearch initialQuery={nameEs || nameEn} selected={imageUrl} onSelect={setImageUrl} />
      <Label theme={theme}>{locale === 'es' ? 'o pega una URL' : 'or paste a URL'}</Label>
      <TextInput value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" style={input} placeholderTextColor={theme.colors.textMuted} />

      <Text style={[styles.section, { color: theme.colors.text }]}>
        {locale === 'es' ? 'Precios y stock por unidad' : 'Prices & stock per unit'}
      </Text>
      {prices.map((row) => (
        <View key={row.unit} style={styles.priceRow}>
          <Text style={{ width: 110, color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.sm }}>
            {locale === 'es' ? UNIT_DEFINITIONS[row.unit].labelEs : UNIT_DEFINITIONS[row.unit].labelEn}
          </Text>
          <TextInput
            value={row.priceUsd}
            onChangeText={(v) => setPrice(row.unit, 'priceUsd', v)}
            keyboardType="decimal-pad"
            placeholder="$"
            placeholderTextColor={theme.colors.textMuted}
            style={[input, { flex: 1 }]}
          />
          <TextInput
            value={row.stock}
            onChangeText={(v) => setPrice(row.unit, 'stock', v)}
            keyboardType="number-pad"
            placeholder={locale === 'es' ? 'stock' : 'stock'}
            placeholderTextColor={theme.colors.textMuted}
            style={[input, { flex: 1 }]}
          />
        </View>
      ))}

      <Button
        label={isEdit ? (locale === 'es' ? 'Guardar cambios' : 'Save changes') : locale === 'es' ? 'Crear producto' : 'Create product'}
        theme={theme}
        loading={saving}
        onPress={save}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

function Label({ theme, children }: { theme: any; children: React.ReactNode }) {
  return (
    <Text style={{ color: theme.colors.textMuted, fontFamily: typography.bodyMedium, fontSize: fontSize.xs, marginTop: spacing.sm }}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  input: { height: 48, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, fontFamily: typography.body, fontSize: fontSize.md },
  section: { fontFamily: typography.title, fontSize: fontSize.md, marginTop: spacing.lg },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
